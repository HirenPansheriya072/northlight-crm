const router = require('express').Router();
const ctrl = require('../controllers/stage.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { stagesSchema } = require('../validators/schemas');

router.use(requireAuth);

router.get('/', ctrl.list);
// Reshaping the pipeline affects everyone, so reps cannot do it.
router.put('/', requireRole('owner', 'manager'), validate({ body: stagesSchema }), ctrl.replace);

module.exports = router;
