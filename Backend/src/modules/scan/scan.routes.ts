import { Router } from 'express';
import * as scanController from './scan.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { validate, scanTextSchema, scanScreenMetadataSchema, idParamSchema } from '../../validations';
import { UserRole } from '../../config/constants';

const router = Router();

/**
 * Scan Routes
 * All content scanning endpoints
 */

// All routes require authentication
router.use(authenticate);

// Text scanning (child and parent)
router.post(
  '/text',
  requireRole([UserRole.CHILD, UserRole.PARENT]),
  validate(scanTextSchema),
  scanController.scanText
);

// Screen metadata scanning (child only)
router.post(
  '/screen-metadata',
  requireRole([UserRole.CHILD]),
  validate(scanScreenMetadataSchema),
  scanController.scanScreenMetadata
);

// Get scan history (child or parent)
router.get(
  '/history',
  requireRole([UserRole.CHILD, UserRole.PARENT]),
  scanController.getScanHistory
);

// Image scanning (child and parent)
router.post(
  '/image',
  requireRole([UserRole.CHILD, UserRole.PARENT]),
  scanController.scanImage
);

// Get scan by ID (child or parent)
router.get(
  '/:scanId',
  requireRole([UserRole.CHILD, UserRole.PARENT]),
  validate(idParamSchema),
  scanController.getScanById
);

export default router;
