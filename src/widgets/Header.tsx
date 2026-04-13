// @ts-nocheck
import { LogoutOutlined } from "@ant-design/icons";
import { Avatar, Button, Flex, Layout, Space, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/store/auth.context";

const roleColors = {
  ADMIN: "red",
  DOCTOR: "green",
  REGISTRATOR: "blue",
  PATIENT: "gold",
};

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    navigate("/login", { replace: true });
    await logout();
  };

  return (
    <Layout.Header className="page-header">
      <Flex justify="space-between" align="center" gap={16}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Клиническая информационная система
          </Typography.Title>
          <Typography.Text type="secondary">
            Управление пациентами, записями и медицинскими визитами
          </Typography.Text>
        </div>

        <Space size="middle">
          <Space size="small">
            <Avatar style={{ backgroundColor: "#0f766e" }}>
              {(user?.firstName || user?.email || "U")
                .slice(0, 1)
                .toUpperCase()}
            </Avatar>
            <div>
              <Typography.Text strong>
                {user?.email || "Пользователь"}
              </Typography.Text>
              <br />
              <Tag
                color={roleColors[user?.role] || "default"}
                style={{ marginInlineEnd: 0 }}
              >
                {user?.role || "USER"}
              </Tag>
            </div>
          </Space>

          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            Выйти
          </Button>
        </Space>
      </Flex>
    </Layout.Header>
  );
}
