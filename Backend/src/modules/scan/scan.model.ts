import mongoose, { Document, Schema } from 'mongoose';
import { ScanType, AbuseCategory, AlertSeverity } from '../../config/constants';

/**
 * Scan Result Model
 * Stores all content scan results with AI analysis data
 * 
 * PRIVACY & COMPLIANCE NOTES:
 * - All scans are timestamped for audit purposes
 * - Content is stored for review but can be purged per retention policy
 * - Links child to parent for transparent monitoring
 */

export interface IAIAnalysis {
  isAbusive: boolean;
  categories: AbuseCategory[];
  severityScore: number; // 0-100
  confidence: number;    // 0-1
  sentiment: string;
  threatDetected: boolean;
  rawResponse?: Record<string, unknown>;
}

export interface IScanResult extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;      // Child who submitted
  parentId: mongoose.Types.ObjectId;    // Parent for visibility
  
  // Scan details
  scanType: ScanType;
  content: string;                      // Text content or metadata
  sourceApp?: string;                   // App where content was found
  
  // AI Analysis results
  analysis: IAIAnalysis;
  severity: AlertSeverity;
  
  // Processing metadata
  processedAt: Date;
  processingTimeMs: number;
  aiServiceVersion?: string;
  
  // Manual review
  manuallyReported: boolean;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const aiAnalysisSchema = new Schema<IAIAnalysis>(
  {
    isAbusive: {
      type: Boolean,
      required: true,
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
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    sentiment: {
      type: String,
      required: true,
    },
    threatDetected: {
      type: Boolean,
      default: false,
    },
    rawResponse: {
      type: Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const scanResultSchema = new Schema<IScanResult>(
  {
    userId: {
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
    scanType: {
      type: String,
      enum: Object.values(ScanType),
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },
    sourceApp: {
      type: String,
      trim: true,
    },
    analysis: {
      type: aiAnalysisSchema,
      required: true,
    },
    severity: {
      type: String,
      enum: Object.values(AlertSeverity),
      required: true,
      index: true,
    },
    processedAt: {
      type: Date,
      required: true,
    },
    processingTimeMs: {
      type: Number,
      required: true,
    },
    aiServiceVersion: {
      type: String,
    },
    manuallyReported: {
      type: Boolean,
      default: false,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: {
      type: String,
      maxlength: [1000, 'Review notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
scanResultSchema.index({ userId: 1, createdAt: -1 });
scanResultSchema.index({ parentId: 1, createdAt: -1 });
scanResultSchema.index({ parentId: 1, severity: 1 });
scanResultSchema.index({ 'analysis.isAbusive': 1, severity: 1 });
scanResultSchema.index({ createdAt: -1 });

export const ScanResult = mongoose.model<IScanResult>('ScanResult', scanResultSchema);
export default ScanResult;
