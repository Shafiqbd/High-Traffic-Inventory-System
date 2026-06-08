import { apiSlice } from "../../store/apiSlice";
import type { Drop, DropWithPurchases, CreateDropDto, ApiResponse } from "../../types/drop.types";

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

  }),
});

export const {
  useGetDropsQuery,
  useGetDropByIdQuery,
  useCreateDropMutation,
} = dropApi;
