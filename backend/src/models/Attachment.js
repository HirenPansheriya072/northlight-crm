const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', required: true, index: true },
    entityType: { type: String, enum: ['contact', 'deal'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

attachmentSchema.index({ orgId: 1, entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('Attachment', attachmentSchema);
