// @ts-nocheck
import { Card, Col, List, Row, Space, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Navigate } from "react-router-dom";
import { patientsApi } from "../features/patients/patients.api";
import { doctorsApi } from "../features/doctors/doctors.api";
import { appointmentsApi } from "../features/appointments/appointments.api";
import { visitsApi } from "../features/visits/visits.api";
import { diagnosesApi } from "../features/diagnoses/diagnoses.api";
import StatsCards from "../widgets/StatsCards";
import Loader from "../shared/ui/Loader";
import { useAuth } from "../app/store/auth.context";

export default function DashboardPage() {
  const { isPatient } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointmentsToday: 0,
    visitsMonth: 0,
    sickLeaves: 0,
    topDiagnoses: [],
    visitsByDoctor: [],
  });

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      const today = dayjs().format("YYYY-MM-DD");
      const [patients, doctors, appointments, visits, diagnoses] =
        await Promise.allSettled([
          patientsApi.list({ page: 1, limit: 1 }),
          doctorsApi.list({ page: 1, limit: 1 }),
          appointmentsApi.list({ date: today }),
          visitsApi.getStatistics({ period: "month" }),
          diagnosesApi.getStatistics({ period: "month" }),
        ]);

      setStats({
        patients:
          patients.status === "fulfilled"
            ? patients.value.data?.pagination?.total ?? patients.value.data?.data?.length ?? 0
            : 0,
        doctors:
          doctors.status === "fulfilled"
            ? doctors.value.data?.pagination?.total ?? doctors.value.data?.data?.length ?? 0
            : 0,
        appointmentsToday:
          appointments.status === "fulfilled"
            ? appointments.value.data?.pagination?.total ??
              appointments.value.data?.data?.length ??
              0
            : 0,
        visitsMonth:
          visits.status === "fulfilled" ? visits.value.data?.data?.totalVisits ?? 0 : 0,
        sickLeaves:
          visits.status === "fulfilled" ? visits.value.data?.data?.sickLeaves ?? 0 : 0,
        topDiagnoses:
          diagnoses.status === "fulfilled"
            ? diagnoses.value.data?.data?.topDiagnoses ?? []
            : visits.status === "fulfilled"
              ? visits.value.data?.data?.topDiagnoses ?? []
              : [],
        visitsByDoctor:
          visits.status === "fulfilled" ? visits.value.data?.data?.visitsByDoctor ?? [] : [],
      });

      setLoading(false);
    };

    loadDashboard();
  }, []);

  if (isPatient) {
    return <Navigate to="/doctors" replace />;
  }

  if (loading) {
    return <Loader text="Загружаем сводку по клинике" />;
  }

  return (
    <div className="page-stack">
      <div>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>
          Дашборд
        </Typography.Title>
        <Typography.Text type="secondary">
          Оперативная картина по пациентам, врачам и визитам на {dayjs().format("DD.MM.YYYY")}
        </Typography.Text>
      </div>

      <StatsCards
        items={[
          { title: "Пациенты", value: stats.patients, caption: "Всего в системе" },
          { title: "Врачи", value: stats.doctors, caption: "Активные сотрудники" },
          {
            title: "Записи сегодня",
            value: stats.appointmentsToday,
            caption: "План приемов на текущий день",
          },
          {
            title: "Визиты за месяц",
            value: stats.visitsMonth,
            caption: `Больничных выдано: ${stats.sickLeaves}`,
          },
        ]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card className="page-card" title="Нагрузка по врачам">
            <List
              dataSource={stats.visitsByDoctor}
              locale={{ emptyText: "Данные отсутствуют" }}
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical" size={0}>
                    <Typography.Text strong>
                      {item.doctorName || `Врач #${item.doctorId}`}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      Проведено визитов: {item.visitCount ?? 0}
                    </Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card className="page-card" title="Топ диагнозов">
            <Space wrap>
              {stats.topDiagnoses.length ? (
                stats.topDiagnoses.map((item) => (
                  <Tag key={`${item.code}-${item.name}`} color="geekblue">
                    {item.code} {item.name} ({item.count})
                  </Tag>
                ))
              ) : (
                <Typography.Text type="secondary">
                  Статистика по диагнозам пока отсутствует
                </Typography.Text>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
