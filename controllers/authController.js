const { User, Business } = require('../models');
const { ROLES } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { ok, created } = require('../utils/response');
const { signToken } = require('../services/tokenService');

// Public sign-up always creates a BUSINESS_ADMIN. The role is never taken from the request.
exports.register = asyncHandler(async (req, res) => {
  if (process.env.ALLOW_PUBLIC_REGISTRATION === 'false') {
    throw new AppError('Public registration is disabled', 403);
  }
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password, role: ROLES.BUSINESS_ADMIN });
  return created(res, { user, token: signToken(user) }, 'Registration successful');
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.unscoped().findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  return ok(res, { user, token: signToken(user) }, 'Login successful'); // User#toJSON strips the password
});

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, { include: [{ model: Business, as: 'business' }] });
  return ok(res, user);
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.unscoped().findByPk(req.user.id);
  if (!(await user.comparePassword(currentPassword))) throw new AppError('Current password is incorrect', 400);
  user.password = newPassword;
  await user.save();
  return ok(res, null, 'Password updated');
});
