const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/auth');
const { numericId } = require('../middlewares/validate');

router.use(authenticate);
router.get('/', ctrl.list);
router.get('/unread-count', ctrl.unreadCount);
router.patch('/read-all', ctrl.markAllRead);
router.patch('/:id/read', numericId, ctrl.markRead);
router.delete('/:id', numericId, ctrl.remove);

module.exports = router;
