import request from 'supertest';
import { createApp } from '../../app';
import { ContentType, AlertSeverity } from '@config/constants';
import { Express } from 'express';

describe('Scan Module', () => {
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

  describe('POST /api/scan/text', () => {
    it('should scan safe text and return non-abusive', async () => {
      const response = await request(app)
        .post('/api/scan/text')
        .set('Authorization', `Bearer ${childToken}`)
        .send({
          content: 'Hello, how are you doing today?',
          source: 'chat_app',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analysis.isAbusive).toBe(false);
      expect(response.body.data.analysis.severityScore).toBeLessThan(0.3);
    });

    it('should detect abusive text', async () => {
      const response = await request(app)
        .post('/api/scan/text')
        .set('Authorization', `Bearer ${childToken}`)
        .send({
          content: 'I hate you and want to hurt you',
          source: 'chat_app',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analysis.isAbusive).toBe(true);
      expect(response.body.data.analysis.severityScore).toBeGreaterThan(0.3);
    });

    it('should detect self-harm content', async () => {
      const response = await request(app)
        .post('/api/scan/text')
        .set('Authorization', `Bearer ${childToken}`)
        .send({
          content: 'I want to kill myself',
          source: 'chat_app',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analysis.isAbusive).toBe(true);
      expect(response.body.data.analysis.categories).toContain('self_harm');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/scan/text')
        .send({
          content: 'Test content',
          source: 'chat_app',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/scan/image', () => {
    it('should scan image URL', async () => {
      const response = await request(app)
        .post('/api/scan/image')
        .set('Authorization', `Bearer ${childToken}`)
        .send({
          imageUrl: 'https://example.com/image.jpg',
          source: 'social_media',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analysis).toBeDefined();
    });
  });

  describe('GET /api/scan/history', () => {
    beforeEach(async () => {
      // Create some scan records
      await request(app)
        .post('/api/scan/text')
        .set('Authorization', `Bearer ${childToken}`)
        .send({
          content: 'First test content',
          source: 'chat_app',
        });

      await request(app)
        .post('/api/scan/text')
        .set('Authorization', `Bearer ${childToken}`)
        .send({
          content: 'Second test content',
          source: 'social_media',
        });
    });

    it('should get scan history', async () => {
      const response = await request(app)
        .get('/api/scan/history')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.scans).toBeInstanceOf(Array);
      expect(response.body.data.scans.length).toBe(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter by abusive flag', async () => {
      const response = await request(app)
        .get('/api/scan/history?isAbusive=false')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.scans.forEach((scan: any) => {
        expect(scan.analysis.isAbusive).toBe(false);
      });
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/scan/history?page=1&limit=1')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.scans.length).toBe(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/scan/:id', () => {
    let scanId: string;

    beforeEach(async () => {
      const scanResponse = await request(app)
        .post('/api/scan/text')
        .set('Authorization', `Bearer ${childToken}`)
        .send({
          content: 'Test content for retrieval',
          source: 'chat_app',
        });
      scanId = scanResponse.body.data.id;
    });

    it('should get scan by ID', async () => {
      const response = await request(app)
        .get(`/api/scan/${scanId}`)
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(scanId);
    });

    it('should fail with invalid ID', async () => {
      const response = await request(app)
        .get('/api/scan/invalid-id')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
