// @ts-nocheck
import { ReactNode } from "react";
import { App as AntApp, ConfigProvider } from "antd";
import { AuthProvider } from "../store/auth.context";

type AppProvidersProps = {
  children?: ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#0f766e",
          borderRadius: 14,
          colorBgLayout: "#f4f7f6",
          colorBgContainer: "#ffffff",
        },
      }}
    >
      <AntApp>
        <AuthProvider>{children}</AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}
