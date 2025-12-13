import request from 'supertest';
import { createApp } from '../../app';
import { AlertSeverity, AlertStatus } from '@config/constants';
import Alert from '@modules/alerts/alert.model';
import { Express } from 'express';

describe('Alerts Module', () => {
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

    // Create some scans with abusive content to generate alerts
    await request(app)
      .post('/api/scan/text')
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        content: 'I hate you and want to hurt you badly',
        source: 'chat_app',
      });
  });

  describe('GET /api/alerts', () => {
    it('should get alerts for parent', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should filter alerts by severity', async () => {
      const response = await request(app)
        .get(`/api/alerts?severity=${AlertSeverity.HIGH}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.alerts.forEach((alert: any) => {
        expect(alert.severity).toBe(AlertSeverity.HIGH);
      });
    });

    it('should filter alerts by status', async () => {
      const response = await request(app)
        .get(`/api/alerts?status=${AlertStatus.PENDING}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/alerts/:id', () => {
    it('should get alert by ID', async () => {
      // First get the list of alerts
      const listResponse = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${parentToken}`);

      if (listResponse.body.data.alerts.length > 0) {
        const alertId = listResponse.body.data.alerts[0].id;

        const response = await request(app)
          .get(`/api/alerts/${alertId}`)
          .set('Authorization', `Bearer ${parentToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(alertId);
      }
    });
  });

  describe('PUT /api/alerts/:id/status', () => {
    it('should update alert status', async () => {
      // First get the list of alerts
      const listResponse = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${parentToken}`);

      if (listResponse.body.data.alerts.length > 0) {
        const alertId = listResponse.body.data.alerts[0].id;

        const response = await request(app)
          .put(`/api/alerts/${alertId}/status`)
          .set('Authorization', `Bearer ${parentToken}`)
          .send({ status: AlertStatus.REVIEWED })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe(AlertStatus.REVIEWED);
      }
    });
  });

  describe('PUT /api/alerts/:id/acknowledge', () => {
    it('should acknowledge alert', async () => {
      // First get the list of alerts
      const listResponse = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${parentToken}`);

      if (listResponse.body.data.alerts.length > 0) {
        const alertId = listResponse.body.data.alerts[0].id;

        const response = await request(app)
          .put(`/api/alerts/${alertId}/acknowledge`)
          .set('Authorization', `Bearer ${parentToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.acknowledgedAt).toBeDefined();
      }
    });
  });

  describe('PUT /api/alerts/:id/resolve', () => {
    it('should resolve alert with notes', async () => {
      // First get the list of alerts
      const listResponse = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${parentToken}`);

      if (listResponse.body.data.alerts.length > 0) {
        const alertId = listResponse.body.data.alerts[0].id;

        const response = await request(app)
          .put(`/api/alerts/${alertId}/resolve`)
          .set('Authorization', `Bearer ${parentToken}`)
          .send({ notes: 'Discussed with child, issue resolved' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe(AlertStatus.RESOLVED);
        expect(response.body.data.resolvedAt).toBeDefined();
      }
    });
  });

  describe('GET /api/alerts/stats', () => {
    it('should get alert statistics', async () => {
      const response = await request(app)
        .get('/api/alerts/stats')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('bySeverity');
      expect(response.body.data).toHaveProperty('byStatus');
    });
  });
});
