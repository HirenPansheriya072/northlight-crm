const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', required: true, index: true },
    title: { type: String, required: true, trim: true },
    value: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD' },
    stageId: { type: mongoose.Schema.Types.ObjectId, required: true },
    // Sparse float so a drag only rewrites the card that moved.
    order: { type: Number, required: true },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expectedCloseDate: { type: Date },
    status: { type: String, enum: ['open', 'won', 'lost'], default: 'open' },
    lostReasonCategory: { type: String, enum: ['Price', 'Competitor', 'Features', 'Timing', 'Other', ''], default: '' },
    lostReason: { type: String, trim: true },
  },
  { timestamps: true }
);

dealSchema.index({ orgId: 1, stageId: 1, order: 1 });
dealSchema.index({ orgId: 1, status: 1 });

module.exports = mongoose.model('Deal', dealSchema);
