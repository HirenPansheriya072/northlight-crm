const router = require('express').Router();
const ctrl = require('../controllers/user.controller');

router.get('/', ctrl.list);

module.exports = router;
