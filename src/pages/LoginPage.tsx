// @ts-nocheck
import { LockOutlined, MailOutlined, MedicineBoxOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Modal,
  Row,
  Space,
  Statistic,
  Typography,
} from "antd";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../app/store/auth.context";
import { authApi } from "../features/auth/auth.api";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [messageApi, contextHolder] = message.useMessage();
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onLogin = async (values) => {
    setSubmitting(true);
    try {
      await login(values);
      messageApi.success("Авторизация выполнена");
      navigate(location.state?.from || "/", { replace: true });
    } catch (error) {
      messageApi.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotPassword = async (values) => {
    try {
      await authApi.forgotPassword(values);
      messageApi.success("Инструкция по восстановлению отправлена");
      setForgotOpen(false);
    } catch (error) {
      messageApi.error(error.message);
    }
  };

  const onResetPassword = async (values) => {
    try {
      await authApi.resetPassword(values);
      messageApi.success("Пароль обновлен");
      setResetOpen(false);
    } catch (error) {
      messageApi.error(error.message);
    }
  };

  return (
    <>
      {contextHolder}

      <div className="login-shell">
        <aside className="login-aside">
          <div>
            <Space align="center" size="middle">
              <div className="brand-badge">
                <MedicineBoxOutlined />
              </div>
              <div>
                <Typography.Title level={2} style={{ color: "white", margin: 0 }}>
                  MediFlow
                </Typography.Title>
                <Typography.Text style={{ color: "rgba(255,255,255,0.72)" }}>
                  Регистратура, прием и личный кабинет пациента
                </Typography.Text>
              </div>
            </Space>

            <Typography.Title
              level={1}
              style={{ color: "white", marginTop: 48, marginBottom: 16, maxWidth: 560 }}
            >
              Система приёма пациентов
            </Typography.Title>

            <Typography.Paragraph
              style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, maxWidth: 520 }}
            >
              Для начала работы с системой учета пациентов войдите в аккаунт
            </Typography.Paragraph>
          </div>
        </aside>

        <section className="login-panel">
          <Card className="login-card" style={{ width: "100%", maxWidth: 460 }}>
            <Typography.Title level={3}>Вход в систему</Typography.Title>
            <Typography.Paragraph type="secondary">
              Используйте учетную запись, созданную администратором клиники.
            </Typography.Paragraph>

            <Form layout="vertical" onFinish={onLogin}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, type: "email" }]}
              >
                <Input prefix={<MailOutlined />} placeholder="doctor@clinic.ru" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Пароль"
                rules={[{ required: true, min: 6 }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Введите пароль"
                />
              </Form.Item>

              <Space direction="vertical" style={{ width: "100%" }}>
                <Button type="primary" htmlType="submit" block loading={submitting}>
                  Войти
                </Button>
                <Space>
                  <Button type="link" onClick={() => setForgotOpen(true)}>
                    Забыли пароль?
                  </Button>
                  <Button type="link" onClick={() => setResetOpen(true)}>
                    Сбросить по токену
                  </Button>
                </Space>
              </Space>
            </Form>
          </Card>
        </section>
      </div>

      <Modal
        title="Запрос на восстановление пароля"
        open={forgotOpen}
        footer={null}
        onCancel={() => setForgotOpen(false)}
      >
        <Form layout="vertical" onFinish={onForgotPassword}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Отправить запрос
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Сброс пароля по токену"
        open={resetOpen}
        footer={null}
        onCancel={() => setResetOpen(false)}
      >
        <Form layout="vertical" onFinish={onResetPassword}>
          <Form.Item name="token" label="Токен" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Новый пароль"
            rules={[{ required: true, min: 8 }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Подтверждение"
            rules={[{ required: true, min: 8 }]}
          >
            <Input.Password />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Обновить пароль
          </Button>
        </Form>
      </Modal>
    </>
  );
}
