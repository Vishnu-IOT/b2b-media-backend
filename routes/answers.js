const router = require('express').Router();
const ctrl = require('../controllers/answerController');
const { authenticate } = require('../middlewares/auth');
const { validate, numericId } = require('../middlewares/validate');
const rules = require('../middlewares/validators').answer;

router.get('/', ctrl.list);
router.post('/', authenticate, validate(rules.create), ctrl.create);
router.put('/:id', authenticate, numericId, validate(rules.update), ctrl.update);
router.delete('/:id', authenticate, numericId, ctrl.remove);

module.exports = router;
