const Deal = require('../models/Deal');
const Org = require('../models/Org');
const Note = require('../models/Note');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../utils/activity');
const { triggerDealPlaybooks } = require('../utils/playbookTrigger');

const ORDER_GAP = 1000;

async function assertStageExists(orgId, stageId) {
  const org = await Org.findById(orgId).lean();
  const stage = org?.pipelineStages.find((s) => String(s._id) === String(stageId));
  if (!stage) throw ApiError.badRequest('That stage is not on this pipeline');
  return stage;
}

// The whole board in one request: cards grouped by stage, already ordered.
const board = asyncHandler(async (req, res) => {
  const org = await Org.findById(req.orgId).lean();
  const query = { orgId: req.orgId, status: { $ne: 'lost' } };
  if (req.user.role === 'rep') {
    query.ownerId = req.user._id;
  }
  const deals = await Deal.find(query)
    .sort({ order: 1 })
    .populate('contactId', 'name company')
    .populate('ownerId', 'name avatarColor')
    .lean();

  const columns = [...org.pipelineStages]
    .sort((a, b) => a.order - b.order)
    .map((stage) => {
      const cards = deals.filter((d) => String(d.stageId) === String(stage._id));
      return {
        id: String(stage._id),
        name: stage.name,
        color: stage.color,
        isWon: stage.isWon,
        total: cards.reduce((sum, d) => sum + (d.value || 0), 0),
        cards,
      };
    });

  const pipelineTotal = columns.reduce((sum, c) => sum + c.total, 0);
  res.json({ columns, pipelineTotal, currency: org.currency });
});

const list = asyncHandler(async (req, res) => {
  const query = { orgId: req.orgId };
  if (req.user.role === 'rep') {
    query.ownerId = req.user._id;
  }
  const deals = await Deal.find(query)
    .sort({ createdAt: -1 })
    .populate('contactId', 'name company')
    .populate('ownerId', 'name avatarColor')
    .lean();
  res.json({ items: deals });
});

const getOne = asyncHandler(async (req, res) => {
  const deal = await Deal.findOne({ _id: req.params.id, orgId: req.orgId })
    .populate('contactId', 'name company email')
    .populate('ownerId', 'name avatarColor')
    .lean();
  if (!deal) throw ApiError.notFound('That deal does not exist');

  if (req.user.role === 'rep' && String(deal.ownerId) !== String(req.user._id)) {
    throw ApiError.forbidden('You do not have permission to view this deal');
  }

  const Interaction = require('../models/Interaction');

  const [notes, tasks, interactions] = await Promise.all([
    Note.find({ orgId: req.orgId, entityType: 'deal', entityId: deal._id })
      .sort({ createdAt: -1 })
      .populate('authorId', 'name avatarColor')
      .lean(),
    Task.find({ orgId: req.orgId, entityType: 'deal', entityId: deal._id })
      .sort({ dueDate: 1 })
      .lean(),
    Interaction.find({ orgId: req.orgId, entityType: 'deal', entityId: deal._id })
      .sort({ createdAt: -1 })
      .populate('performedBy', 'name avatarColor')
      .lean(),
  ]);

  res.json({ deal, notes, tasks, interactions });
});

const create = asyncHandler(async (req, res) => {
  await assertStageExists(req.orgId, req.body.stageId);

  // New cards land on top of their column.
  const first = await Deal.findOne({ orgId: req.orgId, stageId: req.body.stageId })
    .sort({ order: 1 })
    .lean();
  const order = first ? first.order - ORDER_GAP : ORDER_GAP;

  const deal = await Deal.create({
    ...req.body,
    contactId: req.body.contactId || undefined,
    ownerId: req.body.ownerId || req.user._id,
    orgId: req.orgId,
    order,
  });

  await logActivity({
    orgId: req.orgId,
    actorId: req.user._id,
    verb: 'created deal',
    entityType: 'deal',
    entityId: deal._id,
    meta: { title: deal.title, value: deal.value },
  });

  // Trigger automation playbooks for deal stage entry
  await triggerDealPlaybooks(req.orgId, deal, deal.stageId, req.user._id);

  res.status(201).json({ deal });
});

const update = asyncHandler(async (req, res) => {
  if (req.body.stageId) await assertStageExists(req.orgId, req.body.stageId);

  let deal = await Deal.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!deal) throw ApiError.notFound('That deal does not exist');
  if (req.user.role === 'rep' && String(deal.ownerId) !== String(req.user._id)) {
    throw ApiError.forbidden('You do not have permission to edit this deal');
  }

  const stageChanged = req.body.stageId && String(deal.stageId) !== String(req.body.stageId);

  const patch = { ...req.body };
  if (patch.contactId === '') patch.contactId = undefined;

  deal = await Deal.findByIdAndUpdate(
    deal._id,
    { $set: patch },
    { new: true, runValidators: true }
  );

  await logActivity({
    orgId: req.orgId,
    actorId: req.user._id,
    verb: 'updated deal',
    entityType: 'deal',
    entityId: deal._id,
    meta: { title: deal.title },
  });

  if (stageChanged) {
    await triggerDealPlaybooks(req.orgId, deal, deal.stageId, req.user._id);
  }

  res.json({ deal });
});

/**
 * Reorder / move between stages using fractional ordering.
 * The client sends the neighbours the card landed between, so we only write one document
 * instead of renumbering the whole column on every drag.
 */
const move = asyncHandler(async (req, res) => {
  const { stageId, beforeId, afterId } = req.body;
  const stage = await assertStageExists(req.orgId, stageId);

  const deal = await Deal.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!deal) throw ApiError.notFound('That deal does not exist');
  if (req.user.role === 'rep' && String(deal.ownerId) !== String(req.user._id)) {
    throw ApiError.forbidden('You do not have permission to move this deal');
  }

  const [before, after] = await Promise.all([
    beforeId ? Deal.findOne({ _id: beforeId, orgId: req.orgId }).lean() : null,
    afterId ? Deal.findOne({ _id: afterId, orgId: req.orgId }).lean() : null,
  ]);

  let order;
  if (before && after) order = (before.order + after.order) / 2;
  else if (before) order = before.order + ORDER_GAP;
  else if (after) order = after.order - ORDER_GAP;
  else order = ORDER_GAP;

  const stageChanged = String(deal.stageId) !== String(stageId);
  deal.stageId = stageId;
  deal.order = order;
  // Dropping into the won column closes the deal -- the board is the source of truth.
  if (stage.isWon) deal.status = 'won';
  else if (deal.status === 'won') deal.status = 'open';
  await deal.save();

  // Floats run out of precision after ~50 inserts in the same gap. Renumber that column then.
  if (before && after && Math.abs(before.order - after.order) < 0.001) {
    const cards = await Deal.find({ orgId: req.orgId, stageId }).sort({ order: 1 });
    await Promise.all(
      cards.map((c, i) => Deal.updateOne({ _id: c._id }, { $set: { order: (i + 1) * ORDER_GAP } }))
    );
  }

  if (stageChanged) {
    await logActivity({
      orgId: req.orgId,
      actorId: req.user._id,
      verb: 'moved deal',
      entityType: 'deal',
      entityId: deal._id,
      meta: { title: deal.title, stage: stage.name },
    });
    await triggerDealPlaybooks(req.orgId, deal, stageId, req.user._id);
  }

  res.json({ deal });
});

const remove = asyncHandler(async (req, res) => {
  const deal = await Deal.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!deal) throw ApiError.notFound('That deal does not exist');
  if (req.user.role === 'rep' && String(deal.ownerId) !== String(req.user._id)) {
    throw ApiError.forbidden('You do not have permission to delete this deal');
  }

  await Deal.findByIdAndDelete(deal._id);
  await Promise.all([
    Note.deleteMany({ orgId: req.orgId, entityType: 'deal', entityId: deal._id }),
    Task.deleteMany({ orgId: req.orgId, entityType: 'deal', entityId: deal._id }),
  ]);
  await logActivity({
    orgId: req.orgId,
    actorId: req.user._id,
    verb: 'deleted deal',
    entityType: 'deal',
    entityId: deal._id,
    meta: { title: deal.title },
  });
  res.json({ ok: true });
});

module.exports = { board, list, getOne, create, update, move, remove };
