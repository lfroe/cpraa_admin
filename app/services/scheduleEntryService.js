/**
 * Created by lukas on 09/04/2017.
 */
const ScheduleEntry = require('../models/scheduleEntry');
const RegistrationEntry = require('../models/registrationEntry');
const moment = require('moment');
const mshelper = require('@v3rg1l/microservice-helper').requestHelper;
const utils = require('@v3rg1l/microservice-helper').utilService;
const Config = require('../../config');
config = Config();
const _ = require('lodash');
const logger = utils.getLogger('perform', config.logPath);
const Pusher = require('pusher');
pusher = new Pusher(config.pusherConfig);

module.exports = {
    save: async (requestData, user) => {
        requestData.owner = requestData.user;
        requestData.start = moment.utc(requestData.start).format();
        requestData.end = moment.utc(requestData.end).format();
        requestData.eventId = requestData.eventId || utils.guid();
        const scheduleEntry = await new ScheduleEntry({
            start: requestData.start,
            schoolClassId: requestData.schoolClassId,
            end: requestData.end, owner: user, eventId: requestData.eventId,
            testId: requestData.testId, title: requestData.title,
            domain: user.domain
        }).save();
        return {success: true, scheduleEntry};
    },
    update: async (id, requestData) => {
        const scheduleEntry = await ScheduleEntry.findOne({_id: id});
        if (!scheduleEntry) {
            return {success: false, msg: 'ScheduleEntry not found'};
        }
        requestData.start = moment.utc(requestData.start).format();
        requestData.end = moment.utc(requestData.end).format();
        requestData.eventId = requestData.eventId || utils.guid();
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
    delete: async (id) => {
        const entry = await ScheduleEntry.findOne({_id: id});
        if (!entry) {
            return {success: false, msg: 'ScheduleEntry not found'};
        }
        await entry.remove();
        return {success: true};
    },
    loadAll: async (userId, token) => {
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
    loadByDateRange: async (startDate, endDate, userId, token, user) => {
        const userData = user ? user : await mshelper.sendServiceRequest('admin-service',
            '/gate/routeRequest/auth-service/api/usermanagement/user',
            'get', {}, {id: userId}, {'x-access-token': token});
        const entries = await ScheduleEntry.find({
            $and: [
                {start: {$gt: startDate}},
                {start: {$lt: endDate}},
                {domain: userData.user.domain}
            ]
        });
        return {entries, success: true};
    },
    loadById: async (id) => {
        const relevantEntry = await ScheduleEntry.findOne({_id: id});
        if (!relevantEntry) {
            return {success: false};
        }
        return {success: true, scheduleEntry: relevantEntry};
    },
    loadByEventId: async (eventId) => {
        const relevantEntry = await ScheduleEntry.findOne({eventId});
        if (!relevantEntry) {
            return {success: false};
        }
        return {success: true, scheduleEntry: relevantEntry};
    },
    loadOpenByUser: async (userId, token) => {
        const schoolClasses = await mshelper.sendServiceRequest('admin-service',
            `/gate/routeRequest/auth-service/api/schoolClasses/schoolClass/${userId}`,
            'get', {}, {}, {'x-access-token': token});
        const timeZoneOffset = moment.parseZone(new Date()).utcOffset();
        const startDate = moment().startOf('day').add(timeZoneOffset - 15, 'minutes');
        const endDate = moment().endOf('day').add(timeZoneOffset + 120, 'minutes');
        let entries = [];
        const requests = schoolClasses.classes.length > 0 ? schoolClasses.classes.map(async (clazz) => {
            let scheduleEntries = await ScheduleEntry.find({
                $and: [
                    {start: {$gt: startDate}},
                    {start: {$lt: endDate}},
                    {schoolClassId: clazz._id},
                    {status: 'open-for-registration'}
                ]
            });
            entries = entries.concat(scheduleEntries)
        }) : [];
        await Promise.all(requests);
        return {success: true, entries}
    },
    loadForPerform: async (userId, token) => {
        const result = [];
        const timeZoneOffset = moment.parseZone(new Date()).utcOffset();
        const startDate = moment().startOf('day').add(timeZoneOffset - 15, 'minutes');
        const endDate = moment().endOf('day').add(timeZoneOffset + 120, 'minutes');
        logger.info(`Trying to get scheduleEntries for id [${req.query.userId}]`);
        const userData = await mshelper.sendServiceRequest('admin-service',
            '/gate/routeRequest/auth-service/api/usermanagement/user',
            'get', {}, {id: userId}, {'x-access-token': token});
        let scheduleData = ['admin', 'teacher'].indexOf(userData.user.type) >= 0 ? await module.exports.loadByDateRange(startDate, endDate, null, null, userData) :
            await module.exports.loadOpenByUser(userId, token);
        if (!scheduleData) {
            logger.info('Couldn\'t get scheduleEntries from admin-service. Something is terribly, terribly wrong');
            scheduleData = {entries: []};
        }
        const testRequests = scheduleData.entries.length > 0 ? scheduleData.entries.map(async (scheduleEntry) => {
            const testData = await mshelper.sendServiceRequest('admin-service',
                '/gate/routeRequest/create-service/api/testmanagement/test/name', 'get',
                {}, {id: scheduleEntry.testId}, {'x-access-token': token});
            if (testData && testData.result) {
                const registrationEntry = await RegistrationEntry.findOne({
                    scheduleEntryId: scheduleEntry._id,
                    ownerId: userId
                });
                result.push({
                    test: {name: testData.result},
                    scheduleEntry: scheduleEntry,
                    registrationEntry: registrationEntry
                })
            }
        }) : [];
        await Promise.all(testRequests);
        return {success: true, result};
    },
    setStatus: async (userId, scheduleEntryId, status, token) => {
        const scheduleEntry = await ScheduleEntry.findOne({_id: scheduleEntryId});
        if (!scheduleEntry) {
            return {success: false, msg: 'Unable to find ScheduleEntry'}
        }
        if (scheduleEntry.owner.toString() !== userId) {
            return {success: false, msg: 'Insufficient rights'}
        }
        const clazzData = await mshelper.sendServiceRequest('admin-service',
            '/gate/routeRequest/auth-service/api/schoolClasses/schoolClass',
            'get', {}, {id: scheduleEntry.schoolClassId}, {'x-access-token': token});
        const channels = [];
        const oldStatus = scheduleEntry.status;
        _.each(clazzData.schoolClass.users, (user) => {
            if (user.type === 'student') {
                logger.info(`Adding channel ${user.pusherKey} to list of channels...`)
                channels.push(user.pusherKey)
            }
        });
        scheduleEntry.status = status;
        await scheduleEntry.save();
        switch (scheduleEntry.status) {
            case 'default':
                logger.info('Setting scheduleEntryState [default]. Triggering Pusher');
                pusher.trigger(channels, 'open-changed', {
                    openForRegistration: false,
                    id: scheduleEntry.id,
                    clazz: scheduleEntry.schoolClassId
                });
                pusher.trigger(channels, 'running-changed', {
                    running: false,
                    id: scheduleEntry.id,
                    clazz: scheduleEntry.schoolClassId
                });
                if (oldStatus === 'open-for-registration') {
                    await RegistrationEntry.deleteMany({ scheduleEntryId: scheduleEntry._id});
                }
                break;
            case 'open-for-registration':
                logger.info('Setting scheduleEntryState [open-for-registration]. Triggering Pusher');
                pusher.trigger(channels, 'open-changed', {
                    openForRegistration: true,
                    id: scheduleEntry.id,
                    clazz: scheduleEntry.schoolClassId
                });
                break;
            case 'running':
                logger.info('Setting scheduleEntryState [running]. Triggering Pusher');
                pusher.trigger(channels, 'open-changed', {
                    openForRegistration: false,
                    id: scheduleEntry.id,
                    clazz: scheduleEntry.schoolClassId
                });
                pusher.trigger(channels, 'running-changed', {
                    running: true,
                    id: scheduleEntry.id,
                    clazz: scheduleEntry.schoolClassId
                });
                break;
        }
        return {success: true, scheduleEntry}
    }
};
