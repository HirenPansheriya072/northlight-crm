const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    color: { type: String, default: 'pine' },
    // Marks the stage that means "closed" so the board can style it.
    isWon: { type: Boolean, default: false },
  },
  { _id: true }
);

const orgSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    currency: { type: String, default: 'USD' },
    pipelineStages: { type: [stageSchema], default: [] },
  },
  { timestamps: true }
);

orgSchema.statics.defaultStages = function defaultStages() {
  return [
    { name: 'New lead', order: 1, color: 'slate' },
    { name: 'Contacted', order: 2, color: 'sky' },
    { name: 'Proposal sent', order: 3, color: 'brass' },
    { name: 'Negotiation', order: 4, color: 'amber' },
    { name: 'Won', order: 5, color: 'pine', isWon: true },
  ];
};

module.exports = mongoose.model('Org', orgSchema);
