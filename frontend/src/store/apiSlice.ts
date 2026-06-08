import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiUrl } from "../utils/helper";

const baseQueryWithAuth = async (args: any, api: any, extraOptions: any) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: apiUrl,
  });

  const result = await baseQuery(args, api, extraOptions);

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  refetchOnMountOrArgChange: 2,
  tagTypes: ['Drop', 'Purchase', 'User', 'Reservation'],
  endpoints: () => ({}),
});
