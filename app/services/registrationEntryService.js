/**
 * Created by lukas on 09/04/2017.
 */
const RegistrationEntry= require('../models/registrationEntry');
const ScheduleEntry    = require('../models/scheduleEntry');
const moment           = require('moment');
const mshelper         = require('@v3rg1l/microservice-helper').requestHelper;
const utils            = require('@v3rg1l/microservice-helper').utilService;
const mongoose         = require('mongoose');

const Config= require('../../config'),
      config= Config();
const _     = require('lodash');
const Pusher= require('pusher'),
      pusher= new Pusher(config.pusherConfig);

module.exports = {
    register: async(requestData, user, token) => {
        const scheduleEntry    = await ScheduleEntry.findOne({_id: requestData.scheduleEntryId});
        const registrationEntry= await new RegistrationEntry({
            scheduleEntryId: requestData.scheduleEntryId,
            row            : requestData.row,
            seat           : requestData.seat,
            ownerId        : user._id,
            status         : 'initial'
        }).save();
        const userData = await mshelper.sendServiceRequest('admin-service', '/gate/routeRequest/auth-service/api/usermanagement/user', 'get', {}, {
            id: scheduleEntry.owner
        }, {'x-access-token': token});
        pusher.trigger(userData.user.pusherKey, 'registration-changed', {msg: 'New registration'});
        return {success: true, registrationEntry};
    },
    deregister: async(id, token) => {
        const entry= await RegistrationEntry.findOne({_id: id});
        if (!entry) {
            return {success: false, msg: 'RegistrationEntry not found'};
        }
        const scheduleEntry= await ScheduleEntry.findOne({_id: entry.scheduleEntryId});
        const userData     = await mshelper.sendServiceRequest('admin-service', '/gate/routeRequest/auth-service/api/usermanagement/user', 'get', {}, {
            id: scheduleEntry.owner
        }, {'x-access-token': token});
        pusher.trigger(userData.user.pusherKey, 'registration-changed', {msg: 'New de-registration'});
        await entry.remove();
        return {success: true};
    },
    stop: async(id) => {
        await RegistrationEntry.findOneAndUpdate({
            _id: id
        }, {
            $set: {
                stopped: true
            }
        });
        return {success: true};
    },
    loadByUser: async(userId, token) => {
        const registrationEntry= await RegistrationEntry.findOne({ownerId: userId, status: {$in: ['active', 'paused']}});
        const isActive         = registrationEntry && ['active', 'paused'].indexOf(registrationEntry.status) >= 0;
        if (!registrationEntry || !isActive) {
            return {success: true, msg: 'Could not find active registrationEntry'}
        }
        const performedTestData = await mshelper.sendServiceRequest('admin-service', '/gate/routeRequest/perform-service/api/performedTests/performedTest/getActive', 'get', {}, {
            scheduleEntryId: registrationEntry.scheduleEntryId
        }, {'x-access-token': token});
        const performedTest= performedTestData && performedTestData.performedTest
            ? performedTestData.performedTest
            :   null;
        return {success: true, registrationEntry, performedTest}
    },
    loadByScheduleEntry: async(scheduleEntryId, token) => {
        let scheduleEntry = await ScheduleEntry.findOne({
            _id: mongoose
                .Types
                .ObjectId(scheduleEntryId)
        });
        if (!scheduleEntry) {
            return {success: false, msg: 'ScheduleEntry not found'}
        }
        let registrationEntries      = await RegistrationEntry.find({scheduleEntryId: scheduleEntryId});
        let registrationEntryUserData= registrationEntries.length > 0
            ? await mshelper.sendServiceRequest('admin-service', '/gate/routeRequest/auth-service/api/usermanagement/users', 'get', {}, {
                ids: registrationEntries.map((entry) => entry.ownerId)
            }, {'x-access-token': token})
            :   [];
        let maxRow = 0,
            maxSeat= 0;
        let result = registrationEntries.map((registrationEntry) => {
            let relevantUser= _.find(registrationEntryUserData.users, (user) => user._id === registrationEntry.ownerId);
                maxRow      = registrationEntry.row > maxRow
                ? registrationEntry.row
                :   maxRow;
            maxSeat= registrationEntry.seat > maxSeat
                ? registrationEntry.seat
                :   maxSeat;
            return Object.assign({}, {
                _id            : registrationEntry._id,
                scheduleEntryId: registrationEntry.scheduleEntryId,
                ownerId        : registrationEntry.ownerId,
                row            : registrationEntry.row,
                seat           : registrationEntry.seat,
                status         : registrationEntry.status
            }, {
                firstName: relevantUser.firstname,
                lastName : relevantUser.lastname
            })
        });
        return {
            success: true,
            entries: _.sortBy(result, ['row', 'seat']),
            maxRow,
            maxSeat
        };
    },
    setStatus: async(registrationEntryId, userId, status, token) => {
        const entry = await RegistrationEntry.findOne({
            _id: mongoose
                .Types
                .ObjectId(registrationEntryId)
        });
        if (!entry) {
            return {success: false, msg: `Unable to find RegistrationEntry with id ${registrationEntryId}`}
        }
        const scheduleEntry = ScheduleEntry.findOne({
            _id  : entry.scheduleEntryId,
            owner: mongoose
                .Types
                .ObjectId(userId)
        });
        if (!scheduleEntry) {
            return {success: false, msg: 'ScheduleEntry not found or not owned by requesting user'}
        }
        const validStates = ['initial', 'active', 'paused', 'stopped', 'finished'];
        const validStateTransitions = {
            initial: ['active'],
            active: ['paused', 'stopped', 'finished'],
            paused: ['active', 'stopped', 'finished'],
            finished: [],
            stopped: []
        };
        if (validStates.indexOf(status) < 0) {
            return {success: false, msg: 'Invalid Status'}
        }
        if (validStateTransitions[entry.status].indexOf(status) < 0) {
            return {success: false, msg: 'Invalid Status Transition'}
        }
        const userData = await mshelper.sendServiceRequest('admin-service', '/gate/routeRequest/auth-service/api/usermanagement/user', 'get', {}, {
            id: entry.ownerId
        }, {'x-access-token': token});
        entry.status= status;
        await entry.save();
        pusher.trigger(userData.user.pusherKey, 'status-changed', {
            msg   : 'status',
            status: entry.status
        });
        return {success: true, status}
    },
    setStatusViaScheduleEntry: async(scheduleEntryId, userId, status, token) => {
        const entry = await RegistrationEntry.findOne({
            scheduleEntryId: mongoose.Types.ObjectId(scheduleEntryId),
            ownerId: userId,
            status: {$in: ['active', 'paused']}
        });
        if (!entry) {
            return {success: false, msg: `Unable to find RegistrationEntry with scheduleEntryID ${scheduleEntryId}`}
        }
        return module.exports.setStatus(entry._id, userId, status, token)
    }
};
