require('dotenv').config();

const required = ['MONGODB_URI'];

for (const key of required) {
  if (!process.env[key] && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 4001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/scheduler_db',

  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4002',
  analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4000',

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100
  },

  agenda: {
    collection: process.env.AGENDA_COLLECTION || 'agendaJobs',
    processEvery: process.env.AGENDA_PROCESS_EVERY || '30 seconds'
  }
};
