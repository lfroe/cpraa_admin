/**
 * Created by lukas on 18/02/2017.
 */
const express            = require('hydra-express').getExpress();
const router             = express.Router();
const statusService = require('../services/statusService');

router.get('/health', async (req, res) => {
    res.json(await statusService.checkHealth())
});
module.exports = router;
