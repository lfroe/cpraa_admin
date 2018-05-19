/**
 * Created by lukas on 18/04/2017.
 */
// get an instance of mongoose and mongoose.Schema
const mongoose    = require('mongoose');
const gradeSchema = new mongoose.Schema({
    name        : {type: String, required: true},
    abbreviation: {type: String, required: true},
    percent     : {type: Number, required: true}
});
const testSchema  = new mongoose.Schema({
    name         : {type: String, required: true},
    tasks        : {type: String, required: true},
    sharingLevel : {type: String},
    sharedWith   : [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    owner        : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    taskIds      : [{type: mongoose.Schema.Types.ObjectId, ref: 'Task'}],
    grades       : {type: [gradeSchema]}
});
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
