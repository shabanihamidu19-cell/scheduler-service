const cron = require('node-cron');
const axios = require('axios');
const Job = require('../models/Job');
const config = require('../config');

class SchedulerService {
  constructor() {
    this.activeJobs = new Map(); // jobId → cron task
  }

  // Start all active jobs from DB when service boots
  async initialize() {
    const jobs = await Job.find({ status: 'active' });
    console.log(`Loading ${jobs.length} active jobs...`);

    for (const job of jobs) {
      this.scheduleJob(job);
    }
  }

  scheduleJob(job) {
    if (!cron.validate(job.cronExpression)) {
      console.error(`Invalid cron expression for job ${job._id}: ${job.cronExpression}`);
      return;
    }

    // Stop existing if any
    if (this.activeJobs.has(job._id.toString())) {
      this.activeJobs.get(job._id.toString()).stop();
    }

    const task = cron.schedule(job.cronExpression, async () => {
      await this.executeJob(job);
    });

    this.activeJobs.set(job._id.toString(), task);
    console.log(`Scheduled job: ${job.jobName} (${job.cronExpression})`);
  }

  async executeJob(job) {
    console.log(`Executing job: ${job.jobName}`);

    try {
      switch (job.action) {
        case 'send_notification':
          await this.triggerNotification(job.payload);
          break;
        case 'generate_report':
          await this.triggerAnalyticsReport(job.payload);
          break;
        case 'cleanup':
        case 'token_cleanup':
          console.log(`Running cleanup: ${job.jobName}`, job.payload);
          // Hapa unaweza ku-call Auth Service
          break;
        case 'custom':
          console.log(`Custom action for ${job.jobName}`, job.payload);
          break;
        default:
          console.warn(`Unknown action: ${job.action}`);
      }

      // Update job stats
      await Job.findByIdAndUpdate(job._id, {
        lastRunAt: new Date(),
        $inc: { runCount: 1 }
      });
    } catch (error) {
      console.error(`Job failed: ${job.jobName}`, error.message);
      await Job.findByIdAndUpdate(job._id, { status: 'failed' });
    }
  }

  async triggerNotification(payload) {
    try {
      await axios.post(`${config.notificationServiceUrl}/notifications`, {
        ...payload,
        source: 'scheduler-service'
      });
      console.log('Notification triggered successfully');
    } catch (err) {
      console.error('Failed to trigger notification:', err.message);
    }
  }

  async triggerAnalyticsReport(payload) {
    try {
      await axios.post(`${config.analyticsServiceUrl}/analytics`, {
        service: 'scheduler-service',
        metric: 'custom',
        value: 1,
        metadata: { type: 'scheduled_report', ...payload }
      });
      console.log('Analytics report triggered');
    } catch (err) {
      console.error('Failed to trigger analytics:', err.message);
    }
  }

  async createJob(data) {
    const job = await Job.create(data);
    if (job.status === 'active') {
      this.scheduleJob(job);
    }
    return job;
  }

  async getJobs(filter = {}) {
    return await Job.find(filter).sort({ createdAt: -1 });
  }

  async getJobById(id) {
    return await Job.findById(id);
  }

  async updateJob(id, updates) {
    const job = await Job.findByIdAndUpdate(id, updates, { new: true });

    if (!job) return null;

    // Re-schedule if still active
    if (job.status === 'active') {
      this.scheduleJob(job);
    } else if (this.activeJobs.has(id)) {
      this.activeJobs.get(id).stop();
      this.activeJobs.delete(id);
    }

    return job;
  }

  async cancelJob(id) {
    const job = await Job.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    );

    if (this.activeJobs.has(id)) {
      this.activeJobs.get(id).stop();
      this.activeJobs.delete(id);
    }

    return job;
  }
}

module.exports = new SchedulerService();
