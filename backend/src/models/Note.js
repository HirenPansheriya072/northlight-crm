const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', required: true, index: true },
    body: { type: String, required: true, trim: true },
    entityType: { type: String, enum: ['contact', 'deal'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

noteSchema.index({ orgId: 1, entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
