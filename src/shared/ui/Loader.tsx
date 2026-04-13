// @ts-nocheck
import { Flex, Spin, Typography } from "antd";

export default function Loader({ fullscreen = false, text = "Загрузка" }) {
  return (
    <Flex
      vertical
      align="center"
      justify="center"
      gap={12}
      style={{
        minHeight: fullscreen ? "100vh" : 240,
        width: "100%",
      }}
    >
      <Spin size="large" />
      <Typography.Text type="secondary">{text}</Typography.Text>
    </Flex>
  );
}
