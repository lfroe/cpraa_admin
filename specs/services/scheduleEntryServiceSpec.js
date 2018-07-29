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
before(function(done) {
    console.log('In before');
    scheduleEntryService.__set__({
        utils : utilServiceMock,
        logger: utilServiceMock.getLogger()
    });
    console.log('Mocking shit');
    console.log(mockgoose);
        mockgoose.prepareStorage().then(() => {
            mongoose.connect('mongodb://localhost').then((err) => {
                done(err)
            })
        }).catch(function (err) {
            done(err)
        });
});
after((done) => {
    mockgoose.helper.reset();
    done()
});

describe('scheduleEntry save', () => {
    it('try to save schedule entry => success', async () => {
        const requestData = {
            user: '5998619578bf532030c64981',
            start        : new Date(),
            end          : new Date(),
            schoolClassId: '5777619578bf532030c64981',
            testId       : '5998888878bf532030c64981',
            title        : 'some title',
            eventId      : '12345'
        };
        const result = await scheduleEntryService.save(requestData, {
            username: 'lufr',
            _id     : '5998619578bf532030c64981'
        });
        assert.isDefined(result.scheduleEntry);
        expect(result.scheduleEntry).to.have.property('_id');
        assert.strictEqual(result.scheduleEntry.title, 'some title')
    });
});
describe('scheduleEntry deletion', () => {
    it('try to delete schedule entry => success', async () => {
        this.timeout(120000);
        const requestData = {
            user         : '5998619578bf532030c64981',
            start        : new Date(),
            end          : new Date(),
            schoolClassId: '5777619578bf532030c64981',
            testId       : '5998888878bf532030c64981',
            title        : 'some title',
            eventId      : '12345'
        };
        const result = await scheduleEntryService.save(requestData, {username: 'lufr', _id: '5998619578bf532030c64981'})
        assert.isDefined(result.scheduleEntry);
        scheduleEntryService.delete(result.scheduleEntry._id)
        const se = ScheduleEntry.findOne({_id: result.scheduleEntry._id})
        assert.isNull(se);
    })
});
