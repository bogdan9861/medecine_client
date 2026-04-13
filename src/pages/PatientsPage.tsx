// @ts-nocheck
import {
  Button,
  Card,
  Col,
  DatePicker,
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
import dayjs from "dayjs";
import { Navigate } from "react-router-dom";
import { useAuth } from "../app/store/auth.context";
import { patientsApi } from "../features/patients/patients.api";
import Table from "../shared/ui/Table";

const { RangePicker } = DatePicker;

const canManagePatients = (role) =>
  ["ADMIN", "REGISTRATOR", "DOCTOR"].includes(role);
const canCreatePatients = (role) => ["ADMIN", "REGISTRATOR"].includes(role);
const canArchivePatients = (role) => role === "ADMIN";

export default function PatientsPage() {
  const { user, isPatient } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    gender: undefined,
    isArchived: false,
    fromDate: undefined,
    toDate: undefined,
  });
  const [modalState, setModalState] = useState({ open: false, patient: null });

  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await patientsApi.list({
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      });

      setItems(response.data?.data ?? []);
      setPagination((prev) => ({
        ...prev,
        total:
          response.data?.pagination?.total ?? response.data?.data?.length ?? 0,
      }));
    } catch (error) {
      messageApi.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadPatients();
  }, [
    pagination.current,
    pagination.pageSize,
    filters.search,
    filters.gender,
    filters.isArchived,
    filters.fromDate,
    filters.toDate,
  ]);

  const openCreate = () => {
    form.resetFields();
    setModalState({ open: true, patient: null });
  };

  const openEdit = (patient) => {
    form.setFieldsValue({
      ...patient,
      birthDate: patient.birthDate ? dayjs(patient.birthDate) : null,
    });
    setModalState({ open: true, patient });
  };

  const closeModal = () => {
    setModalState({ open: false, patient: null });
    form.resetFields();
  };

  const onSubmit = async (values) => {
    setSaving(true);
    const payload = {
      ...values,
      birthDate: values.birthDate
        ? values.birthDate.format("YYYY-MM-DD")
        : undefined,
    };

    try {
      if (modalState.patient?.id) {
        await patientsApi.update(modalState.patient.id, payload);
        messageApi.success("Данные пациента обновлены");
      } else {
        await patientsApi.create(payload);
        messageApi.success("Пациент создан");
      }

      closeModal();
      loadPatients();
    } catch (error) {
      messageApi.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async (id) => {
    try {
      await patientsApi.archive(id);
      messageApi.success("Пациент архивирован");
      loadPatients();
    } catch (error) {
      messageApi.error(error.message);
    }
  };

  if (isPatient) {
    return <Navigate to="/doctors" replace />;
  }

  return (
    <div className="page-stack">
      {contextHolder}

      <Card
        className="page-card"
        title="Пациенты"
        extra={
          canCreatePatients(user?.role) ? (
            <Button type="primary" onClick={openCreate}>
              Новый пациент
            </Button>
          ) : null
        }
      >
        <div className="filters-grid" style={{ marginBottom: 16 }}>
          <Input
            placeholder="Поиск по ФИО, email, телефону"
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                search: event.target.value,
              }))
            }
          />

          <Select
            allowClear
            placeholder="Пол"
            value={filters.gender}
            options={[
              { value: "MALE", label: "Мужской" },
              { value: "FEMALE", label: "Женский" },
            ]}
            onChange={(gender) => setFilters((prev) => ({ ...prev, gender }))}
          />

          <RangePicker
            format="DD.MM.YYYY"
            onChange={(dates) =>
              setFilters((prev) => ({
                ...prev,
                fromDate: dates?.[0]?.format("YYYY-MM-DD"),
                toDate: dates?.[1]?.format("YYYY-MM-DD"),
              }))
            }
          />

          <Space>
            <Typography.Text>Архив</Typography.Text>
            <Switch
              checked={filters.isArchived}
              onChange={(isArchived) =>
                setFilters((prev) => ({ ...prev, isArchived }))
              }
            />
          </Space>
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
              title: "Пациент",
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>
                    {[record.lastName, record.firstName, record.middleName]
                      .filter(Boolean)
                      .join(" ")}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    {record.email || "Без email"}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "Дата рождения",
              dataIndex: "birthDate",
              render: (value) =>
                value ? dayjs(value).format("DD.MM.YYYY") : "—",
            },
            {
              title: "Пол",
              dataIndex: "gender",
              render: (value) => (
                <Tag color={value === "MALE" ? "blue" : "magenta"}>
                  {value === "MALE" ? "Мужской" : "Женский"}
                </Tag>
              ),
            },
            { title: "Телефон", dataIndex: "phone" },
            { title: "СНИЛС", dataIndex: "snils" },
            {
              title: "Статус",
              render: (_, record) => (
                <Tag color={record.isArchived ? "default" : "green"}>
                  {record.isArchived ? "Архив" : "Активен"}
                </Tag>
              ),
            },
            {
              title: "Действия",
              fixed: "right",
              width: 180,
              render: (_, record) => (
                <Space wrap>
                  {canManagePatients(user?.role) ? (
                    <Button size="small" onClick={() => openEdit(record)}>
                      Изменить
                    </Button>
                  ) : null}
                  {canArchivePatients(user?.role) ? (
                    <Popconfirm
                      title="Архивировать пациента?"
                      onConfirm={() => onArchive(record.id)}
                    >
                      <Button size="small" danger>
                        Архив
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
        title={
          modalState.patient ? "Редактирование пациента" : "Создание пациента"
        }
        open={modalState.open}
        footer={null}
        onCancel={closeModal}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="Имя"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Фамилия"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="middleName" label="Отчество">
            <Input />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="birthDate"
                label="Дата рождения"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="Пол" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: "MALE", label: "Мужской" },
                    { value: "FEMALE", label: "Женский" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Телефон"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="snils" label="СНИЛС">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="policyNumber" label="Полис ОМС">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="password" label="Пароль">
            <Input />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={saving}>
            Сохранить
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
