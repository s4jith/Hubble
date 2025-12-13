import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../config/env';

/**
 * Swagger/OpenAPI Configuration
 * Defines API documentation structure
 */
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hubble API - Cyberbullying Detection & Prevention',
      version: '1.0.0',
      description: `
## Overview
Hubble is an AI-powered backend for a mobile application that detects and responds to cyberbullying in real time.

## Features
- **Role-based Access Control**: Parent, Child, and Admin roles with strict permissions
- **AI-powered Detection**: Real-time content analysis for cyberbullying detection
- **Real-time Alerts**: Socket.IO integration for instant notifications
- **Privacy-focused**: Built with data minimization and consent management

## Authentication
This API uses JWT Bearer tokens for authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

## Rate Limiting
- General API: ${env.rateLimit.maxRequests} requests per ${env.rateLimit.windowMs / 60000} minutes
- Auth endpoints: 10 requests per 15 minutes
- Scan endpoints: 30 requests per minute

## Privacy & Compliance
- All monitoring requires explicit consent
- Data minimization principles applied
- Audit logs for sensitive operations
- Parental transparency enforced
      `,
      contact: {
        name: 'Hubble Team',
        email: 'support@hubble.app',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.port}/api`,
        description: 'Development server',
      },
      {
        url: 'https://api.hubble.app/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE',
            },
            errors: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
            },
            data: {
              type: 'object',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'parent@example.com',
            },
            username: {
              type: 'string',
              example: 'parentuser',
            },
            role: {
              type: 'string',
              enum: ['parent', 'child', 'admin'],
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            isActive: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        RegisterParentInput: {
          type: 'object',
          required: ['email', 'username', 'password', 'firstName', 'lastName', 'consentGiven'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'parent@example.com',
            },
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 30,
              example: 'parentuser',
            },
            password: {
              type: 'string',
              minLength: 8,
              example: 'SecurePass123',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            dateOfBirth: {
              type: 'string',
              format: 'date-time',
            },
            consentGiven: {
              type: 'boolean',
              example: true,
              description: 'Must be true to register',
            },
          },
        },
        CreateChildInput: {
          type: 'object',
          required: ['username', 'password', 'firstName', 'lastName'],
          properties: {
            username: {
              type: 'string',
              example: 'childuser',
            },
            password: {
              type: 'string',
              example: 'ChildPass123',
            },
            firstName: {
              type: 'string',
              example: 'Jane',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            dateOfBirth: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['login', 'password'],
          properties: {
            login: {
              type: 'string',
              description: 'Email or username',
              example: 'parent@example.com',
            },
            password: {
              type: 'string',
              example: 'SecurePass123',
            },
          },
        },
        TokenPair: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
            },
            refreshToken: {
              type: 'string',
            },
            expiresIn: {
              type: 'string',
              example: '15m',
            },
          },
        },
        ScanResult: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
            },
            userId: {
              type: 'string',
            },
            parentId: {
              type: 'string',
            },
            scanType: {
              type: 'string',
              enum: ['text', 'screen_metadata', 'image'],
            },
            content: {
              type: 'string',
            },
            analysis: {
              $ref: '#/components/schemas/AIAnalysis',
            },
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
            },
            processedAt: {
              type: 'string',
              format: 'date-time',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AIAnalysis: {
          type: 'object',
          properties: {
            isAbusive: {
              type: 'boolean',
            },
            categories: {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  'harassment',
                  'threat',
                  'hate_speech',
                  'sexual_content',
                  'self_harm',
                  'bullying',
                  'discrimination',
                  'profanity',
                  'spam',
                  'other',
                ],
              },
            },
            severityScore: {
              type: 'number',
              minimum: 0,
              maximum: 100,
            },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
            },
            sentiment: {
              type: 'string',
            },
            threatDetected: {
              type: 'boolean',
            },
          },
        },
        Alert: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
            },
            childId: {
              type: 'string',
            },
            parentId: {
              type: 'string',
            },
            title: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
            },
            status: {
              type: 'string',
              enum: ['pending', 'acknowledged', 'resolved', 'escalated'],
            },
            guidanceProvided: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        UpdateSettingsInput: {
          type: 'object',
          properties: {
            notifications: {
              type: 'object',
              properties: {
                emailNotifications: { type: 'boolean' },
                pushNotifications: { type: 'boolean' },
                notifyOnLow: { type: 'boolean' },
                notifyOnMedium: { type: 'boolean' },
                notifyOnHigh: { type: 'boolean' },
                notifyOnCritical: { type: 'boolean' },
              },
            },
            monitoring: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                textScanEnabled: { type: 'boolean' },
                screenMetadataEnabled: { type: 'boolean' },
              },
            },
            defaultAlertThreshold: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
            },
          },
        },
        MentalHealthResource: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
            },
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            content: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['article', 'video', 'helpline', 'exercise', 'external_link'],
            },
            isEmergency: {
              type: 'boolean',
            },
            externalUrl: {
              type: 'string',
            },
            phoneNumber: {
              type: 'string',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Authentication required',
                code: 'AUTHENTICATION_ERROR',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Access denied',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'You do not have permission to perform this action',
                code: 'AUTHORIZATION_ERROR',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication and authorization endpoints',
      },
      {
        name: 'Parent',
        description: 'Parent-specific endpoints',
      },
      {
        name: 'Child',
        description: 'Child-specific endpoints',
      },
      {
        name: 'Scan',
        description: 'Content scanning endpoints',
      },
      {
        name: 'Alerts',
        description: 'Alert management endpoints',
      },
    ],
  },
  apis: ['./src/modules/**/*.controller.ts', './src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
