const mongoose = require('mongoose');
const User = require('../models/User');
const Org = require('../models/Org');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/token');

// Signing up creates the org too -- the first user is always its owner, unless signing up via invitation token.
const register = asyncHandler(async (req, res) => {
  const { name, email, password, orgName, token } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('That email is already registered');

  let invitation = null;
  if (token) {
    const Invitation = require('../models/Invitation');
    invitation = await Invitation.findOne({ token, used: false, expiresAt: { $gt: new Date() } });
    if (!invitation) throw ApiError.badRequest('Invalid or expired invitation link');
  }

  const session = await mongoose.startSession();
  let user;
  try {
    await session.withTransaction(async () => {
      let orgId;
      let role = 'owner';

      if (invitation) {
        orgId = invitation.orgId;
        role = invitation.role;
      } else {
        const [org] = await Org.create(
          [{ name: orgName, pipelineStages: Org.defaultStages() }],
          { session }
        );
        orgId = org._id;
      }

      const passwordHash = await User.hashPassword(password);
      [user] = await User.create(
        [{ orgId, name, email, passwordHash, role }],
        { session }
      );

      if (invitation) {
        invitation.used = true;
        await invitation.save({ session });
      }
    });
  } catch (err) {
    // Standalone mongod has no transactions -- fall back to sequential writes.
    if (err.code === 20 || /Transaction numbers|replica set/i.test(err.message)) {
      let orgId;
      let role = 'owner';

      if (invitation) {
        orgId = invitation.orgId;
        role = invitation.role;
      } else {
        const org = await Org.create({ name: orgName, pipelineStages: Org.defaultStages() });
        orgId = org._id;
      }

      const passwordHash = await User.hashPassword(password);
      user = await User.create({ orgId, name, email, passwordHash, role });

      if (invitation) {
        invitation.used = true;
        await invitation.save();
      }
    } else {
      throw err;
    }
  } finally {
    session.endSession();
  }

  setAuthCookie(res, signToken(user));
  res.status(201).json({ user: user.toPublic() });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw ApiError.unauthorized('Email or password is incorrect');

  const ok = await user.checkPassword(password);
  if (!ok) throw ApiError.unauthorized('Email or password is incorrect');

  setAuthCookie(res, signToken(user));
  res.json({ user: user.toPublic() });
});

// One-click entry for portfolio visitors. Credentials live in env, not in the client.
const demoLogin = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: env.demo.email });
  if (!user) throw ApiError.notFound('The demo account is not seeded yet. Run npm run seed.');
  setAuthCookie(res, signToken(user));
  res.json({ user: user.toPublic() });
});

const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

const me = asyncHandler(async (req, res) => {
  const org = await Org.findById(req.user.orgId).lean();
  res.json({
    user: req.user.toPublic(),
    org: org && {
      id: String(org._id),
      name: org.name,
      currency: org.currency,
      pipelineStages: org.pipelineStages.map((s) => ({
        id: String(s._id),
        name: s.name,
        order: s.order,
        color: s.color,
        isWon: s.isWon,
      })),
    },
  });
});

module.exports = { register, login, demoLogin, logout, me };
