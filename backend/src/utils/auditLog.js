const ActivityLog = require('../models/ActivityLog');

async function logActivity(req, action, description) {
  try {
    if (!req.orgId || !req.user?._id) return;
    await ActivityLog.create({
      orgId: req.orgId,
      userId: req.user._id,
      action,
      description,
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

module.exports = { logActivity };
