/**
 * Created by lukas on 09/04/2017.
 */
const express = require('express');
const router = express.Router();

const registrationEntryService = require('../services/registrationEntryService');

router.post('/registration', async (req, res) => {
    res.json(await registrationEntryService.save(req.body, req.body.user));
});
router.post('/registration/register', async (req, res) => {
    res.json(await registrationEntryService.register(req.body, req.body.user, req.headers['x-access-token']));
});
router.delete('/registration/deregister/:id', async (req, res) => {
    res.json(await registrationEntryService.deregister(req.params.id, req.headers['x-access-token']))
});
router.get('/registrationEntries/:scheduleEntryId', async (req, res) => {
    res.json(await registrationEntryService.loadByScheduleEntry(req.params.scheduleEntryId, req.headers['x-access-token']));
});
module.exports = router;
