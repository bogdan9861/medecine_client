// @ts-nocheck
import {
  TeamOutlined,
  UserSwitchOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  DashboardOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Layout, Menu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../app/store/auth.context";

const items = [
  { key: "/", icon: <DashboardOutlined />, label: "Дашборд" },
  { key: "/patients", icon: <TeamOutlined />, label: "Пациенты" },
  { key: "/doctors", icon: <UserSwitchOutlined />, label: "Врачи" },
  { key: "/appointments", icon: <CalendarOutlined />, label: "Записи" },
  { key: "/visits", icon: <MedicineBoxOutlined />, label: "Визиты" },
  { key: "/diagnoses", icon: <FileTextOutlined />, label: "Диагнозы" },
  {
    key: "/registrators",
    icon: <SafetyCertificateOutlined />,
    label: "Регистраторы",
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const visibleItems = items.filter((item) => {
    if (
      user?.role === "PATIENT" &&
      ["/", "/patients", "/registrators"].includes(item.key)
    ) {
      return false;
    }

    if (item.key === "/registrators" && user?.role !== "ADMIN") {
      return false;
    }

    return true;
  });

  const selectedKey =
    visibleItems.find((item) =>
      item.key === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.key)
    )?.key ??
    visibleItems[0]?.key ??
    "/";

  return (
    <Layout.Sider
      breakpoint="lg"
      collapsedWidth="0"
      width={260}
      theme="light"
      style={{
        borderRight: "1px solid #e8eeec",
        background:
          "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(240,248,246,1) 100%)",
      }}
    >
      <div className="brand-block">
        <div className="brand-badge">M</div>
        <div>
          <div className="brand-title">MediFlow</div>
          <div className="brand-subtitle">Регистратура и прием</div>
        </div>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={visibleItems}
        onClick={({ key }) => navigate(key)}
        style={{ borderInlineEnd: 0, background: "transparent" }}
      />
    </Layout.Sider>
  );
}
