const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate, numericId } = require('../middlewares/validate');
const rules = require('../middlewares/validators');
const { ROLES } = require('../config/constants');

router.use(authenticate, authorize(ROLES.SUPER_ADMIN));

router.get('/stats', ctrl.stats);

// Business users
router.get('/users', ctrl.listUsers);
router.post('/users', validate(rules.adminUser.create), ctrl.createUser);
router.get('/users/:id', numericId, ctrl.getUser);
router.put('/users/:id', numericId, validate(rules.adminUser.update), ctrl.updateUser);
router.delete('/users/:id', numericId, ctrl.deleteUser);

// Approve / reject business content (types: businesses, stories, strategies, achievements, products, enquiries, videos, questions, answers)
router.get('/pending', ctrl.pending);
router.get('/content/:type', ctrl.listContent);
router.patch('/content/:type/:id/status', numericId, validate(rules.moderation.status), ctrl.setStatus);
router.delete('/content/:type/:id', numericId, ctrl.deleteContent);

module.exports = router;
