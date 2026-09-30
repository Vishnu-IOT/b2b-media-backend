require('dotenv').config({ quiet: true });
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

const origins = (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);

// Images/videos are served from this API but embedded by the frontend on another origin
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: origins.includes('*') || origins.length === 0 ? true : origins, credentials: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Uploaded files: /uploads/images/<file>, /uploads/videos/<file>, ...
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), { maxAge: '7d', index: false }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
