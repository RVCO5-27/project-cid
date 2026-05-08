const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

describe('Students API (protected)', () => {
  const admin = { username: 'test_admin_students', password: 'adminPass!234' };
  let token;

  beforeAll(async () => {
    // create admin
    const hash = await bcrypt.hash(admin.password, 10);
    await db.execute('DELETE FROM admins WHERE username = ?', [admin.username]);
    await db.execute('INSERT INTO admins (username, password, full_name, role) VALUES (?, ?, ?, ?)', [
      admin.username,
      hash,
      'Students Test',
      'Editor',
    ]);

    // login and get token
    const res = await request(app).post('/api/auth/login').send({ username: admin.username, password: admin.password });
    token = res.body.token;
  });

  afterAll(async () => {
    await db.execute('DELETE FROM admins WHERE username = ?', [admin.username]);
    await db.execute("DELETE FROM students WHERE student_id LIKE 'TST-%'");
    if (typeof db.close === 'function') await db.close();
  });

  test('unauthorized access to /api/students returns 401', async () => {
    await request(app).get('/api/students').expect(401);
  });

  test('create student with valid data returns 201', async () => {
    const payload = { student_id: 'TST-001', first_name: 'Alice', last_name: 'Tester', grade_level: '11', strand: 'STEM', section: 'A', school_year: '2025-2026' };
    const res = await request(app).post('/api/students').set('Authorization', `Bearer ${token}`).send(payload).expect(201);
    expect(res.body).toMatchObject({ student_id: payload.student_id, first_name: payload.first_name, last_name: payload.last_name });
  });

  test('validation fails when required fields missing', async () => {
    const payload = { first_name: 'NoID' };
    const res = await request(app).post('/api/students').set('Authorization', `Bearer ${token}`).send(payload).expect(422);
    expect(res.body).toHaveProperty('errors');
  });

  test('list students returns array', async () => {
    const res = await request(app).get('/api/students').set('Authorization', `Bearer ${token}`).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
