const { Notification } = require('../models');
const { NOTIFICATION_TYPES } = require('../config/constants');

const shorten = (text, n = 80) => (text.length > n ? `${text.slice(0, n - 1)}…` : text);

// Tell the question owner that someone answered (nothing is sent when you answer your own question)
const notifyNewAnswer = async ({ question, answer, answerer, transaction }) => {
  if (question.userId === answerer.id) return null;
  return Notification.create(
    {
      userId: question.userId,
      type: NOTIFICATION_TYPES.NEW_ANSWER,
      title: 'New answer to your question',
      message: `${answerer.name} answered your question "${shorten(question.title)}"`,
      questionId: question.id,
      answerId: answer.id,
    },
    { transaction }
  );
};

module.exports = { notifyNewAnswer };
