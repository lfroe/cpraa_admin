/**
 * Created by lukas on 09/04/2017.
 */
const express = require('express');
const router = express.Router();
const scheduleEntryService = require('../services/scheduleEntryService');

router.post('/scheduleEntry', async (req, res) => {
    res.json(await scheduleEntryService.save(req.body, req.body.user));
});
router.put('/scheduleEntry', async (req, res) => {
    res.json(await scheduleEntryService.update(req.query.id, req.body));
});
router.delete('/scheduleEntry', async (req, res) => {
    res.json(await scheduleEntryService.delete(req.query.id));
});
router.get('/scheduleEntry', async (req, res) => {
    if (req.query.startDate && req.query.endDate){
        res.json(await scheduleEntryService.loadByDateRange(req.query.startDate, req.query.endDate, req.query.userId, req.headers['x-access-token']));
    } else if (req.query.id) {
        res.json(await scheduleEntryService.loadById(req.query.id));
    } else if (req.query.eventId){
        res.json(await scheduleEntryService.loadByEventId(req.query.eventId));
    } else {
        res.json(await scheduleEntryService.loadAll(req.query.userId, req.headers['x-access-token']));
    }
});
router.get('/scheduleEntry/:userId/open', async (req, res) => {
    res.json(await scheduleEntryService.loadOpenByUser(req.params.userId, req.headers['x-access-token']))
});
router.get('/scheduleEntry/perform', async (req, res) => {
    res.json(await scheduleEntryService.loadForPerform(req.query.userId, req.headers['x-access-token']))
});
router.put('/scheduleEntry/:id/setStatus', async (req, res) => {
    res.json(await scheduleEntryService.setStatus(req.body.user._id, req.params.id, req.body.status, req.headers['x-access-token']))
});
module.exports = router;
