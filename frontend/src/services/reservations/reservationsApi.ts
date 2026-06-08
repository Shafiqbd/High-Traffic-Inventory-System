import { apiSlice } from "../../store/apiSlice";
export const reservationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET all users
    getReservations: builder.query({
      query: () => ({
        url: "/reservations",
        method: "GET",
      }),
      providesTags: ['Reservation'],
    }),

    // GET users by ID
    getReservationById: builder.query({
      query: (id) => ({
        url: `/reservations/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: 'Reservation', id }],
    }),

    // POST create new users
    createReservation: builder.mutation({
      query: (data) => ({
        url: "/reservations",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['Reservation'],
    }),

  }),
});

export const {
  useGetReservationsQuery,
  useGetReservationByIdQuery,
  useCreateReservationMutation
  
} = reservationsApi;
