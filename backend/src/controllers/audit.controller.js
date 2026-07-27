const Activity = require('../models/Activity');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  if (req.user.role === 'rep') {
    throw ApiError.forbidden('Only owners and managers can view audit logs');
  }

  const items = await Activity.find({ orgId: req.orgId })
    .populate('actorId', 'name avatarColor')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  res.json({ items });
});

module.exports = {
  list,
};
