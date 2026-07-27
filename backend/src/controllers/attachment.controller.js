const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Attachment = require('../models/Attachment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../utils/activity');

// Use /tmp/uploads on Vercel since the root filesystem is read-only
const isVercel = process.env.VERCEL === '1';
const uploadDir = isVercel
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const list = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const attachments = await Attachment.find({
    orgId: req.orgId,
    entityType,
    entityId,
  })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'name avatarColor')
    .lean();

  res.json({ items: attachments });
});

const create = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file provided');

  const { entityType, entityId } = req.body;
  if (!entityType || !entityId) {
    // Cleanup file if request is bad
    fs.unlinkSync(req.file.path);
    throw ApiError.badRequest('entityType and entityId are required');
  }

  // The client will get a relative URL to our served static files
  const fileUrl = `/uploads/${req.file.filename}`;

  const attachment = await Attachment.create({
    orgId: req.orgId,
    entityType,
    entityId,
    fileName: req.file.originalname,
    fileUrl,
    fileSize: req.file.size,
    uploadedBy: req.user._id,
  });

  await logActivity({
    orgId: req.orgId,
    actorId: req.user._id,
    verb: 'uploaded attachment',
    entityType,
    entityId,
    meta: { fileName: attachment.fileName },
  });

  res.status(201).json({ attachment });
});

const remove = asyncHandler(async (req, res) => {
  const attachment = await Attachment.findOne({
    _id: req.params.id,
    orgId: req.orgId,
  });
  if (!attachment) throw ApiError.notFound('Attachment not found');

  // Remove local file
  const filename = path.basename(attachment.fileUrl);
  const filepath = path.join(uploadDir, filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }

  await Attachment.deleteOne({ _id: attachment._id });

  await logActivity({
    orgId: req.orgId,
    actorId: req.user._id,
    verb: 'deleted attachment',
    entityType: attachment.entityType,
    entityId: attachment.entityId,
    meta: { fileName: attachment.fileName },
  });

  res.json({ ok: true });
});

module.exports = {
  upload: upload.single('file'),
  list,
  create,
  remove,
};
