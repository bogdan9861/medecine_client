// features/appointments/AppointmentForm.tsx
import React from "react";
import { Form, Select, DatePicker, Button } from "antd";
import { api } from "../../shared/api/axios";
import { useState } from "react";

export default function AppointmentForm() {
  const [slots, setSlots] = useState([]);

  const getSlots = async (doctorId, date) => {
    const res = await api.get("/appointments/available-slots", {
      params: {
        doctorId,
        date,
      },
    });

    setSlots(res.data.data.filter((s) => s.available));
  };

  const onFinish = async (values) => {
    await api.post("/appointments", values);
  };

  return (
    <Form onFinish={onFinish}>
      <Form.Item name="doctorId">
        <Select placeholder="Выбери врача" />
      </Form.Item>

      <Form.Item name="date">
        <DatePicker
          onChange={(date) => getSlots(1, date.format("YYYY-MM-DD"))}
        />
      </Form.Item>

      <Form.Item name="appointmentTime">
        <Select
          placeholder="Свободное время"
          options={slots.map((s) => ({
            value: s.time,
            label: s.time,
          }))}
        />
      </Form.Item>

      <Button htmlType="submit">Записать</Button>
    </Form>
  );
}
