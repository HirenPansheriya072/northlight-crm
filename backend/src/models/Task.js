const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', required: true, index: true },
    title: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    done: { type: Boolean, default: false },
    doneAt: { type: Date },
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    entityType: { type: String, enum: ['contact', 'deal', 'none'], default: 'none' },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

taskSchema.index({ orgId: 1, done: 1, dueDate: 1 });
taskSchema.index({ dueDate: 1, done: 1, reminderSent: 1 });

module.exports = mongoose.model('Task', taskSchema);
