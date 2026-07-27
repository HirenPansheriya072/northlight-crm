const router = require('express').Router();
const ctrl = require('../controllers/task.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { taskSchema, taskQuerySchema, idParams } = require('../validators/schemas');

router.use(requireAuth);

router.get('/', validate({ query: taskQuerySchema }), ctrl.list);
router.post('/', validate({ body: taskSchema }), ctrl.create);
router.patch('/:id', validate({ params: idParams, body: taskSchema.partial() }), ctrl.update);
router.delete('/:id', validate({ params: idParams }), ctrl.remove);

module.exports = router;
