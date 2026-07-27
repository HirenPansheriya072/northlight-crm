const mongoose = require('mongoose');
const Deal = require('../models/Deal');
const Contact = require('../models/Contact');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Org = require('../models/Org');
const asyncHandler = require('../utils/asyncHandler');

const summary = asyncHandler(async (req, res) => {
  const orgId = new mongoose.Types.ObjectId(String(req.orgId));
  const userId = new mongoose.Types.ObjectId(String(req.user._id));

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const org = await Org.findById(orgId).lean();
  const stageNames = new Map(org.pipelineStages.map((s) => [String(s._id), s.name]));
  const stageOrder = new Map(org.pipelineStages.map((s) => [String(s._id), s.order]));

  const dealMatchOpen = { orgId, status: 'open' };
  const dealMatchWon = { orgId, status: 'won', updatedAt: { $gte: monthStart } };
  const dealMatchLostCount = { orgId, status: 'lost', updatedAt: { $gte: monthStart } };
  const dealMatchMonthly = { orgId, status: 'won', updatedAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } };
  const dealMatchLostDist = { orgId, status: 'lost', lostReasonCategory: { $ne: '' } };
  const contactMatch = { orgId };
  const taskMatchDue = { orgId, done: false, dueDate: { $gte: startOfToday, $lte: endOfToday } };
  const taskMatchOverdue = { orgId, done: false, dueDate: { $lt: startOfToday } };
  const activityMatch = { orgId };

  if (req.user.role === 'rep') {
    dealMatchOpen.ownerId = userId;
    dealMatchWon.ownerId = userId;
    dealMatchLostCount.ownerId = userId;
    dealMatchMonthly.ownerId = userId;
    dealMatchLostDist.ownerId = userId;
    contactMatch.ownerId = userId;
    taskMatchDue.assigneeId = userId;
    taskMatchOverdue.assigneeId = userId;
    activityMatch.actorId = userId;
  }

  const [byStage, wonThisMonth, lostThisMonth, openTotal, contactCount, tasksDue, overdue, activity, monthly, lostReasons] =
    await Promise.all([
      Deal.aggregate([
        { $match: dealMatchOpen },
        { $group: { _id: '$stageId', value: { $sum: '$value' }, count: { $sum: 1 } } },
      ]),
      Deal.aggregate([
        { $match: dealMatchWon },
        { $group: { _id: null, value: { $sum: '$value' }, count: { $sum: 1 } } },
      ]),
      Deal.countDocuments(dealMatchLostCount),
      Deal.aggregate([
        { $match: dealMatchOpen },
        { $group: { _id: null, value: { $sum: '$value' }, count: { $sum: 1 } } },
      ]),
      Contact.countDocuments(contactMatch),
      Task.find(taskMatchDue)
        .sort({ dueDate: 1 })
        .limit(6)
        .lean(),
      Task.countDocuments(taskMatchOverdue),
      Activity.find(activityMatch)
        .sort({ createdAt: -1 })
        .limit(12)
        .populate('actorId', 'name avatarColor')
        .lean(),
      Deal.aggregate([
        { $match: dealMatchMonthly },
        {
          $group: {
            _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } },
            value: { $sum: '$value' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
      Deal.aggregate([
        { $match: dealMatchLostDist },
        { $group: { _id: '$lostReasonCategory', count: { $sum: 1 }, value: { $sum: '$value' } } },
      ]),
    ]);

  const won = wonThisMonth[0] || { value: 0, count: 0 };
  const open = openTotal[0] || { value: 0, count: 0 };
  const closed = won.count + lostThisMonth;

  const stages = byStage
    .map((s) => ({
      stageId: String(s._id),
      name: stageNames.get(String(s._id)) || 'Unknown',
      order: stageOrder.get(String(s._id)) || 99,
      value: s.value,
      count: s.count,
    }))
    .sort((a, b) => a.order - b.order);

  // Fill gaps so the chart never shows a broken line.
  const months = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const hit = monthly.find((m) => m._id.y === d.getFullYear() && m._id.m === d.getMonth() + 1);
    months.push({
      label: d.toLocaleString('en-US', { month: 'short' }),
      value: hit ? hit.value : 0,
      count: hit ? hit.count : 0,
    });
  }

  res.json({
    currency: org.currency,
    cards: {
      openValue: open.value,
      openCount: open.count,
      wonValue: won.value,
      wonCount: won.count,
      contactCount,
      overdueCount: overdue,
      winRate: closed > 0 ? Math.round((won.count / closed) * 100) : null,
    },
    stages,
    months,
    lostReasons: lostReasons.map((lr) => ({
      category: lr._id,
      count: lr.count,
      value: lr.value,
    })),
    tasksDueToday: tasksDue,
    activity: activity.map((a) => ({
      id: String(a._id),
      verb: a.verb,
      entityType: a.entityType,
      entityId: a.entityId,
      meta: a.meta,
      createdAt: a.createdAt,
      actor: a.actorId ? { name: a.actorId.name, avatarColor: a.actorId.avatarColor } : null,
    })),
  });
});

module.exports = { summary };
