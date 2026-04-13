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
  Tag,
} from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useAuth } from "../app/store/auth.context";
import { diagnosesApi } from "../features/diagnoses/diagnoses.api";
import { doctorsApi } from "../features/doctors/doctors.api";
import { patientsApi } from "../features/patients/patients.api";
import { visitsApi } from "../features/visits/visits.api";
import Table from "../shared/ui/Table";

const { RangePicker } = DatePicker;

const canEditDiagnoses = (role) => ["ADMIN", "DOCTOR"].includes(role);
const canDeleteDiagnoses = (role) => role === "ADMIN";

export default function DiagnosesPage() {
  const { user, isPatient, currentPatientId, currentDoctorId } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [visits, setVisits] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    patientId: isPatient ? currentPatientId : undefined,
    isActive: undefined,
    icd10Code: "",
    fromDate: undefined,
    toDate: undefined,
  });
  const [modalState, setModalState] = useState({
    open: false,
    diagnosis: null,
  });

  const loadLookups = async () => {
    try {
      const requests = [doctorsApi.list({ page: 1, limit: 100 })];

      if (!isPatient) {
        requests.unshift(
          patientsApi.list({ page: 1, limit: 100, isArchived: false })
        );
      }

      requests.push(
        isPatient
          ? visitsApi.byPatient(currentPatientId)
          : visitsApi.list({
              page: 1,
              limit: 100,
              ...(user?.role === "DOCTOR" ? { doctorId: currentDoctorId } : {}),
            })
      );

      const responses = await Promise.all(requests);
      const doctorsResponse = responses[isPatient ? 0 : 1];
      const visitsResponse = responses[responses.length - 1];

      setDoctors(doctorsResponse.data?.data ?? []);
      setVisits(visitsResponse.data?.data ?? visitsResponse.data ?? []);

      if (!isPatient) {
        setPatients(responses[0].data?.data ?? []);
      }
    } catch (error) {
      messageApi.error(error.message);
    }
  };

  const loadStatistics = async () => {
    if (isPatient) {
      setStatistics({});
      return;
    }

    try {
      const response = await diagnosesApi.getStatistics({ period: "month" });
      setStatistics(response.data?.data ?? {});
    } catch {
      setStatistics({});
    }
  };

  const loadDiagnoses = async () => {
    setLoading(true);
    try {
      const query = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
        patientId: isPatient ? currentPatientId : filters.patientId,
      };

      const response =
        user?.role === "PATIENT"
          ? await diagnosesApi.activeByPatient(1)
          : await diagnosesApi.list(query);

      const data = response.data?.data ?? [];
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
  }, [isPatient, currentPatientId, currentDoctorId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadDiagnoses();
  }, [
    pagination.current,
    pagination.pageSize,
    filters.patientId,
    filters.isActive,
    filters.icd10Code,
    filters.fromDate,
    filters.toDate,
    isPatient,
    currentPatientId,
  ]);

  const openModal = (diagnosis = null) => {
    form.setFieldsValue({
      ...diagnosis,
      isPrimary: Boolean(diagnosis?.isPrimary),
      isActive: diagnosis?.isActive !== false,
    });
    setModalState({ open: true, diagnosis });
  };

  const closeModal = () => {
    setModalState({ open: false, diagnosis: null });
    form.resetFields();
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      if (modalState.diagnosis?.id) {
        await diagnosesApi.update(modalState.diagnosis.id, values);
        messageApi.success("Диагноз обновлен");
      } else {
        await diagnosesApi.create(values);
        messageApi.success("Диагноз добавлен");
      }

      closeModal();
      loadDiagnoses();
      loadStatistics();
    } catch (error) {
      messageApi.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    try {
      await diagnosesApi.remove(id);
      messageApi.success("Диагноз удален");
      loadDiagnoses();
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
                title="Топ диагнозов"
                value={statistics.topDiagnoses?.length || 0}
                suffix="позиций"
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card className="page-card">
              <Statistic title="Период" value={statistics.period || "month"} />
            </Card>
          </Col>
        </Row>
      ) : null}

      <Card
        className="page-card"
        title={isPatient ? "Мои диагнозы" : "Диагнозы"}
        extra={
          !isPatient && canEditDiagnoses(user?.role) ? (
            <Button type="primary" onClick={() => openModal()}>
              Новый диагноз
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
              Показаны только ваши диагнозы
            </Card>
          )}

          <Select
            allowClear
            placeholder="Активность"
            options={[
              { value: true, label: "Активные" },
              { value: false, label: "Неактивные" },
            ]}
            onChange={(isActive) =>
              setFilters((prev) => ({ ...prev, isActive }))
            }
          />

          <Input
            placeholder="Код МКБ-10"
            value={filters.icd10Code}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, icd10Code: event.target.value }))
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
            showSizeChanger: true,
            onChange: (page, pageSize) =>
              setPagination((prev) => ({ ...prev, current: page, pageSize })),
          }}
          columns={[
            { title: "МКБ-10", dataIndex: "icd10Code" },
            { title: "Название", dataIndex: "name" },
            { title: "Описание", dataIndex: "description" },
            {
              title: "Статус",
              render: (_, record) => (
                <Space wrap>
                  <Tag color={record.isActive === false ? "default" : "green"}>
                    {record.isActive === false ? "Неактивен" : "Активен"}
                  </Tag>
                  {record.isPrimary ? <Tag color="blue">Основной</Tag> : null}
                </Space>
              ),
            },
            {
              title: "Дата",
              render: (_, record) =>
                record.createdAt
                  ? dayjs(record.createdAt).format("DD.MM.YYYY")
                  : "—",
            },
            {
              title: "Действия",
              hidden: isPatient,
              width: 220,
              render: (_, record) => (
                <Space wrap>
                  {canEditDiagnoses(user?.role) ? (
                    <Button size="small" onClick={() => openModal(record)}>
                      Изменить
                    </Button>
                  ) : null}
                  {canDeleteDiagnoses(user?.role) ? (
                    <Popconfirm
                      title="Удалить диагноз?"
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
          title={
            modalState.diagnosis
              ? "Редактирование диагноза"
              : "Создание диагноза"
          }
          open={modalState.open}
          footer={null}
          onCancel={closeModal}
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

            <Form.Item name="visitId" label="Визит">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={visits.map((visit) => ({
                  value: visit.id,
                  label:
                    `${visit.icd10Code || ""} ${
                      visit.diagnosis || ""
                    }`.trim() || `Визит #${visit.id}`,
                }))}
              />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="icd10Code"
                  label="Код МКБ-10"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Название"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="Описание">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item
              name="isPrimary"
              label="Основной диагноз"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="isActive"
              label="Активный диагноз"
              valuePropName="checked"
            >
              <Switch defaultChecked />
            </Form.Item>

            <Button type="primary" htmlType="submit" block loading={saving}>
              Сохранить диагноз
            </Button>
          </Form>
        </Modal>
      ) : null}
    </div>
  );
}
