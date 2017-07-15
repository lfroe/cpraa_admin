/**
 * Created by lukas on 18/04/2017.
 */
// get an instance of mongoose and mongoose.Schema
const mongoose = require('mongoose');
const scheduleSchema = new mongoose.Schema({
    start: {type: Date, required: true},
    end: {type: Date, required: true},
    title: {type: String, required: true},
    eventId: {type: String, required: true},
    testId: {type: String},
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    schoolClassId: {type: String}
});
module.exports = mongoose.model('ScheduleEntry', scheduleSchema);
