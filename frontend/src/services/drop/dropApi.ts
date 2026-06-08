import { apiSlice } from "../../store/apiSlice";
import type { Drop, DropWithPurchases, CreateDropDto, UpdateDropDto, UpdateDropStatusDto, ApiResponse } from "../../types/drop.types";

export const dropApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET all drops
    getDrops: builder.query<ApiResponse<Drop[]>, void>({
      query: () => ({
        url: "/drops",
        method: "GET",
      }),
      providesTags: ['Drop'],
    }),

    // GET drop by ID
    getDropById: builder.query<ApiResponse<DropWithPurchases>, string>({
      query: (id) => ({
        url: `/drops/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: 'Drop', id }],
    }),

    // POST create new drop
    createDrop: builder.mutation<ApiResponse<Drop>, CreateDropDto>({
      query: (data) => ({
        url: "/drops",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['Drop'],
    }),

    // PUT update drop
    updateDrop: builder.mutation<ApiResponse<Drop>, { id: string; data: UpdateDropDto }>({
      query: ({ id, data }) => ({
        url: `/drops/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Drop', id }, 'Drop'],
    }),

    // PATCH update drop status
    updateDropStatus: builder.mutation<ApiResponse<Drop>, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/drops/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Drop', id }],
    }),

    // DELETE drop
    deleteDrop: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/drops/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Drop', id }, 'Drop'],
    }),
  }),
});

export const {
  useGetDropsQuery,
  useGetDropByIdQuery,
  useCreateDropMutation,
  useUpdateDropMutation,
  useUpdateDropStatusMutation,
  useDeleteDropMutation,
} = dropApi;
