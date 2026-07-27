const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');

router.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

router.use('/auth', require('./auth.routes'));
router.use('/contacts', require('./contact.routes'));
router.use('/deals', require('./deal.routes'));
router.use('/notes', require('./note.routes'));
router.use('/tasks', require('./task.routes'));
router.use('/stages', require('./stage.routes'));
router.use('/dashboard', requireAuth, require('./dashboard.routes'));
router.use('/users', requireAuth, require('./user.routes'));
router.use('/users/invites', require('./invite.routes'));
router.use('/attachments', require('./attachment.routes'));
router.use('/interactions', require('./interaction.routes'));
router.use('/playbooks', require('./playbook.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/audit-logs', require('./audit.routes'));

module.exports = router;
