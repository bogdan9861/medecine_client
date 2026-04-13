// @ts-nocheck
import { Layout } from "antd";
import { motion } from "framer-motion";
import Sidebar from "../../widgets/Sidebar";
import Header from "../../widgets/Header";

export default function PageLayout({ children }) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />

      <Layout>
        <Header />
        <Layout.Content style={{ padding: 24 }}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            {children}
          </motion.div>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
