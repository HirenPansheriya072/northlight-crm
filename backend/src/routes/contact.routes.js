const router = require('express').Router();
const ctrl = require('../controllers/contact.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { contactSchema, listQuerySchema, idParams } = require('../validators/schemas');

router.use(requireAuth);

router.get('/', validate({ query: listQuerySchema }), ctrl.list);
router.get('/export', ctrl.exportCsv);
router.post('/import', ctrl.importCsv);
router.get('/check-duplicate', ctrl.checkDuplicate);
router.post('/', validate({ body: contactSchema }), ctrl.create);
router.get('/:id', validate({ params: idParams }), ctrl.getOne);
router.patch('/:id', validate({ params: idParams, body: contactSchema.partial() }), ctrl.update);
router.delete('/:id', validate({ params: idParams }), ctrl.remove);

module.exports = router;
