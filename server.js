require('dotenv').config({ quiet: true });
const app = require('./app');
const { sequelize } = require('./models');
const { ensureUploadDirs } = require('./config/upload');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set (see .env.example)');
    await sequelize.authenticate();
    ensureUploadDirs();
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}/api`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();
