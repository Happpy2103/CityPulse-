// src/pages/ReportIssue.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Select,
  Modal,
  Spin,
  Typography,
  Card,
  Row,
  Col,
  Divider,
  message,
  Layout,
  Space,
  Upload,
} from "antd";
import {
  PlusOutlined,
  EnvironmentOutlined,
  ArrowLeftOutlined,
  LogoutOutlined,
  UserOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { theme } from "antd";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Header, Content } = Layout;
const { Dragger } = Upload;

const API_ISSUES = "http://localhost:5028/api/Issues";
const API_CATEGORIES = "http://localhost:5028/api/Categories";
const API_PRIORITIES = "http://localhost:5028/api/Priorities";
const API_ISSUE_MEDIAS = "http://localhost:5028/api/IssueMedias";

export default function ReportIssue() {
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // read user only for display; effect will read directly from localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

  // media files (local, not auto-uploaded)
  const [mediaFiles, setMediaFiles] = useState([]);

  // -------- Helpers --------
  const getDisplayName = (u) =>
    u?.name || u?.displayName || u?.email || "Citizen";

  const getLocation = () => {
    if (!navigator.geolocation) {
      message.error("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        form.setFieldsValue({ latitude: lat, longitude: lon });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await res.json();
          setLocationName(data.display_name || "");
        } catch {
          setLocationName("");
        }
      },
      () => message.warning("Location access denied.")
    );
  };

  // ✅ FIX: don't depend on `user` object (which changes every render)
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const stored = localStorage.getItem("user");
      const localUser = stored ? JSON.parse(stored) : null;

      if (!localUser) {
        navigate("/login");
        return;
      }

      try {
        const [catRes, priRes] = await Promise.all([
          fetch(API_CATEGORIES),
          fetch(API_PRIORITIES),
        ]);

        if (!catRes.ok || !priRes.ok) {
          throw new Error("Failed to load form data");
        }

        const [catData, priData] = await Promise.all([
          catRes.json(),
          priRes.json(),
        ]);

        if (!isMounted) return;

        setCategories(catData || []);
        setPriorities(priData || []);
      } catch (err) {
        if (isMounted) {
          console.error(err);
          message.error("Failed to load form data.");
        }
      } finally {
        if (isMounted) setFetching(false);
      }

      // also fetch location once
      getLocation();
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [navigate]); // 👈 only depends on navigate

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.description) {
      message.warning("Please fill all category fields.");
      return;
    }
    try {
      const res = await fetch(API_CATEGORIES, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });
      if (!res.ok) throw new Error();
      const addedCat = await res.json();
      setCategories((prev) => [...prev, addedCat]);
      setNewCategory({ name: "", description: "" });
      setIsModalOpen(false);
      message.success("Category added successfully!");
    } catch {
      message.error("Failed to add category.");
    }
  };

  // upload media after issue is created

  // upload media after issue is created
const uploadIssueMedia = async (issueId) => {
  if (!mediaFiles.length) return;

  for (const file of mediaFiles) {
    try {
      // Ant Design Upload wraps the real File in `originFileObj`
      const realFile = file.originFileObj || file;

      const formData = new FormData();
      formData.append("issueId", issueId);   // matches int issueId in controller
      formData.append("file", realFile);     // matches IFormFile file in controller

      const res = await fetch(API_ISSUE_MEDIAS, {
        method: "POST",
        body: formData, // don't set Content-Type manually
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.warn(
          "[IssueMedia] Upload failed for file:",
          file.name,
          "server says:",
          txt
        );
      } else {
        console.log("[IssueMedia] Uploaded:", file.name);
      }
    } catch (err) {
      console.error("[IssueMedia] error uploading file", file.name, err);
    }
  }
};


  const handleSubmit = async (values) => {
  const stored = localStorage.getItem("user");
  const localUser = stored ? JSON.parse(stored) : null;

  if (!localUser) {
    message.warning("Please login first.");
    navigate("/login");
    return;
  }

  const payload = {
    issueId: 0,
    title: values.title,
    description: values.description,
    categoryId: Number(values.categoryId),
    priorityId: Number(values.priorityId),
    statusId: 1, // Reported
    reportedBy: Number(localUser.userId),
    latitude: parseFloat(values.latitude || 0),
    longitude: parseFloat(values.longitude || 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
  };

  setLoading(true);
  try {
    const res = await fetch(API_ISSUES, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Try to read JSON response
    const body = await res.json().catch(() => null);
    console.log("Issue POST response:", res.status, body);

    // HTTP error
    if (!res.ok) {
      throw new Error(body?.message || "Failed to submit issue.");
    }

    // API error (success: false)
    if (!body?.success) {
      throw new Error(body?.message || "Issue creation failed.");
    }

    // ✅ success === true here
    const issue = body.data || {};
    const newIssueId = issue.issueId;
    console.log("New issue id:", newIssueId);

    if (newIssueId) {
      await uploadIssueMedia(newIssueId);
    }

    // Show toast immediately
    message.success(body.message || "Issue created successfully.");

    // Show info modal (optional, for UX)
    Modal.info({
      title: "Issue reported successfully",
      content: (
        <>
          <p>{body.message || "Thank you for helping improve our city."}</p>
          {locationName && <p>📍 {locationName}</p>}
          {mediaFiles.length > 0 && (
            <p>
              📎 {mediaFiles.length} file
              {mediaFiles.length > 1 ? "s" : ""} attached
            </p>
          )}
          <p style={{ marginTop: 8 }}>
            You can now track this in <b>My Issues</b>.
          </p>
        </>
      ),
      okText: "Go to My Issues",
      onOk: () => {
        console.log("Modal OK clicked → navigating");
        navigate("/ViewMyIssue");
      },
    });

    // Also navigate even if user closes modal with ESC / X
    navigate("/ViewMyIssue");

    // Reset form and local UI state
    form.resetFields();
    setLocationName("");
    setMediaFiles([]);
  } catch (err) {
    console.error("Issue submit error:", err);
    message.error(err.message || "Something went wrong while submitting.");
  } finally {
    setLoading(false);
  }
};


  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // -------- UI --------
  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      {/* Header – consistent with Cdashboard */}
      <Header
        style={{
          background: colorBgContainer,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "#1677ff",
              borderRadius: 6,
            }}
          />
          <Title level={4} style={{ margin: 0 }}>
            Citizen Portal
          </Title>
        </div>

        <Space size="large">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/Cdashboard")}
          >
            Back to Dashboard
          </Button>

          {user && (
            <Space align="center" style={{ marginRight: 8 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#1677ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <UserOutlined />
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <Text strong style={{ display: "block" }}>
                  {getDisplayName(user)}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Citizen
                </Text>
              </div>
            </Space>
          )}

          <Button
            type="text"
            icon={<LogoutOutlined />}
            danger
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: "32px 48px" }}>
        {/* Page title + helper */}
        <Row justify="center" style={{ marginBottom: 24 }}>
          <Col xs={24} md={22} lg={18} xl={14}>
            <div style={{ marginBottom: 8 }}>
              <Title level={2} style={{ margin: 0 }}>
                Report a City Issue
              </Title>
              <Text type="secondary">
                Fill in the details below so we can route your issue to the
                correct department.
              </Text>
            </div>
          </Col>
        </Row>

        {/* Main form card */}
        <Row justify="center">
          <Col xs={24} md={22} lg={18} xl={14}>
            <Card
              bordered={false}
              style={{
                borderRadius: borderRadiusLG,
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              }}
              bodyStyle={{ padding: 28 }}
            >
              {fetching ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                  }}
                >
                  <Spin size="large" />
                </div>
              ) : (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  initialValues={{ latitude: 0, longitude: 0 }}
                >
                  {/* Section 1: Issue details */}
                  <div style={{ marginBottom: 16 }}>
                    <Title level={4} style={{ marginBottom: 4 }}>
                      Issue details
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Describe what’s happening and why it matters.
                    </Text>
                  </div>

                  <Row gutter={24}>
                    <Col xs={24} md={24}>
                      <Form.Item
                        label="Issue title"
                        name="title"
                        rules={[
                          {
                            required: true,
                            message: "Please enter an issue title",
                          },
                        ]}
                        extra="Example: 'Pothole on main road near bus stop'."
                      >
                        <Input placeholder="Enter a short, clear title" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={24}>
                      <Form.Item
                        label="Description"
                        name="description"
                        rules={[
                          {
                            required: true,
                            message: "Please describe the issue",
                          },
                        ]}
                        extra="Include where it is, since when, and any risks to people or property."
                      >
                        <TextArea
                          rows={5}
                          placeholder="Describe the issue in detail..."
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider style={{ margin: "20px 0" }} />

                  {/* Section 2: Category & priority */}
                  <div style={{ marginBottom: 16 }}>
                    <Title level={4} style={{ marginBottom: 4 }}>
                      Category & priority
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Help us classify and prioritize your report correctly.
                    </Text>
                  </div>

                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Category"
                        name="categoryId"
                        rules={[
                          {
                            required: true,
                            message: "Please select a category",
                          },
                        ]}
                      >
                        <Select placeholder="Select category" size="large">
                          {categories.map((c) => (
                            <Option key={c.categoryId} value={c.categoryId}>
                              {c.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Button
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalOpen(true)}
                        block
                        type="dashed"
                      >
                        Add new category
                      </Button>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Priority"
                        name="priorityId"
                        rules={[
                          {
                            required: true,
                            message: "Please select a priority",
                          },
                        ]}
                        extra="Use higher priority for safety risks or urgent issues."
                      >
                        <Select placeholder="Select priority" size="large">
                          {priorities.map((p) => (
                            <Option key={p.priorityId} value={p.priorityId}>
                              {p.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider style={{ margin: "20px 0" }} />

                  {/* Section 3: Location */}
                  <div style={{ marginBottom: 16 }}>
                    <Title level={4} style={{ marginBottom: 4 }}>
                      Location
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Share where this issue is happening so we can find it
                      quickly.
                    </Text>
                  </div>

                  <Row gutter={24}>
                    <Col xs={24} md={16}>
                      {locationName ? (
                        <div
                          style={{
                            background: "#f5f5f5",
                            padding: "10px 14px",
                            borderRadius: 10,
                            marginBottom: 8,
                            fontSize: 13,
                          }}
                        >
                          <EnvironmentOutlined /> <span>{locationName}</span>
                        </div>
                      ) : (
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          Location not fetched yet.
                        </Text>
                      )}

                      <Space
                        direction="vertical"
                        style={{ width: "100%", marginTop: 8 }}
                      >
                        <Button onClick={getLocation} block>
                          Use my current location
                        </Button>

                        {/* Show lat/long as read-only technical fields */}
                        <Row gutter={12}>
                          <Col span={12}>
                            <Form.Item
                              name="latitude"
                              label={
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "#9ca3af",
                                  }}
                                >
                                  Latitude (auto)
                                </span>
                              }
                            >
                              <Input disabled />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="longitude"
                              label={
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "#9ca3af",
                                  }}
                                >
                                  Longitude (auto)
                                </span>
                              }
                            >
                              <Input disabled />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Space>
                    </Col>
                    <Col xs={24} md={8}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        If automatic location doesn’t work, you can still
                        describe the address clearly in the description above.
                      </Text>
                    </Col>
                  </Row>

                  <Divider style={{ margin: "20px 0" }} />

                  {/* Section 4: Media upload (optional) */}
                  <div style={{ marginBottom: 16 }}>
                    <Title level={4} style={{ marginBottom: 4 }}>
                      Photos & videos (optional)
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Attach images or short videos to help officers understand
                      the issue better.
                    </Text>
                  </div>

                  <Form.Item>
                   <Dragger
  multiple
  accept="image/*,video/*"
  beforeUpload={(file) => {
    setMediaFiles((prev) => [...prev, file]);
    return false; // prevent auto-upload by AntD
  }}
  onRemove={(file) => {
    setMediaFiles((prev) => prev.filter((f) => f.uid !== file.uid));
  }}
  fileList={mediaFiles}
  style={{ borderRadius: 12 }}
>
  <p className="ant-upload-drag-icon">
    <InboxOutlined />
  </p>
  <p className="ant-upload-text">
    Click or drag files to this area to upload
  </p>
  <p className="ant-upload-hint">
    You can add multiple files. Max size and count can be limited on the
    server.
  </p>
</Dragger>

                  </Form.Item>

                  <Divider style={{ margin: "24px 0 16px" }} />

                  <Row justify="space-between" align="middle">
                    <Col>
                      <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate("/Cdashboard")}
                      >
                        Cancel
                      </Button>
                    </Col>
                    <Col>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        size="large"
                        style={{
                          borderRadius: 8,
                          minWidth: 180,
                          fontWeight: 600,
                        }}
                      >
                        {loading ? "Submitting..." : "Submit issue"}
                      </Button>
                    </Col>
                  </Row>
                </Form>
              )}

              {/* Add Category Modal */}
              <Modal
                title="Add new category"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleAddCategory}
                okText="Add category"
              >
                <Form layout="vertical">
                  <Form.Item label="Category name" required>
                    <Input
                      placeholder="E.g. Streetlight, Garbage, Water leakage"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          name: e.target.value,
                        })
                      }
                    />
                  </Form.Item>
                  <Form.Item label="Description" required>
                    <TextArea
                      rows={3}
                      placeholder="Short description of when to use this category."
                      value={newCategory.description}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          description: e.target.value,
                        })
                      }
                    />
                  </Form.Item>
                </Form>
              </Modal>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
