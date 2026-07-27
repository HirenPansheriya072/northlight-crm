const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// Team list drives the owner/assignee pickers.
const list = asyncHandler(async (req, res) => {
  const users = await User.find({ orgId: req.orgId }).sort({ createdAt: 1 }).lean();
  res.json({
    items: users.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      avatarColor: u.avatarColor,
    })),
  });
});

module.exports = { list };
