// src/pages/City.jsx
import React from "react";
import { Card, Row, Col, Typography, Tag } from "antd";
import {
  EnvironmentOutlined,
  BarChartOutlined,
  TeamOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export default function City() {
  const cities = [
    { name: "New York", desc: "Smart reporting, sanitation tracking and urban service analytics." },
    { name: "London", desc: "Data-driven decisions with live SLA dashboards and ward-wise monitoring." },
    { name: "Tokyo", desc: "IoT-enabled civic insights with citizen-first feedback loops." },
    { name: "Paris", desc: "Citizen engagement, issue transparency and open civic data views." },
  ];

  const metrics = [
    { label: "Cities onboarded", value: "19+" },
    { label: "Issues resolved", value: "2.4K+" },
    { label: "Avg. SLA compliance", value: "93%" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f7f9fc 0%, #ffffff 50%, #f9f0ff 100%)",
        padding: "96px 24px 48px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Cities Powered by CityPulse
          </Title>
          <Paragraph style={{ maxWidth: 720, margin: "0 auto", color: "#666" }}>
            CityPulse helps governments and citizens collaborate in real time.  
            From dense metros to emerging smart cities, our platform adapts to each city’s unique needs.
          </Paragraph>
        </div>

        {/* Metrics strip */}
        <Row
          gutter={[24, 24]}
          justify="center"
          style={{ marginBottom: 40 }}
        >
          {metrics.map((m, i) => (
            <Col xs={24} sm={8} key={i}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  textAlign: "center",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  background: "rgba(255,255,255,0.9)",
                }}
              >
                <Title level={3} style={{ marginBottom: 2 }}>
                  {m.value}
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {m.label}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Cities grid */}
        <Row gutter={[32, 32]} justify="center">
          {cities.map((city, i) => (
            <Col xs={24} sm={12} md={8} lg={6} key={i}>
              <Card
                hoverable
                style={{
                  borderRadius: 18,
                  textAlign: "left",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                  height: "100%",
                  paddingTop: 12,
                  paddingBottom: 16,
                }}
                bodyStyle={{ padding: "16px 18px 18px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <EnvironmentOutlined style={{ fontSize: 18, color: "#1677ff" }} />
                  <Title level={4} style={{ margin: 0 }}>
                    {city.name}
                  </Title>
                </div>
                <Paragraph style={{ color: "#666", fontSize: 14, marginBottom: 12 }}>
                  {city.desc}
                </Paragraph>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 4,
                  }}
                >
                  <Tag color="blue" style={{ borderRadius: 999 }}>
                    <BarChartOutlined style={{ marginRight: 6 }} />
                    Smart Governance
                  </Tag>
                  <Tag color="green" style={{ borderRadius: 999 }}>
                    <TeamOutlined style={{ marginRight: 6 }} />
                    Citizen-first
                  </Tag>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
