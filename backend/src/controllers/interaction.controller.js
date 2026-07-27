const Interaction = require('../models/Interaction');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../utils/activity');

const list = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const items = await Interaction.find({
    orgId: req.orgId,
    entityType,
    entityId,
  })
    .sort({ createdAt: -1 })
    .populate('performedBy', 'name avatarColor')
    .lean();

  res.json({ items });
});

const create = asyncHandler(async (req, res) => {
  const { entityType, entityId, type, notes, outcome, duration } = req.body;

  const interaction = await Interaction.create({
    orgId: req.orgId,
    entityType,
    entityId,
    type,
    notes,
    outcome,
    duration: duration || 0,
    performedBy: req.user._id,
  });

  await logActivity({
    orgId: req.orgId,
    actorId: req.user._id,
    verb: `logged a ${type}`,
    entityType,
    entityId,
    meta: { type, outcome },
  });

  // Populate the author so the client gets the full data instantly
  const populated = await Interaction.findById(interaction._id)
    .populate('performedBy', 'name avatarColor')
    .lean();

  res.status(201).json({ interaction: populated });
});

module.exports = { list, create };
