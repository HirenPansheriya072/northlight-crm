const Org = require('../models/Org');
const Deal = require('../models/Deal');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const org = await Org.findById(req.orgId).lean();
  res.json({
    stages: [...org.pipelineStages]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ id: String(s._id), name: s.name, order: s.order, color: s.color, isWon: s.isWon })),
  });
});

// Replaces the whole stage list. Order comes from array position, which keeps the client simple.
const replace = asyncHandler(async (req, res) => {
  const org = await Org.findById(req.orgId);
  if (!org) throw ApiError.notFound('Org not found');

  const keptIds = req.body.stages.filter((s) => s._id).map((s) => String(s._id));
  const removed = org.pipelineStages.filter((s) => !keptIds.includes(String(s._id)));

  // Refuse to delete a stage that still holds deals -- silently orphaning cards is worse.
  for (const stage of removed) {
    const count = await Deal.countDocuments({ orgId: req.orgId, stageId: stage._id });
    if (count > 0) {
      throw ApiError.badRequest(
        `"${stage.name}" still holds ${count} deal${count > 1 ? 's' : ''}. Move them first.`
      );
    }
  }

  org.pipelineStages = req.body.stages.map((s, i) => ({
    ...(s._id ? { _id: s._id } : {}),
    name: s.name,
    order: i + 1,
    color: s.color || 'slate',
    isWon: Boolean(s.isWon),
  }));
  await org.save();

  res.json({
    stages: org.pipelineStages.map((s) => ({
      id: String(s._id),
      name: s.name,
      order: s.order,
      color: s.color,
      isWon: s.isWon,
    })),
  });
});

module.exports = { list, replace };
