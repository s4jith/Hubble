import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Complaint {
  id: string;
  type: 'deepfake' | 'cyberbullying' | 'threat';
  title: string;
  description: string;
  status: 'pending' | 'under_review' | 'in_progress' | 'resolved';
  submittedDate: string;
  authority: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  imageUrl: string | null;
}

interface ComplaintState {
  complaints: Complaint[];
  isLoading: boolean;
  activeFilter: 'all' | 'pending' | 'under_review' | 'in_progress' | 'resolved';
}

const initialState: ComplaintState = {
  complaints: [],
  isLoading: false,
  activeFilter: 'all',
};

const complaintSlice = createSlice({
  name: 'complaint',
  initialState,
  reducers: {
    setComplaints: (state, action: PayloadAction<Complaint[]>) => {
      state.complaints = action.payload;
    },
    addComplaint: (state, action: PayloadAction<Complaint>) => {
      state.complaints.unshift(action.payload);
    },
    updateComplaintStatus: (state, action: PayloadAction<{ id: string; status: Complaint['status'] }>) => {
      const complaint = state.complaints.find(c => c.id === action.payload.id);
      if (complaint) {
        complaint.status = action.payload.status;
      }
    },
    setActiveFilter: (state, action: PayloadAction<ComplaintState['activeFilter']>) => {
      state.activeFilter = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { 
  setComplaints, 
  addComplaint, 
  updateComplaintStatus, 
  setActiveFilter, 
  setLoading 
} = complaintSlice.actions;
export default complaintSlice.reducer;
