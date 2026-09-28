// src/components/Footer.jsx
import React from "react";
import { Layout, Typography, Space, Row, Col } from "antd";
import {
  GithubOutlined,
  MailOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

const { Footer } = Layout;
const { Text, Title } = Typography;

function AppFooter() {
  return (
    <Footer
      style={{
        background: "linear-gradient(90deg, #f0f5ff 0%, #fafafa 60%, #f6ffed 100%)",
        padding: "48px 24px 24px",
        marginTop: 64,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Row gutter={[32, 32]}>
          {/* Brand */}
          <Col xs={24} md={8}>
            <Title level={4} style={{ marginBottom: 8 }}>
              CityPulse
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Empowering smart cities through technology, transparency, and
              citizen collaboration.
            </Text>
          </Col>

          {/* Quick Links */}
          <Col xs={12} md={8}>
            <Title level={5}>Quick Links</Title>
            <Space direction="vertical">
              <Text><a href="/">Home</a></Text>
              <Text><a href="/about">About</a></Text>
              <Text><a href="/city">City</a></Text>
              <Text><a href="/contact">Contact</a></Text>
            </Space>
          </Col>

          {/* Contact */}
          <Col xs={12} md={8}>
            <Title level={5}>Contact</Title>
            <Space direction="vertical">
              <Space>
                <MailOutlined />
                <Text>support@citypulse.com</Text>
              </Space>
              <Space>
                <EnvironmentOutlined />
                <Text>India</Text>
              </Space>
              <Space>
                <a
                  href="https://github.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GithubOutlined style={{ fontSize: 18 }} />
                </a>
                <Text type="secondary">GitHub</Text>
              </Space>
            </Space>
          </Col>
        </Row>

        {/* Bottom Bar */}
        <div
          style={{
            marginTop: 32,
            paddingTop: 16,
            borderTop: "1px solid rgba(0,0,0,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Text type="secondary">
            © {new Date().getFullYear()} CityPulse. All rights reserved.
          </Text>
          <Text type="secondary">
            Built with ❤️ using React & Ant Design
          </Text>
        </div>
      </div>
    </Footer>
  );
}

export default AppFooter;
