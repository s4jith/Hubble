import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DashboardStats {
  totalReports: number;
  activeAlerts: number;
  resolved: number;
  pending: number;
}

interface DashboardState {
  stats: DashboardStats;
  securityTips: string[];
  isLoading: boolean;
}

const initialState: DashboardState = {
  stats: {
    totalReports: 0,
    activeAlerts: 0,
    resolved: 0,
    pending: 0,
  },
  securityTips: [],
  isLoading: false,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setStats: (state, action: PayloadAction<DashboardStats>) => {
      state.stats = action.payload;
    },
    setSecurityTips: (state, action: PayloadAction<string[]>) => {
      state.securityTips = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setStats, setSecurityTips, setLoading } = dashboardSlice.actions;
export default dashboardSlice.reducer;
