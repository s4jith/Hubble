import mongoose, { Document, Schema } from 'mongoose';

/**
 * Mental Health Resource Model
 * Stores resources for children based on severity and categories
 * 
 * PRIVACY & COMPLIANCE NOTES:
 * - Resources are context-aware based on detected issues
 * - Emergency resources clearly marked
 * - Age-appropriate content ensured
 */

export interface IMentalHealthResource extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Resource details
  title: string;
  description: string;
  content: string;
  type: 'article' | 'video' | 'helpline' | 'exercise' | 'external_link';
  
  // Targeting
  categories: string[];      // Matches abuse categories
  minSeverityScore: number;
  maxSeverityScore: number;
  
  // Age appropriateness
  minAge?: number;
  maxAge?: number;
  
  // Priority and display
  priority: number;
  isEmergency: boolean;
  
  // External links
  externalUrl?: string;
  phoneNumber?: string;
  
  // Status
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const mentalHealthResourceSchema = new Schema<IMentalHealthResource>(
  {
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: true,
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
    },
    type: {
      type: String,
      enum: ['article', 'video', 'helpline', 'exercise', 'external_link'],
      required: true,
    },
    categories: [{
      type: String,
      required: true,
    }],
    minSeverityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    maxSeverityScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    minAge: {
      type: Number,
      min: 0,
    },
    maxAge: {
      type: Number,
      max: 18,
    },
    priority: {
      type: Number,
      default: 0,
    },
    isEmergency: {
      type: Boolean,
      default: false,
    },
    externalUrl: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
mentalHealthResourceSchema.index({ categories: 1, isActive: 1 });
mentalHealthResourceSchema.index({ minSeverityScore: 1, maxSeverityScore: 1 });
mentalHealthResourceSchema.index({ isEmergency: 1, isActive: 1 });
mentalHealthResourceSchema.index({ priority: -1 });

export const MentalHealthResource = mongoose.model<IMentalHealthResource>(
  'MentalHealthResource',
  mentalHealthResourceSchema
);
export default MentalHealthResource;
