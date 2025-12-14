import { apiClient } from './client';

/**
 * Complaint Types
 */
export type ComplaintStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'escalated';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export type EvidenceType = 'screenshot' | 'document' | 'video' | 'audio' | 'other';

export interface Evidence {
  id: string;
  type: EvidenceType;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  description?: string;
}

export interface TimelineEntry {
  id: string;
  action: string;
  description: string;
  performedByName?: string;
  timestamp: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  childId?: string;
  evidence: Evidence[];
  timeline: TimelineEntry[];
  referenceNumber: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintsResponse {
  complaints: Complaint[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
  };
}

/**
 * Complaints API Service
 */
export const complaintsApi = {
  /**
   * Get all complaints
   */
  async getComplaints(params?: {
    page?: number;
    limit?: number;
    status?: ComplaintStatus;
    priority?: ComplaintPriority;
    category?: string;
  }): Promise<ComplaintsResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.category) query.append('category', params.category);

    return apiClient.get<ComplaintsResponse>(`/complaints?${query.toString()}`);
  },

  /**
   * Get complaint stats
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
  }> {
    return apiClient.get('/complaints/stats');
  },

  /**
   * Get complaint categories
   */
  async getCategories(): Promise<{ categories: string[] }> {
    return apiClient.get<{ categories: string[] }>('/complaints/categories');
  },

  /**
   * Get single complaint
   */
  async getComplaint(complaintId: string): Promise<Complaint> {
    return apiClient.get<Complaint>(`/complaints/${complaintId}`);
  },

  /**
   * Get complaint by reference number
   */
  async getComplaintByReference(referenceNumber: string): Promise<Complaint> {
    return apiClient.get<Complaint>(`/complaints/reference/${referenceNumber}`);
  },

  /**
   * Create complaint
   */
  async createComplaint(data: {
    title: string;
    description: string;
    category: string;
    priority?: ComplaintPriority;
    childId?: string;
    evidence?: Omit<Evidence, 'id' | 'uploadedAt'>[];
  }): Promise<Complaint> {
    return apiClient.post<Complaint>('/complaints', data);
  },

  /**
   * Update complaint
   */
  async updateComplaint(
    complaintId: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      priority?: ComplaintPriority;
    }
  ): Promise<Complaint> {
    return apiClient.put<Complaint>(`/complaints/${complaintId}`, data);
  },

  /**
   * Delete complaint (drafts only)
   */
  async deleteComplaint(complaintId: string): Promise<void> {
    return apiClient.delete(`/complaints/${complaintId}`);
  },

  /**
   * Add evidence
   */
  async addEvidence(
    complaintId: string,
    evidence: {
      type: EvidenceType;
      url: string;
      filename: string;
      size: number;
      mimeType: string;
      description?: string;
    }
  ): Promise<Complaint> {
    return apiClient.post<Complaint>(`/complaints/${complaintId}/evidence`, evidence);
  },

  /**
   * Remove evidence
   */
  async removeEvidence(complaintId: string, evidenceId: string): Promise<Complaint> {
    return apiClient.delete<Complaint>(`/complaints/${complaintId}/evidence/${evidenceId}`);
  },
};
