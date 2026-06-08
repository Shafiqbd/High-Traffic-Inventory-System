// API Response Types

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface Drop {
  id: string;
  name: string;
  price: string;
  initialStock: number;
  availableStock: number;
  startsAt: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  dropId: string;
  userId: string;
  user?: User;
  expiresAt: string;
  createdAt: string;
  status?: 'active' | 'expired';
}

export interface Purchase {
  id: string;
  dropId: string;
  userId: string;
  user?: User;
  createdAt: string;
}

export interface DropWithPurchases {
  drop: Drop;
  recentPurchases: Purchase[];
}

// API Request Types

export interface CreateDropRequest {
  name: string;
  price: string;
  initialStock: number;
  startsAt: string;
}

export interface CreateUserRequest {
  email: string;
  name?: string;
}

export interface CreateReservationRequest {
  dropId: string;
  userId: string;
}

export interface CreatePurchaseRequest {
  reservationId: string;
  userId: string;
}

export interface CancelReservationRequest {
  userId: string;
}

// API Error Response

export interface ApiError {
  error: string;
}
