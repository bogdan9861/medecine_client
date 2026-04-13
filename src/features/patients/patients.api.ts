// @ts-nocheck
import { api } from "../../shared/api/axios";
import { endpoints, omitEmpty } from "../../shared/api/endpoints";

export const patientsApi = {
  list: (params) => api.get(endpoints.patients.root, { params: omitEmpty(params) }),
  search: (params) => api.get(endpoints.patients.search, { params: omitEmpty(params) }),
  getById: (id) => api.get(endpoints.patients.byId(id)),
  create: (payload) => api.post(endpoints.patients.root, payload),
  update: (id, payload) => api.put(endpoints.patients.byId(id), payload),
  archive: (id) => api.delete(endpoints.patients.byId(id)),
};
