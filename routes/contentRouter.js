const express = require('express');
const { authenticate, optionalAuth, authorize } = require('../middlewares/auth');
const { uploadFields } = require('../middlewares/upload');
const { validate, numericId } = require('../middlewares/validate');
const { ROLES } = require('../config/constants');

const ownerRoles = authorize(ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN);
const noUpload = (req, res, next) => next();

/**
 * Standard router for business-owned content.
 *   GET    /          public list (published items of published businesses)
 *   GET    /mine      own items, all statuses            (BUSINESS_ADMIN, SUPER_ADMIN with ?businessId=)
 *   GET    /:id       detail (drafts / pending only for owner + Super Admin)
 *   POST   /          create -> PENDING (or DRAFT)        (BUSINESS_ADMIN, SUPER_ADMIN with businessId)
 *   PUT    /:id       update -> back to PENDING           (owner, SUPER_ADMIN)
 *   DELETE /:id       delete                              (owner, SUPER_ADMIN)
 */
module.exports = ({ controller, files = [], rules }) => {
  const router = express.Router();
  const upload = files.length ? uploadFields(files) : noUpload;

  router.get('/', controller.list);
  router.get('/mine', authenticate, ownerRoles, controller.mine);
  router.get('/:id', optionalAuth, controller.getOne);
  router.post('/', authenticate, ownerRoles, upload, validate(rules.create), controller.create);
  router.put('/:id', authenticate, ownerRoles, numericId, upload, validate(rules.update), controller.update);
  router.delete('/:id', authenticate, ownerRoles, numericId, controller.remove);
  return router;
};
