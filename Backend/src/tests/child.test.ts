import request from 'supertest';
import { createApp } from '../../app';
import { UserRole } from '@config/constants';
import { Express } from 'express';

describe('Child Module', () => {
  let app: Express;
  let parentToken: string;
  let childToken: string;
  let childId: string;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    // Register parent
    const parentResponse = await request(app).post('/api/auth/register').send({
      email: 'parent@example.com',
      password: 'SecurePass123!',
      firstName: 'Parent',
      lastName: 'User',
    });
    parentToken = parentResponse.body.data.accessToken;

    // Create child
    const childResponse = await request(app)
      .post('/api/auth/child')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        username: 'childuser',
        password: 'ChildPass123!',
        firstName: 'Child',
        lastName: 'User',
        dateOfBirth: '2010-05-15',
      });
    childId = childResponse.body.data.user.id;

    // Login as child
    const loginResponse = await request(app).post('/api/auth/login').send({
      username: 'childuser',
      password: 'ChildPass123!',
    });
    childToken = loginResponse.body.data.accessToken;
  });

  describe('GET /api/child/profile', () => {
    it('should get child profile', async () => {
      const response = await request(app)
        .get('/api/child/profile')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('childuser');
      expect(response.body.data.role).toBe(UserRole.CHILD);
    });
  });

  describe('PUT /api/child/profile', () => {
    it('should update child profile (non-credential fields)', async () => {
      const response = await request(app)
        .put('/api/child/profile')
        .set('Authorization', `Bearer ${childToken}`)
        .send({
          firstName: 'UpdatedName',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('UpdatedName');
    });

    it('should NOT allow child to update password', async () => {
      const response = await request(app)
        .put('/api/child/profile')
        .set('Authorization', `Bearer ${childToken}`)
        .send({
          password: 'NewPassword123!',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should NOT allow child to update username', async () => {
      const response = await request(app)
        .put('/api/child/profile')
        .set('Authorization', `Bearer ${childToken}`)
        .send({
          username: 'newusername',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should NOT allow child to update email', async () => {
      const response = await request(app)
        .put('/api/child/profile')
        .set('Authorization', `Bearer ${childToken}`)
        .send({
          email: 'newemail@example.com',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/child/resources', () => {
    it('should get mental health resources', async () => {
      const response = await request(app)
        .get('/api/child/resources')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/child/scan-history', () => {
    it('should get child scan history', async () => {
      const response = await request(app)
        .get('/api/child/scan-history')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('scans');
      expect(response.body.data).toHaveProperty('pagination');
    });
  });
});
