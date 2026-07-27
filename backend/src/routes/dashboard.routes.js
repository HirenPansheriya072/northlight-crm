const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');

router.get('/summary', ctrl.summary);

module.exports = router;
