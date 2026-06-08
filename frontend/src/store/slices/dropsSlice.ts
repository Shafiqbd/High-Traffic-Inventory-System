import { createSlice } from '@reduxjs/toolkit';
import type { Purchase } from '../../types/drop.types';

interface DropsState {
  // Map of dropId to recent purchases (for Socket.io updates)
  recentPurchases: Record<string, Purchase[]>;
}

const initialState: DropsState = {
  recentPurchases: {},
};

const dropsSlice = createSlice({
  name: 'drops',
  initialState,
  reducers: {
    updateRecentPurchases: (state, action: { payload: { dropId: string; purchases: Purchase[] } }) => {
      state.recentPurchases[action.payload.dropId] = action.payload.purchases;
    },
  },
});

export const { updateRecentPurchases } = dropsSlice.actions;
export default dropsSlice.reducer;

// Selectors
export const selectRecentPurchases = (dropId: string) => (state: { drops: DropsState }) =>
  state.drops.recentPurchases[dropId] || [];
