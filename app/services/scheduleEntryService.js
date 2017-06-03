/**
 * Created by lukas on 09/04/2017.
 */
const ScheduleEntry = require('../models/scheduleEntry');
const msHelper = require('microservice-helper');

module.exports = {
    saveScheduleEntry: async (requestData, user) => {
        requestData.owner = requestData.user;
        scheduleEntry = await new ScheduleEntry({
            start:  requestData.start,
            end: requestData.end, owner: user, eventId: requestData.eventId,
            testId: requestData.testId, title: requestData.title
        }).save();
        return { scheduleEntry: scheduleEntry }
    },
    updateScheduleEntry: async (id, requestData) => {
        let scheduleEntry = await ScheduleEntry.findOne({ _id: id });
        if ( !scheduleEntry ) {
            return { success: false, msg: 'ScheduleEntry not found' };
        }
        await ScheduleEntry.findOneAndUpdate({ _id: id }, {
            $set: {
                start: requestData.start, end: requestData.end, eventId: requestData.eventId,
                testId: requestData.testId, title: requestData.title
            }
        });
        return { success: true };
    },
    deleteScheduleEntry: async (id) => {
        let entry = await ScheduleEntry.findOne({ _id: id });
        if ( !entry ) {
            return { success: false, msg: "ScheduleEntry not found" };
        }
        await entry.remove();
        return { success: true };
    },
    loadScheduleEntries: async (user) => {
        if ( user.admin ) {
            return await ScheduleEntry.find({});
        }
        return await ScheduleEntry.find({ owner: user });
    },
    findByDateRange: async (startDate, endDate) => {
        let entries = await ScheduleEntry.find({
            $and: [
                {start: {$gt: startDate}},
                {start: {$lt: endDate}}
            ]
        });
        return { result: entries }
    }
};