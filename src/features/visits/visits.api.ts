// @ts-nocheck
import { api } from "../../shared/api/axios";
import { endpoints, omitEmpty } from "../../shared/api/endpoints";

export const visitsApi = {
  list: (params) => api.get(endpoints.visits.root, { params: omitEmpty(params) }),
  getStatistics: (params) =>
    api.get(endpoints.visits.statistics, { params: omitEmpty(params) }),
  getById: (id) => api.get(endpoints.visits.byId(id)),
  byPatient: () => api.get(endpoints.visits.byPatient()),
  create: (payload) => api.post(endpoints.visits.root, payload),
  addPrescription: (id, payload) =>
    api.post(endpoints.visits.prescriptions(id), payload),
  update: (id, payload) => api.put(endpoints.visits.byId(id), payload),
  remove: (id) => api.delete(endpoints.visits.byId(id)),
};
