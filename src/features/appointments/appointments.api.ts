// @ts-nocheck
import { api } from "../../shared/api/axios";
import { endpoints, omitEmpty } from "../../shared/api/endpoints";

export const appointmentsApi = {
  list: (params) =>
    api.get(endpoints.appointments.root, { params: omitEmpty(params) }),
  my: (params) => api.get(endpoints.appointments.my, { params: omitEmpty(params) }),
  getAvailableSlots: (params) =>
    api.get(endpoints.appointments.availableSlots, {
      params: omitEmpty(params),
    }),
  create: (payload) => api.post(endpoints.appointments.root, payload),
  cancel: (id) => api.put(endpoints.appointments.cancel(id)),
};
