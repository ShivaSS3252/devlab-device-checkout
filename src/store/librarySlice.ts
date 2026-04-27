import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Device } from '@/domain/Device';
import { User } from '@/domain/User';
import { DevLab } from '@/domain/DevLab';
import { CheckoutLimitError } from '@/errors/CheckoutLimitError';
import { DuplicateCheckoutError } from '@/errors/DuplicateCheckoutError';
import { DevLabService } from '@/services/DevLabService';
import { RootState } from './index';

export interface DevLabState {
  books: Device[];
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DevLabState = {
  books: [],
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
};

export const fetchDevicesAsync = createAsyncThunk(
  'devlab/fetchDevices',
  async (_, { getState }) => {
    const state = getState() as RootState;
    return state.devlab.books;
  }
);

export const checkoutDeviceAsync = createAsyncThunk(
  'devlab/checkoutDevice',
  async ({ userId, bookTitle }: { userId: string; bookTitle: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { books, users, currentUser } = state.devlab;

      const user = currentUser || users.find((u: User) => u.id === userId);
      const device = books.find((b: Device) => b.name === bookTitle);

      if (!user) {
        throw new Error('User not found');
      }
      if (!device || device.units === 0) {
        throw new Error('Device not available');
      }
      if (user.checkedOutDevices.length >= 2) {
        throw new CheckoutLimitError();
      }
      if (user.checkedOutDevices.includes(bookTitle)) {
        throw new DuplicateCheckoutError();
      }

      const updatedBooks = books.map((b: Device) =>
        b.name === bookTitle ? b.decrementCopies() : b
      ).filter((b: Device) => b.hasCopies());

      const updatedUser = user.checkoutDevice(bookTitle);
      const updatedUsers = users.map((u: User) =>
        u.id === userId ? updatedUser : u
      );

      return {
        books: updatedBooks,
        users: updatedUsers,
        currentUser: updatedUser
      };
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
  async ({ userId, bookTitle }: { userId: string; bookTitle: string }, { getState }) => {
    const state = getState() as RootState;
    const service = new DevLabService(new DevLab(state.devlab.books, state.devlab.users));

    const updated = service.returnDevice(userId, bookTitle);

    return {
      books: [...updated.getBooks()],
      users: [...updated.getUsers()],
      currentUser: updated.getUser(userId) || null
    };
  }
);

export const addDeviceAsync = createAsyncThunk(
  'devlab/addDevice',
  async (device: Device, { getState }) => {
    const state = getState() as RootState;
    const currentBooks = state.devlab.books;

    const existing = currentBooks.find((b: Device) => b.name === device.name);
    const updatedBooks = existing
      ? currentBooks.map((b: Device) => b.name === device.name ? new Device(b.name, b.units + device.units) : b)
      : [...currentBooks, device];

    return updatedBooks;
  }
);

export const addUserAsync = createAsyncThunk(
  'devlab/addUser',
  async (user: User, { getState }) => {
    const state = getState() as RootState;
    const currentUsers = state.devlab.users;
    return [...currentUsers, user];
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
    initializeDevLab: (state, action: PayloadAction<{ books: Device[]; users: User[] }>) => {
      state.books = action.payload.books;
      state.users = action.payload.users;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Devices
      .addCase(fetchDevicesAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDevicesAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.books = action.payload;
      })
      .addCase(fetchDevicesAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Checkout Device
      .addCase(checkoutDeviceAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkoutDeviceAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.books = action.payload.books;
        state.users = action.payload.users;
        state.currentUser = action.payload.currentUser;
      })
      .addCase(checkoutDeviceAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Return Device
      .addCase(returnDeviceAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(returnDeviceAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.books = action.payload.books;
        state.users = action.payload.users;
        state.currentUser = action.payload.currentUser;
      })
      .addCase(returnDeviceAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Add Device
      .addCase(addDeviceAsync.fulfilled, (state, action) => {
        state.books = action.payload;
      })
      // Add User
      .addCase(addUserAsync.fulfilled, (state, action) => {
        state.users = action.payload;
      });
  },
});

export const { clearError, setCurrentUser, initializeDevLab } = devLabSlice.actions;
export default devLabSlice.reducer;
