const Activity = require('../models/Activity');

// Fire-and-forget audit trail. Never let logging break the request.
async function logActivity({ orgId, actorId, verb, entityType, entityId, meta = {} }) {
  try {
    await Activity.create({ orgId, actorId, verb, entityType, entityId, meta });
  } catch (err) {
    console.error('activity log failed', err.message);
  }
}

module.exports = { logActivity };
