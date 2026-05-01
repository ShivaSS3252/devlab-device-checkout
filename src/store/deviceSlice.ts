import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Device } from '@/domain/Device';
import { User } from '@/domain/User';
import { DevLab } from '@/domain/DevLab';
import { CheckoutLimitError } from '@/errors/CheckoutLimitError';
import { DuplicateCheckoutError } from '@/errors/DuplicateCheckoutError';
import { DevLabService } from '@/services/DevLabService';
import { RootState } from './index';
import { logoutAsync } from './authSlice';

export interface DevLabState {
  devices: Device[];
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DevLabState = {
  devices: [],
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
};

// Helpers to always reconstruct class instances from plain Redux state objects
const toDevice = (d: any): Device => new Device(d.name, d.units);
const toUser = (u: any): User => new User(u.id, u.name, [...(u.checkedOutDevices || [])]);

export const fetchDevicesAsync = createAsyncThunk(
  'devlab/fetchDevices',
  async (_, { getState }) => {
    const state = getState() as RootState;
    return state.devlab.devices;
  }
);

export const checkoutDeviceAsync = createAsyncThunk(
  'devlab/checkoutDevice',
  async ({ userId, deviceName }: { userId: string; deviceName: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { devices, users } = state.devlab;

      // Always reconstruct class instances so prototype methods are available
      const rawUser = users.find((u: any) => u.id === userId);
      const rawDevice = devices.find((d: any) => d.name === deviceName);

      if (!rawUser) throw new Error('User not found');
      if (!rawDevice || rawDevice.units === 0) throw new Error('Device not available');

      const user = toUser(rawUser);

      if (user.checkedOutDevices.length >= 2) throw new CheckoutLimitError();
      if (user.checkedOutDevices.includes(deviceName)) throw new DuplicateCheckoutError();

      const updatedDevices = devices
        .map((d: any) => toDevice({ ...d, units: d.name === deviceName ? d.units - 1 : d.units }))
        .filter((d: Device) => d.units > 0);

      const updatedUser = new User(rawUser.id, rawUser.name, [...rawUser.checkedOutDevices, deviceName]);
      const updatedUsers = users.map((u: any) => u.id === userId ? updatedUser : toUser(u));

      return { devices: updatedDevices, users: updatedUsers, currentUser: updatedUser };
    } catch (error) {
      if (error instanceof CheckoutLimitError) {
        return rejectWithValue('Checkout limit exceeded (max 2 devices)');
      }
      if (error instanceof DuplicateCheckoutError) {
        return rejectWithValue('You cannot checkout the same device twice');
      }
      return rejectWithValue('Failed to checkout device');
    }
  }
);

export const returnDeviceAsync = createAsyncThunk(
  'devlab/returnDevice',
  async ({ userId, deviceName }: { userId: string; deviceName: string }, { getState }) => {
    const state = getState() as RootState;

    // Always reconstruct class instances so prototype methods are available
    const devices = state.devlab.devices.map(toDevice);
    const users = state.devlab.users.map(toUser);

    const service = new DevLabService(new DevLab(devices, users));
    const updated = service.returnDevice(userId, deviceName);

    return {
      devices: [...updated.getDevices()],
      users: [...updated.getUsers()],
      currentUser: updated.getUser(userId) || null,
    };
  }
);

export const addDeviceAsync = createAsyncThunk(
  'devlab/addDevice',
  async (device: Device, { getState }) => {
    const state = getState() as RootState;
    const currentDevices = state.devlab.devices;

    const existing = currentDevices.find((d: any) => d.name === device.name);
    const updatedDevices = existing
      ? currentDevices.map((d: any) =>
          d.name === device.name ? new Device(d.name, d.units + device.units) : toDevice(d)
        )
      : [...currentDevices.map(toDevice), device];

    return updatedDevices;
  }
);

export const addUserAsync = createAsyncThunk(
  'devlab/addUser',
  async (user: User, { getState }) => {
    const state = getState() as RootState;
    return [...state.devlab.users, user];
  }
);

const devLabSlice = createSlice({
  name: 'devlab',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
    initializeDevLab: (state, action: PayloadAction<{ devices: Device[]; users: User[] }>) => {
      state.devices = action.payload.devices;
      state.users = action.payload.users;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevicesAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDevicesAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.devices = action.payload;
      })
      .addCase(fetchDevicesAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(checkoutDeviceAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkoutDeviceAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.devices = action.payload.devices;
        state.users = action.payload.users;
        state.currentUser = action.payload.currentUser;
      })
      .addCase(checkoutDeviceAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(returnDeviceAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(returnDeviceAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.devices = action.payload.devices;
        state.users = action.payload.users;
        state.currentUser = action.payload.currentUser;
      })
      .addCase(returnDeviceAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addDeviceAsync.fulfilled, (state, action) => {
        state.devices = action.payload;
      })
      .addCase(addUserAsync.fulfilled, (state, action) => {
        state.users = action.payload;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.currentUser = null;
      });
  },
});

export const { clearError, setCurrentUser, initializeDevLab } = devLabSlice.actions;
export default devLabSlice.reducer;
