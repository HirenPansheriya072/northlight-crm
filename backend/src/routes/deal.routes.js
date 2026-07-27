const router = require('express').Router();
const ctrl = require('../controllers/deal.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { dealSchema, moveDealSchema, idParams } = require('../validators/schemas');

router.use(requireAuth);

router.get('/board', ctrl.board);
router.get('/', ctrl.list);
router.post('/', validate({ body: dealSchema }), ctrl.create);
router.get('/:id', validate({ params: idParams }), ctrl.getOne);
router.patch('/:id', validate({ params: idParams, body: dealSchema.partial() }), ctrl.update);
router.patch('/:id/move', validate({ params: idParams, body: moveDealSchema }), ctrl.move);
router.delete('/:id', validate({ params: idParams }), ctrl.remove);

module.exports = router;
