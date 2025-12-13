import request from 'supertest';
import { createApp } from '../../app';
import { UserRole } from '@config/constants';
import { Express } from 'express';

describe('Parent Module', () => {
  let app: Express;
  let parentToken: string;
  let parentId: string;
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
    parentId = parentResponse.body.data.user.id;

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
  });

  describe('POST /api/auth/child', () => {
    it('should create a child successfully', async () => {
      const response = await request(app)
        .post('/api/auth/child')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          username: 'newchild',
          password: 'ChildPass123!',
          firstName: 'New',
          lastName: 'Child',
          dateOfBirth: '2012-03-20',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(UserRole.CHILD);
      expect(response.body.data.user.username).toBe('newchild');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/child')
        .send({
          username: 'newchild',
          password: 'ChildPass123!',
          firstName: 'New',
          lastName: 'Child',
          dateOfBirth: '2012-03-20',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/parent/children', () => {
    it('should get parent children list', async () => {
      const response = await request(app)
        .get('/api/parent/children')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/parent/dashboard', () => {
    it('should get dashboard data', async () => {
      const response = await request(app)
        .get('/api/parent/dashboard')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalScans');
      expect(response.body.data).toHaveProperty('totalIncidents');
      expect(response.body.data).toHaveProperty('unresolvedAlerts');
    });
  });

  describe('GET /api/parent/incidents', () => {
    it('should get incidents list', async () => {
      const response = await request(app)
        .get('/api/parent/incidents')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('incidents');
      expect(response.body.data).toHaveProperty('pagination');
    });
  });

  describe('GET /api/parent/analytics', () => {
    it('should get analytics data', async () => {
      const response = await request(app)
        .get('/api/parent/analytics')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Parent Settings', () => {
    describe('GET /api/parent/settings', () => {
      it('should get parent settings', async () => {
        const response = await request(app)
          .get('/api/parent/settings')
          .set('Authorization', `Bearer ${parentToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('notifications');
        expect(response.body.data).toHaveProperty('monitoring');
      });
    });

    describe('PUT /api/parent/settings', () => {
      it('should update parent settings', async () => {
        const response = await request(app)
          .put('/api/parent/settings')
          .set('Authorization', `Bearer ${parentToken}`)
          .send({
            notifications: {
              email: true,
              push: false,
              sms: true,
            },
            monitoring: {
              scanFrequency: 'hourly',
              sensitivityLevel: 'high',
            },
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.notifications.push).toBe(false);
      });
    });
  });
});
