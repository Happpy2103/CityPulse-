import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
} from "antd";
import {
  PlusOutlined,
  EnvironmentOutlined,
  ArrowLeftOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { theme } from "antd";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Header, Content } = Layout;

const API_ISSUES = "http://localhost:5028/api/Issues";
const API_CATEGORIES = "http://localhost:5028/api/Categories";
const API_PRIORITIES = "http://localhost:5028/api/Priorities";

export default function EditIssue() {
  const navigate = useNavigate();
  const { id } = useParams(); // route: /EditIssue/:id
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [form] = Form.useForm();

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [issue, setIssue] = useState(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });

  const getDisplayName = (u) =>
    u?.name || u?.displayName || u?.email || "Citizen";

  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      setLocationName(data.display_name || "");
    } catch {
      setLocationName("");
    }
  };

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

        await reverseGeocode(lat, lon);
      },
      () => message.warning("Location access denied.")
    );
  };

  // Helper to unwrap { success, data } or raw object
  const extractData = (body) => {
    if (!body) return null;
    if (body.data) return body.data;
    return body;
  };

  useEffect(() => {
    const init = async () => {
      try {
        const stored = localStorage.getItem("user");
        const localUser = stored ? JSON.parse(stored) : null;

        if (!localUser) {
          navigate("/login");
          return;
        }

        const [issueRes, catRes, priRes] = await Promise.all([
          fetch(`${API_ISSUES}/${id}`),
          fetch(API_CATEGORIES),
          fetch(API_PRIORITIES),
        ]);

        if (!issueRes.ok || !catRes.ok || !priRes.ok) {
          throw new Error("Failed to load edit data");
        }

        const [issueBody, catBody, priBody] = await Promise.all([
          issueRes.json(),
          catRes.json(),
          priRes.json(),
        ]);

        // unwrap responses
        if (issueBody?.success === false) {
          throw new Error(issueBody.message || "Failed to load issue");
        }

        const issueData = extractData(issueBody);
        const catData = Array.isArray(catBody) ? catBody : catBody.data || [];
        const priData = Array.isArray(priBody) ? priBody : priBody.data || [];

        if (!issueData) {
          throw new Error("Issue not found");
        }

        setIssue(issueData);
        setCategories(catData || []);
        setPriorities(priData || []);

        // set form initial values
        form.setFieldsValue({
          title: issueData.title,
          description: issueData.description,
          categoryId: issueData.categoryId,
          priorityId: issueData.priorityId,
          latitude: issueData.latitude ?? 0,
          longitude: issueData.longitude ?? 0,
        });

        if (issueData.latitude && issueData.longitude) {
          reverseGeocode(issueData.latitude, issueData.longitude);
        }
      } catch (err) {
        console.error(err);
        message.error(err.message || "Failed to load issue for editing");
        navigate("/ViewMyIssue");
      } finally {
        setFetching(false);
      }
    };

    init();
  }, [id, form, navigate]);

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
      const catData = extractData(addedCat) || addedCat;
      setCategories((prev) => [...prev, catData]);
      setNewCategory({ name: "", description: "" });
      setIsCategoryModalOpen(false);
      message.success("Category added successfully!");
    } catch {
      message.error("Failed to add category.");
    }
  };

  const handleSubmit = async (values) => {
  if (!issue) return;

  const stored = localStorage.getItem("user");
  const localUser = stored ? JSON.parse(stored) : null;

  if (!localUser) {
    message.warning("Please login first.");
    navigate("/login");
    return;
  }

  const payload = {
    issueId: issue.issueId,
    title: values.title,
    description: values.description,
    categoryId: Number(values.categoryId),
    priorityId: Number(values.priorityId),
    statusId: issue.statusId, // keep same status when editing
    reportedBy: Number(issue.reportedBy ?? localUser.userId),
    latitude: parseFloat(values.latitude || 0),
    longitude: parseFloat(values.longitude || 0),
    createdAt: issue.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: issue.resolvedAt || null,
  };

  setLoading(true);
  try {
    const res = await fetch(`${API_ISSUES}/${issue.issueId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(body?.message || "Failed to update issue.");
    }

    if (body?.success === false) {
      throw new Error(body?.message || "Issue update failed.");
    }

    const updatedIssue = extractData(body) || payload;
    setIssue(updatedIssue);

    // ✅ show success toast
    message.success(body?.message || "Issue updated successfully.");

    // ✅ immediately go to My Issues
    navigate("/ViewMyIssue");
  } catch (err) {
    console.error(err);
    message.error(err.message || "Something went wrong while updating.");
  } finally {
    setLoading(false);
  }
};


  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      {/* Header – consistent with other pages */}
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
            onClick={() => navigate("/ViewMyIssue")}
          >
            Back to My Issues
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
        <Row justify="center" style={{ marginBottom: 24 }}>
          <Col xs={24} md={22} lg={18} xl={14}>
            <div style={{ marginBottom: 8 }}>
              <Title level={2} style={{ margin: 0 }}>
                Edit Issue
              </Title>
              <Text type="secondary">
                Update the details of your reported issue.
              </Text>
            </div>
          </Col>
        </Row>

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
                      Update the title and description of your report.
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
                      Adjust how this issue is classified and prioritized.
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
                        onClick={() => setIsCategoryModalOpen(true)}
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
                      Update where this issue is happening if needed.
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
                          Location not resolved yet.
                        </Text>
                      )}

                      <Space
                        direction="vertical"
                        style={{ width: "100%", marginTop: 8 }}
                      >
                        <Button onClick={getLocation} block>
                          Use my current location
                        </Button>

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
                                  Latitude
                                </span>
                              }
                            >
                              <Input />
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
                                  Longitude
                                </span>
                              }
                            >
                              <Input />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Space>
                    </Col>
                    <Col xs={24} md={8}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        If automatic location doesn’t work, you can adjust
                        latitude/longitude or describe the address clearly in
                        the description above.
                      </Text>
                    </Col>
                  </Row>

                  <Divider style={{ margin: "24px 0 16px" }} />

                  <Row justify="space-between" align="middle">
                    <Col>
                      <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate("/ViewMyIssue")}
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
                        {loading ? "Saving..." : "Save changes"}
                      </Button>
                    </Col>
                  </Row>
                </Form>
              )}

              {/* Add Category Modal */}
              <Modal
                title="Add new category"
                open={isCategoryModalOpen}
                onCancel={() => setIsCategoryModalOpen(false)}
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
