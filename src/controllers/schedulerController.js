const schedulerService = require('../services/schedulerService');
const { AppError } = require('../middleware/errorHandler');

exports.createJob = async (req, res, next) => {
  try {
    const job = await schedulerService.createJob(req.body);
    res.status(201).json({
      success: true,
      message: 'Job scheduled successfully',
      data: job
    });
  } catch (error) {
    next(error);
  }
};

exports.getJobs = async (req, res, next) => {
  try {
    const result = await schedulerService.getJobs(req.query);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

exports.getJob = async (req, res, next) => {
  try {
    const job = await schedulerService.getJobById(req.params.id);
    if (!job) {
      throw new AppError('Job not found', 404);
    }
    res.json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

exports.updateJob = async (req, res, next) => {
  try {
    const job = await schedulerService.updateJob(req.params.id, req.body);
    if (!job) {
      throw new AppError('Job not found', 404);
    }
    res.json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelJob = async (req, res, next) => {
  try {
    const result = await schedulerService.cancelJob(req.params.id);
    if (!result) {
      throw new AppError('Job not found', 404);
    }
    res.json({
      success: true,
      message: 'Job cancelled successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
