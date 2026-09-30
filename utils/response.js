const ok = (res, data = null, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, message, data });

const created = (res, data = null, message = 'Created') => ok(res, data, message, 201);

module.exports = { ok, created };
