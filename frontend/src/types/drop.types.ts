// Drop related types

export interface Drop {
  id: string;
  name: string;
  price: string;
  initialStock: number;
  availableStock: number;
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED';
  startsAt: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  createdAt: string;
}

export interface DropWithPurchases {
  id: string;
  name: string;
  price: string;
  initialStock: number;
  availableStock: number;
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED';
  startsAt: string;
  createdAt: string;
  recentPurchases?: Purchase[];
}

export interface CreateDropDto {
  name: string;
  price: string | number;
  initialStock: number;
  startsAt?: string | Date;
  status?: string;
}

export interface UpdateDropDto {
  name?: string;
  price?: string | number;
  initialStock?: number;
  startsAt?: string | Date;
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
