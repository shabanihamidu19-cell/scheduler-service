const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  cancelJob
} = require('../controllers/schedulerController');
const { validateCreateJob, validateUpdateJob } = require('../middleware/validate');

router.post('/schedule', validateCreateJob, createJob);
router.get('/jobs', getJobs);
router.get('/jobs/:id', getJob);
router.patch('/jobs/:id', validateUpdateJob, updateJob);
router.delete('/jobs/:id', cancelJob);

module.exports = router;
