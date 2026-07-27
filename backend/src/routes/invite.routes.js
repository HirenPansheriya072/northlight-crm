const router = require('express').Router();
const ctrl = require('../controllers/invite.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { inviteSchema } = require('../validators/schemas');

// Public route to resolve invitation info
router.get('/token/:token', ctrl.getOne);

// Authenticated owner/manager routes
router.use(requireAuth);
router.use(requireRole('owner', 'manager'));

router.get('/', ctrl.list);
router.post('/', validate({ body: inviteSchema }), ctrl.create);

module.exports = router;
