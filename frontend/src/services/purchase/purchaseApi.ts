import { apiSlice } from "../../store/apiSlice";
export const purchaseApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
   
    // POST create new purchase
    createPurchase: builder.mutation({
      query: (data) => ({
        url: "/purchases",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['Drop'],
    }),

  }),
});

export const {
  useCreatePurchaseMutation
} = purchaseApi;
