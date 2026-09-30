const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const getToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

const loadUser = async (token) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findByPk(payload.id); // default scope excludes the password
  if (!user) throw new AppError('User no longer exists', 401);
  return user;
};

// Requires a valid Bearer token
const authenticate = asyncHandler(async (req, res, next) => {
  const token = getToken(req);
  if (!token) throw new AppError('Authentication required', 401);
  req.user = await loadUser(token);
  next();
});

// Public route that behaves differently for logged-in users. Bad/expired tokens are treated as anonymous.
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = getToken(req);
  if (token) {
    try {
      req.user = await loadUser(token);
    } catch (e) {
      req.user = undefined;
    }
  }
  next();
});

// Role-based access: authorize('SUPER_ADMIN'), authorize('SUPER_ADMIN', 'BUSINESS_ADMIN')
const authorize = (...roles) => (req, res, next) =>
  req.user && roles.includes(req.user.role)
    ? next()
    : next(new AppError('You do not have permission to perform this action', 403));

module.exports = { authenticate, optionalAuth, authorize };
