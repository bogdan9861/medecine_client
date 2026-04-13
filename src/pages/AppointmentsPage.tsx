// @ts-nocheck
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Tag,
} from "antd";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import dayjs from "dayjs";
import { useAuth } from "../app/store/auth.context";
import { appointmentsApi } from "../features/appointments/appointments.api";
import { doctorsApi } from "../features/doctors/doctors.api";
import { patientsApi } from "../features/patients/patients.api";
import Table from "../shared/ui/Table";

const { RangePicker } = DatePicker;

const canCreateAppointments = (role) =>
  ["ADMIN", "REGISTRATOR", "DOCTOR"].includes(role);

const normalizeSchedule = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.schedule)) return payload.schedule;
  if (Array.isArray(payload?.days)) return payload.days;
  return [];
};

const getSlotTimestamp = (slot) =>
  slot?.time ||
  slot?.dateTime ||
  slot?.appointmentTime ||
  slot?.startTime ||
  slot?.start ||
  slot?.from;

const normalizeAvailableSlots = (payload) =>
  (payload ?? [])
    .map((slot) => {
      const timestamp = getSlotTimestamp(slot);
      if (!timestamp || slot?.available === false) return null;
      return {
        value: timestamp,
        label: dayjs(timestamp).isValid()
          ? dayjs(timestamp).format("DD.MM.YYYY HH:mm")
          : String(timestamp),
      };
    })
    .filter(Boolean);

const buildSlotsFromSchedule = (schedule, dateValue) => {
  if (!dateValue) return [];

  const selectedDate = dayjs(dateValue);
  const selectedWeekday = selectedDate.day();
  const weekdayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const matchedDay =
    schedule.find((item) => {
      const rawDay = String(
        item?.day || item?.weekday || item?.dayOfWeek || ""
      ).toLowerCase();
      const rawDate = item?.date ? dayjs(item.date) : null;

      if (rawDate?.isValid()) return rawDate.isSame(selectedDate, "day");
      if (!rawDay) return false;
      if (/^\d+$/.test(rawDay)) return Number(rawDay) === selectedWeekday;
      return rawDay.includes(weekdayNames[selectedWeekday]);
    }) || schedule[0];

  const startRaw =
    matchedDay?.startTime || matchedDay?.start || matchedDay?.from;
  const endRaw = matchedDay?.endTime || matchedDay?.end || matchedDay?.to;
  const stepMinutes = Number(
    matchedDay?.slotDuration || matchedDay?.durationMinutes || 15
  );

  if (!startRaw || !endRaw) return [];

  const parseClock = (value) => {
    const normalized =
      String(value).length <= 5
        ? `${selectedDate.format("YYYY-MM-DD")}T${value}`
        : value;
    return dayjs(normalized);
  };

  const start = parseClock(startRaw);
  const end = parseClock(endRaw);
  if (!start.isValid() || !end.isValid() || !end.isAfter(start)) return [];

  const slots = [];
  let cursor = start;
  while (cursor.isBefore(end)) {
    slots.push({
      value: cursor.toISOString(),
      label: cursor.format("DD.MM.YYYY HH:mm"),
    });
    cursor = cursor.add(stepMinutes, "minute");
  }

  return slots;
};

export default function AppointmentsPage() {
  const { user, isPatient, currentDoctorId } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [doctorSchedule, setDoctorSchedule] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [filters, setFilters] = useState({
    date: "",
    doctorId: user?.role === "DOCTOR" ? currentDoctorId : "",
    patientId: user?.role === "PATIENT" ? user?.id : "",
    status: "",
    fromDate: "",
    toDate: "",
  });
  const [modalOpen, setModalOpen] = useState(false);

  const loadLookups = async () => {
    try {
      const [patientsResponse, doctorsResponse] = await Promise.all([
        patientsApi.list({ page: 1, limit: 100, isArchived: false }),
        doctorsApi.list({ page: 1, limit: 100 }),
      ]);

      setDoctors(doctorsResponse.data?.data ?? []);
      setPatients(patientsResponse.data?.data ?? []);
    } catch (error) {
      messageApi.error(error.message);
    }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const query = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
        patientId: filters.patientId,
        doctorId: user?.role === "DOCTOR" ? currentDoctorId : filters.doctorId,
      };

      const response =
        user?.role === "PATIENT"
          ? await appointmentsApi.my(query)
          : await appointmentsApi.list(query);

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
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadAppointments();
  }, [
    pagination.current,
    pagination.pageSize,
    filters.date,
    filters.doctorId,
    filters.patientId,
    filters.status,
    filters.fromDate,
    filters.toDate,
    currentDoctorId,
    user?.role,
  ]);

  const fetchSlots = async (doctorIdArg, dateArg, options = {}) => {
    const { forceReset = false } = options;
    const doctorId = doctorIdArg ?? form.getFieldValue("doctorId");
    const date = dateArg ?? form.getFieldValue("date");
    const currentAppointmentTime = form.getFieldValue("appointmentTime");

    if (!doctorId || !date) {
      setAvailableSlots([]);
      setDoctorSchedule([]);
      form.setFieldValue("appointmentTime", undefined);
      return;
    }

    try {
      const [slotsResponse, scheduleResponse] = await Promise.all([
        appointmentsApi.getAvailableSlots({
          doctorId,
          date: date.format("YYYY-MM-DD"),
        }),
        doctorsApi.getSchedule(doctorId),
      ]);

      const normalizedSchedule = normalizeSchedule(scheduleResponse.data?.data);
      const normalizedSlots = normalizeAvailableSlots(slotsResponse.data?.data);
      const fallbackSlots = buildSlotsFromSchedule(normalizedSchedule, date);
      const nextSlots = normalizedSlots.length
        ? normalizedSlots
        : fallbackSlots;
      const hasCurrentValue = nextSlots.some(
        (slot) => String(slot.value) === String(currentAppointmentTime)
      );

      setDoctorSchedule(normalizedSchedule);
      setAvailableSlots(nextSlots);

      if (forceReset || (currentAppointmentTime && !hasCurrentValue)) {
        form.setFieldValue("appointmentTime", undefined);
      }
    } catch (error) {
      messageApi.error(error.message);
    }
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await appointmentsApi.create({
        patientId: values.patientId,
        doctorId: values.doctorId,
        appointmentTime: values.appointmentTime,
        durationMinutes: values.durationMinutes,
        type: values.type,
        paymentType: values.paymentType,
        notes: values.notes,
      });

      messageApi.success("Запись создана");
      form.resetFields();
      setAvailableSlots([]);
      setDoctorSchedule([]);
      setModalOpen(false);
      loadAppointments();
    } catch (error) {
      messageApi.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const onCancelAppointment = async (id) => {
    try {
      await appointmentsApi.cancel(id);
      messageApi.success("Запись отменена");
      loadAppointments();
    } catch (error) {
      messageApi.error(error.message);
    }
  };

  // if (isPatient) {
  //   return <Navigate to="/doctors" replace />;
  // }

  return (
    <div className="page-stack">
      {contextHolder}

      <Card
        className="page-card"
        title="Записи на прием"
        extra={
          canCreateAppointments(user?.role) ? (
            <Button type="primary" onClick={() => setModalOpen(true)}>
              Новая запись
            </Button>
          ) : null
        }
      >
        <div className="filters-grid" style={{ marginBottom: 16 }}>
          <DatePicker
            style={{ width: "100%" }}
            format="DD.MM.YYYY"
            placeholder="Дата записи"
            onChange={(date) =>
              setFilters((prev) => ({
                ...prev,
                date: date?.format("YYYY-MM-DD"),
              }))
            }
          />

          <Select
            allowClear
            showSearch
            placeholder="Врач"
            optionFilterProp="label"
            value={filters.doctorId}
            options={doctors.map((doctor) => ({
              value: doctor.id,
              label:
                `${doctor.user.lastName || ""} ${
                  doctor.specialization || ""
                }`.trim() || doctor.email,
            }))}
            onChange={(doctorId) =>
              setFilters((prev) => ({ ...prev, doctorId }))
            }
          />

          {user?.role !== "PATIENT" && (
            <Select
              allowClear
              showSearch
              placeholder="Пациент"
              optionFilterProp="label"
              value={filters.patientId}
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
          )}

          <Select
            allowClear
            placeholder="Статус"
            options={[
              { value: "SCHEDULED", label: "Запланирована" },
              { value: "CANCELLED", label: "Отменена" },
              { value: "COMPLETED", label: "Завершена" },
            ]}
            onChange={(status) => setFilters((prev) => ({ ...prev, status }))}
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
            {
              title: "Время",
              dataIndex: "appointmentTime",
              render: (value) =>
                value ? dayjs(value).format("DD.MM.YYYY HH:mm") : "—",
            },
            {
              title: "Пациент",
              render: (_, record) =>
                record.patientName ||
                record.patient?.fullName ||
                [record.patient?.lastName, record.patient?.firstName]
                  .filter(Boolean)
                  .join(" ") ||
                `#${record.patientId}`,
            },
            {
              title: "Врач",
              render: (_, record) => {
                console.log("record ====>", record);

                return (
                  record.doctor.specialization ||
                  record.doctor?.email ||
                  [record.doctor?.lastName, record.doctor?.firstName]
                    .filter(Boolean)
                    .join(" ") ||
                  `#${record.doctorId}`
                );
              },
            },
            { title: "Тип", dataIndex: "type" },
            { title: "Оплата", dataIndex: "paymentType" },
            {
              title: "Статус",
              dataIndex: "status",
              render: (value) => (
                <Tag
                  color={
                    value === "CANCELLED"
                      ? "red"
                      : value === "COMPLETED"
                      ? "green"
                      : "blue"
                  }
                >
                  {value || "SCHEDULED"}
                </Tag>
              ),
            },
            {
              title: "Действия",
              width: 150,
              render: (_, record) => (
                <Popconfirm
                  title="Отменить запись?"
                  onConfirm={() => onCancelAppointment(record.id)}
                >
                  <Button
                    size="small"
                    danger
                    disabled={record.status === "CANCELLED"}
                  >
                    Отменить
                  </Button>
                </Popconfirm>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Создание записи"
        open={modalOpen}
        footer={null}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setAvailableSlots([]);
          setDoctorSchedule([]);
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          onValuesChange={(changedValues, allValues) => {
            if (
              (Object.prototype.hasOwnProperty.call(
                changedValues,
                "doctorId"
              ) ||
                Object.prototype.hasOwnProperty.call(changedValues, "date")) &&
              allValues.doctorId &&
              allValues.date
            ) {
              fetchSlots(allValues.doctorId, allValues.date, {
                forceReset: true,
              });
            }
          }}
        >
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

          <Form.Item name="doctorId" label="Врач" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={doctors.map((doctor) => ({
                value: doctor.id,
                label:
                  `${doctor.user.lastName || ""} ${
                    doctor.specialization || ""
                  }`.trim() || doctor.user.email,
              }))}
            />
          </Form.Item>

          {doctorSchedule.length ? (
            <Card
              size="small"
              style={{ marginBottom: 16 }}
              title="Расписание врача"
            >
              <Descriptions size="small" column={1}>
                {doctorSchedule.map((item, index) => (
                  <Descriptions.Item
                    key={`${item.day || item.date || index}`}
                    label={item.day || item.date || `День ${index + 1}`}
                  >
                    {item.startTime || item.start || item.from || "—"} -{" "}
                    {item.endTime || item.end || item.to || "—"}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Card>
          ) : null}

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="date" label="Дата" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="appointmentTime"
                label="Свободный слот"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Выберите время"
                  notFoundContent="Сначала выберите врача и дату"
                  options={availableSlots}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="durationMinutes"
                label="Длительность, мин"
                initialValue={15}
                rules={[{ required: true }]}
              >
                <InputNumber min={5} max={180} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="Тип приема" initialValue="INITIAL">
                <Select
                  options={[
                    { value: "INITIAL", label: "Первичный" },
                    { value: "FOLLOW_UP", label: "Повторный" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="paymentType" label="Тип оплаты" initialValue="OMS">
            <Select
              options={[
                { value: "OMS", label: "ОМС" },
                { value: "VMI", label: "ДМС" },
                { value: "PAID", label: "Платно" },
              ]}
            />
          </Form.Item>

          <Form.Item name="notes" label="Примечание">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={saving}>
            Сохранить запись
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
