import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, LoginCredentials } from '@/types/auth';
import { User as DomainUser } from '@/domain/User';
import { RootState } from './index';
import { authService } from '@/services/authService';
import { setCurrentUser } from './librarySlice';

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

// Async thunks
/**
 * Login user with OAuth credentials
 * @param credentials - Login credentials from OAuth provider
 * @returns AuthToken with user information
 */
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { dispatch, getState }) => {
    const token = await authService.login(credentials);
    // Find the domain user that matches the auth user
    const state = getState() as RootState;
    const domainUser = state.library.users.find((u: DomainUser) => u.id === token.user.id);
    if (domainUser) {
      dispatch(setCurrentUser(domainUser));
    }
    return token;
  }
);

/**
 * Logout current user
 */
export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async () => {
    await authService.logout();
  }
);

/**
 * Refresh authentication token
 * @returns New AuthToken or null if refresh failed
 */
export const refreshTokenAsync = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    const token = await authService.refreshToken();
    if (!token) {
      return rejectWithValue('Session expired. Please login again.');
    }
    return token;
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async () => {
    const token = authService.getCurrentToken();
    return token;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.error = null;
      })
      // Refresh Token
      .addCase(refreshTokenAsync.fulfilled, (state, action) => {
        state.token = action.payload;
        state.user = action.payload.user;
      })
      .addCase(refreshTokenAsync.rejected, (state, action) => {
        state.user = null;
        state.token = null;
        state.error = action.payload as string;
      })
      // Initialize
      .addCase(initializeAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.token = action.payload;
          state.user = action.payload.user;
        }
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
