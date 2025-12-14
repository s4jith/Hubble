import { Request, Response, NextFunction } from 'express';
import { complaintService } from './complaint.service';
import { sendSuccess } from '../../utils/response';
import { HTTP_STATUS } from '../../config/constants';
import { ComplaintStatus, ComplaintPriority, EvidenceType } from './complaint.model';

/**
 * Complaint Controller
 * Handles HTTP requests for complaint operations
 */
class ComplaintController {
  /**
   * Create a new complaint
   * POST /complaints
   */
  async createComplaint(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { title, description, category, priority, childId, evidence } = req.body;

      const complaint = await complaintService.createComplaint(userId, {
        title,
        description,
        category,
        priority,
        childId,
        evidence,
      });

      sendSuccess(res, complaint, 'Complaint submitted successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all complaints for the user
   * GET /complaints
   */
  async getComplaints(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { page, limit, status, priority, category } = req.query;

      const result = await complaintService.getComplaints(userId, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        status: status as ComplaintStatus,
        priority: priority as ComplaintPriority,
        category: category as string,
      });

      sendSuccess(res, result, 'Complaints retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get complaint stats
   * GET /complaints/stats
   */
  async getStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const stats = await complaintService.getComplaintStats(userId);

      sendSuccess(res, stats, 'Complaint stats retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get complaint categories
   * GET /complaints/categories
   */
  async getCategories(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const categories = complaintService.getCategories();

      sendSuccess(res, { categories }, 'Categories retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single complaint
   * GET /complaints/:id
   */
  async getComplaint(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;

      const complaint = await complaintService.getComplaintById(id, userId);

      sendSuccess(res, complaint, 'Complaint retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get complaint by reference number
   * GET /complaints/reference/:referenceNumber
   */
  async getComplaintByReference(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { referenceNumber } = req.params;

      const complaint = await complaintService.getComplaintByReference(referenceNumber, userId);

      sendSuccess(res, complaint, 'Complaint retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a complaint
   * PUT /complaints/:id
   */
  async updateComplaint(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;
      const { title, description, category, priority } = req.body;

      const complaint = await complaintService.updateComplaint(id, userId, {
        title,
        description,
        category,
        priority,
      });

      sendSuccess(res, complaint, 'Complaint updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a complaint
   * DELETE /complaints/:id
   */
  async deleteComplaint(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;

      await complaintService.deleteComplaint(id, userId);

      sendSuccess(res, null, 'Complaint deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add evidence to a complaint
   * POST /complaints/:id/evidence
   */
  async addEvidence(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;
      const { type, url, filename, size, mimeType, description } = req.body;

      const complaint = await complaintService.addEvidence(id, userId, {
        type: type as EvidenceType,
        url,
        filename,
        size,
        mimeType,
        description,
      });

      sendSuccess(res, complaint, 'Evidence added successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove evidence from a complaint
   * DELETE /complaints/:id/evidence/:evidenceId
   */
  async removeEvidence(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id, evidenceId } = req.params;

      const complaint = await complaintService.removeEvidence(id, userId, evidenceId);

      sendSuccess(res, complaint, 'Evidence removed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update complaint status (admin only in production)
   * PUT /complaints/:id/status
   */
  async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;
      const { status, notes } = req.body;

      const complaint = await complaintService.updateStatus(id, status as ComplaintStatus, userId, notes);

      sendSuccess(res, complaint, 'Complaint status updated');
    } catch (error) {
      next(error);
    }
  }
}

export const complaintController = new ComplaintController();
