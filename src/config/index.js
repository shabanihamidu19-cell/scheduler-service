require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4001,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/scheduler_db',
  nodeEnv: process.env.NODE_ENV || 'development',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4002',
  analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4000'
};
