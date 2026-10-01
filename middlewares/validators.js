const { body } = require('express-validator');
const { ROLES, CONTENT_STATUS_LIST, CATEGORY_STATUS_LIST, LANGUAGES } = require('../config/constants');

const LONG = 200000;

/**
 * spec: { field: { required, type, max, in } }
 * types: string (default) | email | url | date | int | password
 * Rules run AFTER multer, so they work for JSON and multipart bodies alike.
 * On update (creating = false) every field is optional.
 */
const build = (spec, creating) =>
  Object.entries(spec).map(([field, o]) => {
    let chain = body(field);

    chain =
      o.required && creating
        ? chain.trim().notEmpty().withMessage(`${field} is required`).bail()
        : chain.optional({ values: 'falsy' });

    switch (o.type) {
      case 'email':
        return chain.isEmail().withMessage(`${field} must be a valid email`).bail().toLowerCase();
      case 'url':
        return chain
          .isURL({ protocols: ['http', 'https'], require_protocol: true })
          .withMessage(`${field} must be a valid http(s) URL`);
      case 'date':
        return chain.isISO8601().withMessage(`${field} must be a valid date (YYYY-MM-DD)`);
      case 'int':
        return chain.isInt({ min: 1 }).withMessage(`${field} must be a positive integer`).toInt();
      case 'password':
        return chain.isString().isLength({ min: 8, max: 72 }).withMessage(`${field} must be 8-72 characters`);
      default:
        if (o.in) return chain.isIn(o.in).withMessage(`${field} must be one of: ${o.in.join(', ')}`);
        return chain
          .isString()
          .withMessage(`${field} must be text`)
          .bail()
          .trim()
          .isLength({ max: o.max || 255 })
          .withMessage(`${field} is too long`);
    }
  });

const make = (spec) => ({ create: build(spec, true), update: build(spec, false) });

// Fields only a Super Admin may send when acting on behalf of a business
const adminScope = { businessId: { type: 'int' } };
const status = { status: { in: CONTENT_STATUS_LIST } };

module.exports = {
  auth: {
    register: build(
      { name: { required: true, max: 120 }, email: { required: true, type: 'email' }, password: { required: true, type: 'password' } },
      true
    ),
    verifyOtp: build({ email: { required: true, type: 'email' }, otp: { required: true, max: 6 } }, true),
    resendOtp: build({ email: { required: true, type: 'email' } }, true),
    login: build({ email: { required: true, type: 'email' }, password: { required: true, max: 200 } }, true),
    changePassword: build(
      { currentPassword: { required: true, max: 200 }, newPassword: { required: true, type: 'password' } },
      true
    ),
  },

  adminUser: make({
    name: { required: true, max: 120 },
    email: { required: true, type: 'email' },
    password: { required: true, type: 'password' },
    role: { in: Object.values(ROLES) },
  }),

  business: make({
    companyName: { required: true, max: 180 },
    description: { max: LONG },
    story: { max: LONG },
    industry: { max: 120 },
    location: { max: 180 },
    website: { type: 'url' },
    phone: { max: 30 },
    email: { type: 'email' },
    userId: { type: 'int' },
    language: { in: LANGUAGES },
    ...status,
  }),

  story: make({ title: { required: true, max: 255 }, content: { required: true, max: LONG }, ...adminScope, ...status }),
  strategy: make({ title: { required: true, max: 255 }, content: { required: true, max: LONG }, ...adminScope, ...status }),

  achievement: make({
    title: { required: true, max: 255 },
    description: { max: LONG },
    awardName: { max: 255 },
    awardedBy: { max: 255 },
    awardDate: { type: 'date' },
    ...adminScope,
    ...status,
  }),

  product: make({
    name: { required: true, max: 255 },
    description: { max: LONG },
    launchDate: { type: 'date' },
    ...adminScope,
    ...status,
  }),

  enquiry: make({
    title: { required: true, max: 255 },
    description: { required: true, max: LONG },
    category: { max: 120 },
    location: { max: 180 },
    contactInfo: { max: 500 },
    ...adminScope,
    ...status,
  }),

  video: make({
    title: { required: true, max: 255 },
    description: { max: LONG },
    youtubeUrl: { type: 'url' },
    ...adminScope,
    ...status,
  }),

  resourceCategory: make({
    name: { required: true, max: 120 },
    description: { max: 1000 },
    status: { in: CATEGORY_STATUS_LIST },
  }),

  resource: make({
    categoryId: { required: true, type: 'int' },
    title: { required: true, max: 255 },
    summary: { max: 1000 },
    content: { max: LONG },
    videoUrl: { type: 'url' },
    status: { in: ['DRAFT', 'PUBLISHED'] },
  }),

  question: make({ title: { required: true, max: 255 }, description: { required: true, max: LONG }, category: { max: 120 } }),
  answer: make({ questionId: { required: true, type: 'int' }, answer: { required: true, max: LONG } }),

  moderation: { status: build({ status: { required: true, in: CONTENT_STATUS_LIST } }, true) },

  newsletter: {
    subscribe: build({ email: { required: true, type: 'email' } }, true),
  },
};
