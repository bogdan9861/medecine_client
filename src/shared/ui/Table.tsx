// @ts-nocheck
import { Table as AntTable } from "antd";

export default function Table(props) {
  return <AntTable scroll={{ x: 960 }} pagination={false} {...props} />;
}
