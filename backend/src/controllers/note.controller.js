const Note = require('../models/Note');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const note = await Note.create({ ...req.body, orgId: req.orgId, authorId: req.user._id });
  const populated = await note.populate('authorId', 'name avatarColor');
  res.status(201).json({ note: populated });
});

const remove = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!note) throw ApiError.notFound('That note does not exist');
  // Reps can only remove what they wrote; managers and owners can remove anything.
  if (String(note.authorId) !== String(req.user._id) && req.user.role === 'rep') {
    throw ApiError.forbidden('You can only delete your own notes');
  }
  await note.deleteOne();
  res.json({ ok: true });
});

module.exports = { create, remove };
