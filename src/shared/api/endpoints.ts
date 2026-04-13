// @ts-nocheck
export const endpoints = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    register: "/auth/register",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    me: "/auth/me",
    changePassword: "/auth/change-password",
  },
  patients: {
    root: "/patients",
    search: "/patients/search",
    byId: (id) => `/patients/${id}`,
  },
  doctors: {
    root: "/doctors",
    byId: (id) => `/doctors/${id}`,
    schedule: (id) => `/doctors/${id}/schedule`,
    statistics: (id) => `/doctors/${id}/statistics`,
  },
  appointments: {
    root: "/appointments",
    my: "/appointments/my",
    availableSlots: "/appointments/available-slots",
    cancel: (id) => `/appointments/${id}/cancel`,
  },
  visits: {
    root: "/visits",
    statistics: "/visits/statistics",
    byId: (id) => `/visits/${id}`,
    byPatient: () => `/visits/patient/1`,
    prescriptions: (id) => `/visits/${id}/prescriptions`,
  },
  diagnoses: {
    root: "/diagnoses",
    statistics: "/diagnoses/statistics",
    search: "/diagnoses/search",
    byId: (id) => `/diagnoses/${id}`,
    activeByPatient: (patientId) => `/diagnoses/patient/${patientId}/active`,
  },
  health: "/health",
};

export const omitEmpty = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
