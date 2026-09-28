// src/pages/About.jsx
import React from "react";
import { Button, Card, Typography, Row, Col, Divider, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import {
  InfoCircleOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  TeamOutlined,
  CloudServerOutlined,
} from "@ant-design/icons";
import heroImage from "../assets/5.jpg";

const { Title, Paragraph, Text } = Typography;

export default function About() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        // same vibe as Home hero: dark overlay on image
        backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 20px 40px", // top padding so it clears the fixed header
      }}
    >
      <Card
        bordered={false}
        style={{
          maxWidth: 900,
          width: "100%",
          borderRadius: 22,
          padding: "40px 40px 32px",
          background: "rgba(255,255,255,0.94)", // soft glass
          boxShadow: "0 16px 45px rgba(0,0,0,0.35)",
          animation: "fadeUp 0.8s ease-out",
        }}
      >
        {/* Header / Intro */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <InfoCircleOutlined style={{ fontSize: 40, color: "#1677ff" }} />
          <Title level={2} style={{ margin: "12px 0 4px" }}>
            About CityPulse
          </Title>
          <Text type="secondary">
            A unified platform for smarter, more responsive cities 
          </Text>
        </div>

        <Row gutter={[24, 16]}>
          {/* Left column: Overview + Mission / Vision */}
          <Col xs={24} md={14}>
            <Paragraph style={{ fontSize: 15, lineHeight: 1.7 }}>
              <strong>CityPulse</strong> is a civic technology platform that
              connects citizens, departments, and city leadership in one place.
              From reporting issues to tracking performance and analysing trends,
              CityPulse makes urban governance more{" "}
              <Text strong>transparent, collaborative, and data-driven</Text>.
            </Paragraph>

            <Paragraph style={{ fontSize: 15, lineHeight: 1.7 }}>
              Instead of scattered complaints, siloed systems, and delayed
              updates, CityPulse brings everything into a single, intuitive
              interface for both citizens and administrators.
            </Paragraph>

            <Divider style={{ margin: "16px 0" }} />

            <Title level={4} style={{ marginBottom: 8 }}>
              Our Mission
            </Title>
            <Paragraph style={{ fontSize: 15, lineHeight: 1.7 }}>
              To help cities become more{" "}
              <Text strong>responsive, accountable, and citizen-centric</Text>{" "}
              by turning everyday issues into actionable insights.
            </Paragraph>

            <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
              Our Vision
            </Title>
            <Paragraph style={{ fontSize: 15, lineHeight: 1.7 }}>
              A future where every citizen can see how their city is performing,
              every issue has a clear owner, and every decision is backed by
              real data.
            </Paragraph>
          </Col>

          {/* Right column: Quick stats / highlights */}
          <Col xs={24} md={10}>
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                background:
                  "linear-gradient(135deg, #f0f5ff 0%, #e6fffb 100%)",
                marginBottom: 16,
              }}
            >
              <Row gutter={12}>
                <Col span={8} style={{ textAlign: "center" }}>
                  <Title level={3} style={{ marginBottom: 0 }}>
                    2.4K+
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Issues Resolved
                  </Text>
                </Col>
                <Col span={8} style={{ textAlign: "center" }}>
                  <Title level={3} style={{ marginBottom: 0 }}>
                    98%
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Citizen Satisfaction
                  </Text>
                </Col>
                <Col span={8} style={{ textAlign: "center" }}>
                  <Title level={3} style={{ marginBottom: 0 }}>
                    19
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Cities Onboarded
                  </Text>
                </Col>
              </Row>
            </Card>

            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                background: "#f6ffed",
              }}
            >
              <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                <BarChartOutlined style={{ fontSize: 20, color: "#52c41a" }} />
                <div>
                  <Text strong>Built for real-time decisions</Text>
                  <Paragraph style={{ marginBottom: 0, fontSize: 13 }}>
                    Live dashboards, SLA tracking, and operational views for
                    departments.
                  </Paragraph>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <CloudServerOutlined
                  style={{ fontSize: 20, color: "#722ed1" }}
                />
                <div>
                  <Text strong>Secure & scalable</Text>
                  <Paragraph style={{ marginBottom: 0, fontSize: 13 }}>
                    Modern architecture designed for government-grade security
                    and reliability.
                  </Paragraph>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: "24px 0 16px" }} />

        {/* What you can do */}
        <Title level={4} style={{ marginBottom: 10 }}>
          What you can do with CityPulse
        </Title>

        <Row gutter={[16, 8]}>
          <Col xs={24} md={12}>
            <Paragraph style={{ marginBottom: 8 }}>
              <CheckCircleOutlined
                style={{ color: "#52c41a", marginRight: 8 }}
              />
              Report issues (garbage, roads, streetlights, water, etc.) with
              photos and GPS location.
            </Paragraph>
            <Paragraph style={{ marginBottom: 8 }}>
              <CheckCircleOutlined
                style={{ color: "#52c41a", marginRight: 8 }}
              />
              Track complaint status in real time and receive notifications on
              updates.
            </Paragraph>
            <Paragraph style={{ marginBottom: 8 }}>
              <CheckCircleOutlined
                style={{ color: "#52c41a", marginRight: 8 }}
              />
              View open and resolved issues across your locality or ward.
            </Paragraph>
          </Col>
          <Col xs={24} md={12}>
            <Paragraph style={{ marginBottom: 8 }}>
              <CheckCircleOutlined
                style={{ color: "#52c41a", marginRight: 8 }}
              />
              Monitor department-wise performance and SLA adherence.
            </Paragraph>
            <Paragraph style={{ marginBottom: 8 }}>
              <CheckCircleOutlined
                style={{ color: "#52c41a", marginRight: 8 }}
              />
              Analyse trends to identify hotspots, recurring issues, and
              systemic gaps.
            </Paragraph>
            <Paragraph style={{ marginBottom: 8 }}>
              <CheckCircleOutlined
                style={{ color: "#52c41a", marginRight: 8 }}
              />
              Build trust through open, accessible civic data and dashboards.
            </Paragraph>
          </Col>
        </Row>

        <Divider style={{ margin: "24px 0 16px" }} />

        {/* Who it's for */}
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Title level={5} style={{ marginBottom: 6 }}>
              For Citizens
            </Title>
            <Paragraph style={{ fontSize: 14, marginBottom: 8 }}>
              CityPulse gives residents a direct channel to raise issues,
              follow-up transparently, and see change happening around them.
            </Paragraph>
            <SpaceWrap>
              <Tag color="blue">Simple to use</Tag>
              <Tag color="green">Transparent</Tag>
              <Tag color="gold">Mobile-first</Tag>
            </SpaceWrap>
          </Col>
          <Col xs={24} md={12}>
            <Title level={5} style={{ marginBottom: 6 }}>
              For City Administrators
            </Title>
            <Paragraph style={{ fontSize: 14, marginBottom: 8 }}>
              CityPulse acts as a control center for monitoring workloads,
              prioritising tasks, and communicating outcomes to the public.
            </Paragraph>
            <SpaceWrap>
              <Tag color="purple">Operational visibility</Tag>
              <Tag color="volcano">Performance tracking</Tag>
              <Tag color="cyan">Data-driven</Tag>
            </SpaceWrap>
          </Col>
        </Row>

        <Divider style={{ margin: "24px 0 16px" }} />

        {/* Closing / Contact */}
        <Row>
          <Col span={24}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
              }}
            >
              <Paragraph style={{ marginBottom: 0 }}>
                Have questions, partnership ideas, or want to pilot CityPulse in
                your city? Reach out at{" "}
                <a href="mailto:support@citypulse.com">
                  support@citypulse.com
                </a>
                .
              </Paragraph>
              <Button
                type="primary"
                icon={<TeamOutlined />}
                onClick={() => navigate("/contact")}
              >
                Contact our team
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      <style>
        {`
          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(24px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}

/**
 * Small helper wrapper so tags wrap nicely.
 */
function SpaceWrap({ children }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 4,
      }}
    >
      {children}
    </div>
  );
}
