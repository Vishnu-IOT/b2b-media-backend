const { Op, literal } = require('sequelize');
const { Question, Answer, User } = require('../models');
const { isSuperAdmin } = require('../services/businessService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { ok, created } = require('../utils/response');
const { paginate, paged } = require('../utils/pagination');
const pick = require('../utils/pick');

const FIELDS = ['title', 'description', 'category'];
const USER_ATTRS = ['id', 'name'];
const ANSWER_COUNT = [
  literal("(SELECT COUNT(*) FROM answers AS a WHERE a.questionId = `Question`.`id` AND a.status = 'PUBLISHED')"),
  'answerCount',
];

const canManage = (user, question) => isSuperAdmin(user) || question.userId === user.id;

const listQuestions = async (req, res, baseWhere) => {
  const pg = paginate(req.query);
  const where = { ...baseWhere };
  if (req.query.category) where.category = { [Op.like]: `%${req.query.category}%` };
  if (req.query.q) where[Op.or] = ['title', 'description'].map((f) => ({ [f]: { [Op.like]: `%${req.query.q}%` } }));

  const { rows, count } = await Question.findAndCountAll({
    where,
    attributes: { include: [ANSWER_COUNT] },
    include: [{ model: User, as: 'user', attributes: USER_ATTRS }],
    order: [['createdAt', 'DESC']],
    limit: pg.limit,
    offset: pg.offset,
  });
  return ok(res, paged(rows, count, pg));
};

// GET /api/questions — public feed
exports.list = asyncHandler((req, res) => listQuestions(req, res, { status: 'PUBLISHED' }));

// GET /api/questions/mine — everything the caller asked, in any status
exports.mine = asyncHandler((req, res) => listQuestions(req, res, { userId: req.user.id }));

// GET /api/questions/:id — the question with its published answers
exports.getOne = asyncHandler(async (req, res) => {
  const question = await Question.findByPk(req.params.id, {
    attributes: { include: [ANSWER_COUNT] },
    include: [
      { model: User, as: 'user', attributes: USER_ATTRS },
      {
        model: Answer,
        as: 'answers',
        where: { status: 'PUBLISHED' },
        required: false,
        separate: true,
        order: [['createdAt', 'ASC']],
        include: [{ model: User, as: 'user', attributes: USER_ATTRS }],
      },
    ],
  });
  if (!question || (question.status !== 'PUBLISHED' && !(req.user && canManage(req.user, question)))) {
    throw new AppError('Question not found', 404);
  }
  return ok(res, question);
});

exports.create = asyncHandler(async (req, res) => {
  const question = await Question.create({ ...pick(req.body, FIELDS), userId: req.user.id });
  return created(res, question, 'Question posted');
});

exports.update = asyncHandler(async (req, res) => {
  const question = await Question.findByPk(req.params.id);
  if (!question) throw new AppError('Question not found', 404);
  if (!canManage(req.user, question)) throw new AppError('You can only edit your own question', 403);
  await question.update(pick(req.body, FIELDS));
  return ok(res, question, 'Question updated');
});

exports.remove = asyncHandler(async (req, res) => {
  const question = await Question.findByPk(req.params.id);
  if (!question) throw new AppError('Question not found', 404);
  if (!canManage(req.user, question)) throw new AppError('You can only delete your own question', 403);
  await question.destroy(); // answers and related notifications cascade
  return ok(res, null, 'Question deleted');
});
