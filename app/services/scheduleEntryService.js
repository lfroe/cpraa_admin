/**
 * Created by lukas on 09/04/2017.
 */
const ScheduleEntry = require('../models/scheduleEntry');
const moment = require('moment');
const mshelper = require('@v3rg1l/microservice-helper').requestHelper;
const utils = require('@v3rg1l/microservice-helper').utilService;

module.exports = {
    save           : async (requestData, user) => {
        requestData.owner = requestData.user;
        requestData.start = moment.utc(requestData.start).format();
        requestData.end = moment.utc(requestData.end).format();
        requestData.eventId = requestData.eventId || utils.guid();
        const scheduleEntry = await new ScheduleEntry({
            start        : requestData.start,
            schoolClassId: requestData.schoolClassId,
            end          : requestData.end, owner: user, eventId: requestData.eventId,
            testId       : requestData.testId, title: requestData.title
        }).save();
        return {success: true, scheduleEntry};
    },
    update         : async (id, requestData) => {
        const scheduleEntry = await ScheduleEntry.findOne({_id: id});
        if (!scheduleEntry) {
            return {success: false, msg: 'ScheduleEntry not found'};
        }
        requestData.start = moment.utc(requestData.start).format();
        requestData.end = moment.utc(requestData.end).format();
        requestData.eventId = requestData.eventId || utils.guid();
        await ScheduleEntry.findOneAndUpdate({_id: id}, {
            $set: {
                start        : moment(requestData.start).toDate(),
                end          : moment(requestData.end).toDate(),
                eventId      : requestData.eventId,
                schoolClassId: requestData.schoolClassId,
                testId       : requestData.testId,
                title        : requestData.title
            }
        });
        return {success: true};
    },
    delete         : async (id) => {
        const entry = await ScheduleEntry.findOne({_id: id});
        if (!entry) {
            return {success: false, msg: 'ScheduleEntry not found'};
        }
        await entry.remove();
        return {success: true};
    },
    loadAll        : async (userId, token) => {
        const userData = await mshelper.sendServiceRequest('admin-service',
            '/gate/routeRequest/auth-service/api/usermanagement/user',
            'get', {}, {id: userId}, {'x-access-token': token});
        let scheduleEntries = [];
        if (userData.user.admin) {
            scheduleEntries = await ScheduleEntry.find({});

        } else {
            scheduleEntries = await ScheduleEntry.find({owner: userData.user});
        }
        return {success: true, entries: scheduleEntries};
    },
    loadByDateRange: async (startDate, endDate) => {
        const entries = await ScheduleEntry.find({
            $and: [
                {start: {$gt: startDate}},
                {start: {$lt: endDate}}
            ]
        });
        return {result: entries};
    },
    loadByEventId  : async (eventId) => {
        const relevantEntry = await ScheduleEntry.findOne({eventId});
        if (!relevantEntry) {
            return {success: false};
        }
        return {success: true, scheduleEntry: relevantEntry};
    }
};
