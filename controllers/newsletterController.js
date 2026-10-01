const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { ok } = require('../utils/response');
const { subscribe, unsubscribe } = require('../services/newsletterService');

// POST /api/newsletter/subscribe { email } — no OTP, subscribes immediately
exports.subscribe = asyncHandler(async (req, res) => {
  const email = String(req.body.email).trim().toLowerCase();
  const { alreadySubscribed } = await subscribe(email);
  return ok(
    res,
    { email, alreadySubscribed },
    alreadySubscribed ? "You're already subscribed" : 'Subscribed! You will get an email for every new post.'
  );
});

// GET /api/newsletter/unsubscribe?token=...
exports.unsubscribeByToken = asyncHandler(async (req, res) => {
  const found = await unsubscribe(req.query.token);
  if (!found) throw new AppError('Invalid unsubscribe link', 404);
  return ok(res, null, 'You have been unsubscribed');
});
