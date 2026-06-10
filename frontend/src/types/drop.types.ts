// Drop related types

export interface Drop {
  id: string;
  name: string;
  price: string;
  initialStock: number;
  availableStock: number;
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED';
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  userId?: string;
  email?: string;
  userName: string;
  purchasedAt?: string;
}

export interface DropWithPurchases {
  id: string;
  name: string;
  price: string;
  initialStock: number;
  availableStock: number;
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED';
  startsAt: string;
  endsAt: string;
  createdAt: string;
  recentPurchases?: Purchase[];
}

export interface CreateDropDto {
  name: string;
  price: string | number;
  initialStock: number;
  startsAt?: string;
  endsAt?: string;
  status?: string;
}

export interface UpdateDropDto {
  name?: string;
  price?: string | number;
  initialStock?: number;
  startsAt?: string;
  status?: string;
}

export interface UpdateDropStatusDto {
  status: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  count?: number;
}
