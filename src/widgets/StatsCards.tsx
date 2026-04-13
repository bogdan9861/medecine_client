// @ts-nocheck
import { Card, Col, Row, Statistic, Typography } from "antd";

export default function StatsCards({ items = [] }) {
  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col xs={24} sm={12} xl={6} key={item.title}>
          <Card className="stat-card">
            <Statistic
              title={item.title}
              value={item.value}
              suffix={item.suffix}
              precision={item.precision}
            />
            {item.caption ? (
              <Typography.Text type="secondary">{item.caption}</Typography.Text>
            ) : null}
          </Card>
        </Col>
      ))}
    </Row>
  );
}
