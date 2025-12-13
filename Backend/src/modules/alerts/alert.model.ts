import mongoose, { Document, Schema } from 'mongoose';
import { AlertSeverity, AlertStatus, AbuseCategory } from '../../config/constants';

/**
 * Alert Model
 * Stores alerts generated from scan results
 * 
 * PRIVACY & COMPLIANCE NOTES:
 * - Alerts are generated based on severity thresholds set by parents
 * - Parent notifications respect notification preferences
 * - All alert state changes are timestamped
 */

export interface IAlert extends Document {
  _id: mongoose.Types.ObjectId;
  childId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  scanResultId: mongoose.Types.ObjectId;
  
  // Alert details
  title: string;
  message: string;
  severity: AlertSeverity;
  categories: AbuseCategory[];
  severityScore: number;
  
  // Status tracking
  status: AlertStatus;
  acknowledgedAt?: Date;
  acknowledgedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolutionNotes?: string;
  
  // Notification tracking
  parentNotified: boolean;
  parentNotifiedAt?: Date;
  childNotified: boolean;
  childNotifiedAt?: Date;
  
  // Guidance provided
  guidanceProvided?: string;
  resourcesShared?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scanResultId: {
      type: Schema.Types.ObjectId,
      ref: 'ScanResult',
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    severity: {
      type: String,
      enum: Object.values(AlertSeverity),
      required: true,
      index: true,
    },
    categories: [{
      type: String,
      enum: Object.values(AbuseCategory),
    }],
    severityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: Object.values(AlertStatus),
      default: AlertStatus.PENDING,
      index: true,
    },
    acknowledgedAt: {
      type: Date,
    },
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolutionNotes: {
      type: String,
      maxlength: [1000, 'Resolution notes cannot exceed 1000 characters'],
    },
    parentNotified: {
      type: Boolean,
      default: false,
    },
    parentNotifiedAt: {
      type: Date,
    },
    childNotified: {
      type: Boolean,
      default: false,
    },
    childNotifiedAt: {
      type: Date,
    },
    guidanceProvided: {
      type: String,
      maxlength: [2000, 'Guidance cannot exceed 2000 characters'],
    },
    resourcesShared: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
alertSchema.index({ parentId: 1, status: 1 });
alertSchema.index({ childId: 1, status: 1 });
alertSchema.index({ parentId: 1, createdAt: -1 });
alertSchema.index({ severity: 1, status: 1 });
alertSchema.index({ createdAt: -1 });

export const Alert = mongoose.model<IAlert>('Alert', alertSchema);
export default Alert;
