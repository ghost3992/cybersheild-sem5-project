import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

// Helper to safely get stored auth
const storedToken = localStorage.getItem('cybershield_token');
let storedUser = null;
try {
  const raw = localStorage.getItem('cybershield_user');
  if (raw) storedUser = JSON.parse(raw);
} catch (e) {
  // ignore json parse error
}

// Thunk: User Login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/auth/login', credentials);
      const { token, user } = response.data;
      localStorage.setItem('cybershield_token', token);
      localStorage.setItem('cybershield_user', JSON.stringify(user));
      return { token, user };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Authentication failed. Please verify credentials.'
      );
    }
  }
);

// Thunk: User Register
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/auth/register', userData);
      const { token, user } = response.data;
      localStorage.setItem('cybershield_token', token);
      localStorage.setItem('cybershield_user', JSON.stringify(user));
      return { token, user };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Registration failed. Please check your inputs.'
      );
    }
  }
);

// Thunk: Verify Session
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/auth/me');
      return response.data.user;
    } catch (err) {
      localStorage.removeItem('cybershield_token');
      localStorage.removeItem('cybershield_user');
      return rejectWithValue('Session expired.');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser,
    token: storedToken,
    isAuthenticated: !!storedToken,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('cybershield_token');
      localStorage.removeItem('cybershield_user');
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      // Fetch me
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

