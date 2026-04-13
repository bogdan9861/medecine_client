// @ts-nocheck
import { Button, Result } from "antd";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <Result
      status="404"
      title="Страница не найдена"
      subTitle="Маршрут отсутствует или был перемещен."
      extra={
        <Button type="primary">
          <Link to="/">На главную</Link>
        </Button>
      }
    />
  );
}
