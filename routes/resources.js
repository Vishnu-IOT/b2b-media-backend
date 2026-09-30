const router = require('express').Router();
const ctrl = require('../controllers/resourceController');
const { authenticate, optionalAuth, authorize } = require('../middlewares/auth');
const { uploadFields } = require('../middlewares/upload');
const { validate, numericId } = require('../middlewares/validate');
const rules = require('../middlewares/validators').resource;
const { ROLES } = require('../config/constants');

const admin = [authenticate, authorize(ROLES.SUPER_ADMIN)];
const upload = uploadFields(['coverImage', 'file', 'video']); // cover image, PDF/document, uploaded video

router.get('/', optionalAuth, ctrl.list);
router.get('/:idOrSlug', optionalAuth, ctrl.getOne);
router.post('/', ...admin, upload, validate(rules.create), ctrl.create);
router.put('/:id', ...admin, numericId, upload, validate(rules.update), ctrl.update);
router.delete('/:id', ...admin, numericId, ctrl.remove);

module.exports = router;
