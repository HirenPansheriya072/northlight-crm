const router = require('express').Router();
const ctrl = require('../controllers/note.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { noteSchema, idParams } = require('../validators/schemas');

router.use(requireAuth);

router.post('/', validate({ body: noteSchema }), ctrl.create);
router.delete('/:id', validate({ params: idParams }), ctrl.remove);

module.exports = router;
