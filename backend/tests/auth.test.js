const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

describe('Auth API', () => {
  const username = 'test_admin';
  const password = 'testPass123!';
  let server;

  beforeAll(async () => {
    const hash = await bcrypt.hash(password, 10);
    await db.execute('DELETE FROM admins WHERE username = ?', [username]);
    await db.execute('INSERT INTO admins (username, password, full_name, role) VALUES (?, ?, ?, ?)', [
      username,
      hash,
      'Test Admin',
      'Editor',
    ]);
  });

  afterAll(async () => {
    await db.execute('DELETE FROM admins WHERE username = ?', [username]);
  });

  test('login with valid credentials returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username, password })
      .expect(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ username, role: 'Editor' });
  });

  test('GET /api/admin/dashboard requires admin token with role', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username, password })
      .expect(200);
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);
    expect(res.body.user).toMatchObject({ username, role: 'Editor' });
  });

  test('login with invalid credentials returns 401', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ username, password: 'wrong' })
      .expect(401);
  });
});
