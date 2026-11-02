import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import incidentReducer from '../features/incidents/incidentSlice';
import analyticsReducer from '../features/analytics/analyticsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    incidents: incidentReducer,
    analytics: analyticsReducer,
  },
});

export default store;

