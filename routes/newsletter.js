const router = require('express').Router();
const ctrl = require('../controllers/newsletterController');
const { validate } = require('../middlewares/validate');
const rules = require('../middlewares/validators').newsletter;

router.post('/subscribe', validate(rules.subscribe), ctrl.subscribe);
router.get('/unsubscribe', ctrl.unsubscribeByToken);

module.exports = router;
