const router = require('express').Router();
const ctrl = require('../controllers/attachment.controller');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParams } = require('../validators/schemas');

router.use(requireAuth);

router.post('/', ctrl.upload, ctrl.create);
router.get('/:entityType/:entityId', ctrl.list);
router.delete('/:id', validate({ params: idParams }), ctrl.remove);

module.exports = router;
