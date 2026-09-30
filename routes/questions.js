const router = require('express').Router();
const ctrl = require('../controllers/questionController');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { validate, numericId } = require('../middlewares/validate');
const rules = require('../middlewares/validators').question;

router.get('/', ctrl.list);
router.get('/mine', authenticate, ctrl.mine);
router.get('/:id', optionalAuth, numericId, ctrl.getOne);
router.post('/', authenticate, validate(rules.create), ctrl.create);
router.put('/:id', authenticate, numericId, validate(rules.update), ctrl.update);
router.delete('/:id', authenticate, numericId, ctrl.remove);

module.exports = router;
