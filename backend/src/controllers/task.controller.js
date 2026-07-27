const Task = require('../models/Task');
const Contact = require('../models/Contact');
const Deal = require('../models/Deal');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../utils/activity');

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

// Attaches the contact / deal name to each task so the list reads well without extra calls.
async function withEntityLabels(orgId, tasks) {
  const contactIds = tasks.filter((t) => t.entityType === 'contact').map((t) => t.entityId);
  const dealIds = tasks.filter((t) => t.entityType === 'deal').map((t) => t.entityId);

  const [contacts, deals] = await Promise.all([
    contactIds.length ? Contact.find({ orgId, _id: { $in: contactIds } }, 'name').lean() : [],
    dealIds.length ? Deal.find({ orgId, _id: { $in: dealIds } }, 'title').lean() : [],
  ]);

  const map = new Map();
  contacts.forEach((c) => map.set(String(c._id), c.name));
  deals.forEach((d) => map.set(String(d._id), d.title));

  return tasks.map((t) => ({
    ...t,
    entityLabel: t.entityId ? map.get(String(t.entityId)) || null : null,
  }));
}

const list = asyncHandler(async (req, res) => {
  const { filter, assigneeId } = req.validatedQuery;
  const query = { orgId: req.orgId };

  if (req.user.role === 'rep') {
    query.assigneeId = req.user._id;
  } else if (assigneeId) {
    query.assigneeId = assigneeId;
  }

  if (filter === 'today') {
    query.done = false;
    query.dueDate = { $gte: startOfToday(), $lte: endOfToday() };
  } else if (filter === 'overdue') {
    query.done = false;
    query.dueDate = { $lt: startOfToday() };
  } else if (filter === 'upcoming') {
    query.done = false;
    query.dueDate = { $gt: endOfToday() };
  } else if (filter === 'done') {
    query.done = true;
  }

  const tasks = await Task.find(query)
    .sort(filter === 'done' ? { doneAt: -1 } : { dueDate: 1 })
    .limit(200)
    .populate('assigneeId', 'name avatarColor')
    .lean();

  const items = await withEntityLabels(req.orgId, tasks);

  const countScope = req.user.role === 'rep' ? { assigneeId: req.user._id } : {};

  // The counts drive the tab badges, so they always reflect the whole org or rep.
  const [today, overdue, upcoming] = await Promise.all([
    Task.countDocuments({
      orgId: req.orgId,
      done: false,
      dueDate: { $gte: startOfToday(), $lte: endOfToday() },
      ...countScope,
    }),
    Task.countDocuments({ orgId: req.orgId, done: false, dueDate: { $lt: startOfToday() }, ...countScope }),
    Task.countDocuments({ orgId: req.orgId, done: false, dueDate: { $gt: endOfToday() }, ...countScope }),
  ]);

  res.json({ items, counts: { today, overdue, upcoming } });
});

const create = asyncHandler(async (req, res) => {
  const task = await Task.create({
    ...req.body,
    entityId: req.body.entityId || undefined,
    entityType: req.body.entityType || 'none',
    assigneeId: req.body.assigneeId || req.user._id,
    orgId: req.orgId,
  });
  await logActivity({
    orgId: req.orgId,
    actorId: req.user._id,
    verb: 'added follow-up',
    entityType: 'task',
    entityId: task._id,
    meta: { title: task.title },
  });

  if (String(task.assigneeId) !== String(req.user._id)) {
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: task.assigneeId,
      title: 'New Follow-up Assigned',
      body: `${req.user.name} assigned you the task "${task.title}".`,
      link: '/tasks',
    });
  }

  res.status(201).json({ task });
});

const update = asyncHandler(async (req, res) => {
  let task = await Task.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!task) throw ApiError.notFound('That follow-up does not exist');
  if (req.user.role === 'rep' && String(task.assigneeId) !== String(req.user._id)) {
    throw ApiError.forbidden('You do not have permission to modify this follow-up');
  }

  const originalAssigneeId = task.assigneeId;
  const patch = { ...req.body };
  if (typeof patch.done === 'boolean') {
    patch.doneAt = patch.done ? new Date() : null;
    // A reopened task should be able to remind again.
    if (!patch.done) patch.reminderSent = false;
  }

  task = await Task.findByIdAndUpdate(
    task._id,
    { $set: patch },
    { new: true, runValidators: true }
  );

  await logActivity({
    orgId: req.orgId,
    actorId: req.user._id,
    verb: patch.done ? 'completed follow-up' : 'updated follow-up',
    entityType: 'task',
    entityId: task._id,
    meta: { title: task.title },
  });

  if (req.body.assigneeId && String(req.body.assigneeId) !== String(originalAssigneeId) && String(req.body.assigneeId) !== String(req.user._id)) {
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: req.body.assigneeId,
      title: 'Follow-up Reassigned',
      body: `${req.user.name} reassigned the task "${task.title}" to you.`,
      link: '/tasks',
    });
  }

  res.json({ task });
});

const remove = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!task) throw ApiError.notFound('That follow-up does not exist');
  if (req.user.role === 'rep' && String(task.assigneeId) !== String(req.user._id)) {
    throw ApiError.forbidden('You do not have permission to delete this follow-up');
  }

  await Task.findByIdAndDelete(task._id);

  await logActivity({
    orgId: req.orgId,
    actorId: req.user._id,
    verb: 'deleted follow-up',
    entityType: 'task',
    entityId: task._id,
    meta: { title: task.title },
  });

  res.json({ ok: true });
});

module.exports = { list, create, update, remove };
