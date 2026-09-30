const { Notification, Question } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { ok } = require('../utils/response');
const { paginate, paged } = require('../utils/pagination');

const findOwn = async (req) => {
  const notification = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!notification) throw new AppError('Notification not found', 404);
  return notification;
};

// GET /api/notifications?isRead=false
exports.list = asyncHandler(async (req, res) => {
  const pg = paginate(req.query);
  const where = { userId: req.user.id };
  if (req.query.isRead === 'true') where.isRead = true;
  if (req.query.isRead === 'false') where.isRead = false;

  const { rows, count } = await Notification.findAndCountAll({
    where,
    include: [{ model: Question, as: 'question', attributes: ['id', 'title'] }],
    order: [['createdAt', 'DESC']],
    limit: pg.limit,
    offset: pg.offset,
  });
  return ok(res, paged(rows, count, pg));
});

exports.unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.count({ where: { userId: req.user.id, isRead: false } });
  return ok(res, { count });
});

exports.markRead = asyncHandler(async (req, res) => {
  const notification = await findOwn(req);
  await notification.update({ isRead: true });
  return ok(res, notification, 'Marked as read');
});

exports.markAllRead = asyncHandler(async (req, res) => {
  const [updated] = await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
  return ok(res, { updated }, 'All notifications marked as read');
});

exports.remove = asyncHandler(async (req, res) => {
  const notification = await findOwn(req);
  await notification.destroy();
  return ok(res, null, 'Notification deleted');
});
