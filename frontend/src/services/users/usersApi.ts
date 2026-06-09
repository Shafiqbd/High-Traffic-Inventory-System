import { apiSlice } from "../../store/apiSlice";
export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET all users
    getUsers: builder.query({
      query: () => ({
        url: "/users",
        method: "GET",
      }),
      providesTags: ['User'],
    }),

    // GET users by ID
    getUsersId: builder.query({
      query: (id) => ({
        url: `/users/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),

    // POST create new users
    createUser: builder.mutation({
      query: (data) => ({
        url: "/users",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    loginUser: builder.mutation({
      query: (data) => ({
        url: "/users/login",
        method: "POST",
        body: data,
      }),
    }),

  }),
});

export const {
  useGetUsersQuery,
  useGetUsersIdQuery,
  useCreateUserMutation,
  useLoginUserMutation
} = usersApi;
