// @ts-nocheck
import {
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useAuth } from "../app/store/auth.context";
import { doctorsApi } from "../features/doctors/doctors.api";
import Table from "../shared/ui/Table";

const canManageDoctors = (role) => role === "ADMIN";

const normalizeSchedule = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.schedule)) {
    return payload.schedule;
  }

  if (Array.isArray(payload?.days)) {
    return payload.days;
  }

  return [];
};

export default function DoctorsPage() {
  const { user } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({
    search: "",
    specialization: undefined,
    isOnVacation: undefined,
  });
  const [modalState, setModalState] = useState({ open: false, doctor: null });
  const [scheduleState, setScheduleState] = useState({ open: false, items: [], doctor: null });
  const [statisticsState, setStatisticsState] = useState({ open: false, data: null, doctor: null });

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const response = await doctorsApi.list({
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      });

      setItems(response.data?.data ?? []);
      setPagination((prev) => ({
        ...prev,
        total: response.data?.pagination?.total ?? response.data?.data?.length ?? 0,
      }));
    } catch (error) {
      messageApi.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadDoctors();
  }, [pagination.current, pagination.pageSize, filters.search, filters.specialization, filters.isOnVacation]);

  const openModal = (doctor = null) => {
    form.setFieldsValue({
      ...doctor,
      isOnVacation: Boolean(doctor?.isOnVacation),
    });
    setModalState({ open: true, doctor });
  };

  const closeModal = () => {
    setModalState({ open: false, doctor: null });
    form.resetFields();
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      if (modalState.doctor?.id) {
        await doctorsApi.update(modalState.doctor.id, values);
        messageApi.success("Врач обновлен");
      } else {
        await doctorsApi.create(values);
        messageApi.success("Врач создан");
      }

      closeModal();
      loadDoctors();
    } catch (error) {
      messageApi.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    try {
      await doctorsApi.remove(id);
      messageApi.success("Врач деактивирован");
      loadDoctors();
    } catch (error) {
      messageApi.error(error.message);
    }
  };

  const showSchedule = async (doctor) => {
    try {
      const response = await doctorsApi.getSchedule(doctor.id);
      setScheduleState({
        open: true,
        doctor,
        items: normalizeSchedule(response.data?.data),
      });
    } catch (error) {
      messageApi.error(error.message);
    }
  };

  const showStatistics = async (doctor) => {
    try {
      const response = await doctorsApi.getStatistics(doctor.id);
      setStatisticsState({ open: true, doctor, data: response.data?.data ?? {} });
    } catch (error) {
      messageApi.error(error.message);
    }
  };

  return (
    <div className="page-stack">
      {contextHolder}

      <Card
        className="page-card"
        title="Врачи"
        extra={
          canManageDoctors(user?.role) ? (
            <Button type="primary" onClick={() => openModal()}>
              Новый врач
            </Button>
          ) : null
        }
      >
        <div className="filters-grid" style={{ marginBottom: 16 }}>
          <Input
            placeholder="Поиск по email или специализации"
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, search: event.target.value }))
            }
          />

          <Input
            placeholder="Специализация"
            value={filters.specialization}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, specialization: event.target.value || undefined }))
            }
          />

          <Select
            allowClear
            placeholder="Отпуск"
            value={filters.isOnVacation}
            options={[
              { value: true, label: "В отпуске" },
              { value: false, label: "Работает" },
            ]}
            onChange={(isOnVacation) => setFilters((prev) => ({ ...prev, isOnVacation }))}
          />
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (page, pageSize) =>
              setPagination((prev) => ({ ...prev, current: page, pageSize })),
          }}
          columns={[
            {
              title: "Врач",
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>
                    {[record.lastName, record.firstName, record.middleName]
                      .filter(Boolean)
                      .join(" ") || record.email}
                  </Typography.Text>
                  <Typography.Text type="secondary">{record.email}</Typography.Text>
                </Space>
              ),
            },
            { title: "Специализация", dataIndex: "specialization" },
            { title: "Телефон", dataIndex: "phone" },
            {
              title: "Статус",
              render: (_, record) => (
                <Space wrap>
                  <Tag color={record.isOnVacation ? "orange" : "green"}>
                    {record.isOnVacation ? "В отпуске" : "Доступен"}
                  </Tag>
                  {record.isActive === false ? <Tag>Неактивен</Tag> : null}
                </Space>
              ),
            },
            {
              title: "Действия",
              width: 320,
              render: (_, record) => (
                <Space wrap>
                  <Button size="small" onClick={() => showSchedule(record)}>
                    Расписание
                  </Button>
                  <Button size="small" onClick={() => showStatistics(record)}>
                    Статистика
                  </Button>
                  {canManageDoctors(user?.role) ? (
                    <Button size="small" onClick={() => openModal(record)}>
                      Изменить
                    </Button>
                  ) : null}
                  {canManageDoctors(user?.role) ? (
                    <Popconfirm
                      title="Деактивировать врача?"
                      onConfirm={() => onDelete(record.id)}
                    >
                      <Button size="small" danger>
                        Удалить
                      </Button>
                    </Popconfirm>
                  ) : null}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={modalState.doctor ? "Редактирование врача" : "Создание врача"}
        open={modalState.open}
        footer={null}
        onCancel={closeModal}
      >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="firstName" label="Имя" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lastName" label="Фамилия" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="middleName" label="Отчество">
            <Input />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Телефон" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="specialization"
            label="Специализация"
            rules={[{ required: true }]}
          >
            <Input placeholder="Терапевт" />
          </Form.Item>

          <Form.Item name="isOnVacation" label="В отпуске" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={saving}>
            Сохранить
          </Button>
        </Form>
      </Modal>

      <Drawer
        title={`Расписание: ${scheduleState.doctor?.email || ""}`}
        open={scheduleState.open}
        width={480}
        onClose={() => setScheduleState({ open: false, items: [], doctor: null })}
      >
        {scheduleState.items.length ? (
          <Descriptions bordered column={1}>
            {scheduleState.items.map((item, index) => (
              <Descriptions.Item
                key={`${item.day || item.date || index}`}
                label={item.day || item.date || `День ${index + 1}`}
              >
                {item.startTime || item.start || item.from || "—"} -{" "}
                {item.endTime || item.end || item.to || "—"}
              </Descriptions.Item>
            ))}
          </Descriptions>
        ) : (
          <Typography.Text type="secondary">Данные расписания не получены</Typography.Text>
        )}
      </Drawer>

      <Drawer
        title={`Статистика: ${statisticsState.doctor?.email || ""}`}
        open={statisticsState.open}
        width={520}
        onClose={() => setStatisticsState({ open: false, data: null, doctor: null })}
      >
        <Descriptions bordered column={1}>
          {Object.entries(statisticsState.data || {}).map(([key, value]) => (
            <Descriptions.Item key={key} label={key}>
              {typeof value === "object" ? JSON.stringify(value) : String(value)}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Drawer>
    </div>
  );
}
