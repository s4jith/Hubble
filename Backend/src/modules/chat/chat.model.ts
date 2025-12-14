import mongoose, { Document, Schema } from 'mongoose';

/**
 * Message Sender Type
 */
export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system',
}

/**
 * Message Type
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  CARD = 'card',
  QUICK_REPLY = 'quick_reply',
}

/**
 * Chat Message Interface
 */
export interface IChatMessage {
  id: string;
  sender: MessageSender;
  type: MessageType;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Chat Session Model
 * Stores chat conversations with the AI bot
 */
export interface IChatSession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  // Session info
  title: string;
  isActive: boolean;
  
  // Messages
  messages: IChatMessage[];
  messageCount: number;
  
  // User score (safety score based on conversations)
  userScore: number;
  scoreCategory: 'safe' | 'moderate' | 'at_risk';
  
  // Context for AI
  context?: Record<string, any>;
  
  // Session metadata
  lastMessageAt?: Date;
  endedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    id: { type: String, required: true },
    sender: { type: String, enum: Object.values(MessageSender), required: true },
    type: { type: String, enum: Object.values(MessageType), default: MessageType.TEXT },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const chatSessionSchema = new Schema<IChatSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    messages: [chatMessageSchema],
    messageCount: {
      type: Number,
      default: 0,
    },
    userScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    scoreCategory: {
      type: String,
      enum: ['safe', 'moderate', 'at_risk'],
      default: 'safe',
    },
    context: {
      type: Schema.Types.Mixed,
    },
    lastMessageAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
chatSessionSchema.index({ userId: 1, isActive: 1 });
chatSessionSchema.index({ userId: 1, createdAt: -1 });

// Update score category based on score
chatSessionSchema.pre('save', function (next) {
  if (this.userScore >= 70) {
    this.scoreCategory = 'safe';
  } else if (this.userScore >= 40) {
    this.scoreCategory = 'moderate';
  } else {
    this.scoreCategory = 'at_risk';
  }
  next();
});

export const ChatSession = mongoose.model<IChatSession>('ChatSession', chatSessionSchema);
