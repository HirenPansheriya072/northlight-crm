const Contact = require('../models/Contact');
const Deal = require('../models/Deal');
const Note = require('../models/Note');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../utils/activity');
const { triggerContactPlaybooks } = require('../utils/playbookTrigger');

const list = asyncHandler(async (req, res) => {
  const { q, page, limit, ownerId, source } = req.validatedQuery;
  const filter = { orgId: req.orgId };

  if (req.user.role === 'rep') {
    filter.ownerId = req.user._id;
  } else if (ownerId) {
    filter.ownerId = ownerId;
  }

  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { company: rx }, { email: rx }, { tags: rx }];
  }
  if (source) filter.source = source;

  const [items, total] = await Promise.all([
    Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('ownerId', 'name avatarColor')
      .lean(),
    Contact.countDocuments(filter),
  ]);

  res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1 });
});

const getOne = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({ _id: req.params.id, orgId: req.orgId })
    .populate('ownerId', 'name avatarColor')
    .lean();
  if (!contact) throw ApiError.notFound('That contact does not exist');

  if (req.user.role === 'rep' && String(contact.ownerId) !== String(req.user._id)) {
    throw ApiError.forbidden('You do not have permission to view this contact');
  }

  const Interaction = require('../models/Interaction');

  const [deals, notes, tasks, interactions] = await Promise.all([
    Deal.find({ orgId: req.orgId, contactId: contact._id }).sort({ createdAt: -1 }).lean(),
    Note.find({ orgId: req.orgId, entityType: 'contact', entityId: contact._id })
      .sort({ createdAt: -1 })
      .populate('authorId', 'name avatarColor')
      .lean(),
    Task.find({ orgId: req.orgId, entityType: 'contact', entityId: contact._id })
      .sort({ dueDate: 1 })
      .lean(),
    Interaction.find({ orgId: req.orgId, entityType: 'contact', entityId: contact._id })
      .sort({ createdAt: -1 })
      .populate('performedBy', 'name avatarColor')
      .lean(),
  ]);

  res.json({ contact, deals, notes, tasks, interactions });
});

const create = asyncHandler(async (req, res) => {
  const contact = await Contact.create({
    ...req.body,
    ownerId: req.body.ownerId || req.user._id,
    orgId: req.orgId,
  });
  await logActivity({
    orgId: req.orgId,
    actorId: req.user._id,
    verb: 'created contact',
    entityType: 'contact',
    entityId: contact._id,
    meta: { name: contact.name },
  });

  // Assign notification
  if (String(contact.ownerId) !== String(req.user._id)) {
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: contact.ownerId,
      title: 'New Contact Assigned',
      body: `${req.user.name} assigned you the contact "${contact.name}".`,
      link: `/contacts/${contact._id}`,
    });
  }

  // Trigger automation playbooks for contact creation
  await triggerContactPlaybooks(req.orgId, contact, req.user._id);

  res.status(201).json({ contact });
});

const update = asyncHandler(async (req, res) => {
  let contact = await Contact.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!contact) throw ApiError.notFound('That contact does not exist');
  if (req.user.role === 'rep' && String(contact.ownerId) !== String(req.user._id)) {
    throw ApiError.forbidden('You do not have permission to edit this contact');
  }

  const originalOwnerId = contact.ownerId;
  contact = await Contact.findByIdAndUpdate(
    contact._id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  await logActivity({
    orgId: req.orgId,
    actorId: req.user._id,
    verb: 'updated contact',
    entityType: 'contact',
    entityId: contact._id,
    meta: { name: contact.name },
  });

  // Reassign notification
  if (req.body.ownerId && String(req.body.ownerId) !== String(originalOwnerId) && String(req.body.ownerId) !== String(req.user._id)) {
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: req.body.ownerId,
      title: 'Contact Reassigned',
      body: `${req.user.name} reassigned the contact "${contact.name}" to you.`,
      link: `/contacts/${contact._id}`,
    });
  }

  res.json({ contact });
});

const remove = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!contact) throw ApiError.notFound('That contact does not exist');
  if (req.user.role === 'rep' && String(contact.ownerId) !== String(req.user._id)) {
    throw ApiError.forbidden('You do not have permission to delete this contact');
  }

  await Contact.findByIdAndDelete(contact._id);

  // Keep the org tidy: drop the paper trail attached to this contact.
  await Promise.all([
    Note.deleteMany({ orgId: req.orgId, entityType: 'contact', entityId: contact._id }),
    Task.deleteMany({ orgId: req.orgId, entityType: 'contact', entityId: contact._id }),
    Deal.updateMany({ orgId: req.orgId, contactId: contact._id }, { $unset: { contactId: 1 } }),
  ]);

  await logActivity({
    orgId: req.orgId,
    actorId: req.user._id,
    verb: 'deleted contact',
    entityType: 'contact',
    entityId: contact._id,
    meta: { name: contact.name },
  });
  res.json({ ok: true });
});

// CSV export -- streams straight to the browser, no library needed.
const exportCsv = asyncHandler(async (req, res) => {
  const filter = { orgId: req.orgId };
  if (req.user.role === 'rep') {
    filter.ownerId = req.user._id;
  }
  const contacts = await Contact.find(filter).sort({ createdAt: -1 }).lean();
  const cols = ['name', 'email', 'phone', 'company', 'title', 'source', 'tags'];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = contacts.map((c) =>
    cols.map((col) => escape(Array.isArray(c[col]) ? c[col].join('; ') : c[col])).join(',')
  );
  const csv = [cols.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
  res.send(csv);
});

const importCsv = asyncHandler(async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) throw ApiError.badRequest('Nothing to import');
  if (rows.length > 500) throw ApiError.badRequest('Import 500 rows at a time or fewer');

  const docs = rows
    .filter((r) => r.name)
    .map((r) => ({
      orgId: req.orgId,
      ownerId: req.user._id,
      name: String(r.name).trim(),
      email: r.email ? String(r.email).toLowerCase().trim() : undefined,
      phone: r.phone ? String(r.phone).trim() : undefined,
      company: r.company ? String(r.company).trim() : undefined,
      title: r.title ? String(r.title).trim() : undefined,
      source: ['referral', 'website', 'cold outreach', 'event', 'social', 'other'].includes(r.source)
        ? r.source
        : 'other',
      tags: typeof r.tags === 'string' ? r.tags.split(';').map((t) => t.trim()).filter(Boolean) : [],
    }));

  if (docs.length === 0) throw ApiError.badRequest('Every row needs a name column');
  const inserted = await Contact.insertMany(docs);
  res.status(201).json({ imported: inserted.length });
});

const checkDuplicate = asyncHandler(async (req, res) => {
  const { email, phone } = req.query;
  if (!email && !phone) {
    return res.json({ duplicate: false });
  }

  const query = { orgId: req.orgId };
  const or = [];
  if (email) or.push({ email: email.toLowerCase().trim() });
  if (phone) or.push({ phone: phone.trim() });
  query.$or = or;

  const match = await Contact.findOne(query);
  if (match) {
    return res.json({ duplicate: true, contact: { id: match._id, name: match.name } });
  }
  res.json({ duplicate: false });
});

module.exports = { list, getOne, create, update, remove, exportCsv, importCsv, checkDuplicate };
