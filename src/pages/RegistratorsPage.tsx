// @ts-nocheck
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Result,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import { useState } from "react";
import { useAuth } from "../app/store/auth.context";

export default function RegistratorsPage() {
  const { user, register } = useAuth();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);

  if (user?.role !== "ADMIN") {
    return (
      <Result
        status="403"
        title="Доступ запрещен"
        subTitle="Только администратор может управлять регистраторами."
      />
    );
  }

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await register({
        ...values,
        role: "REGISTRATOR",
      });
      messageApi.success("Регистратор создан");
      form.resetFields();
    } catch (error) {
      messageApi.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      {contextHolder}

      <Card className="page-card" title="Регистраторы">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Alert
            type="info"
            showIcon
            message="Добавление нового регистратора"
            description="Заполните поля ниже для создания нового регистратора в системе"
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            style={{ maxWidth: 640 }}
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Form.Item
                name="firstName"
                label="Имя"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="lastName"
                label="Фамилия"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Телефон"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, type: "email" }]}
              >
                <Input />
              </Form.Item>

              <Form.Item name="role" label="Роль" initialValue="REGISTRATOR">
                <Select
                  disabled
                  options={[{ value: "REGISTRATOR", label: "REGISTRATOR" }]}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Пароль"
                rules={[{ required: true, min: 8 }]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Подтверждение пароля"
                dependencies={["password"]}
                rules={[
                  { required: true },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || value === getFieldValue("password")) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Пароли должны совпадать")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={submitting}>
                Создать регистратора
              </Button>
            </Space>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
