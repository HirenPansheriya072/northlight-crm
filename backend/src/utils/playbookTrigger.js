const Playbook = require('../models/Playbook');
const Task = require('../models/Task');

async function triggerContactPlaybooks(orgId, contact, actorId) {
  try {
    const playbooks = await Playbook.find({ orgId, triggerType: 'contact_created' }).lean();
    for (const pb of playbooks) {
      for (const t of pb.tasks) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (t.dueDaysAfter || 0));
        await Task.create({
          orgId,
          title: t.title,
          dueDate,
          assigneeId: contact.ownerId || actorId,
          entityType: 'contact',
          entityId: contact._id,
        });
      }
    }
  } catch (err) {
    console.error('[Playbook] trigger failed for contact:', err.message);
  }
}

async function triggerDealPlaybooks(orgId, deal, stageId, actorId) {
  try {
    const playbooks = await Playbook.find({
      orgId,
      triggerType: 'deal_stage_entered',
      triggerValue: String(stageId),
    }).lean();
    for (const pb of playbooks) {
      for (const t of pb.tasks) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (t.dueDaysAfter || 0));
        await Task.create({
          orgId,
          title: t.title,
          dueDate,
          assigneeId: deal.ownerId || actorId,
          entityType: 'deal',
          entityId: deal._id,
        });
      }
    }
  } catch (err) {
    console.error('[Playbook] trigger failed for deal stage:', err.message);
  }
}

module.exports = {
  triggerContactPlaybooks,
  triggerDealPlaybooks,
};
