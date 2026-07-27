const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', required: true, index: true },
    entityType: { type: String, enum: ['contact', 'deal'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: { type: String, enum: ['call', 'email', 'meeting', 'sms'], required: true },
    notes: { type: String, required: true, trim: true },
    outcome: { type: String, enum: ['connected', 'no-answer', 'left-voicemail', 'completed'], required: true },
    duration: { type: Number, default: 0 }, // in minutes
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

interactionSchema.index({ orgId: 1, entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('Interaction', interactionSchema);
