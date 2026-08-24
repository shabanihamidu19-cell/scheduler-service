const Agenda = require('agenda');
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class SchedulerService {
  constructor() {
    this.agenda = null;
    this.isReady = false;
  }

  async initialize() {
    this.agenda = new Agenda({
      db: {
        address: config.mongoUri,
        collection: config.agenda.collection
      },
      processEvery: config.agenda.processEvery,
      maxConcurrency: 20,
      defaultConcurrency: 5
    });

    this.defineJobs();

    await this.agenda.start();
    this.isReady = true;

    logger.info('Agenda started successfully');

    this.agenda.on('fail', (err, job) => {
      logger.error(`Job failed: ${job.attrs.name}`, {
        error: err.message,
        jobId: job.attrs._id,
        data: job.attrs.data
      });
    });

    this.agenda.on('success', (job) => {
      logger.info(`Job completed: ${job.attrs.name}`, { jobId: job.attrs._id });
    });
  }

  defineJobs() {
    this.agenda.define('send_notification', async (job) => {
      const { payload } = job.attrs.data;
      await this.triggerNotification(payload);
    });

    this.agenda.define('generate_report', async (job) => {
      const { payload } = job.attrs.data;
      await this.triggerAnalyticsReport(payload);
    });

    this.agenda.define('cleanup', async (job) => {
      logger.info('Running cleanup job', job.attrs.data);
    });

    this.agenda.define('token_cleanup', async (job) => {
      logger.info('Running token cleanup', job.attrs.data);
    });

    this.agenda.define('custom', async (job) => {
      logger.info('Running custom job', job.attrs.data);
    });
  }

  async triggerNotification(payload) {
    try {
      await axios.post(`${config.notificationServiceUrl}/notifications`, {
        ...payload,
        source: 'scheduler-service'
      }, { timeout: 10000 });
      logger.info('Notification triggered successfully');
    } catch (err) {
      logger.error('Failed to trigger notification', { error: err.message });
      throw err;
    }
  }

  async triggerAnalyticsReport(payload) {
    try {
      await axios.post(`${config.analyticsServiceUrl}/analytics`, {
        service: 'scheduler-service',
        metric: 'custom',
        value: 1,
        metadata: { type: 'scheduled_report', ...payload }
      }, { timeout: 10000 });
      logger.info('Analytics report triggered');
    } catch (err) {
      logger.error('Failed to trigger analytics', { error: err.message });
      throw err;
    }
  }

  async createJob({ jobName, cronExpression, action, payload = {}, createdBy = 'api', runAt, timezone = 'Africa/Nairobi' }) {
    if (!this.isReady) {
      throw new AppError('Scheduler is not ready yet', 503);
    }

    const data = {
      jobName,
      action,
      payload,
      createdBy,
      createdAt: new Date()
    };

    let job;

    if (runAt) {
      job = await this.agenda.schedule(runAt, action, data);
    } else if (cronExpression) {
      job = this.agenda.create(action, data);
      job.repeatEvery(cronExpression, { timezone });
      job.unique({ 'data.jobName': jobName });
      await job.save();
    } else {
      throw new AppError('Either cronExpression or runAt is required', 400);
    }

    logger.info(`Job created: ${jobName}`, { jobId: job.attrs._id, action });
    return this.formatJob(job);
  }

  async getJobs({ status, action, limit = 50, page = 1 } = {}) {
    const query = {};
    if (status === 'active') query.disabled = { $ne: true };
    if (status === 'paused' || status === 'cancelled') query.disabled = true;
    if (action) query.name = action;

    const skip = (page - 1) * limit;
    const jobs = await this.agenda.jobs(query, {}, limit, skip);

    return {
      data: jobs.map(j => this.formatJob(j)),
      pagination: {
        page: Number(page),
        limit: Number(limit)
      }
    };
  }

  async getJobById(id) {
    const jobs = await this.agenda.jobs({ _id: id });
    if (!jobs.length) return null;
    return this.formatJob(jobs[0]);
  }

  async updateJob(id, updates) {
    const jobs = await this.agenda.jobs({ _id: id });
    if (!jobs.length) return null;

    const job = jobs[0];

    if (updates.jobName) job.attrs.data.jobName = updates.jobName;
    if (updates.payload) job.attrs.data.payload = updates.payload;
    if (updates.action) job.attrs.name = updates.action;

    if (updates.status === 'paused' || updates.status === 'cancelled') {
      await job.disable();
    } else if (updates.status === 'active') {
      await job.enable();
    }

    if (updates.cronExpression) {
      job.repeatEvery(updates.cronExpression, {
        timezone: updates.timezone || 'Africa/Nairobi'
      });
    }

    await job.save();
    logger.info(`Job updated: ${id}`);
    return this.formatJob(job);
  }

  async cancelJob(id) {
    const numRemoved = await this.agenda.cancel({ _id: id });
    if (numRemoved === 0) return null;

    logger.info(`Job cancelled/removed: ${id}`);
    return { id, cancelled: true };
  }

  formatJob(job) {
    return {
      id: job.attrs._id,
      name: job.attrs.name,
      jobName: job.attrs.data?.jobName,
      payload: job.attrs.data?.payload,
      createdBy: job.attrs.data?.createdBy,
      nextRunAt: job.attrs.nextRunAt,
      lastRunAt: job.attrs.lastRunAt,
      lastFinishedAt: job.attrs.lastFinishedAt,
      failedAt: job.attrs.failedAt,
      failCount: job.attrs.failCount,
      disabled: job.attrs.disabled || false,
      repeatInterval: job.attrs.repeatInterval,
      timezone: job.attrs.repeatTimezone
    };
  }

  async getHealth() {
    return {
      ready: this.isReady,
      agendaRunning: !!this.agenda
    };
  }

  async gracefulShutdown() {
    if (this.agenda) {
      logger.info('Stopping Agenda gracefully...');
      await this.agenda.stop();
      logger.info('Agenda stopped');
    }
  }
}

module.exports = new SchedulerService();
