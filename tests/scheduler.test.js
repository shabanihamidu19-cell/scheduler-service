const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Job = require('../src/models/Job');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scheduler_test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Job.deleteMany({});
});

describe('Scheduler Service', () => {
  test('POST /schedule - should create a job', async () => {
    const res = await request(app)
      .post('/schedule')
      .send({
        jobName: 'daily-physics-reminder',
        cronExpression: '0 9 * * *',
        action: 'send_notification',
        payload: {
          userId: '123',
          message: 'Una siku 3 haujapitia somo lako pendwa la physics...'
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.jobName).toBe('daily-physics-reminder');
  });

  test('GET /jobs - should list jobs', async () => {
    await Job.create({
      jobName: 'test-job',
      cronExpression: '*/5 * * * *',
      action: 'cleanup'
    });

    const res = await request(app).get('/jobs');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });
});
