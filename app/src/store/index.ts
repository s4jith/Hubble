import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import feedReducer from './slices/feedSlice';
import chatReducer from './slices/chatSlice';
import complaintReducer from './slices/complaintSlice';
import dashboardReducer from './slices/dashboardSlice';
import notificationReducer from './slices/notificationSlice';
import profileReducer from './slices/profileSlice';
import appReducer from './slices/appSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    profile: profileReducer,
    feed: feedReducer,
    chat: chatReducer,
    complaint: complaintReducer,
    dashboard: dashboardReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization check
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export individual slices - import actions directly from slices when needed
// to avoid naming conflicts between slices
export { default as authReducer } from './slices/authSlice';
export { default as feedReducer } from './slices/feedSlice';
export { default as chatReducer } from './slices/chatSlice';
export { default as complaintReducer } from './slices/complaintSlice';
export { default as dashboardReducer } from './slices/dashboardSlice';
export { default as notificationReducer } from './slices/notificationSlice';
export { default as profileReducer } from './slices/profileSlice';
export { default as appReducer } from './slices/appSlice';

// Export types from slices
export type { User, UserProfile, UserStats, AuthError } from './slices/authSlice';

// Re-export async thunks (these have unique names)
export * from './thunks';
