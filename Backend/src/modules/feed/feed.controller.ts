import { Request, Response, NextFunction } from 'express';
import { feedService } from './feed.service';
import { sendSuccess } from '../../utils/response';
import { HTTP_STATUS } from '../../config/constants';
import { FeedType } from './feed.model';

/**
 * Feed Controller
 * Handles HTTP requests for feed/post operations
 */
class FeedController {
  /**
   * Create a new post
   * POST /feed/posts
   */
  async createPost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { type, heading, content, image, visibleTo } = req.body;

      const post = await feedService.createPost(userId, {
        type: type || FeedType.PUBLIC,
        heading,
        content,
        image,
        visibleTo,
      });

      sendSuccess(res, post, 'Post created successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all posts
   * GET /feed/posts
   */
  async getPosts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { page, limit, type, authorId } = req.query;

      const result = await feedService.getPosts(userId, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        type: type as FeedType,
        authorId: authorId as string,
      });

      sendSuccess(res, result, 'Posts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single post
   * GET /feed/posts/:id
   */
  async getPost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;

      const post = await feedService.getPostById(id, userId);

      sendSuccess(res, post, 'Post retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a post
   * PUT /feed/posts/:id
   */
  async updatePost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;
      const { heading, content, image } = req.body;

      const post = await feedService.updatePost(id, userId, { heading, content, image });

      sendSuccess(res, post, 'Post updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a post
   * DELETE /feed/posts/:id
   */
  async deletePost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;

      await feedService.deletePost(id, userId);

      sendSuccess(res, null, 'Post deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Like/unlike a post
   * POST /feed/posts/:id/like
   */
  async toggleLike(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;

      const result = await feedService.toggleLike(id, userId);

      sendSuccess(res, result, result.liked ? 'Post liked' : 'Post unliked');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save/unsave a post
   * POST /feed/posts/:id/save
   */
  async toggleSave(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;

      const result = await feedService.toggleSave(id, userId);

      sendSuccess(res, result, result.saved ? 'Post saved' : 'Post unsaved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Report a post
   * POST /feed/posts/:id/report
   */
  async reportPost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;
      const { reason } = req.body;

      const result = await feedService.reportPost(id, userId, reason || 'No reason provided');

      sendSuccess(res, result, 'Post reported successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get saved posts
   * GET /feed/saved
   */
  async getSavedPosts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { page, limit } = req.query;

      const result = await feedService.getSavedPosts(
        userId,
        page ? parseInt(page as string, 10) : 1,
        limit ? parseInt(limit as string, 10) : 20
      );

      sendSuccess(res, result, 'Saved posts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get comments for a post
   * GET /feed/posts/:id/comments
   */
  async getComments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;

      const result = await feedService.getComments(id, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      sendSuccess(res, result, 'Comments retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a comment to a post
   * POST /feed/posts/:id/comments
   */
  async addComment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;
      const { content } = req.body;

      const comment = await feedService.addComment(id, userId, content);

      sendSuccess(res, comment, 'Comment added successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a comment
   * DELETE /feed/comments/:id
   */
  async deleteComment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;

      await feedService.deleteComment(id, userId);

      sendSuccess(res, null, 'Comment deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const feedController = new FeedController();
