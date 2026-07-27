const crypto = require('crypto');
const Invitation = require('../models/Invitation');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const invites = await Invitation.find({ orgId: req.orgId }).sort({ createdAt: -1 }).lean();
  res.json({ items: invites });
});

const create = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await Invitation.create({
    orgId: req.orgId,
    email,
    role: role || 'rep',
    token,
    expiresAt,
  });

  res.status(201).json({ invite });
});

const getOne = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const invite = await Invitation.findOne({ token, used: false, expiresAt: { $gt: new Date() } }).lean();
  if (!invite) {
    throw ApiError.notFound('Invalid or expired invitation link');
  }
  res.json({ invite });
});

module.exports = { list, create, getOne };
