/**
 * Created by lukas on 18/04/2017.
 */
// get an instance of mongoose and mongoose.Schema
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    scheduleEntryId: {type: mongoose.Schema.Types.ObjectId, ref: 'ScheduleEntry'},
    ownerId        : {type: String},
    row            : {type: Number},
    seat           : {type: Number},
    active         : {type: Boolean, required: true, default: false},
    stopped        : {type: Boolean, default: false}
});
module.exports = mongoose.model('RegistrationEntry', schema);
