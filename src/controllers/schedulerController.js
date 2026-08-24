const schedulerService = require('../services/schedulerService');

exports.createJob = async (req, res) => {
  try {
    const { jobName, cronExpression, action, payload, createdBy } = req.body;

    if (!jobName || !cronExpression || !action) {
      return res.status(400).json({
        success: false,
        message: 'jobName, cronExpression and action are required'
      });
    }

    const job = await schedulerService.createJob({
      jobName,
      cronExpression,
      action,
      payload: payload || {},
      createdBy: createdBy || 'api'
    });

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create job' });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const jobs = await schedulerService.getJobs(req.query);
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
};

exports.getJob = async (req, res) => {
  try {
    const job = await schedulerService.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch job' });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await schedulerService.updateJob(req.params.id, req.body);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update job' });
  }
};

exports.cancelJob = async (req, res) => {
  try {
    const job = await schedulerService.cancelJob(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, message: 'Job cancelled', data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel job' });
  }
};
