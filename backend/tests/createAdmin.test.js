const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../server');
const db = require('../config/db');

describe('Create admin API', () => {
  beforeAll(async () => {
    const hash = await bcrypt.hash('x', 10);
    await db.execute('DELETE FROM admins WHERE username = ?', ['bootstrap_guard_test']);
    await db.execute('INSERT INTO admins (username, password, full_name, role) VALUES (?, ?, ?, ?)', [
      'bootstrap_guard_test',
      hash,
      'Guard',
      'Editor',
    ]);
  });

  afterAll(async () => {
    await db.execute('DELETE FROM admins WHERE username = ?', ['bootstrap_guard_test']);
  });

  test('GET /api/create-admin/status returns available', async () => {
    const res = await request(app).get('/api/create-admin/status').expect(200);
    expect(res.body).toHaveProperty('available');
    expect(typeof res.body.available).toBe('boolean');
    expect(res.body.available).toBe(false);
  });

  test('POST returns 403 when an admin already exists', async () => {
    const res = await request(app)
      .post('/api/create-admin')
      .send({
        username: 'new_bootstrap',
        email: 'new_bootstrap@example.com',
        password: 'Abcd1234!@',
      })
      .expect(403);
    expect(res.body.message).toMatch(/Admin.*already exists/i);
  });

  test('POST returns 422 when password is weak', async () => {
    const res = await request(app)
      .post('/api/create-admin')
      .send({
        username: 'u',
        email: 'u@example.com',
        password: 'short',
      })
      .expect(422);
    expect(res.body.message || res.body.errors).toBeTruthy();
  });
});
