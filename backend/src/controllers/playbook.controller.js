const Playbook = require('../models/Playbook');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const playbooks = await Playbook.find({ orgId: req.orgId }).sort({ createdAt: -1 }).lean();
  res.json({ items: playbooks });
});

const create = asyncHandler(async (req, res) => {
  const { name, triggerType, triggerValue, tasks } = req.body;

  const playbook = await Playbook.create({
    orgId: req.orgId,
    name,
    triggerType,
    triggerValue: triggerValue || '',
    tasks,
  });

  res.status(201).json({ playbook });
});

const remove = asyncHandler(async (req, res) => {
  const playbook = await Playbook.findOneAndDelete({
    _id: req.params.id,
    orgId: req.orgId,
  });
  if (!playbook) throw ApiError.notFound('Playbook not found');
  res.json({ ok: true });
});

module.exports = { list, create, remove };
