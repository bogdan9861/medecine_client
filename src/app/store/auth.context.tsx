// @ts-nocheck
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi } from "../../features/auth/auth.api";

const AuthContext = createContext(null);

const resolveLinkedEntityId = (entity) => {
  if (!entity) {
    return undefined;
  }

  return (
    entity?.id ??
    entity?.entityId ??
    entity?.userId ??
    entity?.patientId ??
    entity?.doctorId ??
    undefined
  );
};

const resolvePatientId = (user) =>
  user?.patientId ??
  user?.patient?.id ??
  user?.patient?.patientId ??
  user?.profile?.patientId ??
  user?.profile?.patient?.id ??
  user?.data?.patientId ??
  resolveLinkedEntityId(user?.patient);

const resolveDoctorId = (user) =>
  user?.doctorId ??
  user?.doctor?.id ??
  user?.doctor?.doctorId ??
  user?.profile?.doctorId ??
  user?.profile?.doctor?.id ??
  user?.data?.doctorId ??
  resolveLinkedEntityId(user?.doctor);

type AuthProviderProps = {
  children?: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getMe = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const response = await authApi.getMe();
      const me = response.data?.data ?? null;

      console.log("me=====>", me);
      
      setUser(me);
      return me;
    } catch {
      localStorage.removeItem("token");
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (payload) => {
    const response = await authApi.login(payload);
    const token = response.data?.data?.token;
    const currentUser = response.data?.data?.user ?? null;

    if (token) {
      localStorage.setItem("token", token);
    }

    setUser(currentUser);
    return currentUser;
  };

  const register = async (payload) => {
    const response = await authApi.register(payload);
    return response.data?.data;
  };

  const logout = async () => {
    localStorage.removeItem("token");
    try {
      await authApi.logout();
    } catch {
      // ignore logout transport errors and clear local session anyway
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    getMe();
  }, []);

  console.log("user", user);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser: getMe,
      isAuthenticated: Boolean(user),
      isPatient: user?.role === "PATIENT",
      isDoctor: user?.role === "DOCTOR",
      isAdmin: user?.role === "ADMIN",
      currentDoctorId: resolveDoctorId(user),
      currentPatientId: user?.patients?.[0]?.id,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
