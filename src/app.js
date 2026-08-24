const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const logger = require('./utils/logger');
const schedulerRoutes = require('./routes/schedulerRoutes');
const schedulerService = require('./services/schedulerService');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' }
});
app.use(limiter);

// Request logging (simple)
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/', schedulerRoutes);

// Health check (includes Agenda status)
app.get('/health', async (req, res) => {
  const health = await schedulerService.getHealth();
  const statusCode = health.ready ? 200 : 503;

  res.status(statusCode).json({
    status: health.ready ? 'ok' : 'degraded',
    service: 'scheduler-service',
    timestamp: new Date().toISOString(),
    ...health
  });
});

// 404 + Error handler
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    // Connect Mongo (Agenda also uses the same URI)
    await mongoose.connect(config.mongoUri);
    logger.info('MongoDB connected');

    // Start Agenda
    await schedulerService.initialize();

    const server = app.listen(config.port, () => {
      logger.info(`Scheduler Service running on port ${config.port} [${config.nodeEnv}]`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await schedulerService.gracefulShutdown();
        await mongoose.connection.close();
        logger.info('Process terminated');
        process.exit(0);
      });

      // Force exit after 10s
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('Failed to start service', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;
