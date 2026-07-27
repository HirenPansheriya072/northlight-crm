const router = require('express').Router();
const ctrl = require('../controllers/playbook.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { playbookSchema, idParams } = require('../validators/schemas');

router.use(requireAuth);
router.use(requireRole('owner', 'manager'));

router.get('/', ctrl.list);
router.post('/', validate({ body: playbookSchema }), ctrl.create);
router.delete('/:id', validate({ params: idParams }), ctrl.remove);

module.exports = router;
