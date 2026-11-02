import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

export const fetchMetrics = createAsyncThunk(
  'analytics/fetchMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/analytics/metrics');
      return response.data.metrics;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load metrics.');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    metrics: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default analyticsSlice.reducer;

