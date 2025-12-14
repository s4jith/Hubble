import mongoose, { Document, Schema } from 'mongoose';

/**
 * Complaint Status
 */
export enum ComplaintStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
}

/**
 * Complaint Priority
 */
export enum ComplaintPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Evidence Type
 */
export enum EvidenceType {
  SCREENSHOT = 'screenshot',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other',
}

/**
 * Evidence Interface
 */
export interface IEvidence {
  id: string;
  type: EvidenceType;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  description?: string;
}

/**
 * Timeline Entry Interface
 */
export interface ITimelineEntry {
  id: string;
  action: string;
  description: string;
  performedBy?: mongoose.Types.ObjectId;
  performedByName?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Complaint Model
 * Stores user complaints/reports
 */
export interface IComplaint extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  // Complaint details
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  
  // Related child (for parent reports)
  childId?: mongoose.Types.ObjectId;
  
  // Evidence
  evidence: IEvidence[];
  
  // Timeline/Activity log
  timeline: ITimelineEntry[];
  
  // Assigned handler
  assignedTo?: mongoose.Types.ObjectId;
  assignedAt?: Date;
  
  // Resolution
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  
  // Reference number for tracking
  referenceNumber: string;
  
  // External escalation
  externalReferenceNumber?: string;
  escalatedTo?: string;
  escalatedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const evidenceSchema = new Schema<IEvidence>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: Object.values(EvidenceType), required: true },
    url: { type: String, required: true },
    filename: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    description: { type: String },
  },
  { _id: false }
);

const timelineSchema = new Schema<ITimelineEntry>(
  {
    id: { type: String, required: true },
    action: { type: String, required: true },
    description: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    performedByName: { type: String },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const complaintSchema = new Schema<IComplaint>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(ComplaintPriority),
      default: ComplaintPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(ComplaintStatus),
      default: ComplaintStatus.SUBMITTED,
      index: true,
    },
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    evidence: [evidenceSchema],
    timeline: [timelineSchema],
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedAt: {
      type: Date,
    },
    resolution: {
      type: String,
      maxlength: [2000, 'Resolution cannot exceed 2000 characters'],
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    externalReferenceNumber: {
      type: String,
    },
    escalatedTo: {
      type: String,
    },
    escalatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
complaintSchema.index({ userId: 1, status: 1, createdAt: -1 });
complaintSchema.index({ status: 1, priority: 1, createdAt: -1 });

// Pre-save hook to generate reference number
complaintSchema.pre('save', async function (next) {
  if (this.isNew && !this.referenceNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.referenceNumber = `HUB-${year}${month}-${random}`;
  }

  // Add initial timeline entry for new complaints
  if (this.isNew) {
    this.timeline.push({
      id: new mongoose.Types.ObjectId().toString(),
      action: 'created',
      description: 'Complaint submitted',
      timestamp: new Date(),
    });
  }

  next();
});

export const Complaint = mongoose.model<IComplaint>('Complaint', complaintSchema);
