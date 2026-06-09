
export interface CreatePurchaseDto {
  dropId: string;
  userId: string;
}



export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
