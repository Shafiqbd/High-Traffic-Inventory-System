import { apiSlice } from "../../store/apiSlice";
export const reservationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET all reservations
    getReservations: builder.query({
      query: () => ({
        url: "/reservations",
        method: "GET",
      }),
      providesTags: ['Reservation'],
    }),

    // GET reservations by ID
    getReservationById: builder.query({
      query: (id) => ({
        url: `/reservations/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: 'Reservation', id }],
    }),

    // POST create new reservations
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
