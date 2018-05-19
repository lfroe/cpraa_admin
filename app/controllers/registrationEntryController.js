/**
 * Created by lukas on 09/04/2017.
 */
const express = require('express');
const router = express.Router();

const registrationEntryService = require('../services/registrationEntryService');

router.post('/register', async (req, res) => {
    res.json(await registrationEntryService.register(req.body, req.body.user, req.headers['x-access-token']));
});
router.delete('/deregister/:id', async (req, res) => {
    res.json(await registrationEntryService.deregister(req.params.id, req.headers['x-access-token']))
});
router.get('/:scheduleEntryId/registrationEntries', async (req, res) => {
    res.json(await registrationEntryService.loadByScheduleEntry(req.params.scheduleEntryId, req.headers['x-access-token']));
});
router.get('/loadByUser', async (req, res) => {
    res.json(await registrationEntryService.loadByUser(req.query.userId, req.headers['x-access-token']))
});
router.put('/:id/setStatus', async (req, res) => {
    res.json(await registrationEntryService.setStatus(req.params.id, req.body.user._id, req.body.status, req.headers['x-access-token']))
});
router.put('/setStatusViaScheduleEntry/:scheduleEntryId', async (req, res) => {
    res.json(await registrationEntryService.setStatusViaScheduleEntry(req.params.scheduleEntryId, req.body.user._id, req.body.status, req.headers['x-access-token']))
});
module.exports = router;
