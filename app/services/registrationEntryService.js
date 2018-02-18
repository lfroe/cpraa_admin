/**
 * Created by lukas on 09/04/2017.
 */
const RegistrationEntry = require('../models/registrationEntry');
const ScheduleEntry = require('../models/scheduleEntry');
const moment = require('moment');
const mshelper = require('@v3rg1l/microservice-helper').requestHelper;
const utils = require('@v3rg1l/microservice-helper').utilService;
const mongoose = require('mongoose');

const Config = require('../../config');
config = Config();
const _ = require('lodash');
const Pusher = require('pusher');
pusher = new Pusher(config.pusherConfig);

module.exports = {
    register: async (requestData, user, token) => {
        const scheduleEntry = await ScheduleEntry.findOne({_id: requestData.scheduleEntryId});
        const registrationEntry = await new RegistrationEntry({
            scheduleEntryId: requestData.scheduleEntryId,
            row: requestData.row,
            seat: requestData.seat,
            ownerId: user._id,
            active: false,
            stopped: false
        }).save();
        const userData = await mshelper.sendServiceRequest('admin-service',
            '/gate/routeRequest/auth-service/api/usermanagement/user',
            'get', {}, {id: scheduleEntry.owner}, {'x-access-token': token});
        pusher.trigger(userData.user.pusherKey, 'registration-changed', {msg: "New registration"});
        return {success: true, registrationEntry};
    },
    deregister: async (id, token) => {
        const entry = await RegistrationEntry.findOne({_id: id});
        if (!entry) {
            return {success: false, msg: 'RegistrationEntry not found'};
        }
        const scheduleEntry = await ScheduleEntry.findOne({_id: entry.scheduleEntryId});
        const userData = await mshelper.sendServiceRequest('admin-service',
            '/gate/routeRequest/auth-service/api/usermanagement/user',
            'get', {}, {id: scheduleEntry.owner}, {'x-access-token': token});
        pusher.trigger(userData.user.pusherKey, 'registration-changed', {msg: "New de-registration"});
        await entry.remove();
        return {success: true};
    },
    stop: async (id) => {
        await RegistrationEntry.findOneAndUpdate({_id: id}, {
            $set: {stopped: true}
        });
        return {success: true};
    },
    loadByScheduleEntry: async (scheduleEntryId, token) => {
        let scheduleEntry = await ScheduleEntry.findOne({_id: mongoose.Types.ObjectId(scheduleEntryId)});
        if (!scheduleEntry) {
            return {success: false, msg: 'ScheduleEntry not found'}
        }
        const userData = await mshelper.sendServiceRequest('admin-service',
            '/gate/routeRequest/auth-service/api/usermanagement/user',
            'get', {}, {id: scheduleEntry.owner}, {'x-access-token': token});
        let registrationEntries = await RegistrationEntry.find({scheduleEntryId: scheduleEntryId});
        let registrationEntryUserData = registrationEntries.length > 0 ?  await mshelper.sendServiceRequest('admin-service',
                    '/gate/routeRequest/auth-service/api/usermanagement/users',
                    'get', {}, {ids: registrationEntries.map((entry) => { return entry.ownerId })}, {'x-access-token': token}) : [];
        let result = registrationEntries.map((registrationEntry) => {
            let relevantUser = _.find(registrationEntryUserData.users, (user) => {return user._id === registrationEntry.ownerId});

            return Object.assign({}, { _id: registrationEntry._id, scheduleEntryId: registrationEntry.scheduleEntryId,
                ownerId: registrationEntry.ownerId, row: registrationEntry.row, seat: registrationEntry.seat,
                active: registrationEntry.active, stopped: registrationEntry}, {firstName: relevantUser.firstname, lastName: relevantUser.lastname})
        });
        return {success: true, entries: result};
    }
   

};
