/**
 * Created by lukas on 09/04/2017.
 */
const ScheduleEntry = require('../models/scheduleEntry');
const moment = require('moment');

module.exports = {
    saveScheduleEntry: async (requestData, user) => {
        requestData.owner = requestData.user;
        requestData.start = moment.utc(requestData.start).format();
        requestData.end = moment.utc(requestData.end).format();
        const scheduleEntry = await new ScheduleEntry({
            start: requestData.start,
            schoolClassId: requestData.schoolClassId,
            end: requestData.end, owner: user, eventId: requestData.eventId,
            testId: requestData.testId, title: requestData.title
        }).save();
        return {scheduleEntry: scheduleEntry}
    },
    updateScheduleEntry: async (id, requestData) => {
        const scheduleEntry = await ScheduleEntry.findOne({_id: id});
        if (!scheduleEntry) {
            return {success: false, msg: 'ScheduleEntry not found'};
        }
        requestData.start = moment.utc(requestData.start).format();
        requestData.end = moment.utc(requestData.end).format();
        await ScheduleEntry.findOneAndUpdate({_id: id}, {
            $set: {
                start: moment(requestData.start).toDate(),
                end: moment(requestData.end).toDate(),
                eventId: requestData.eventId,
                schoolClassId: requestData.schoolClassId,
                testId: requestData.testId,
                title: requestData.title
            }
        });
        return {success: true};
    },
    deleteScheduleEntry: async (id) => {
        const entry = await ScheduleEntry.findOne({_id: id});
        if (!entry) {
            return {success: false, msg: 'ScheduleEntry not found'};
        }
        await entry.remove();
        return {success: true};
    },
    loadScheduleEntries: async (user) => {
        let scheduleEntries = [];
        if (user.admin) {
            scheduleEntries = await ScheduleEntry.find({});

        } else {
            scheduleEntries = await ScheduleEntry.find({owner: user});
        }
        return {success: true, entries: scheduleEntries}
    },
    findByDateRange: async (startDate, endDate) => {
        const entries = await ScheduleEntry.find({
            $and: [
                {start: {$gt: startDate}},
                {start: {$lt: endDate}}
            ]
        });
        return {result: entries}
    },
    findByEventId: async (eventId) => {
        const relevantEntry = await ScheduleEntry.findOne({eventId: eventId});
        if (!relevantEntry) {
            return {success: false}
        }
        return {success: true, scheduleEntry: relevantEntry}
    }
};