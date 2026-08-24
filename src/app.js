const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const logger = require('./utils/logger');
const schedulerRoutes = require('./routes/schedulerRoutes');
const schedulerService = require('./services/schedulerService');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(logger);

app.use('/', schedulerRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'scheduler-service' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('MongoDB connected');

    // Load and start all active jobs
    await schedulerService.initialize();

    app.listen(config.port, () => {
      console.log(`Scheduler Service running on port ${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;
