const assert = require('chai').assert;
const expect = require('chai').expect;

const ScheduleEntry = require('../../app/models/scheduleEntry');
const mongoose = require('mongoose');
const Mockgoose = require('mockgoose').Mockgoose;
const mockgoose = new Mockgoose(mongoose);
const rewire = require('rewire');
const scheduleEntryService = rewire('../../app/services/scheduleEntryService');
const utilServiceMock = {
    getLogger       : (logFileName, logPath) => {
        console.log('logfilename is', logFileName);
        return {
            info: (logString) => {
            }
        }
    },
    validatePassword: (password) => {
        return {success: password.length >= 10}
    }
};
mongoose.Promise = require('bluebird');
before(() => {
    mockgoose.prepareStorage().then(() => {
        if (mongoose.connection.db) return done();
        mongoose.connect('mongodb://localhost/admn', {}, err => {
            console.log('Error occurred while trying to connect to mongo', err)
        });
    });
    scheduleEntryService.__set__({
        utils : utilServiceMock,
        logger: utilServiceMock.getLogger()
    });
});
after(() => {
    if (mockgoose.connection) {
        mockgoose.connection.close();
    }
});
// beforeEach(done => {
//     mongoose.connection.collections.scheduleentries.drop(() => {
//         console.log('also calling done function');
//         done();
//     });
// });
describe('scheduleEntry save', () => {
    it('try to save schedule entry => success', async () => {
        const requestData = {
            user         : '5998619578bf532030c64981',

            start        : new Date(),
            end          : new Date(),
            schoolClassId: '5777619578bf532030c64981',
            testId       : '5998888878bf532030c64981',
            title        : 'some title',
            eventId      : '12345'
        };
        const result = await scheduleEntryService.save(requestData, {username: 'lufr', _id: '5998619578bf532030c64981'});
        assert.isDefined(result.scheduleEntry);
        expect(result.scheduleEntry).to.have.property('_id');
        assert.strictEqual(result.scheduleEntry.title, 'some title')
    });
});
describe('scheduleEntry deletion', () => {
   it('try to delete schedule entry => success', async () => {
       const requestData = {
           user         : '5998619578bf532030c64981',
           start        : new Date(),
           end          : new Date(),
           schoolClassId: '5777619578bf532030c64981',
           testId       : '5998888878bf532030c64981',
           title        : 'some title',
           eventId      : '12345'
       };
       const result = await scheduleEntryService.save(requestData, {username: 'lufr', _id: '5998619578bf532030c64981'});
       assert.isDefined(result.scheduleEntry);
       await scheduleEntryService.delete(result.scheduleEntry._id);
       const se = await ScheduleEntry.findOne({ _id: result.scheduleEntry._id });
       assert.isNull(se);
   })
});
