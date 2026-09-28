// src/pages/ViewComments.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Card,
  Spin,
  message,
  theme,
  Modal,
  Select,
  Input,
} from "antd";
import {
  ArrowLeftOutlined,
  LogoutOutlined,
  UserOutlined,
  EyeOutlined,
  FileExclamationOutlined,
} from "@ant-design/icons";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const API_BASE = "http://localhost:5028";

export default function ViewComments() {
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Comment modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getUserFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const getDisplayName = (u) =>
    u?.name || u?.displayName || u?.email || "Citizen";

  const fmtDateIsoToLocal = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });
    } catch {
      return iso;
    }
  };

  // Fetch comments + issues
  const fetchAll = useCallback(
    async (currentUser) => {
      setLoading(true);
      try {
        const [resComments, resIssues] = await Promise.all([
          fetch(`${API_BASE}/api/Comments`),
          fetch(`${API_BASE}/api/Issues`),
        ]);

        if (!resComments.ok || !resIssues.ok) {
          throw new Error("Failed to load comments data");
        }

        const [commentsBody, issuesBody] = await Promise.all([
          resComments.json(),
          resIssues.json(),
        ]);

        const extractList = (body) => {
          if (!body) return [];
          if (Array.isArray(body)) return body;
          if (Array.isArray(body.data)) return body.data;
          return [];
        };

        const commentsData = extractList(commentsBody);
        const issuesData = extractList(issuesBody);

        const myId = Number(currentUser?.userId);
        const myComments = commentsData.filter(
          (c) => Number(c.userId) === myId
        );

        setComments(myComments || []);
        setIssues(issuesData || []);
      } catch (err) {
        console.error(err);
        message.error(err.message || "Failed to load comments");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const u = getUserFromStorage();
    if (!u) {
      navigate("/login");
      return;
    }
    setUser(u);
    fetchAll(u);
  }, [getUserFromStorage, navigate, fetchAll]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // issueId -> issue object
  const issueMap = useMemo(() => {
    const map = new Map();
    issues.forEach((i) => {
      map.set(i.issueId, i);
    });
    return map;
  }, [issues]);

  // only issues reported by current user
  const myIssues = useMemo(() => {
    if (!user) return [];
    const myId = Number(user.userId);
    return issues.filter((it) => Number(it.reportedBy) === myId);
  }, [issues, user]);

  // ---------------- TABLE COLUMNS ----------------
  const columns = [
    {
      title: "Comment ID",
      dataIndex: "commentId",
      key: "commentId",
      width: 100,
      align: "center",
      fixed: "left",
      render: (id) => <Text type="secondary">#{id}</Text>,
    },
    {
      title: "Issue",
      dataIndex: "issueId",
      key: "issueId",
      width: 260,
      fixed: "left",
      render: (issueId) => {
        const issue = issueMap.get(issueId);
        if (!issue) {
          return (
            <Space>
              <Tag icon={<FileExclamationOutlined />}>Issue #{issueId}</Tag>
            </Space>
          );
        }
        return (
          <Space direction="vertical" size={0}>
            <Tag icon={<FileExclamationOutlined />}>
              Issue #{issue.issueId}
            </Tag>
            <Text
              style={{
                display: "block",
                whiteSpace: "normal",
                wordBreak: "break-word",
              }}
              ellipsis={{ tooltip: issue.title }}
            >
              {issue.title || "(untitled issue)"}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Comment",
      dataIndex: "commentText",
      key: "commentText",
      // No width => this column flexes and uses remaining space
      render: (text) => (
        <Text
          style={{
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        >
          {text && text.trim().length > 0
            ? text
            : "(no comment text provided)"}
        </Text>
      ),
    },
    {
      title: "Created at",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 190,
      render: (date) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {fmtDateIsoToLocal(date)}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      align: "center",
      render: (_, record) => {
        const issue = issueMap.get(record.issueId);
        return (
          <Space size={4}>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => navigate("/ViewMyIssue")}
            >
              View Issue
            </Button>
            
          </Space>
        );
      },
    },
  ];

  const handleOpenAddModal = () => {
    setSelectedIssueId(null);
    setNewCommentText("");
    setAddModalVisible(true);
  };

  const handleAddComment = async () => {
    if (!user) {
      message.warning("Please login again.");
      navigate("/login");
      return;
    }

    if (!selectedIssueId) {
      message.warning("Please select an issue.");
      return;
    }

    if (!newCommentText || !newCommentText.trim()) {
      message.warning("Please enter a comment.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        issueId: Number(selectedIssueId),
        userId: Number(user.userId),
        commentText: newCommentText.trim(),
      };

      console.log("Submitting comment payload:", payload);

      const res = await fetch(`${API_BASE}/api/Comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("POST /api/Comments status:", res.status);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to add comment");
      }

      message.success("Comment added successfully.");

      setAddModalVisible(false);
      setSelectedIssueId(null);
      setNewCommentText("");

      const u = getUserFromStorage();
      if (u) {
        await fetchAll(u); // refresh comments list
      }
    } catch (err) {
      console.error("[AddComment] error:", err);
      message.error(err.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      {/* Header – consistent with Cdashboard / ReportIssue / ViewMyIssue */}
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
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 12,
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0 }}>
              My Comments
            </Title>
            <Text type="secondary">
              View and add comments on your reported issues.
            </Text>
          </div>
          <Button type="primary" onClick={handleOpenAddModal}>
            Add Comment
          </Button>
        </div>

        <Card
          bordered={false}
          style={{
            width: "100%",
            maxWidth: 1400,
            margin: "0 auto",
            borderRadius: borderRadiusLG,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
          bodyStyle={{ padding: 20 }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table
              rowKey={(record) => record.commentId}
              columns={columns}
              dataSource={comments}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              locale={{
                emptyText: "You haven’t added any comments yet.",
              }}
              style={{ width: "100%" }}
              // allow table to be wider than container; user can scroll horizontally
              scroll={{ x: "max-content" }}
            />
          )}
        </Card>
      </Content>

      {/* Add Comment Modal */}
      <Modal
        open={addModalVisible}
        title="Add Comment"
        onCancel={() => {
          if (submitting) return;
          setAddModalVisible(false);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              if (submitting) return;
              setAddModalVisible(false);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={handleAddComment}
          >
            Submit Comment
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">Select one of your reported issues:</Text>
          <Select
            style={{ marginTop: 6, width: "100%" }}
            placeholder="Select issue"
            value={selectedIssueId}
            onChange={(val) => setSelectedIssueId(val)}
            showSearch
            optionFilterProp="children"
          >
            {myIssues.map((issue) => (
              <Option key={issue.issueId} value={issue.issueId}>
                #{issue.issueId} — {issue.title || "(untitled issue)"}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <Text type="secondary">Your comment:</Text>
          <TextArea
            rows={4}
            style={{ marginTop: 6 }}
            placeholder="Write your comment here..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
          />
        </div>
      </Modal>
    </Layout>
  );
}
