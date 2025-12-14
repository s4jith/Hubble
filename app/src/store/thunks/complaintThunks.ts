import { createAsyncThunk } from '@reduxjs/toolkit';
import { complaintsApi, ComplaintStatus, ComplaintPriority, EvidenceType } from '../../services/api';

/**
 * Complaint Thunks
 * Async actions for complaint management
 */

export const fetchComplaints = createAsyncThunk(
  'complaint/fetchComplaints',
  async (
    params:
      | {
          page?: number;
          limit?: number;
          status?: ComplaintStatus;
          priority?: ComplaintPriority;
          category?: string;
        }
      | undefined,
    { rejectWithValue }
  ) => {
    try {
      const response = await complaintsApi.getComplaints(params);
      return {
        complaints: response.complaints.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          category: c.category,
          priority: c.priority,
          status: c.status,
          referenceNumber: c.referenceNumber,
          evidence: c.evidence,
          timeline: c.timeline,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          resolution: c.resolution,
        })),
        stats: response.stats,
        total: response.total,
        page: response.page,
        totalPages: response.totalPages,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch complaints');
    }
  }
);

export const fetchComplaintById = createAsyncThunk(
  'complaint/fetchById',
  async (complaintId: string, { rejectWithValue }) => {
    try {
      const complaint = await complaintsApi.getComplaint(complaintId);
      return complaint;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch complaint');
    }
  }
);

export const createComplaint = createAsyncThunk(
  'complaint/create',
  async (
    data: {
      title: string;
      description: string;
      category: string;
      priority?: ComplaintPriority;
      childId?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const complaint = await complaintsApi.createComplaint(data);
      return complaint;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create complaint');
    }
  }
);

export const updateComplaint = createAsyncThunk(
  'complaint/update',
  async (
    {
      complaintId,
      data,
    }: {
      complaintId: string;
      data: {
        title?: string;
        description?: string;
        category?: string;
        priority?: ComplaintPriority;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const complaint = await complaintsApi.updateComplaint(complaintId, data);
      return complaint;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update complaint');
    }
  }
);

export const addComplaintEvidence = createAsyncThunk(
  'complaint/addEvidence',
  async (
    {
      complaintId,
      evidence,
    }: {
      complaintId: string;
      evidence: {
        type: EvidenceType;
        url: string;
        filename: string;
        size: number;
        mimeType: string;
        description?: string;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const complaint = await complaintsApi.addEvidence(complaintId, evidence);
      return complaint;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add evidence');
    }
  }
);

export const removeComplaintEvidence = createAsyncThunk(
  'complaint/removeEvidence',
  async (
    { complaintId, evidenceId }: { complaintId: string; evidenceId: string },
    { rejectWithValue }
  ) => {
    try {
      const complaint = await complaintsApi.removeEvidence(complaintId, evidenceId);
      return complaint;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove evidence');
    }
  }
);

export const fetchComplaintCategories = createAsyncThunk(
  'complaint/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await complaintsApi.getCategories();
      return response.categories;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch categories');
    }
  }
);

export const fetchComplaintStats = createAsyncThunk(
  'complaint/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await complaintsApi.getStats();
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch stats');
    }
  }
);
