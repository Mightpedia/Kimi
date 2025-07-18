require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const { errorMiddleware } = require('./middleware/error.middleware');
const { MONGODB_URI, PORT, CORS_ORIGIN } = require('./config/env');
const allRoutes = require('./routes/index');

const app = express();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(mongoSanitize());
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully.'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.1.0'
  });
});

app.use('/api', allRoutes);

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Access API at http://localhost:${PORT}`);
});

module.exports = app;