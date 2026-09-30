const { Answer, Question, User, sequelize } = require('../models');
const { isSuperAdmin } = require('../services/businessService');
const { notifyNewAnswer } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { ok, created } = require('../utils/response');
const { paginate, paged } = require('../utils/pagination');

const USER_ATTRS = ['id', 'name'];

// GET /api/answers?questionId=1 — published answers of a question
exports.list = asyncHandler(async (req, res) => {
  if (!req.query.questionId) throw new AppError('questionId query parameter is required', 400);
  const pg = paginate(req.query);
  const { rows, count } = await Answer.findAndCountAll({
    where: { questionId: req.query.questionId, status: 'PUBLISHED' },
    include: [{ model: User, as: 'user', attributes: USER_ATTRS }],
    order: [['createdAt', 'ASC']],
    limit: pg.limit,
    offset: pg.offset,
  });
  return ok(res, paged(rows, count, pg));
});

// POST /api/answers — saves the answer and notifies the question owner in one transaction
exports.create = asyncHandler(async (req, res) => {
  const { questionId, answer: text } = req.body;

  const answer = await sequelize.transaction(async (transaction) => {
    const question = await Question.findOne({ where: { id: questionId, status: 'PUBLISHED' }, transaction });
    if (!question) throw new AppError('Question not found', 404);

    const saved = await Answer.create({ questionId: question.id, userId: req.user.id, answer: text }, { transaction });
    await notifyNewAnswer({ question, answer: saved, answerer: req.user, transaction });
    return saved;
  });

  return created(res, answer, 'Answer posted');
});

exports.update = asyncHandler(async (req, res) => {
  const answer = await Answer.findByPk(req.params.id);
  if (!answer) throw new AppError('Answer not found', 404);
  if (!isSuperAdmin(req.user) && answer.userId !== req.user.id) throw new AppError('You can only edit your own answer', 403);
  if (req.body.answer) await answer.update({ answer: req.body.answer });
  return ok(res, answer, 'Answer updated');
});

exports.remove = asyncHandler(async (req, res) => {
  const answer = await Answer.findByPk(req.params.id);
  if (!answer) throw new AppError('Answer not found', 404);
  if (!isSuperAdmin(req.user) && answer.userId !== req.user.id) throw new AppError('You can only delete your own answer', 403);
  await answer.destroy();
  return ok(res, null, 'Answer deleted');
});
