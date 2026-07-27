const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    title: { type: String, trim: true },
    source: {
      type: String,
      enum: ['referral', 'website', 'cold outreach', 'event', 'social', 'other'],
      default: 'other',
    },
    tags: { type: [String], default: [] },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

contactSchema.index({ orgId: 1, name: 'text', company: 'text', email: 'text' });
contactSchema.index({ orgId: 1, createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
