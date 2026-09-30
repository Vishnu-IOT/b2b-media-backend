const router = require('express').Router();
const ctrl = require('../controllers/resourceCategoryController');
const { authenticate, optionalAuth, authorize } = require('../middlewares/auth');
const { validate, numericId } = require('../middlewares/validate');
const rules = require('../middlewares/validators').resourceCategory;
const { ROLES } = require('../config/constants');

const admin = [authenticate, authorize(ROLES.SUPER_ADMIN)];

router.get('/', optionalAuth, ctrl.list);
router.get('/:idOrSlug', optionalAuth, ctrl.getOne);
router.post('/', ...admin, validate(rules.create), ctrl.create);
router.put('/:id', ...admin, numericId, validate(rules.update), ctrl.update);
router.delete('/:id', ...admin, numericId, ctrl.remove);

module.exports = router;
