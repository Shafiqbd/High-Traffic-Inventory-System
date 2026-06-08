import { apiSlice } from "../../store/apiSlice";


export const dropApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDrops: builder.query({
      query: () => ({
        url: "/drop",
        method: "GET",
      }),
    }),

    getDropById: builder.query({
      query: (id) => ({
        url: `/drop/${id}`,
        method: "GET",
      }),
    }),

    // POST - Create new DPS account
    createDrop: builder.mutation({
      query: (newAccount) => ({
        url: "/drop",
        method: "POST",
        body: newAccount,
      }),
    }),

  }),
});

export const {
  useGetDropsQuery,
  useGetDropByIdQuery,
  useCreateDropMutation,
  
} = dropApi;
