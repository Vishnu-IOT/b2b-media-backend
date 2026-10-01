const { Subscriber } = require('../models');
const { generateToken } = require('../utils/otp');
const { sendMail } = require('./mailService');
const { subscribeWelcomeEmail, newPostEmail } = require('./emailTemplates');

const SITE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const unsubscribeLink = (token) => `${SITE_URL.replace(/\/$/, '')}/unsubscribe?token=${token}`;

// POST /api/newsletter/subscribe — no OTP: adds the email (or reactivates it) right away.
const subscribe = async (email) => {
  let subscriber = await Subscriber.findOne({ where: { email } });

  if (subscriber) {
    if (subscriber.isActive) return { alreadySubscribed: true, subscriber };
    subscriber.isActive = true;
    await subscriber.save();
    return { alreadySubscribed: false, subscriber };
  }

  subscriber = await Subscriber.create({ email, unsubscribeToken: generateToken() });

  await sendMail({ to: email, ...subscribeWelcomeEmail({ unsubscribeUrl: unsubscribeLink(subscriber.unsubscribeToken) }) }).catch(
    (err) => console.error('[newsletter] welcome email failed:', err.message) // never block the subscribe response
  );

  return { alreadySubscribed: false, subscriber };
};

// GET /api/newsletter/unsubscribe?token=...
const unsubscribe = async (token) => {
  const subscriber = await Subscriber.findOne({ where: { unsubscribeToken: token } });
  if (!subscriber) return false;
  subscriber.isActive = false;
  await subscriber.save();
  return true;
};

// Called after a resource post is (or becomes) PUBLISHED. Fire-and-forget from the caller;
// failures are logged, never thrown back into the request that published the post.
const notifyNewPost = async (post, category) => {
  const subscribers = await Subscriber.findAll({ where: { isActive: true }, attributes: ['email', 'unsubscribeToken'] });
  if (!subscribers.length) return { sent: 0 };

  const url = `${SITE_URL.replace(/\/$/, '')}/resources/${post.slug}`;

  const results = await Promise.allSettled(
    subscribers.map((s) =>
      sendMail({
        to: s.email,
        ...newPostEmail({
          title: post.title,
          summary: post.summary,
          category: category ? category.name : null,
          postUrl: url,
          unsubscribeUrl: unsubscribeLink(s.unsubscribeToken),
        }),
      })
    )
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.length - sent;
  if (failed) console.error(`[newsletterService] ${failed} newsletter email(s) failed to send for post ${post.id}`);
  return { sent, failed };
};

module.exports = { subscribe, unsubscribe, notifyNewPost };
