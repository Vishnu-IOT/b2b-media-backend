const paginate = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
};

const paged = (rows, count, { page, limit }) => ({
  items: rows,
  pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
});

module.exports = { paginate, paged };
