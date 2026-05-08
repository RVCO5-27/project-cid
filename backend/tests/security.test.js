const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/security');

describe('Security Enforcement - Admin Only Access', () => {
  let adminToken;
  let nonAdminToken;
  let secret;

  beforeAll(() => {
    secret = getJwtSecret();
    
    // Create a mock admin token
    adminToken = jwt.sign(
      { id: 1, username: 'admin', role: 'SuperAdmin' },
      secret,
      { expiresIn: '1h' }
    );

    // Create a mock non-admin token (role not in ADMIN_ROLES)
    nonAdminToken = jwt.sign(
      { id: 2, username: 'user', role: 'Guest' },
      secret,
      { expiresIn: '1h' }
    );
  });

  describe('School Management Protection', () => {
    const schoolData = {
      school_id: 'TEST-001',
      school_name: 'Test School',
      principal_name: 'Test Principal',
      designation: 'Principal',
      year_started: 2026
    };

    test('POST /api/schools should fail without token (401)', async () => {
      const res = await request(app)
        .post('/api/schools')
        .send(schoolData);
      expect(res.status).toBe(401);
    });

    test('POST /api/schools should fail with non-admin role (403)', async () => {
      const res = await request(app)
        .post('/api/schools')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send(schoolData);
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Admin access required');
    });

    test('DELETE /api/schools/:id should fail with non-admin role (403)', async () => {
      const res = await request(app)
        .delete('/api/schools/1')
        .set('Authorization', `Bearer ${nonAdminToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Issuances Management Protection', () => {
    test('POST /api/admin/issuances-mgmt should fail without token (401)', async () => {
      const res = await request(app)
        .post('/api/admin/issuances-mgmt')
        .send({ title: 'Untrusted Update' });
      expect(res.status).toBe(401);
    });

    test('POST /api/admin/issuances-mgmt should fail with non-admin role (403)', async () => {
      const res = await request(app)
        .post('/api/admin/issuances-mgmt')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({ title: 'Untrusted Update' });
      expect(res.status).toBe(403);
    });
  });

  describe('File Upload Protection', () => {
    test('POST /api/upload should fail without token (401)', async () => {
      const res = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('test'), 'test.txt');
      expect(res.status).toBe(401);
    });

    test('POST /api/upload should fail with non-admin role (403)', async () => {
      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .attach('file', Buffer.from('test'), 'test.txt');
      expect(res.status).toBe(403);
    });
  });
});
