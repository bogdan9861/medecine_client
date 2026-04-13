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
  Statistic,
  Switch,
} from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useAuth } from "../app/store/auth.context";
import { appointmentsApi } from "../features/appointments/appointments.api";
import { doctorsApi } from "../features/doctors/doctors.api";
import { patientsApi } from "../features/patients/patients.api";
import { visitsApi } from "../features/visits/visits.api";
import Table from "../shared/ui/Table";

const { RangePicker } = DatePicker;

const canCreateVisits = (role) =>
  ["ADMIN", "DOCTOR", "REGISTRATOR"].includes(role);
const canEditVisits = (role) => ["ADMIN", "DOCTOR"].includes(role);
const canDeleteVisits = (role) => role === "ADMIN";

export default function VisitsPage() {
  const { user, isPatient, currentPatientId, currentDoctorId } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [statistics, setStatistics] = useState({
    totalVisits: 0,
    sickLeaves: 0,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    patientId: isPatient ? currentPatientId : "",
    doctorId: user?.role === "DOCTOR" ? currentDoctorId : "",
    hasSickLeave: "",
    fromDate: "",
    toDate: "",
  });
  const [modalState, setModalState] = useState({ open: false, visit: null });

  const loadLookups = async () => {
    try {
      const requests = [doctorsApi.list({ page: 1, limit: 100 })];

      if (!isPatient) {
        requests.unshift(
          patientsApi.list({ page: 1, limit: 100, isArchived: false })
        );
        requests.push(
          appointmentsApi.list({
            page: 1,
            limit: 100,
            ...(user?.role === "DOCTOR" ? { doctorId: currentDoctorId } : {}),
          })
        );
      }

      const responses = await Promise.all(requests);
      const doctorsResponse = responses[isPatient ? 0 : 1];

      setDoctors(doctorsResponse.data?.data ?? []);

      if (!isPatient) {
        setPatients(responses[0].data?.data ?? []);
        setAppointments(responses[2].data?.data ?? []);
      }
    } catch (error) {
      messageApi.error(error.message);
    }
  };

  const loadStatistics = async () => {
    if (isPatient) {
      setStatistics({ totalVisits: 0, sickLeaves: 0 });
      return;
    }

    try {
      const response = await visitsApi.getStatistics({ period: "month" });
      setStatistics(response.data?.data ?? { totalVisits: 0, sickLeaves: 0 });
    } catch {
      setStatistics({ totalVisits: 0, sickLeaves: 0 });
    }
  };

  const loadVisits = async () => {
    setLoading(true);
    try {
      const response = isPatient
        ? await visitsApi.byPatient(user?.id)
        : await visitsApi.list({
            page: pagination.current,
            limit: pagination.pageSize,
            ...filters,
            doctorId:
              user?.role === "DOCTOR" ? currentDoctorId : filters.doctorId,
          });

      const data = response.data?.data ?? response.data ?? [];

      setItems(data);
      setPagination((prev) => ({
        ...prev,
        total: response.data?.pagination?.total ?? data.length ?? 0,
      }));
    } catch (error) {
      messageApi.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadLookups();
    loadStatistics();
  }, [isPatient, currentDoctorId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadVisits();
  }, [
    pagination.current,
    pagination.pageSize,
    filters.patientId,
    filters.doctorId,
    filters.hasSickLeave,
    filters.fromDate,
    filters.toDate,
    isPatient,
    currentPatientId,
    currentDoctorId,
    user?.role,
  ]);

  const openModal = (visit = null) => {
    form.setFieldsValue({
      ...visit,
      sickLeaveIssued: Boolean(visit?.sickLeaveIssued),
    });
    setModalState({ open: true, visit });
  };

  const closeModal = () => {
    setModalState({ open: false, visit: null });
    form.resetFields();
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      if (modalState.visit?.id) {
        await visitsApi.update(modalState.visit.id, values);
        messageApi.success("Визит обновлен");
      } else {
        await visitsApi.create(values);
        messageApi.success("Визит создан");
      }

      closeModal();
      loadVisits();
      loadStatistics();
    } catch (error) {
      messageApi.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    try {
      await visitsApi.remove(id);
      messageApi.success("Визит удален");
      loadVisits();
      loadStatistics();
    } catch (error) {
      messageApi.error(error.message);
    }
  };

  return (
    <div className="page-stack">
      {contextHolder}

      {!isPatient ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card className="page-card">
              <Statistic
                title="Визиты за месяц"
                value={statistics.totalVisits || 0}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card className="page-card">
              <Statistic
                title="Выдано больничных"
                value={statistics.sickLeaves || 0}
              />
            </Card>
          </Col>
        </Row>
      ) : null}

      <Card
        className="page-card"
        title={isPatient ? "Мои визиты" : "Визиты"}
        extra={
          !isPatient && canCreateVisits(user?.role) ? (
            <Button type="primary" onClick={() => openModal()}>
              Новый визит
            </Button>
          ) : null
        }
      >
        <div className="filters-grid" style={{ marginBottom: 16 }}>
          {!isPatient ? (
            <Select
              allowClear
              showSearch
              placeholder="Пациент"
              optionFilterProp="label"
              options={patients.map((patient) => ({
                value: patient.id,
                label: `${patient.lastName || ""} ${
                  patient.firstName || ""
                }`.trim(),
              }))}
              onChange={(patientId) =>
                setFilters((prev) => ({ ...prev, patientId }))
              }
            />
          ) : (
            <Card
              size="small"
              style={{ background: "#f8fffe", borderColor: "#ccece6" }}
            >
              Показаны только ваши визиты
            </Card>
          )}

          <Select
            allowClear
            showSearch
            placeholder="Врач"
            optionFilterProp="label"
            options={doctors.map((doctor) => ({
              value: doctor.id,
              label:
                `${doctor.lastName || ""} ${doctor.firstName || ""}`.trim() ||
                doctor.email,
            }))}
            onChange={(doctorId) =>
              setFilters((prev) => ({ ...prev, doctorId }))
            }
          />

          <Select
            allowClear
            placeholder="Больничный"
            options={[
              { value: true, label: "Есть больничный" },
              { value: false, label: "Без больничного" },
            ]}
            onChange={(hasSickLeave) =>
              setFilters((prev) => ({ ...prev, hasSickLeave }))
            }
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
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: !isPatient,
            onChange: (page, pageSize) =>
              setPagination((prev) => ({ ...prev, current: page, pageSize })),
          }}
          columns={[
            {
              title: "Дата",
              render: (_, record) =>
                record.createdAt
                  ? dayjs(record.createdAt).format("DD.MM.YYYY HH:mm")
                  : record.visitDate
                  ? dayjs(record.visitDate).format("DD.MM.YYYY HH:mm")
                  : "—",
            },
            {
              title: "Пациент",
              hidden: isPatient,
              render: (_, record) =>
                record.patientName ||
                [record.patient?.lastName, record.patient?.firstName]
                  .filter(Boolean)
                  .join(" ") ||
                `#${record.patientId}`,
            },
            {
              title: "Врач",
              render: (_, record) =>
                record.doctorName ||
                record.doctor?.email ||
                `#${record.doctorId}`,
            },
            { title: "Диагноз", dataIndex: "diagnosis" },
            { title: "МКБ-10", dataIndex: "icd10Code" },
            {
              title: "Больничный",
              render: (_, record) => (record.sickLeaveIssued ? "Да" : "Нет"),
            },
            {
              title: "Действия",
              hidden: isPatient,
              width: 220,
              render: (_, record) => (
                <Space wrap>
                  {canEditVisits(user?.role) ? (
                    <Button size="small" onClick={() => openModal(record)}>
                      Изменить
                    </Button>
                  ) : null}
                  {canDeleteVisits(user?.role) ? (
                    <Popconfirm
                      title="Удалить визит?"
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
          ].filter((column) => !column.hidden)}
        />
      </Card>

      {!isPatient ? (
        <Modal
          title={modalState.visit ? "Редактирование визита" : "Создание визита"}
          open={modalState.open}
          footer={null}
          onCancel={closeModal}
          width={760}
        >
          <Form form={form} layout="vertical" onFinish={onSubmit}>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="patientId"
                  label="Пациент"
                  rules={[{ required: true }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={patients.map((patient) => ({
                      value: patient.id,
                      label: `${patient.lastName || ""} ${
                        patient.firstName || ""
                      }`.trim(),
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="doctorId"
                  label="Врач"
                  rules={[{ required: true }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={doctors.map((doctor) => ({
                      value: doctor.id,
                      label:
                        `${doctor.user.lastName || ""} ${
                          doctor.specialization || ""
                        }`.trim() || doctor.email,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="appointmentId" label="Связанная запись">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={appointments.map((appointment) => ({
                  value: appointment.id,
                  label: `${dayjs(appointment.appointmentTime).format(
                    "DD.MM.YYYY HH:mm"
                  )} / ${appointment.patient.firstName || appointment.patientId}`,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="complaints"
              label="Жалобы"
              rules={[{ required: true }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item name="anamnesis" label="Анамнез">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="diagnosis"
                  label="Диагноз"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="icd10Code"
                  label="Код МКБ-10"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="recommendations" label="Рекомендации">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item
              name="sickLeaveIssued"
              label="Выдан больничный"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Button type="primary" htmlType="submit" block loading={saving}>
              Сохранить визит
            </Button>
          </Form>
        </Modal>
      ) : null}
    </div>
  );
}
