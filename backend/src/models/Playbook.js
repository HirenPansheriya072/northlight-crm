const mongoose = require('mongoose');

const playbookSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', required: true, index: true },
    name: { type: String, required: true, trim: true },
    triggerType: { type: String, enum: ['contact_created', 'deal_stage_entered'], required: true },
    triggerValue: { type: String, default: '' }, // Stage ID or empty for contact_created
    tasks: [
      {
        title: { type: String, required: true, trim: true },
        dueDaysAfter: { type: Number, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Playbook', playbookSchema);
