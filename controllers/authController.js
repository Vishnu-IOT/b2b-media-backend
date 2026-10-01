const { User, Business } = require('../models');
const { ROLES } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { ok, created } = require('../utils/response');
const { signToken } = require('../services/tokenService');
const { generateOtp } = require('../utils/otp');
const { sendMail } = require('../services/mailService');
const { otpEmail, welcomeEmail } = require('../services/emailTemplates');

const OTP_TTL_MIN = parseInt(process.env.OTP_EXPIRES_MIN, 10) || 10;
// Where the "open admin panel" button in the welcome email points to. Falls back to FRONTEND_URL/login.
const adminPanelUrl = () =>
  process.env.ADMIN_PANEL_URL || `${(process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '')}/login`;

const sendOtpEmail = (email, otp) => sendMail({ to: email, ...otpEmail({ otp, ttlMinutes: OTP_TTL_MIN }) });

const sendWelcomeEmail = (user) =>
  sendMail({ to: user.email, ...welcomeEmail({ name: user.name, loginUrl: adminPanelUrl() }) }).catch((err) =>
    console.error('[auth] welcome email failed:', err.message)
  ); // never block verify-otp's response on this

// Public sign-up always creates a BUSINESS_ADMIN. The role is never taken from the request.
// Step 1 of registration: creates the (unverified) account and emails an OTP. No token yet —
// the account can't log in until POST /api/auth/verify-otp confirms the email.
exports.register = asyncHandler(async (req, res) => {
  if (process.env.ALLOW_PUBLIC_REGISTRATION === 'false') {
    throw new AppError('Public registration is disabled', 403);
  }
  const { name, email, password } = req.body;

  let user = await User.unscoped().findOne({ where: { email: String(email).trim().toLowerCase() } });
  if (user && user.isEmailVerified) throw new AppError('An account with this email already exists', 409);

  if (user) {
    // Unverified leftover from a previous attempt: update their details and resend the OTP.
    user.set({ name, password });
  } else {
    user = User.build({ name, email, password, role: ROLES.BUSINESS_ADMIN });
  }

  const otp = generateOtp();
  await user.setOtp(otp, OTP_TTL_MIN);
  await user.save();
  await sendOtpEmail(user.email, otp);

  return created(res, { email: user.email }, 'OTP sent to your email. Verify it to complete registration.');
});

// Step 2 of registration: confirms the OTP, marks the account verified, and logs them in.
exports.verifyOtp = asyncHandler(async (req, res) => {
  const email = String(req.body.email).trim().toLowerCase();
  const user = await User.unscoped().findOne({ where: { email } });
  if (!user) throw new AppError('Email not found. Please register first.', 404);
  if (user.isEmailVerified) throw new AppError('This email is already verified. Please login.', 409);

  const matches = await user.verifyOtp(req.body.otp);
  if (!matches) throw new AppError('Invalid or expired OTP', 400);

  user.isEmailVerified = true;
  user.clearOtp();
  await user.save();

  sendWelcomeEmail(user); // fire-and-forget: carries the admin panel link, never delays the response

  return ok(res, { user, token: signToken(user) }, 'Registration successful');
});

// Resends a fresh OTP to an unverified account (e.g. the first one expired).
exports.resendOtp = asyncHandler(async (req, res) => {
  const email = String(req.body.email).trim().toLowerCase();
  const user = await User.unscoped().findOne({ where: { email } });
  if (!user) throw new AppError('Email not found. Please register first.', 404);
  if (user.isEmailVerified) throw new AppError('This email is already verified. Please login.', 409);

  const otp = generateOtp();
  await user.setOtp(otp, OTP_TTL_MIN);
  await user.save();
  await sendOtpEmail(user.email, otp);

  return ok(res, { email: user.email }, 'OTP resent');
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.unscoped().findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.isEmailVerified) throw new AppError('Please verify your email before logging in', 403);
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
