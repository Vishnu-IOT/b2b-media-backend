const { ROLES, CONTENT_STATUS: S, CONTENT_STATUS_LIST } = require('../config/constants');

/**
 * Decides the status a save should end up with.
 * - BUSINESS_ADMIN: DRAFT (saved privately) or PENDING (submitted for approval). They can never publish or reject.
 *   Editing already approved/rejected content sends it back to PENDING for re-approval.
 * - SUPER_ADMIN: may set any status; otherwise keeps the current one (new content defaults to PUBLISHED).
 */
const resolveStatus = (user, requested, current = null) => {
  if (user.role === ROLES.SUPER_ADMIN) {
    return CONTENT_STATUS_LIST.includes(requested) ? requested : current || S.PUBLISHED;
  }
  if (requested === S.DRAFT) return S.DRAFT;
  if (requested === S.PENDING) return S.PENDING;
  if (!requested && current === S.DRAFT) return S.DRAFT;
  return S.PENDING;
};

// Sets status and keeps publishedAt (when the model has it) consistent with it
const applyStatus = (item, status) => {
  item.status = status;
  if (item.constructor.rawAttributes.publishedAt) {
    item.publishedAt = status === S.PUBLISHED ? item.publishedAt || new Date() : null;
  }
};

module.exports = { resolveStatus, applyStatus };
