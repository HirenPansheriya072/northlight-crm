const router = require('express').Router();
const ctrl = require('../controllers/interaction.controller');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { interactionSchema } = require('../validators/schemas');

router.use(requireAuth);

router.post('/', validate({ body: interactionSchema }), ctrl.create);
router.get('/:entityType/:entityId', ctrl.list);

module.exports = router;
