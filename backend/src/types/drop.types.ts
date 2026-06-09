// Request/Response types for Drop API

export enum DropStatus {
  ACTIVE = 'ACTIVE',
  UPCOMING = 'UPCOMING'
}

export interface CreateDropDto {
  name: string;
  price: string | number;
  initialStock: number;
  startsAt: string | Date;
  status: DropStatus;
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

export interface DropQuery {
  status?: string;
  search?: string;
}

