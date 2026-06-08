// Request/Response types for User API

export interface CreateUserDto {
  email: string;
  name?: string;
  password: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
