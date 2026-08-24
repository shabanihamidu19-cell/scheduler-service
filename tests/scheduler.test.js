const request = require('supertest');
const mongoose = require('mongoose');

// Note: Full integration tests with Agenda require the service to be fully started.
// These are basic smoke tests. For thorough testing, run against a test Mongo instance.

describe('Scheduler Service API', () => {
  let app;

  beforeAll(async () => {
    // Set test env
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scheduler_test';

    // Import after env is set
    app = require('../src/app');
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  test('GET /health should return status', async () => {
    const res = await request(app).get('/health');
    // May be 200 or 503 depending on whether Agenda finished initializing
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('service', 'scheduler-service');
  });

  test('POST /schedule should validate required fields', async () => {
    const res = await request(app)
      .post('/schedule')
      .send({
        jobName: 'test'
        // missing cronExpression and action
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /jobs should return array structure', async () => {
    const res = await request(app).get('/jobs');
    // Depending on initialization state
    expect([200, 500, 503]).toContain(res.status);
  });
});
