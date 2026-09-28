// src/pages/Blog.jsx
import React from "react";
import { Card, Row, Col, Typography, Tag } from "antd";
import heroImage from "../assets/5.jpg";

const { Title, Paragraph, Text } = Typography;

export default function Blog() {
  const posts = [
    {
      title: "CityPulse Launches New Dashboard",
      date: "Oct 20, 2025",
      category: "Updates",
      desc: "Our newest dashboard redesign improves visibility, usability, and real-time reporting across all departments.",
    },
    {
      title: "IoT Sensors Improve City Management",
      date: "Sep 12, 2025",
      category: "Technology",
      desc: "Smart infrastructure is transforming cities with air quality tracking, traffic optimization, and utility intelligence.",
    },
    {
      title: "Citizen Engagement Drives Change",
      date: "Aug 30, 2025",
      category: "Community",
      desc: "Discover how digitization and transparency are enabling citizens to report issues and see results faster than ever.",
    },
    
  ];

  const tagColor = (category) => {
    switch (category) {
      case "Updates":
        return "blue";
      case "Technology":
        
        return "purple";
      case "Community":
        return "green";
      default:
        return "default";
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #ffffff 0%, #f7f9fc 60%, #f9f0ff 100%)",
        paddingTop: 80,
      }}
    >
      {/* Hero Header */}
      <div
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "100px 24px 72px",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <Title style={{ color: "#fff", marginBottom: 12 }}>
          CityPulse Blog & Updates
        </Title>
        <Paragraph style={{ color: "#e5e5e5", fontSize: 16 }}>
          Product updates, smart city insights, and community success stories.
        </Paragraph>
      </div>

      {/* Blog Grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
        <Row gutter={[32, 32]}>
          {posts.map((post, i) => (
            <Col xs={24} md={12} lg={8} key={i}>
              <Card
                hoverable
                style={{
                  borderRadius: 18,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                }}
                bodyStyle={{ flex: 1 }}
              >
                <Tag color={tagColor(post.category)}>{post.category}</Tag>

                <Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
                  {post.title}
                </Title>

                <Text type="secondary" style={{ fontSize: 13 }}>
                  {post.date}
                </Text>

                <Paragraph style={{ marginTop: 12, fontSize: 14 }}>
                  {post.desc}
                </Paragraph>

                <div style={{ marginTop: "auto", paddingTop: 12 }}>
                  <Text
                    style={{
                      color: "#1677ff",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Read more →
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
