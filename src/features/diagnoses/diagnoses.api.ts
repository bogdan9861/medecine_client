// @ts-nocheck
import { api } from "../../shared/api/axios";
import { endpoints, omitEmpty } from "../../shared/api/endpoints";

export const diagnosesApi = {
  list: (params) => api.get(endpoints.diagnoses.root, { params: omitEmpty(params) }),
  getStatistics: (params) =>
    api.get(endpoints.diagnoses.statistics, { params: omitEmpty(params) }),
  search: (params) => api.get(endpoints.diagnoses.search, { params: omitEmpty(params) }),
  getById: (id) => api.get(endpoints.diagnoses.byId(id)),
  activeByPatient: (patientId) => api.get(endpoints.diagnoses.activeByPatient(patientId)),
  create: (payload) => api.post(endpoints.diagnoses.root, payload),
  update: (id, payload) => api.put(endpoints.diagnoses.byId(id), payload),
  remove: (id) => api.delete(endpoints.diagnoses.byId(id)),
};
