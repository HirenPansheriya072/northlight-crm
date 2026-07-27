const express = require('express');
const router = express.Router();
const controller = require('../controllers/audit.controller');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', controller.list);

module.exports = router;
