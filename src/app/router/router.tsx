// @ts-nocheck
import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../../pages/LoginPage";
import DashboardPage from "../../pages/DashboardPage";
import PatientsPage from "../../pages/PatientsPage";
import DoctorsPage from "../../pages/DoctorsPage";
import AppointmentsPage from "../../pages/AppointmentsPage";
import VisitsPage from "../../pages/VisitsPage";
import DiagnosesPage from "../../pages/DiagnosesPage";
import RegistratorsPage from "../../pages/RegistratorsPage";
import NotFoundPage from "../../pages/NotFoundPage";
import PrivateRoute from "./PrivateRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <PrivateRoute />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "patients", element: <PatientsPage /> },
      { path: "doctors", element: <DoctorsPage /> },
      { path: "appointments", element: <AppointmentsPage /> },
      { path: "visits", element: <VisitsPage /> },
      { path: "diagnoses", element: <DiagnosesPage /> },
      { path: "registrators", element: <RegistratorsPage /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
