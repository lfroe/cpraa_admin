/**
 * Created by lukas on 09/04/2017.
 */
let express = require('express');
let router = express.Router();

let scheduleEntryService = require('../services/scheduleEntryService');

router.post('/scheduleEntry', async (req, res) => {
    res.json(await scheduleEntryService.saveScheduleEntry(req.body, req.body.user))
});
router.put('/scheduleEntry', async (req, res) => {
    res.json(await scheduleEntryService.updateScheduleEntry(req.query.id, req.body));
});
router.delete('/scheduleEntry', async (req, res) => {
    res.json(await scheduleEntryService.deleteScheduleEntry(req.query.id));
});
router.get('/scheduleEntry', async (req, res) => {
    if (req.query.startDate && req.query.endDate){
        res.json(await scheduleEntryService.findByDateRange(req.query.startDate, req.query.endDate))
    } else if (req.query.eventId){
        res.json(await scheduleEntryService.findByEventId(req.query.eventId))
    } else {
        res.json(await scheduleEntryService.loadScheduleEntries(req.body.user));
    }
});
module.exports = router;