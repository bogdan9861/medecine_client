// features/patients/PatientsTable.tsx
import { Table, Input, Select } from "antd";
import React, { useEffect, useState } from "react";
import { api } from "../../shared/api/axios";

export default function PatientsTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    search: "",
    gender: undefined,
  });

  const fetchPatients = async () => {
    setLoading(true);
    const res = await api.get("/patients", { params: filters });
    setData(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, [filters]);

  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Input
          placeholder="Поиск"
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />

        <Select
          placeholder="Пол"
          style={{ width: 120 }}
          onChange={(value) => setFilters({ ...filters, gender: value })}
          options={[
            { value: "MALE", label: "Мужской" },
            { value: "FEMALE", label: "Женский" },
          ]}
        />
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={[
          { title: "Имя", dataIndex: "firstName" },
          { title: "Фамилия", dataIndex: "lastName" },
          { title: "Телефон", dataIndex: "phone" },
        ]}
      />
    </>
  );
}
