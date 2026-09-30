const router = require('express').Router();
const ctrl = require('../controllers/businessController');
const { authenticate, optionalAuth, authorize } = require('../middlewares/auth');
const { uploadFields } = require('../middlewares/upload');
const { validate, numericId } = require('../middlewares/validate');
const rules = require('../middlewares/validators').business;
const { ROLES } = require('../config/constants');

const upload = uploadFields(['logo', 'coverImage']);
const both = authorize(ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN);

router.get('/', ctrl.list);
router.get('/me', authenticate, authorize(ROLES.BUSINESS_ADMIN), ctrl.getMine);
router.put('/me', authenticate, authorize(ROLES.BUSINESS_ADMIN), upload, validate(rules.update), ctrl.updateMine);
router.get('/:idOrSlug', optionalAuth, ctrl.getOne);
router.post('/', authenticate, both, upload, validate(rules.create), ctrl.create);
router.put('/:id', authenticate, both, numericId, upload, validate(rules.update), ctrl.update);
router.delete('/:id', authenticate, authorize(ROLES.SUPER_ADMIN), numericId, ctrl.remove);

module.exports = router;
