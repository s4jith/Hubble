import { Router } from 'express';
import { complaintController } from './complaint.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

/**
 * Complaint Routes
 * All routes require authentication
 */

// Get stats (must be before /:id)
router.get('/stats', authenticate, complaintController.getStats);

// Get categories (must be before /:id)
router.get('/categories', authenticate, complaintController.getCategories);

// Get by reference number (must be before /:id)
router.get('/reference/:referenceNumber', authenticate, complaintController.getComplaintByReference);

// CRUD routes
router.get('/', authenticate, complaintController.getComplaints);
router.post('/', authenticate, complaintController.createComplaint);
router.get('/:id', authenticate, complaintController.getComplaint);
router.put('/:id', authenticate, complaintController.updateComplaint);
router.delete('/:id', authenticate, complaintController.deleteComplaint);

// Evidence routes
router.post('/:id/evidence', authenticate, complaintController.addEvidence);
router.delete('/:id/evidence/:evidenceId', authenticate, complaintController.removeEvidence);

// Status update (could be admin-only in production)
router.put('/:id/status', authenticate, complaintController.updateStatus);

export default router;
