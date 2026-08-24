const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    jobName: {
      type: String,
      required: true,
      trim: true
    },
    cronExpression: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'send_notification',
        'generate_report',
        'cleanup',
        'token_cleanup',
        'custom'
      ]
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'failed', 'cancelled'],
      default: 'active'
    },
    lastRunAt: Date,
    nextRunAt: Date,
    runCount: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: String,
      default: 'system'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
