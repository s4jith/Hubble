import request from 'supertest';
import { createApp } from '../../app';
import User from '@modules/users/user.model';
import { UserRole } from '@config/constants';
import { Express } from 'express';

describe('Auth Module', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  describe('POST /api/auth/register', () => {
    const validParentData = {
      email: 'parent@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
    };

    it('should register a new parent successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validParentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(validParentData.email);
      expect(response.body.data.user.role).toBe(UserRole.PARENT);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should fail with duplicate email', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(validParentData);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(validParentData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validParentData, email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validParentData, password: '123' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    const parentData = {
      email: 'logintest@example.com',
      password: 'SecurePass123!',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(parentData);
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: parentData.email, password: parentData.password })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(parentData.email);
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: parentData.email, password: 'wrongpassword' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'refresh@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      });
      refreshToken = registerResponse.body.data.refreshToken;
    });

    it('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'logout@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      });
      accessToken = registerResponse.body.data.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
