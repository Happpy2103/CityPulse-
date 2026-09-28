import React from "react";
import { Button, Card, Col, Row, Typography } from "antd";
import {
  FlagOutlined,
  PieChartOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
  BulbOutlined,
  TeamOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import heroImage from "../assets/5.jpg";

const { Title, Paragraph, Text } = Typography;

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: "easeOut" },
  }),
};

const containerStyle = {
  maxWidth: 1200,
  margin: "0 auto",
};

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ overflowX: "hidden", background: "#fff" }}>
      {/* HERO SECTION */}
      <section
        style={{
          position: "relative",
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "90vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.5) 100%)",
            backdropFilter: "blur(6px)",
            zIndex: 1,
          }}
        />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{
            position: "relative",
            zIndex: 2,
            ...containerStyle,
            padding: "0 20px",
          }}
        >
          <Title
            level={1}
            style={{
              color: "#fff",
              fontWeight: 800,
              fontSize: "3rem",
              marginBottom: 20,
              letterSpacing: -0.5,
            }}
          >
            Making Cities Smarter, Together
          </Title>
          <Paragraph
            style={{
              color: "#f0f0f0",
              fontSize: 18,
              marginBottom: 32,
              lineHeight: 1.7,
              maxWidth: 720,
              marginInline: "auto",
            }}
          >
            Empower your city with{" "}
            <strong>data, transparency</strong> and{" "}
            <strong>citizen collaboration</strong>. CityPulse connects citizens
            and municipalities for a cleaner, smarter, and more responsive city.
          </Paragraph>

          {/* Hero CTAs */}
          <motion.div
            variants={fadeUp}
            custom={2}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 16,
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            <Button
              type="primary"
              size="large"
              style={{
                paddingInline: 32,
                borderRadius: 28,
                fontWeight: 600,
                fontSize: 16,
              }}
              onClick={() => navigate("/report-issue")}
            >
              Report an Issue
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* WHY CITYPULSE */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={fadeUp}
          viewport={{ once: true, amount: 0.4 }}
        >
          <Title level={2}>Why Choose CityPulse?</Title>
          <Paragraph
            style={{
              color: "#666",
              fontSize: 17,
              maxWidth: 750,
              margin: "16px auto 50px",
            }}
          >
            We merge technology and civic spirit — enabling citizens and
            administrators to co-create a cleaner, safer, more transparent city.
          </Paragraph>
        </motion.div>

        <div style={containerStyle}>
          <Row gutter={[24, 24]} justify="center">
            {[
              {
                icon: (
                  <BulbOutlined style={{ fontSize: 44, color: "#1677ff" }} />
                ),
                title: "Innovation-Driven",
                desc: "Leverage technology to create efficient, connected, and livable cities.",
              },
              {
                icon: (
                  <TeamOutlined style={{ fontSize: 44, color: "#722ed1" }} />
                ),
                title: "Citizen-Centric",
                desc: "Enable real-time participation and foster a sense of community ownership.",
              },
              {
                icon: (
                  <GlobalOutlined style={{ fontSize: 44, color: "#52c41a" }} />
                ),
                title: "Data Transparency",
                desc: "Build accountability through accessible dashboards and open city data.",
              },
              
            ].map((item, i) => (
              <Col xs={24} md={8} key={i}>
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  custom={i + 1}
                >
                  <motion.div
                    whileHover={{ y: -8, boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <Card
                      bordered={false}
                      hoverable
                      style={{
                        borderRadius: 16,
                        height: "100%",
                        textAlign: "center",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                      }}
                    >
                      {item.icon}
                      <Title level={4} style={{ marginTop: 12 }}>
                        {item.title}
                      </Title>
                      <Paragraph style={{ color: "#666" }}>
                        {item.desc}
                      </Paragraph>
                    </Card>
                  </motion.div>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: "#f7f9fc", padding: "90px 24px" }}>
        <div style={{ ...containerStyle }}>
          <Title
            level={2}
            style={{ textAlign: "center", marginBottom: 12, marginTop: 0 }}
          >
            What You Can Do
          </Title>
          <Paragraph
            style={{
              textAlign: "center",
              color: "#7a7a7a",
              maxWidth: 700,
              margin: "0 auto 48px",
            }}
          >
            CityPulse gives you the tools to report, track, and visualize civic
            issues across your city — all in one place.
          </Paragraph>

          <Row gutter={[32, 32]} justify="center">
            {[
              {
                icon: (
                  <FlagOutlined style={{ fontSize: 40, color: "#1677ff" }} />
                ),
                title: "Report Civic Issues",
                desc: "Easily log complaints with images, GPS coordinates, and categories.",
              },
              {
                icon: (
                  <EnvironmentOutlined
                    style={{ fontSize: 40, color: "#52c41a" }}
                  />
                ),
                title: "Explore on Map",
                desc: "View ongoing issues on an interactive city map for transparency.",
              },
              {
                icon: (
                  <PieChartOutlined
                    style={{ fontSize: 40, color: "#722ed1" }}
                  />
                ),
                title: "Monitor SLAs",
                desc: "Track resolution timelines and department performance visually.",
              },
              {
                icon: (
                  <SafetyOutlined
                    style={{ fontSize: 40, color: "#fa8c16" }}
                  />
                ),
                title: "Real-Time Alerts",
                desc: "Stay updated on issue progress and emergency announcements.",
              },
            ].map((f, i) => (
              <Col xs={24} md={12} lg={6} key={i}>
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  custom={i + 1}
                >
                  <motion.div
                    whileHover={{ y: -6, boxShadow: "0 12px 32px rgba(0,0,0,0.1)" }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <Card
                      bordered={false}
                      hoverable
                      style={{
                        borderRadius: 16,
                        textAlign: "center",
                        height: "100%",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div style={{ marginBottom: 16 }}>{f.icon}</div>
                      <Title level={4} style={{ marginBottom: 8 }}>
                        {f.title}
                      </Title>
                      <Paragraph style={{ color: "#666" }}>
                        {f.desc}
                      </Paragraph>
                    </Card>
                  </motion.div>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* ANALYTICS / STATS */}
      <section
        style={{
          padding: "90px 24px",
          background: "linear-gradient(90deg, #f9f0ff 0%, #e6f4ff 100%)",
        }}
      >
        <div style={containerStyle}>
          <Row
            gutter={[32, 32]}
            align="middle"
            justify="center"
            style={{ margin: "0 auto" }}
          >
            <Col xs={24} md={10}>
              <motion.img
                src={heroImage}
                alt="Analytics Dashboard"
                style={{
                  width: "100%",
                  borderRadius: 16,
                  boxShadow: "0 6px 24px rgba(0,0,0,0.1)",
                  objectFit: "cover",
                }}
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, amount: 0.4 }}
              />
            </Col>
            <Col xs={24} md={14}>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
              >
                <Title level={2}>Empowering Data Insights</Title>
                <Paragraph style={{ color: "#555", fontSize: 16 }}>
                  CityPulse transforms civic data into actionable insights —
                  enabling leaders to identify issues faster and citizens to
                  monitor city growth with transparency.
                </Paragraph>
                <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
                  {[
                    { number: "2.4K+", label: "Issues Resolved" },
                    { number: "98%", label: "Citizen Satisfaction" },
                    { number: "19", label: "Cities Connected" },
                  ].map((stat, i) => (
                    <Col xs={8} key={i}>
                      <Card
                        bordered={false}
                        style={{
                          textAlign: "center",
                          borderRadius: 12,
                          boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                        }}
                      >
                        <Title level={3} style={{ marginBottom: 4 }}>
                          {stat.number}
                        </Title>
                        <Text type="secondary">{stat.label}</Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </motion.div>
            </Col>
          </Row>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          background: "linear-gradient(90deg, #1677ff 0%, #722ed1 100%)",
          color: "#fff",
          padding: "100px 24px",
          textAlign: "center",
        }}
      >
        <div style={containerStyle}>
          <Title level={2} style={{ color: "#fff", marginBottom: 12 }}>
            Ready to Transform Your City?
          </Title>
          <Paragraph style={{ color: "#f5f5f5", fontSize: 18, maxWidth: 720, margin: "0 auto" }}>
            Join the CityPulse movement and make urban living more efficient,
            transparent, and connected.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            style={{
              background: "#fff",
              color: "#1677ff",
              borderRadius: 30,
              fontWeight: 600,
              marginTop: 20,
              paddingInline: 32,
            }}
            onClick={() => navigate("/register")}
          >
            Get Started
          </Button>
        </div>
      </section>
    </div>
  );
}

export default Home;
