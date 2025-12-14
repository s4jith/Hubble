import mongoose, { Document, Schema } from 'mongoose';

/**
 * Notification Types
 */
export enum NotificationType {
  ALERT = 'alert',
  SCAN_RESULT = 'scan_result',
  REPORT_UPDATE = 'report_update',
  CHILD_ACTIVITY = 'child_activity',
  SECURITY = 'security',
  SYSTEM = 'system',
  CHAT = 'chat',
}

/**
 * Notification Priority Levels
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Notification Model
 * Stores user notifications for both parents and children
 */
export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  
  // Status
  isRead: boolean;
  readAt?: Date;
  
  // Related entities
  alertId?: mongoose.Types.ObjectId;
  scanResultId?: mongoose.Types.ObjectId;
  complaintId?: mongoose.Types.ObjectId;
  
  // Push notification tracking
  pushSent: boolean;
  pushSentAt?: Date;
  
  // Expiration
  expiresAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      default: NotificationPriority.NORMAL,
    },
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    alertId: {
      type: Schema.Types.ObjectId,
      ref: 'Alert',
    },
    scanResultId: {
      type: Schema.Types.ObjectId,
      ref: 'ScanResult',
    },
    complaintId: {
      type: Schema.Types.ObjectId,
      ref: 'Complaint',
    },
    pushSent: {
      type: Boolean,
      default: false,
    },
    pushSentAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
