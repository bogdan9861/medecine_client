// @ts-nocheck
import { api } from "../../shared/api/axios";
import { endpoints, omitEmpty } from "../../shared/api/endpoints";

export const doctorsApi = {
  list: (params) => api.get(endpoints.doctors.root, { params: omitEmpty(params) }),
  getById: (id) => api.get(endpoints.doctors.byId(id)),
  getSchedule: (id) => api.get(endpoints.doctors.schedule(id)),
  getStatistics: (id) => api.get(endpoints.doctors.statistics(id)),
  create: (payload) => api.post(endpoints.doctors.root, payload),
  update: (id, payload) => api.put(endpoints.doctors.byId(id), payload),
  remove: (id) => api.delete(endpoints.doctors.byId(id)),
};
