import { z } from 'zod';


/**
 * Validation Schemas using Zod
 * Centralized input validation for all API endpoints
 */

// Common validations
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  );

const emailSchema = z.string().email('Invalid email format').toLowerCase().trim();

const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username cannot exceed 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

const nameSchema = z.string().min(1, 'Name is required').max(50, 'Name cannot exceed 50 characters').trim();

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Auth Schemas
export const registerParentSchema = z.object({
  body: z.object({
    email: emailSchema,
    username: usernameSchema.optional(),
    password: passwordSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    phone: z.string().min(1).max(20).optional(),
    dateOfBirth: z.string().optional().transform((val) => {
      if (!val) return val;
      // Accept both YYYY-MM-DD and ISO datetime formats
      if (val.includes('T')) return val;
      return `${val}T00:00:00.000Z`;
    }),
    consentGiven: z.boolean().default(true),
  }),
});

export const createChildSchema = z.object({
  body: z.object({
    username: usernameSchema,
    password: passwordSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    dateOfBirth: z.string().optional().transform((val) => {
      if (!val) return val;
      // Accept both YYYY-MM-DD and ISO datetime formats
      if (val.includes('T')) return val;
      return `${val}T00:00:00.000Z`;
    }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    login: z.string().min(1, 'Email or username is required').optional(),
    email: z.string().min(1, 'Email is required').optional(),
    username: z.string().min(1, 'Username is required').optional(),
    password: z.string().min(1, 'Password is required'),
  }).refine(data => data.login || data.email || data.username, {
    message: 'Email, username, or login is required',
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

// Scan Schemas
export const scanTextSchema = z.object({
  body: z.object({
    content: z
      .string()
      .min(1, 'Content is required')
      .max(10000, 'Content cannot exceed 10000 characters'),
    sourceApp: z.string().max(100).optional(),
  }),
});

export const scanScreenMetadataSchema = z.object({
  body: z.object({
    metadata: z.string().min(1, 'Metadata is required').max(10000),
    sourceApp: z.string().max(100).optional(),
  }),
});

export const manualReportSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Content is required').max(10000),
    description: z.string().min(1).max(1000),
    sourceApp: z.string().max(100).optional(),
  }),
});

// Alert Schemas
export const acknowledgeAlertSchema = z.object({
  params: z.object({
    alertId: objectIdSchema,
  }),
});

export const resolveAlertSchema = z.object({
  params: z.object({
    alertId: objectIdSchema,
  }),
  body: z.object({
    resolutionNotes: z.string().max(1000).optional(),
  }),
});

// Settings Schemas
export const updateSettingsSchema = z.object({
  body: z.object({
    notifications: z
      .object({
        emailNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        notifyOnLow: z.boolean().optional(),
        notifyOnMedium: z.boolean().optional(),
        notifyOnHigh: z.boolean().optional(),
        notifyOnCritical: z.boolean().optional(),
        quietHoursEnabled: z.boolean().optional(),
        quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
        quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
      })
      .optional(),
    monitoring: z
      .object({
        enabled: z.boolean().optional(),
        textScanEnabled: z.boolean().optional(),
        screenMetadataEnabled: z.boolean().optional(),
      })
      .optional(),
    defaultAlertThreshold: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    dataRetentionDays: z.number().min(30).max(365).optional(),
  }),
});

// Pagination Schema
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

// ID Parameter Schema
export const idParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Date Range Query Schema
export const dateRangeSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

// Type exports
export type RegisterParentInput = z.infer<typeof registerParentSchema>;
export type CreateChildInput = z.infer<typeof createChildSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ScanTextInput = z.infer<typeof scanTextSchema>;
export type ScanScreenMetadataInput = z.infer<typeof scanScreenMetadataSchema>;
export type ManualReportInput = z.infer<typeof manualReportSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
