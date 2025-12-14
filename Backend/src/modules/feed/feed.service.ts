import mongoose from 'mongoose';
import { FeedPost, Comment, IFeedPost, IComment, FeedType, PostStatus } from './feed.model';
import { NotFoundError, AuthorizationError } from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * Feed Service
 * Handles all feed/post-related business logic
 */
class FeedService {
  /**
   * Create a new post
   */
  async createPost(
    authorId: string,
    data: {
      type: FeedType;
      heading: string;
      content: string;
      image?: string;
      visibleTo?: string[];
    }
  ): Promise<IFeedPost> {
    const post = await FeedPost.create({
      authorId: new mongoose.Types.ObjectId(authorId),
      type: data.type,
      heading: data.heading,
      content: data.content,
      image: data.image,
      visibleTo: data.visibleTo?.map((id) => new mongoose.Types.ObjectId(id)),
    });

    logger.info(`Post created by user ${authorId}: ${post._id}`);
    return post;
  }

  /**
   * Get posts with pagination and filtering
   */
  async getPosts(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      type?: FeedType;
      authorId?: string;
    } = {}
  ): Promise<{
    posts: any[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    const { page = 1, limit = 20, type, authorId } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { status: PostStatus.ACTIVE };

    if (type) {
      query.type = type;
    }

    if (authorId) {
      query.authorId = new mongoose.Types.ObjectId(authorId);
    }

    // For family posts, check visibility
    if (type === FeedType.FAMILY) {
      query.$or = [
        { authorId: new mongoose.Types.ObjectId(userId) },
        { visibleTo: new mongoose.Types.ObjectId(userId) },
      ];
    }

    const [posts, total] = await Promise.all([
      FeedPost.find(query)
        .populate('authorId', 'username firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FeedPost.countDocuments(query),
    ]);

    // Transform posts to include author info
    const transformedPosts = posts.map((post: any) => ({
      id: post._id.toString(),
      type: post.type,
      author: post.authorId?.username || 'Anonymous',
      authorAvatar: `https://i.pravatar.cc/150?u=${post.authorId?._id}`,
      timestamp: this.getRelativeTime(post.createdAt),
      heading: post.heading,
      content: post.content,
      image: post.image || null,
      likes: post.likeCount,
      comments: post.commentCount,
      isLiked: post.likes?.some((id: mongoose.Types.ObjectId) => id.toString() === userId),
      isSaved: post.savedBy?.some((id: mongoose.Types.ObjectId) => id.toString() === userId),
    }));

    return {
      posts: transformedPosts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  /**
   * Get a single post by ID
   */
  async getPostById(postId: string, userId: string): Promise<any> {
    const post = await FeedPost.findById(postId)
      .populate('authorId', 'username firstName lastName')
      .lean() as any;

    if (!post || post.status === PostStatus.REMOVED) {
      throw new NotFoundError('Post not found');
    }

    return {
      id: post._id.toString(),
      type: post.type,
      author: post.authorId?.username || 'Anonymous',
      authorAvatar: `https://i.pravatar.cc/150?u=${post.authorId?._id}`,
      timestamp: this.getRelativeTime(post.createdAt),
      heading: post.heading,
      content: post.content,
      image: post.image || null,
      likes: post.likeCount,
      comments: post.commentCount,
      isLiked: post.likes?.some((id: mongoose.Types.ObjectId) => id.toString() === userId),
      isSaved: post.savedBy?.some((id: mongoose.Types.ObjectId) => id.toString() === userId),
    };
  }

  /**
   * Like/unlike a post
   */
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const post = await FeedPost.findById(postId);

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      post.likes.push(userObjectId);
      post.likeCount += 1;
    }

    await post.save();

    return { liked: !alreadyLiked, likeCount: post.likeCount };
  }

  /**
   * Save/unsave a post (bookmark)
   */
  async toggleSave(postId: string, userId: string): Promise<{ saved: boolean }> {
    const post = await FeedPost.findById(postId);

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const alreadySaved = post.savedBy.some((id) => id.toString() === userId);

    if (alreadySaved) {
      post.savedBy = post.savedBy.filter((id) => id.toString() !== userId);
    } else {
      post.savedBy.push(userObjectId);
    }

    await post.save();

    return { saved: !alreadySaved };
  }

  /**
   * Report a post
   */
  async reportPost(
    postId: string,
    userId: string,
    reason: string
  ): Promise<{ reported: boolean }> {
    const post = await FeedPost.findById(postId);

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const alreadyReported = post.reportedBy.some((id) => id.toString() === userId);

    if (!alreadyReported) {
      post.reportedBy.push(userObjectId);
      post.reportCount += 1;

      // Auto-flag for review if report count exceeds threshold
      if (post.reportCount >= 3) {
        post.status = PostStatus.REPORTED;
      }
    }

    await post.save();
    logger.info(`Post ${postId} reported by user ${userId}: ${reason}`);

    return { reported: true };
  }

  /**
   * Delete a post (soft delete)
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await FeedPost.findById(postId);

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.authorId.toString() !== userId) {
      throw new AuthorizationError('You can only delete your own posts');
    }

    post.status = PostStatus.REMOVED;
    await post.save();
  }

  /**
   * Update a post
   */
  async updatePost(
    postId: string,
    userId: string,
    data: { heading?: string; content?: string; image?: string }
  ): Promise<IFeedPost> {
    const post = await FeedPost.findById(postId);

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.authorId.toString() !== userId) {
      throw new AuthorizationError('You can only edit your own posts');
    }

    if (data.heading) post.heading = data.heading;
    if (data.content) post.content = data.content;
    if (data.image !== undefined) post.image = data.image;

    await post.save();
    return post;
  }

  /**
   * Get comments for a post
   */
  async getComments(
    postId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{
    comments: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({ postId: new mongoose.Types.ObjectId(postId), status: PostStatus.ACTIVE })
        .populate('authorId', 'username firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ postId: new mongoose.Types.ObjectId(postId), status: PostStatus.ACTIVE }),
    ]);

    const transformedComments = comments.map((comment: any) => ({
      id: comment._id.toString(),
      author: comment.authorId?.username || 'Anonymous',
      authorAvatar: `https://i.pravatar.cc/150?u=${comment.authorId?._id}`,
      content: comment.content,
      timestamp: this.getRelativeTime(comment.createdAt),
      likes: comment.likeCount,
    }));

    return {
      comments: transformedComments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Add a comment to a post
   */
  async addComment(
    postId: string,
    userId: string,
    content: string
  ): Promise<IComment> {
    const post = await FeedPost.findById(postId);

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const comment = await Comment.create({
      postId: new mongoose.Types.ObjectId(postId),
      authorId: new mongoose.Types.ObjectId(userId),
      content,
    });

    // Update comment count
    post.commentCount += 1;
    await post.save();

    return comment;
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.authorId.toString() !== userId) {
      throw new AuthorizationError('You can only delete your own comments');
    }

    comment.status = PostStatus.REMOVED;
    await comment.save();

    // Update comment count
    await FeedPost.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -1 } });
  }

  /**
   * Get saved posts for a user
   */
  async getSavedPosts(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      FeedPost.find({
        savedBy: new mongoose.Types.ObjectId(userId),
        status: PostStatus.ACTIVE,
      })
        .populate('authorId', 'username firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FeedPost.countDocuments({
        savedBy: new mongoose.Types.ObjectId(userId),
        status: PostStatus.ACTIVE,
      }),
    ]);

    const transformedPosts = posts.map((post: any) => ({
      id: post._id.toString(),
      type: post.type,
      author: post.authorId?.username || 'Anonymous',
      authorAvatar: `https://i.pravatar.cc/150?u=${post.authorId?._id}`,
      timestamp: this.getRelativeTime(post.createdAt),
      heading: post.heading,
      content: post.content,
      image: post.image || null,
      likes: post.likeCount,
      comments: post.commentCount,
      isLiked: post.likes?.some((id: mongoose.Types.ObjectId) => id.toString() === userId),
      isSaved: true,
    }));

    return {
      posts: transformedPosts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Helper: Get relative time string
   */
  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  }
}

export const feedService = new FeedService();
