const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  cancelJob
} = require('../controllers/schedulerController');

router.post('/schedule', createJob);
router.get('/jobs', getJobs);
router.get('/jobs/:id', getJob);
router.patch('/jobs/:id', updateJob);
router.delete('/jobs/:id', cancelJob);

module.exports = router;
