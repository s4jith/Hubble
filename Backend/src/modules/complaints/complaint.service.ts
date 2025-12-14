import mongoose from 'mongoose';
import { Complaint, IComplaint, ComplaintStatus, ComplaintPriority, IEvidence, EvidenceType } from './complaint.model';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * Complaint Service
 * Handles all complaint-related business logic
 */
class ComplaintService {
  /**
   * Create a new complaint
   */
  async createComplaint(
    userId: string,
    data: {
      title: string;
      description: string;
      category: string;
      priority?: ComplaintPriority;
      childId?: string;
      evidence?: Omit<IEvidence, 'id' | 'uploadedAt'>[];
    }
  ): Promise<IComplaint> {
    const evidenceWithIds = data.evidence?.map((e) => ({
      ...e,
      id: new mongoose.Types.ObjectId().toString(),
      uploadedAt: new Date(),
    })) || [];

    const complaint = await Complaint.create({
      userId: new mongoose.Types.ObjectId(userId),
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority || ComplaintPriority.MEDIUM,
      childId: data.childId ? new mongoose.Types.ObjectId(data.childId) : undefined,
      evidence: evidenceWithIds,
    });

    logger.info(`Complaint created by user ${userId}: ${complaint.referenceNumber}`);
    return complaint;
  }

  /**
   * Get complaints for a user
   */
  async getComplaints(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: ComplaintStatus;
      priority?: ComplaintPriority;
      category?: string;
    } = {}
  ): Promise<{
    complaints: IComplaint[];
    total: number;
    page: number;
    totalPages: number;
    stats: {
      total: number;
      pending: number;
      inProgress: number;
      resolved: number;
    };
  }> {
    const { page = 1, limit = 20, status, priority, category } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { userId: new mongoose.Types.ObjectId(userId) };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const [complaints, total, stats] = await Promise.all([
      Complaint.find(query)
        .populate('childId', 'username firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Complaint.countDocuments(query),
      this.getComplaintStats(userId),
    ]);

    return {
      complaints: complaints as unknown as IComplaint[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats,
    };
  }

  /**
   * Get complaint stats for a user
   */
  async getComplaintStats(userId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
  }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [total, pending, inProgress, resolved] = await Promise.all([
      Complaint.countDocuments({ userId: userObjectId }),
      Complaint.countDocuments({
        userId: userObjectId,
        status: { $in: [ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW] },
      }),
      Complaint.countDocuments({
        userId: userObjectId,
        status: ComplaintStatus.IN_PROGRESS,
      }),
      Complaint.countDocuments({
        userId: userObjectId,
        status: { $in: [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED] },
      }),
    ]);

    return { total, pending, inProgress, resolved };
  }

  /**
   * Get a single complaint by ID
   */
  async getComplaintById(complaintId: string, userId: string): Promise<IComplaint> {
    const complaint = await Complaint.findOne({
      _id: new mongoose.Types.ObjectId(complaintId),
      userId: new mongoose.Types.ObjectId(userId),
    }).populate('childId', 'username firstName lastName');

    if (!complaint) {
      throw new NotFoundError('Complaint not found');
    }

    return complaint;
  }

  /**
   * Get complaint by reference number
   */
  async getComplaintByReference(referenceNumber: string, userId: string): Promise<IComplaint> {
    const complaint = await Complaint.findOne({
      referenceNumber,
      userId: new mongoose.Types.ObjectId(userId),
    }).populate('childId', 'username firstName lastName');

    if (!complaint) {
      throw new NotFoundError('Complaint not found');
    }

    return complaint;
  }

  /**
   * Update complaint
   */
  async updateComplaint(
    complaintId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      priority?: ComplaintPriority;
    }
  ): Promise<IComplaint> {
    const complaint = await Complaint.findOne({
      _id: new mongoose.Types.ObjectId(complaintId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!complaint) {
      throw new NotFoundError('Complaint not found');
    }

    // Can only update if not yet in progress
    if (![ComplaintStatus.DRAFT, ComplaintStatus.SUBMITTED].includes(complaint.status)) {
      throw new ValidationError('Cannot update complaint after it is being processed');
    }

    if (data.title) complaint.title = data.title;
    if (data.description) complaint.description = data.description;
    if (data.category) complaint.category = data.category;
    if (data.priority) complaint.priority = data.priority;

    // Add timeline entry
    complaint.timeline.push({
      id: new mongoose.Types.ObjectId().toString(),
      action: 'updated',
      description: 'Complaint details updated',
      performedBy: new mongoose.Types.ObjectId(userId),
      timestamp: new Date(),
    });

    await complaint.save();
    return complaint;
  }

  /**
   * Add evidence to complaint
   */
  async addEvidence(
    complaintId: string,
    userId: string,
    evidence: {
      type: EvidenceType;
      url: string;
      filename: string;
      size: number;
      mimeType: string;
      description?: string;
    }
  ): Promise<IComplaint> {
    const complaint = await Complaint.findOne({
      _id: new mongoose.Types.ObjectId(complaintId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!complaint) {
      throw new NotFoundError('Complaint not found');
    }

    const newEvidence: IEvidence = {
      id: new mongoose.Types.ObjectId().toString(),
      ...evidence,
      uploadedAt: new Date(),
    };

    complaint.evidence.push(newEvidence);

    // Add timeline entry
    complaint.timeline.push({
      id: new mongoose.Types.ObjectId().toString(),
      action: 'evidence_added',
      description: `Evidence added: ${evidence.filename}`,
      performedBy: new mongoose.Types.ObjectId(userId),
      timestamp: new Date(),
    });

    await complaint.save();
    return complaint;
  }

  /**
   * Remove evidence from complaint
   */
  async removeEvidence(complaintId: string, userId: string, evidenceId: string): Promise<IComplaint> {
    const complaint = await Complaint.findOne({
      _id: new mongoose.Types.ObjectId(complaintId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!complaint) {
      throw new NotFoundError('Complaint not found');
    }

    const evidenceIndex = complaint.evidence.findIndex((e) => e.id === evidenceId);
    if (evidenceIndex === -1) {
      throw new NotFoundError('Evidence not found');
    }

    const removedEvidence = complaint.evidence[evidenceIndex];
    complaint.evidence.splice(evidenceIndex, 1);

    // Add timeline entry
    complaint.timeline.push({
      id: new mongoose.Types.ObjectId().toString(),
      action: 'evidence_removed',
      description: `Evidence removed: ${removedEvidence.filename}`,
      performedBy: new mongoose.Types.ObjectId(userId),
      timestamp: new Date(),
    });

    await complaint.save();
    return complaint;
  }

  /**
   * Update complaint status (for admins/handlers)
   */
  async updateStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    updatedBy: string,
    notes?: string
  ): Promise<IComplaint> {
    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      throw new NotFoundError('Complaint not found');
    }

    const oldStatus = complaint.status;
    complaint.status = newStatus;

    // Handle resolution
    if (newStatus === ComplaintStatus.RESOLVED || newStatus === ComplaintStatus.CLOSED) {
      complaint.resolvedAt = new Date();
      complaint.resolvedBy = new mongoose.Types.ObjectId(updatedBy);
      if (notes) complaint.resolution = notes;
    }

    // Add timeline entry
    complaint.timeline.push({
      id: new mongoose.Types.ObjectId().toString(),
      action: 'status_changed',
      description: `Status changed from ${oldStatus} to ${newStatus}${notes ? `: ${notes}` : ''}`,
      performedBy: new mongoose.Types.ObjectId(updatedBy),
      timestamp: new Date(),
    });

    await complaint.save();
    logger.info(`Complaint ${complaint.referenceNumber} status changed to ${newStatus}`);
    return complaint;
  }

  /**
   * Delete complaint (soft delete by changing status)
   */
  async deleteComplaint(complaintId: string, userId: string): Promise<void> {
    const complaint = await Complaint.findOne({
      _id: new mongoose.Types.ObjectId(complaintId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!complaint) {
      throw new NotFoundError('Complaint not found');
    }

    // Can only delete drafts
    if (complaint.status !== ComplaintStatus.DRAFT) {
      throw new ValidationError('Only draft complaints can be deleted');
    }

    await Complaint.deleteOne({ _id: complaint._id });
  }

  /**
   * Get complaint categories
   */
  getCategories(): string[] {
    return [
      'Cyberbullying',
      'Online Harassment',
      'Hate Speech',
      'Threats',
      'Identity Theft',
      'Privacy Violation',
      'Inappropriate Content',
      'Scam/Fraud',
      'Other',
    ];
  }
}

export const complaintService = new ComplaintService();
