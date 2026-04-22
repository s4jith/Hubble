import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchComplaints, createComplaint, fetchComplaintById, updateComplaint as updateComplaintThunk, addComplaintEvidence } from '../thunks/complaintThunks';

type ComplaintType = 'deepfake' | 'cyberbullying' | 'threat' | 'harassment' | 'identity_theft' | 'other';
type ComplaintStatus = 'draft' | 'pending' | 'under_review' | 'in_progress' | 'resolved' | 'rejected' | 'closed';
type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

interface ComplaintEvidence {
  id: string;
  type: 'image' | 'video' | 'document' | 'screenshot' | 'url';
  url: string;
  filename: string;
  uploadedAt: string;
  size?: number;
}

interface ComplaintTimeline {
  id: string;
  status: ComplaintStatus;
  message: string;
  timestamp: string;
  updatedBy?: string;
}

interface Complaint {
  id: string;
  type: ComplaintType;
  title: string;
  description: string;
  status: ComplaintStatus;
  submittedDate: string;
  updatedDate?: string;
  authority: string;
  severity: SeverityLevel;
  imageUrl: string | null;
  evidence: ComplaintEvidence[];
  timeline: ComplaintTimeline[];
  referenceNumber?: string;
  assignedTo?: string;
  platformUrl?: string;
  incidentDate?: string;
  location?: string;
  witnesses?: string[];
  tags?: string[];
}

interface ComplaintDraft {
  type: ComplaintType | null;
  title: string;
  description: string;
  severity: SeverityLevel;
  evidence: ComplaintEvidence[];
  platformUrl: string;
  incidentDate: string;
  location: string;
}

interface ComplaintFilters {
  status: ComplaintStatus | 'all';
  type: ComplaintType | 'all';
  severity: SeverityLevel | 'all';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  searchQuery: string;
}

interface ComplaintStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
}

interface ComplaintState {
  complaints: Complaint[];
  currentComplaint: Complaint | null;
  draft: ComplaintDraft;
  filters: ComplaintFilters;
  stats: ComplaintStats;
  isLoading: boolean;
  isSubmitting: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  successMessage: string | null;
}

const initialDraft: ComplaintDraft = {
  type: null,
  title: '',
  description: '',
  severity: 'medium',
  evidence: [],
  platformUrl: '',
  incidentDate: '',
  location: '',
};

const initialFilters: ComplaintFilters = {
  status: 'all',
  type: 'all',
  severity: 'all',
  dateRange: 'all',
  searchQuery: '',
};

const initialState: ComplaintState = {
  complaints: [],
  currentComplaint: null,
  draft: initialDraft,
  filters: initialFilters,
  stats: {
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
  },
  isLoading: false,
  isSubmitting: false,
  isUploading: false,
  uploadProgress: 0,
  error: null,
  successMessage: null,
};

const calculateStats = (complaints: Complaint[]): ComplaintStats => ({
  total: complaints.length,
  pending: complaints.filter(c => c.status === 'pending').length,
  inProgress: complaints.filter(c => c.status === 'in_progress' || c.status === 'under_review').length,
  resolved: complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length,
  rejected: complaints.filter(c => c.status === 'rejected').length,
});

const complaintSlice = createSlice({
  name: 'complaint',
  initialState,
  reducers: {
    // Fetch complaints
    fetchComplaintsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    setComplaints: (state, action: PayloadAction<Complaint[]>) => {
      state.complaints = action.payload;
      state.stats = calculateStats(action.payload);
      state.isLoading = false;
    },
    fetchComplaintsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Single complaint
    setCurrentComplaint: (state, action: PayloadAction<Complaint | null>) => {
      state.currentComplaint = action.payload;
    },
    clearCurrentComplaint: (state) => {
      state.currentComplaint = null;
    },

    // Add complaint
    submitComplaintStart: (state) => {
      state.isSubmitting = true;
      state.error = null;
    },
    addComplaint: (state, action: PayloadAction<Complaint>) => {
      state.complaints.unshift(action.payload);
      state.stats = calculateStats(state.complaints);
      state.isSubmitting = false;
      state.successMessage = 'Complaint submitted successfully!';
      state.draft = initialDraft;
    },
    submitComplaintFailure: (state, action: PayloadAction<string>) => {
      state.isSubmitting = false;
      state.error = action.payload;
    },

    // Update complaint
    updateComplaint: (state, action: PayloadAction<Complaint>) => {
      const index = state.complaints.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.complaints[index] = action.payload;
        state.stats = calculateStats(state.complaints);
      }
      if (state.currentComplaint?.id === action.payload.id) {
        state.currentComplaint = action.payload;
      }
    },
    updateComplaintStatus: (state, action: PayloadAction<{ id: string; status: ComplaintStatus; message?: string }>) => {
      const complaint = state.complaints.find(c => c.id === action.payload.id);
      if (complaint) {
        complaint.status = action.payload.status;
        complaint.updatedDate = new Date().toISOString();
        complaint.timeline.push({
          id: `timeline_${Date.now()}`,
          status: action.payload.status,
          message: action.payload.message || `Status changed to ${action.payload.status}`,
          timestamp: new Date().toISOString(),
        });
        state.stats = calculateStats(state.complaints);
      }
    },

    // Delete complaint
    deleteComplaint: (state, action: PayloadAction<string>) => {
      state.complaints = state.complaints.filter(c => c.id !== action.payload);
      state.stats = calculateStats(state.complaints);
      if (state.currentComplaint?.id === action.payload) {
        state.currentComplaint = null;
      }
    },

    // Draft management
    updateDraft: (state, action: PayloadAction<Partial<ComplaintDraft>>) => {
      state.draft = { ...state.draft, ...action.payload };
    },
    clearDraft: (state) => {
      state.draft = initialDraft;
    },
    saveDraftToStorage: (state) => {
      // This would trigger a side effect to save to AsyncStorage
      state.successMessage = 'Draft saved!';
    },
    loadDraftFromStorage: (state, action: PayloadAction<ComplaintDraft>) => {
      state.draft = action.payload;
    },

    // Evidence/file upload
    uploadEvidenceStart: (state) => {
      state.isUploading = true;
      state.uploadProgress = 0;
      state.error = null;
    },
    updateUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    addEvidence: (state, action: PayloadAction<ComplaintEvidence>) => {
      state.draft.evidence.push(action.payload);
      state.isUploading = false;
      state.uploadProgress = 100;
    },
    removeEvidence: (state, action: PayloadAction<string>) => {
      state.draft.evidence = state.draft.evidence.filter(e => e.id !== action.payload);
    },
    uploadEvidenceFailure: (state, action: PayloadAction<string>) => {
      state.isUploading = false;
      state.uploadProgress = 0;
      state.error = action.payload;
    },

    // Filters
    setFilters: (state, action: PayloadAction<Partial<ComplaintFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setActiveFilter: (state, action: PayloadAction<ComplaintFilters['status']>) => {
      state.filters.status = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.filters.searchQuery = action.payload;
    },
    clearFilters: (state) => {
      state.filters = initialFilters;
    },

    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Messages
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSuccessMessage: (state, action: PayloadAction<string | null>) => {
      state.successMessage = action.payload;
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },

    // Reset
    resetComplaintState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch complaints
      .addCase(fetchComplaints.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.isLoading = false;
        const complaints = action.payload.complaints.map((c: any) => ({
          id: c.id,
          type: (c.category as ComplaintType) || 'other',
          title: c.title,
          description: c.description,
          status: (c.status as ComplaintStatus) || 'pending',
          submittedDate: c.createdAt,
          updatedDate: c.updatedAt,
          authority: 'Pending Assignment',
          severity: (c.priority === 'urgent' ? 'critical' : c.priority || 'medium') as SeverityLevel,
          imageUrl: c.evidence?.[0]?.url || null,
          evidence: (c.evidence || []).map((e: any) => ({
            id: e.id,
            type: e.type === 'audio' ? 'document' : e.type,
            url: e.url,
            filename: e.filename || e.url,
            uploadedAt: e.uploadedAt,
            size: e.size,
          })),
          timeline: (c.timeline || []).map((t: any) => ({
            id: t.id,
            status: t.status || 'pending',
            message: t.note || t.message || '',
            timestamp: t.timestamp,
            updatedBy: t.updatedBy,
          })),
          referenceNumber: c.referenceNumber,
        }));
        state.complaints = complaints;
        if (action.payload.stats) {
          state.stats = action.payload.stats as any;
        } else {
          state.stats = {
            total: complaints.length,
            pending: complaints.filter((c: any) => c.status === 'pending').length,
            inProgress: complaints.filter((c: any) => c.status === 'in_progress' || c.status === 'under_review').length,
            resolved: complaints.filter((c: any) => c.status === 'resolved' || c.status === 'closed').length,
            rejected: complaints.filter((c: any) => c.status === 'rejected').length,
          };
        }
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create complaint
      .addCase(createComplaint.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createComplaint.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const c = action.payload;
        const newComplaint = {
          id: c.id,
          type: (c.category as ComplaintType) || 'other',
          title: c.title,
          description: c.description,
          status: (c.status as ComplaintStatus) || 'pending',
          submittedDate: c.createdAt,
          updatedDate: c.updatedAt,
          authority: 'Pending Assignment',
          severity: (c.priority === 'urgent' ? 'critical' : c.priority || 'medium') as SeverityLevel,
          imageUrl: c.evidence?.[0]?.url || null,
          evidence: (c.evidence || []).map((e: any) => ({
            id: e.id,
            type: e.type === 'audio' ? 'document' : e.type,
            url: e.url,
            filename: e.filename || e.url,
            uploadedAt: e.uploadedAt,
            size: e.size,
          })),
          timeline: (c.timeline || []).map((t: any) => ({
            id: t.id,
            status: t.status || 'pending',
            message: t.note || t.message || '',
            timestamp: t.timestamp,
            updatedBy: t.updatedBy,
          })),
          referenceNumber: c.referenceNumber,
        };
        state.complaints.unshift(newComplaint as Complaint);
        state.successMessage = `Complaint submitted! Reference: ${c.referenceNumber}`;
        state.draft = {
          type: null,
          title: '',
          description: '',
          severity: 'medium',
          evidence: [],
          platformUrl: '',
          incidentDate: '',
          location: '',
        };
        state.stats.total += 1;
        state.stats.pending += 1;
      })
      .addCase(createComplaint.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })
      // Get complaint details
      .addCase(fetchComplaintById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchComplaintById.fulfilled, (state, action) => {
        state.isLoading = false;
        const c = action.payload;
        state.currentComplaint = {
          id: c.id,
          type: (c.category as ComplaintType) || 'other',
          title: c.title,
          description: c.description,
          status: (c.status as ComplaintStatus) || 'pending',
          submittedDate: c.createdAt,
          updatedDate: c.updatedAt,
          authority: 'Pending Assignment',
          severity: (c.priority === 'urgent' ? 'critical' : c.priority || 'medium') as SeverityLevel,
          imageUrl: c.evidence?.[0]?.url || null,
          evidence: (c.evidence || []).map((e: any) => ({
            id: e.id,
            type: e.type === 'audio' ? 'document' : e.type,
            url: e.url,
            filename: e.filename || e.url,
            uploadedAt: e.uploadedAt,
            size: e.size,
          })),
          timeline: (c.timeline || []).map((t: any) => ({
            id: t.id,
            status: t.status || 'pending',
            message: t.note || t.message || '',
            timestamp: t.timestamp,
            updatedBy: t.updatedBy,
          })),
          referenceNumber: c.referenceNumber,
        };
      })
      .addCase(fetchComplaintById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update complaint
      .addCase(updateComplaintThunk.fulfilled, (state, action) => {
        const c = action.payload;
        const index = state.complaints.findIndex(comp => comp.id === c.id);
        if (index !== -1) {
          state.complaints[index] = {
            ...state.complaints[index],
            status: c.status as any,
            updatedDate: c.updatedAt,
          };
        }
      })
      // Add evidence
      .addCase(addComplaintEvidence.pending, (state) => {
        state.isUploading = true;
      })
      .addCase(addComplaintEvidence.fulfilled, (state, action) => {
        state.isUploading = false;
        state.uploadProgress = 100;
        // Evidence added to complaint on server
      })
      .addCase(addComplaintEvidence.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  fetchComplaintsStart,
  setComplaints, 
  fetchComplaintsFailure,
  setCurrentComplaint,
  clearCurrentComplaint,
  submitComplaintStart,
  addComplaint, 
  submitComplaintFailure,
  updateComplaint,
  updateComplaintStatus, 
  deleteComplaint,
  updateDraft,
  clearDraft,
  saveDraftToStorage,
  loadDraftFromStorage,
  uploadEvidenceStart,
  updateUploadProgress,
  addEvidence,
  removeEvidence,
  uploadEvidenceFailure,
  setFilters,
  setActiveFilter, 
  setSearchQuery,
  clearFilters,
  setLoading,
  setError,
  setSuccessMessage,
  clearMessages,
  resetComplaintState,
} = complaintSlice.actions;

export type { 
  Complaint, 
  ComplaintType, 
  ComplaintStatus, 
  SeverityLevel, 
  ComplaintEvidence, 
  ComplaintTimeline,
  ComplaintDraft,
  ComplaintFilters,
};
export default complaintSlice.reducer;
