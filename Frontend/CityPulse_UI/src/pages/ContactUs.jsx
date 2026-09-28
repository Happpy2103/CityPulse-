// src/pages/ContactUs.jsx
import React, { useState } from "react";
import { Input, Button, Form, Typography, message, Row, Col, Card } from "antd";
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import heroImage from "../assets/5.jpg";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function ContactUs() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    setLoading(true);

    // Mock submission
    setTimeout(() => {
      console.log("Contact form submitted:", values);
      message.success("Message sent successfully! We’ll get back to you soon.");
      form.resetFields();
      setLoading(false);
    }, 1200);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 24px 48px", // top padding to clear fixed header
      }}
    >
      <Card
        bordered={false}
        style={{
          width: "100%",
          maxWidth: 900,
          borderRadius: 22,
          padding: "32px 32px 28px",
          background: "rgba(255,255,255,0.94)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
          animation: "fadeUp 0.8s ease-out",
        }}
      >
        <Row gutter={[32, 24]}>
          {/* Left column: title + info */}
          <Col xs={24} md={10}>
            <div style={{ marginBottom: 16 }}>
              <Title level={2} style={{ marginBottom: 8 }}>
                Contact Us
              </Title>
              <Paragraph style={{ marginBottom: 4, color: "#555" }}>
                Have a question, feature idea, or want to pilot CityPulse in
                your city?
              </Paragraph>
              <Paragraph style={{ marginBottom: 0, color: "#777" }}>
                Fill out the form, and our team will get back to you within{" "}
                <Text strong>1–2 business days.</Text>
              </Paragraph>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 16,
                background: "#f5f7ff",
              }}
            >
              <Title level={5} style={{ marginBottom: 8 }}>
                Reach us directly
              </Title>
              <Paragraph style={{ marginBottom: 8 }}>
                <MailOutlined style={{ marginRight: 8, color: "#1677ff" }} />
                <a href="mailto:support@citypulse.com">support@citypulse.com</a>
              </Paragraph>
              <Paragraph style={{ marginBottom: 8 }}>
                <PhoneOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                +91-00000-00000
              </Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                <EnvironmentOutlined
                  style={{ marginRight: 8, color: "#722ed1" }}
                />
                India · Available Mon–Fri, 10:00 AM – 6:00 PM IST
              </Paragraph>
            </div>
          </Col>

          {/* Right column: form */}
          <Col xs={24} md={14}>
            <Form
              layout="vertical"
              form={form}
              onFinish={handleSubmit}
              requiredMark={false}
            >
              <Form.Item
                name="name"
                label="Name"
                rules={[
                  { required: true, message: "Please enter your name" },
                  { min: 2, message: "Name should be at least 2 characters" },
                ]}
              >
                <Input placeholder="Enter your name" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter your email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input placeholder="Enter your email" />
              </Form.Item>

              <Form.Item
                name="subject"
                label="Subject"
                rules={[
                  { required: true, message: "Please enter a subject" },
                ]}
              >
                <Input placeholder="Let us know what this is about" />
              </Form.Item>

              <Form.Item
                name="message"
                label="Message"
                rules={[
                  { required: true, message: "Please enter your message" },
                  {
                    min: 10,
                    message: "Message should be at least 10 characters",
                  },
                ]}
              >
                <TextArea placeholder="Your message..." rows={4} />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 44, fontSize: 15, fontWeight: 600 }}
              >
                Send Message
              </Button>
            </Form>
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
