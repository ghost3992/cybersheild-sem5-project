import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

// Fetch incidents with pagination and filters
export const fetchIncidents = createAsyncThunk(
  'incidents/fetchIncidents',
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', params.page);
      if (params.limit) query.append('limit', params.limit);
      if (params.status && params.status !== 'all') query.append('status', params.status);
      if (params.severity && params.severity !== 'all') query.append('severity', params.severity);
      if (params.incident_type && params.incident_type !== 'all') query.append('incident_type', params.incident_type);
      if (params.assigned_to && params.assigned_to !== 'all') query.append('assigned_to', params.assigned_to);
      if (params.search) query.append('search', params.search);
      if (params.sort_by) query.append('sort_by', params.sort_by);
      if (params.order) query.append('order', params.order);

      const response = await axiosClient.get(`/incidents?${query.toString()}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load incident queue.');
    }
  }
);

// Fetch full incident dossier by ID
export const fetchIncidentById = createAsyncThunk(
  'incidents/fetchIncidentById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/incidents/${id}`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to retrieve incident dossier.');
    }
  }
);

// Create new incident
export const createIncident = createAsyncThunk(
  'incidents/createIncident',
  async (incidentData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/incidents', incidentData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error recording incident.');
    }
  }
);

// Update incident triage/status/notes
export const updateIncident = createAsyncThunk(
  'incidents/updateIncident',
  async ({ id, updates }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosClient.patch(`/incidents/${id}`, updates);
      dispatch(fetchIncidentById(id));
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to apply updates.');
    }
  }
);

// Assign incident
export const assignIncident = createAsyncThunk(
  'incidents/assignIncident',
  async ({ id, assigned_to }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosClient.patch(`/incidents/${id}/assign`, { assigned_to });
      dispatch(fetchIncidentById(id));
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to assign analyst.');
    }
  }
);

// Add comment to discussion
export const addComment = createAsyncThunk(
  'incidents/addComment',
  async ({ id, comment, is_internal }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosClient.post(`/incidents/${id}/comments`, { comment, is_internal });
      dispatch(fetchIncidentById(id));
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to post comment.');
    }
  }
);

// Add technical artifact / observable
export const addArtifact = createAsyncThunk(
  'incidents/addArtifact',
  async ({ id, artifact }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosClient.post(`/incidents/${id}/artifacts`, artifact);
      dispatch(fetchIncidentById(id));
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to attach artifact.');
    }
  }
);

// Delete artifact
export const deleteArtifact = createAsyncThunk(
  'incidents/deleteArtifact',
  async ({ id, artifactId }, { dispatch, rejectWithValue }) => {
    try {
      await axiosClient.delete(`/incidents/${id}/artifacts/${artifactId}`);
      dispatch(fetchIncidentById(id));
      return artifactId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove artifact.');
    }
  }
);

// Delete incident (Admin only)
export const deleteIncident = createAsyncThunk(
  'incidents/deleteIncident',
  async (id, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/incidents/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete record.');
    }
  }
);

// Fetch DRAFT IR Report
export const fetchDraftReport = createAsyncThunk(
  'incidents/fetchDraftReport',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/incidents/${id}/draft-report`);
      return response.data.report;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to generate DRAFT report.');
    }
  }
);

const incidentSlice = createSlice({
  name: 'incidents',
  initialState: {
    incidents: [],
    pagination: {
      page: 1,
      limit: 10,
      totalRecords: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
    currentIncident: null,
    drawerIncidentId: null,
    draftReport: null,
    loading: false,
    reportLoading: false,
    error: null,
    filters: {
      status: 'all',
      severity: 'all',
      incident_type: 'all',
      assigned_to: 'all',
      search: '',
      sort_by: 'created_at',
      order: 'DESC',
      page: 1,
      limit: 10,
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload, page: action.payload.page !== undefined ? action.payload.page : 1 };
    },
    resetFilters: (state) => {
      state.filters = {
        status: 'all',
        severity: 'all',
        incident_type: 'all',
        assigned_to: 'all',
        search: '',
        sort_by: 'created_at',
        order: 'DESC',
        page: 1,
        limit: 10,
      };
    },
    setDrawerIncidentId: (state, action) => {
      state.drawerIncidentId = action.payload;
    },
    clearCurrentIncident: (state) => {
      state.currentIncident = null;
      state.draftReport = null;
    },
    clearIncidentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch incidents
      .addCase(fetchIncidents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncidents.fulfilled, (state, action) => {
        state.loading = false;
        state.incidents = action.payload.data;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchIncidents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single incident
      .addCase(fetchIncidentById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIncidentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentIncident = action.payload;
      })
      .addCase(fetchIncidentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete incident
      .addCase(deleteIncident.fulfilled, (state, action) => {
        state.incidents = state.incidents.filter((i) => i.id !== action.payload);
        if (state.currentIncident?.id === action.payload) {
          state.currentIncident = null;
        }
      })
      // Draft Report
      .addCase(fetchDraftReport.pending, (state) => {
        state.reportLoading = true;
      })
      .addCase(fetchDraftReport.fulfilled, (state, action) => {
        state.reportLoading = false;
        state.draftReport = action.payload;
      })
      .addCase(fetchDraftReport.rejected, (state) => {
        state.reportLoading = false;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setDrawerIncidentId,
  clearCurrentIncident,
  clearIncidentError
} = incidentSlice.actions;

export default incidentSlice.reducer;
