import mongoose, { Document, Schema } from 'mongoose';
import { AuditAction, UserRole } from '../../config/constants';

/**
 * Audit Log Model
 * Stores all sensitive access and actions for compliance
 * 
 * PRIVACY & COMPLIANCE NOTES:
 * - All sensitive data access is logged
 * - Logs include who, what, when, and from where
 * - Used for compliance auditing and security monitoring
 * - Logs are immutable once created
 */

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Actor information
  userId: mongoose.Types.ObjectId;
  userRole: UserRole;
  username: string;
  
  // Action details
  action: AuditAction;
  resourceType: string;
  resourceId?: mongoose.Types.ObjectId;
  description: string;
  
  // Request metadata
  ipAddress: string;
  userAgent: string;
  requestMethod: string;
  requestPath: string;
  
  // Additional context
  metadata?: Record<string, unknown>;
  
  // Outcome
  success: boolean;
  errorMessage?: string;
  
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
    },
    description: {
      type: String,
      required: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    requestMethod: {
      type: String,
      required: true,
    },
    requestPath: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    success: {
      type: Boolean,
      required: true,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Audit logs are immutable
  }
);

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ success: 1, action: 1 });

// Prevent updates to audit logs
auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('Audit logs cannot be modified');
});

auditLogSchema.pre('updateOne', function () {
  throw new Error('Audit logs cannot be modified');
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;
