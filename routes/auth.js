const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const rules = require('../middlewares/validators').auth;

router.post('/register', validate(rules.register), ctrl.register);
router.post('/login', validate(rules.login), ctrl.login);
router.get('/me', authenticate, ctrl.me);
router.put('/change-password', authenticate, validate(rules.changePassword), ctrl.changePassword);

module.exports = router;
