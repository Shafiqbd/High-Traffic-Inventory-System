import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dropApi } from '../../services/api';
import type { Drop, Purchase } from '../../types';

interface DropsState {
  drops: Drop[];
  loading: boolean;
  error: string | null;
  // Map of dropId to recent purchases
  recentPurchases: Record<string, Purchase[]>;
}

const initialState: DropsState = {
  drops: [],
  loading: false,
  error: null,
  recentPurchases: {},
};

// Async thunks
export const fetchDrops = createAsyncThunk(
  'drops/fetchDrops',
  async () => {
    return await dropApi.getAll();
  }
);

export const createDrop = createAsyncThunk(
  'drops/createDrop',
  async (data: { name: string; price: string; initialStock: number; startsAt: string }) => {
    return await dropApi.create(data);
  }
);

const dropsSlice = createSlice({
  name: 'drops',
  initialState,
  reducers: {
    updateStock: (state, action: { payload: { dropId: string; availableStock: number } }) => {
      const drop = state.drops.find((d) => d.id === action.payload.dropId);
      if (drop) {
        drop.availableStock = action.payload.availableStock;
      }
    },
    addDrop: (state, action: { payload: Drop }) => {
      state.drops.push(action.payload);
    },
    updateRecentPurchases: (state, action: { payload: { dropId: string; purchases: Purchase[] } }) => {
      state.recentPurchases[action.payload.dropId] = action.payload.purchases;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch drops
      .addCase(fetchDrops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDrops.fulfilled, (state, action) => {
        state.loading = false;
        state.drops = action.payload;
      })
      .addCase(fetchDrops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch drops';
      })
      // Create drop
      .addCase(createDrop.fulfilled, (state, action) => {
        state.drops.push(action.payload);
      })
      .addCase(createDrop.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create drop';
      });
  },
});

export const { updateStock, addDrop, updateRecentPurchases, clearError } = dropsSlice.actions;
export default dropsSlice.reducer;

// Selectors
export const selectAllDrops = (state: { drops: DropsState }) => state.drops.drops;
export const selectDropsLoading = (state: { drops: DropsState }) => state.drops.loading;
export const selectDropsError = (state: { drops: DropsState }) => state.drops.error;
export const selectRecentPurchases = (dropId: string) => (state: { drops: DropsState }) =>
  state.drops.recentPurchases[dropId] || [];
