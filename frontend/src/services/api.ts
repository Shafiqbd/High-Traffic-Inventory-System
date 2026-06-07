import type {
  Drop,
  DropWithPurchases,
  Reservation,
  Purchase,
  CreateDropRequest,
  CreateReservationRequest,
  CreatePurchaseRequest,
  CancelReservationRequest,
  ApiError,
} from '../types';

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Drop API
export const dropApi = {
  getAll: (active = true): Promise<Drop[]> =>
    request(`/drops?active=${active}`),

  getById: (id: string): Promise<DropWithPurchases> =>
    request(`/drops/${id}`),

  create: (data: CreateDropRequest): Promise<Drop> =>
    request('/drops', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Reservation API
export const reservationApi = {
  create: (data: CreateReservationRequest): Promise<Reservation> =>
    request('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: string): Promise<Reservation> =>
    request(`/reservations/${id}`),

  cancel: (id: string, data: CancelReservationRequest): Promise<{ message: string }> =>
    request(`/reservations/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(data),
    }),
};

// Purchase API
export const purchaseApi = {
  create: (data: CreatePurchaseRequest): Promise<Purchase> =>
    request('/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
