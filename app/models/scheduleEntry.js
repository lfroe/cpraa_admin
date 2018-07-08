/**
 * Created by lukas on 18/04/2017.
 */
// get an instance of mongoose and mongoose.Schema
const mongoose    = require('mongoose');
const schema      = new mongoose.Schema({
    start              : {type: Date, required: true},
    end                : {type: Date, required: true},
    title              : {type: String, required: true},
    eventId            : {type: String, required: true},
    testId             : {type: String},
    owner              : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    domain             : {type: mongoose.Schema.Types.ObjectId, ref: 'Domain'},
    schoolClassId      : {type: String},
    status             : {type: String, default: 'default', enum: ['default', 'open-for-registration', 'running', 'stopped', 'paused', 'finished']},
    running            : {type: Boolean, default: false}
});
module.exports    = mongoose.model('ScheduleEntry', schema);
