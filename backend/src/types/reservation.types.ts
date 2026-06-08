// Request/Response types for Reservation API

export interface CreateReservationDto {
  dropId: string;
  userId: string;
}

export interface CancelReservationDto {
  userId: string;
}

export interface ReservationQuery {
  userId?: string;
  dropId?: string;
  status?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
