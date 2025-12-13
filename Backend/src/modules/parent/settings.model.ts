import mongoose, { Document, Schema } from 'mongoose';
import { AlertSeverity } from '../../config/constants';

/**
 * Settings Model
 * Stores user-specific settings and preferences
 * 
 * PRIVACY & COMPLIANCE NOTES:
 * - Parents control monitoring settings for transparency
 * - Alert thresholds can be customized per child
 * - Notification preferences respected for all alerts
 */

export interface INotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  
  // Severity-based notification preferences
  notifyOnLow: boolean;
  notifyOnMedium: boolean;
  notifyOnHigh: boolean;
  notifyOnCritical: boolean;
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string;
}

export interface IMonitoringSettings {
  enabled: boolean;
  textScanEnabled: boolean;
  screenMetadataEnabled: boolean;
  
  // Per-child settings
  childSpecificSettings?: Map<string, {
    enabled: boolean;
    alertThreshold: AlertSeverity;
  }>;
}

export interface ISettings extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  // Notification preferences
  notifications: INotificationSettings;
  
  // Monitoring settings (for parents)
  monitoring: IMonitoringSettings;
  
  // Alert thresholds
  defaultAlertThreshold: AlertSeverity;
  
  // Privacy settings
  dataRetentionDays: number;
  anonymizeAfterDays: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const notificationSettingsSchema = new Schema<INotificationSettings>(
  {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: false,
    },
    notifyOnLow: {
      type: Boolean,
      default: false,
    },
    notifyOnMedium: {
      type: Boolean,
      default: true,
    },
    notifyOnHigh: {
      type: Boolean,
      default: true,
    },
    notifyOnCritical: {
      type: Boolean,
      default: true,
    },
    quietHoursEnabled: {
      type: Boolean,
      default: false,
    },
    quietHoursStart: {
      type: String,
    },
    quietHoursEnd: {
      type: String,
    },
  },
  { _id: false }
);

const monitoringSettingsSchema = new Schema<IMonitoringSettings>(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    textScanEnabled: {
      type: Boolean,
      default: true,
    },
    screenMetadataEnabled: {
      type: Boolean,
      default: true,
    },
    childSpecificSettings: {
      type: Map,
      of: new Schema({
        enabled: { type: Boolean, default: true },
        alertThreshold: {
          type: String,
          enum: Object.values(AlertSeverity),
          default: AlertSeverity.MEDIUM,
        },
      }, { _id: false }),
    },
  },
  { _id: false }
);

const settingsSchema = new Schema<ISettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    notifications: {
      type: notificationSettingsSchema,
      default: () => ({}),
    },
    monitoring: {
      type: monitoringSettingsSchema,
      default: () => ({}),
    },
    defaultAlertThreshold: {
      type: String,
      enum: Object.values(AlertSeverity),
      default: AlertSeverity.MEDIUM,
    },
    dataRetentionDays: {
      type: Number,
      default: 90,
      min: 30,
      max: 365,
    },
    anonymizeAfterDays: {
      type: Number,
      default: 180,
      min: 90,
      max: 730,
    },
  },
  {
    timestamps: true,
  }
);

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
export default Settings;
