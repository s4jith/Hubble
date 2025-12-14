import { Router } from 'express';
import { feedController } from './feed.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

/**
 * Feed Routes
 * All routes require authentication
 */

// Get saved posts (must be before /posts/:id)
router.get('/saved', authenticate, feedController.getSavedPosts);

// Post routes
router.get('/posts', authenticate, feedController.getPosts);
router.post('/posts', authenticate, feedController.createPost);
router.get('/posts/:id', authenticate, feedController.getPost);
router.put('/posts/:id', authenticate, feedController.updatePost);
router.delete('/posts/:id', authenticate, feedController.deletePost);

// Post interactions
router.post('/posts/:id/like', authenticate, feedController.toggleLike);
router.post('/posts/:id/save', authenticate, feedController.toggleSave);
router.post('/posts/:id/report', authenticate, feedController.reportPost);

// Comments
router.get('/posts/:id/comments', authenticate, feedController.getComments);
router.post('/posts/:id/comments', authenticate, feedController.addComment);
router.delete('/comments/:id', authenticate, feedController.deleteComment);

export default router;
