import mongoose, { Document, Schema } from 'mongoose';

/**
 * Feed Post Types
 */
export enum FeedType {
  FAMILY = 'family',     // Private, visible to family members only
  PUBLIC = 'public',     // Public community posts
  OFFICIAL = 'official', // Official announcements from admins
}

/**
 * Post Status
 */
export enum PostStatus {
  ACTIVE = 'active',
  HIDDEN = 'hidden',    // Hidden by author
  REPORTED = 'reported', // Flagged for review
  REMOVED = 'removed',  // Removed by moderator
}

/**
 * Feed Post Model
 * Community posts for sharing experiences and updates
 */
export interface IFeedPost extends Document {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  type: FeedType;
  
  // Content
  heading: string;
  content: string;
  image?: string;
  
  // Engagement
  likes: mongoose.Types.ObjectId[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  
  // Bookmarks/Saves
  savedBy: mongoose.Types.ObjectId[];
  
  // Status and moderation
  status: PostStatus;
  reportCount: number;
  reportedBy: mongoose.Types.ObjectId[];
  moderationNotes?: string;
  
  // For family posts - who can see
  visibleTo?: mongoose.Types.ObjectId[];
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Comment Model (embedded or separate)
 */
export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  likes: mongoose.Types.ObjectId[];
  likeCount: number;
  parentCommentId?: mongoose.Types.ObjectId; // For nested replies
  status: PostStatus;
  createdAt: Date;
  updatedAt: Date;
}

const feedPostSchema = new Schema<IFeedPost>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(FeedType),
      required: true,
      index: true,
    },
    heading: {
      type: String,
      required: true,
      maxlength: [200, 'Heading cannot exceed 200 characters'],
      trim: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [2000, 'Content cannot exceed 2000 characters'],
    },
    image: {
      type: String,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
    },
    savedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    status: {
      type: String,
      enum: Object.values(PostStatus),
      default: PostStatus.ACTIVE,
      index: true,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    reportedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    moderationNotes: {
      type: String,
    },
    visibleTo: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

const commentSchema = new Schema<IComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'FeedPost',
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    likeCount: {
      type: Number,
      default: 0,
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    status: {
      type: String,
      enum: Object.values(PostStatus),
      default: PostStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
feedPostSchema.index({ type: 1, status: 1, createdAt: -1 });
feedPostSchema.index({ authorId: 1, createdAt: -1 });
commentSchema.index({ postId: 1, createdAt: -1 });

export const FeedPost = mongoose.model<IFeedPost>('FeedPost', feedPostSchema);
export const Comment = mongoose.model<IComment>('Comment', commentSchema);
