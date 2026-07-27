const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['manager', 'rep'], default: 'rep' },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invitation', invitationSchema);
