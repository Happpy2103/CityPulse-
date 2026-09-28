// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Card,
  Button,
  Avatar,
  Space,
  Statistic,
  Skeleton,
  message,
  Alert,
  Collapse,
  Typography,
  Layout,
  theme,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  IdcardOutlined,
  ReloadOutlined,
  MessageOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

// 📈 SIMPLE LINE CHART IMPORTS
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const { Panel } = Collapse;
const { Title, Text } = Typography;
const { Header, Content } = Layout;

// Adjust this if your backend base URL is different in other environments
const API_BASE = "http://localhost:5028";

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [rawResponseText, setRawResponseText] = useState(null);

  // Categories
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  // Comments
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);

  // Statuses
  const [statuses, setStatuses] = useState([]);
  const [statusesLoading, setStatusesLoading] = useState(false);
  const [statusesError, setStatusesError] = useState(null);

  // Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

  // Priorities
  const [priorities, setPriorities] = useState([]);
  const [prioritiesLoading, setPrioritiesLoading] = useState(false);
  const [prioritiesError, setPrioritiesError] = useState(null);

  // Issues – only count needed here
  const [issuesCount, setIssuesCount] = useState(0);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState(null);

  const getUserFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (e) {
      console.warn("Failed parse user from localStorage", e);
      return null;
    }
  }, []);

  // --- fetchPriorities ---
  const fetchPriorities = useCallback(async () => {
    setPrioritiesLoading(true);
    setPrioritiesError(null);
    try {
      const url = `${API_BASE}/api/Priorities`;
      console.log("[Priorities] requesting", url);
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text().catch(() => null);

      if (!res.ok) {
        const errMsg = `Priorities API returned ${res.status} ${res.statusText}${
          text ? ` — ${text}` : ""
        }`;
        setPriorities([]);
        setPrioritiesError(errMsg);
        console.warn(errMsg);
        message.error("Failed to load priorities");
        return;
      }

      if (!contentType.includes("application/json")) {
        const errMsg =
          "Priorities endpoint did not return JSON. Raw body logged to console.";
        setPriorities([]);
        setPrioritiesError(errMsg);
        console.warn(errMsg, "raw:", text);
        message.error("Failed to load priorities (non-JSON response)");
        return;
      }

      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        setPriorities([]);
        setPrioritiesError("Unexpected response shape from Priorities API");
        console.warn("Unexpected priorities shape", data);
      } else {
        const normalized = data.map((p) => ({
          key: p.priorityId ?? String(Math.random()),
          priorityId: p.priorityId,
          name: p.name ?? "",
          level: p.level,
          raw: p,
        }));
        setPriorities(normalized);
      }
    } catch (err) {
      console.warn("Failed to fetch priorities", err);
      setPriorities([]);
      setPrioritiesError("Network or server error while fetching priorities");
      message.error("Failed to load priorities");
    } finally {
      setPrioritiesLoading(false);
    }
  }, []);

  const fetchDashboard = useCallback(
    async (roleId) => {
      setLoading(true);
      setStats(null);
      setStatsError(null);
      setRawResponseText(null);

      const url = `${API_BASE}/api/dashboard${
        typeof roleId !== "undefined" && roleId !== null
          ? `?roleId=${encodeURIComponent(roleId)}`
          : ""
      }`;
      try {
        console.log("[Dashboard] requesting", url);
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
        });

        console.log("[Dashboard] status", res.status, res.statusText);
        const contentType = res.headers.get("content-type") || "";
        const text = await res.text().catch((e) => {
          console.warn("Failed to read dashboard response text", e);
          return null;
        });
        setRawResponseText(text);

        if (
          contentType.includes("text/html") ||
          !contentType.includes("application/json")
        ) {
          console.warn(
            "[Dashboard] dashboard endpoint returned HTML or non-JSON content. Falling back to /api/Categories."
          );
          await fetchCategoriesAndUseAsStats();
          return;
        }

        if (!res.ok) {
          const err = `Dashboard API returned ${res.status} ${res.statusText}`;
          console.warn(err, "body:", text);
          setStatsError(`${err}${text ? ` — body: ${text}` : ""}`);
          return;
        }

        if (!text || /^\s*$/.test(text)) {
          console.warn(
            "Dashboard API returned empty body; falling back to categories."
          );
          await fetchCategoriesAndUseAsStats();
          return;
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.warn(
            "Failed to parse dashboard JSON, falling back to categories.",
            e
          );
          await fetchCategoriesAndUseAsStats();
          return;
        }

        if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
          console.warn(
            "Dashboard API returned empty object; falling back to categories."
          );
          await fetchCategoriesAndUseAsStats();
          return;
        }

        setStats(data);
      } catch (err) {
        console.warn("dashboard fetch failed, falling back to categories", err);
        await fetchCategoriesAndUseAsStats();
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const url = `${API_BASE}/api/Categories`;
      console.log("[Categories] requesting", url);
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text().catch(() => null);
      console.log("[Categories] status", res.status, contentType);
      if (!res.ok) {
        const errMsg = `Categories API returned ${res.status} ${res.statusText}${
          text ? ` — ${text}` : ""
        }`;
        setCategories([]);
        setCategoriesError(errMsg);
        console.warn(errMsg);
        message.error("Failed to load categories");
        return;
      }

      if (!contentType.includes("application/json")) {
        const errMsg =
          "Categories endpoint did not return JSON. Raw body logged to console.";
        setCategories([]);
        setCategoriesError(errMsg);
        console.warn(errMsg, "raw:", text);
        message.error("Failed to load categories (non-JSON response)");
        return;
      }

      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        setCategories([]);
        setCategoriesError("Unexpected response shape from Categories API");
        console.warn("Unexpected categories shape", data);
      } else {
        setCategories(data);
      }
    } catch (err) {
      console.warn("Failed to fetch categories", err);
      setCategories([]);
      setCategoriesError("Network or server error while fetching categories");
      message.error("Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const fetchCategoriesAndUseAsStats = useCallback(async () => {
    try {
      const url = `${API_BASE}/api/Categories`;
      console.log("[Fallback] requesting categories for fallback stats:", url);
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const text = await res.text().catch(() => null);
      const contentType = res.headers.get("content-type") || "";
      setRawResponseText((prev) => prev ?? text);
      if (!res.ok) {
        const err = `Categories API returned ${res.status} ${res.statusText}${
          text ? ` — ${text}` : ""
        }`;
        console.warn(err);
        setStatsError(err);
        return;
      }
      if (!contentType.includes("application/json")) {
        const err = "Categories endpoint returned non-JSON (likely HTML).";
        console.warn(err, "raw:", text);
        setStatsError(err + " See console for raw body.");
        return;
      }
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        console.warn(
          "Categories returned non-array, cannot use as fallback stats.",
          data
        );
        setStatsError("Categories returned unexpected shape.");
        return;
      }
      setCategories(data);
      setStats({
        totalCategories: data.length,
        categoriesPreview: data.slice(0, 5),
      });
      setStatsError(null);
    } catch (err) {
      console.warn("Fallback categories fetch failed", err);
      setStatsError(
        "Fallback categories fetch failed: " + (err?.message || String(err))
      );
    }
  }, []);

  const fetchComments = useCallback(async () => {
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const url = `${API_BASE}/api/Comments`;
      console.log("[Comments] requesting", url);
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text().catch(() => null);
      if (!res.ok) {
        const errMsg = `Comments API returned ${res.status} ${res.statusText}${
          text ? ` — ${text}` : ""
        }`;
        setComments([]);
        setCommentsError(errMsg);
        console.warn(errMsg);
        message.error("Failed to load comments");
        return;
      }

      if (!contentType.includes("application/json")) {
        const errMsg =
          "Comments endpoint did not return JSON. Raw body logged to console.";
        setComments([]);
        setCommentsError(errMsg);
        console.warn(errMsg, "raw:", text);
        message.error("Failed to load comments (non-JSON response)");
        return;
      }

      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        setComments([]);
        setCommentsError("Unexpected response shape from Comments API");
        console.warn("Unexpected comments shape", data);
      } else {
        const normalized = data.map((c) => ({
          key: c.commentId ?? String(Math.random()),
          commentId: c.commentId,
          issueId: c.issueId,
          userId: c.userId,
          commentText: c.commentText ?? "",
          createdAt: c.createdAt,
          raw: c,
        }));
        normalized.sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });
        setComments(normalized);
      }
    } catch (err) {
      console.warn("Failed to fetch comments", err);
      setComments([]);
      setCommentsError("Network or server error while fetching comments");
      message.error("Failed to load comments");
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const fetchStatuses = useCallback(async () => {
    setStatusesLoading(true);
    setStatusesError(null);
    try {
      const url = `${API_BASE}/api/Status`;
      console.log("[Status] requesting", url);
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text().catch(() => null);

      if (!res.ok) {
        const errMsg = `Status API returned ${res.status} ${res.statusText}${
          text ? ` — ${text}` : ""
        }`;
        setStatuses([]);
        setStatusesError(errMsg);
        console.warn(errMsg);
        message.error("Failed to load statuses");
        return;
      }

      if (!contentType.includes("application/json")) {
        const errMsg =
          "Status endpoint did not return JSON. Raw body logged to console.";
        setStatuses([]);
        setStatusesError(errMsg);
        console.warn(errMsg, "raw:", text);
        message.error("Failed to load statuses (non-JSON response)");
        return;
      }

      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        setStatuses([]);
        setStatusesError("Unexpected response shape from Status API");
        console.warn("Unexpected status shape", data);
      } else {
        const normalized = data.map((s) => ({
          key: s.statusId ?? String(Math.random()),
          statusId: s.statusId,
          name: s.name ?? s.statusName ?? "",
          description: s.description ?? "",
          raw: s,
        }));
        setStatuses(normalized);
      }
    } catch (err) {
      console.warn("Failed to fetch statuses", err);
      setStatuses([]);
      setStatusesError("Network or server error while fetching statuses");
      message.error("Failed to load statuses");
    } finally {
      setStatusesLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const url = `${API_BASE}/api/Users`;
      console.log("[Users] requesting", url);
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text().catch(() => null);

      if (!res.ok) {
        const errMsg = `Users API returned ${res.status} ${res.statusText}${
          text ? ` — ${text}` : ""
        }`;
        setUsers([]);
        setUsersError(errMsg);
        console.warn(errMsg);
        message.error("Failed to load users");
        return;
      }

      if (!contentType.includes("application/json")) {
        const errMsg =
          "Users endpoint did not return JSON. Raw body logged to console.";
        setUsers([]);
        setUsersError(errMsg);
        console.warn(errMsg, "raw:", text);
        message.error("Failed to load users (non-JSON response)");
        return;
      }

      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        setUsers([]);
        setUsersError("Unexpected response shape from Users API");
        console.warn("Unexpected users shape", data);
      } else {
        const normalized = data.map((u) => ({
          key: u.userId ?? String(Math.random()),
          userId: u.userId,
          name: u.name ?? u.displayName ?? "",
          email: u.email ?? "",
          roleId: typeof u.roleId !== "undefined" ? Number(u.roleId) : undefined,
          createdAt: u.createdAt,
          raw: u,
        }));
        setUsers(normalized);
      }
    } catch (err) {
      console.warn("Failed to fetch users", err);
      setUsers([]);
      setUsersError("Network or server error while fetching users");
      message.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // 🔢 Only fetch count of issues (supports {success,data:[...]} or plain array)
  const fetchIssues = useCallback(async () => {
    setIssuesLoading(true);
    setIssuesError(null);
    try {
      const url = `${API_BASE}/api/Issues`;
      console.log("[Issues] requesting", url);
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text().catch(() => null);

      if (!res.ok) {
        const errMsg = `Issues API returned ${res.status} ${res.statusText}${
          text ? ` — ${text}` : ""
        }`;
        console.warn(errMsg);
        setIssuesCount(0);
        setIssuesError(errMsg);
        message.error("Failed to load issues");
        return;
      }

      if (!contentType.includes("application/json")) {
        const errMsg =
          "Issues endpoint did not return JSON. Raw body logged to console.";
        console.warn(errMsg, "raw:", text);
        setIssuesCount(0);
        setIssuesError(errMsg);
        message.error("Failed to load issues (non-JSON response)");
        return;
      }

      const data = JSON.parse(text);

      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.data)) {
        list = data.data;
      } else if (Array.isArray(data.$values)) {
        list = data.$values;
      } else {
        console.warn("Unexpected issues shape", data);
        setIssuesError("Unexpected response shape from Issues API");
        setIssuesCount(0);
        return;
      }

      setIssuesCount(list.length);
    } catch (err) {
      console.warn("Failed to fetch issues", err);
      setIssuesCount(0);
      setIssuesError("Network or server error while fetching issues");
      message.error("Failed to load issues");
    } finally {
      setIssuesLoading(false);
    }
  }, []);

  useEffect(() => {
    const u = getUserFromStorage();
    console.log("[Dashboard] loaded user from storage:", u);
    if (!u) {
      localStorage.clear();
      navigate("/login");
      return;
    }
    setUser(u);

    let roleId = null;
    if (typeof u.roleId !== "undefined") roleId = Number(u.roleId);
    else if (typeof u.role !== "undefined") roleId = Number(u.role);
    else if (u.roles && Array.isArray(u.roles) && u.roles.length)
      roleId = Number(u.roles[0].id);
    if (Number.isNaN(roleId)) roleId = null;

    fetchDashboard(roleId);
    fetchCategories();
    fetchComments();
    fetchStatuses();
    fetchPriorities();
    fetchUsers();
    fetchIssues();
  }, [
    getUserFromStorage,
    navigate,
    fetchDashboard,
    fetchCategories,
    fetchComments,
    fetchStatuses,
    fetchUsers,
    fetchIssues,
    fetchPriorities,
  ]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const getDisplayName = (u) =>
    u?.name ||
    u?.displayName ||
    (typeof u?.role === "string" ? u.role : null) ||
    u?.username ||
    u?.email ||
    "User";

  const HeaderPersona = () => (
    <Space size="middle" align="center">
      <Avatar size="large" icon={<UserOutlined />} src={user?.avatarUrl || null} />
      <div style={{ textAlign: "right", lineHeight: 1 }}>
        <div style={{ fontWeight: 600, color: "#111827" }}>
          {getDisplayName(user)}
        </div>
        <div style={{ color: "#6b7280", fontSize: 12 }}>{user?.email}</div>
      </div>
    </Space>
  );

  // filter users: only roleId 2 or 3
  const filteredUsers = users.filter((u) => u.roleId === 2 || u.roleId === 3);

  // 📈 SIMPLE LINE CHART DATA: nice line using total statuses
  const statusesLineData = useMemo(() => {
    const total = statuses.length || 0;
    const points = 6;

    if (total === 0) {
      return [];
    }

    return Array.from({ length: points }, (_, i) => ({
      label: `P${i + 1}`,
      value: Math.round((total * (i + 1)) / points),
    }));
  }, [statuses]);

  // Reusable StatCard (same concept as Cdashboard)
  const StatCard = ({ title, value, icon, color, onClick, actionText }) => (
    <Card
      hoverable
      bordered={false}
      style={{
        height: "100%",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        borderRadius: borderRadiusLG,
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {title}
          </Text>
          <Title level={2} style={{ margin: "4px 0 0" }}>
            {value}
          </Title>
          {actionText && (
            <div
              style={{
                marginTop: 12,
                color,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {actionText} <ArrowRightOutlined />
            </div>
          )}
        </div>
        <div
          style={{
            backgroundColor: `${color}20`,
            color: color,
            padding: 12,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      {/* Header similar to Cdashboard */}
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
          {/* Logo placeholder */}
          <div
            style={{
              width: 32,
              height: 32,
              background: "#1677ff",
              borderRadius: 6,
            }}
          ></div>
          <Title level={4} style={{ margin: 0 }}>
            Admin Console
          </Title>
        </div>

        <Space size="large">
          <HeaderPersona />
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            danger
          >
            Sign Out
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: "32px 48px" }}>
        {/* Welcome + primary action row */}
        <div
          style={{
            marginBottom: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Dashboard Overview
            </Title>
            <Text type="secondary">
              Monitor categories, issues, users, and overall city operations.
            </Text>
          </div>

          <Button
            type="primary"
            size="large"
            style={{ padding: "0 32px", height: 44, fontSize: 14 }}
            onClick={() => navigate("/IssuesPage")}
          >
            Go to Issues
          </Button>
        </div>

        {/* Main content: loading / error / stats + chart */}
        {loading ? (
          <Skeleton active />
        ) : statsError ? (
          <>
            <Alert
              message="Unable to load dashboard stats"
              description={
                <div>
                  <div style={{ marginBottom: 8 }}>{statsError}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => {
                        let roleId = null;
                        if (typeof user?.roleId !== "undefined")
                          roleId = Number(user.roleId);
                        else if (typeof user?.role !== "undefined")
                          roleId = Number(user.role);
                        fetchDashboard(roleId);
                      }}
                    >
                      Retry
                    </Button>
                    <Button onClick={() => navigate("/login")}>Re-login</Button>
                  </div>
                </div>
              }
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Card
              bordered={false}
              style={{
                borderRadius: borderRadiusLG,
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div style={{ marginBottom: 12, color: "#6b7280", fontSize: 13 }}>
                Raw response body (for debugging). Copy this and paste into backend logs/checks.
              </div>

              <Collapse bordered={false}>
                <Panel header="Show raw response body" key="1">
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      fontSize: 12,
                      color: "#111827",
                    }}
                  >
                    {rawResponseText ?? "(empty)"}
                  </pre>
                </Panel>
              </Collapse>
            </Card>
          </>
        ) : (
          <>
            {/* Stats grid using StatCard (2 rows, 3 cards) */}
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} lg={8}>
                <StatCard
                  title="Total Categories"
                  value={categories?.length ?? stats?.totalCategories ?? 0}
                  icon={<CheckCircleOutlined />}
                  color="#1677ff"
                  onClick={() => navigate("/CategoriesPage")}
                  actionText="View categories"
                />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <StatCard
                  title="Total Comments"
                  value={comments?.length ?? 0}
                  icon={<MessageOutlined />}
                  color="#faad14"
                  onClick={() => navigate("/CommentsPage")}
                  actionText="View comments"
                />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <StatCard
                  title="Total Statuses"
                  value={statuses?.length ?? 0}
                  icon={<TeamOutlined />}
                  color="#52c41a"
                  onClick={() => navigate("/StatusesPage")}
                  actionText="Manage statuses"
                />
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <StatCard
                  title="Total Users"
                  value={filteredUsers.length}
                  icon={<UserOutlined />}
                  color="#13c2c2"
                  onClick={() => navigate("/UsersPage")}
                  actionText="View users"
                />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <StatCard
                  title="Total Issues"
                  value={issuesCount}
                  icon={<ExclamationCircleOutlined />}
                  color="#ff4d4f"
                  onClick={() => navigate("/IssuesPage")}
                  actionText="Review issues"
                />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <StatCard
                  title="Total Priorities"
                  value={priorities?.length ?? 0}
                  icon={<IdcardOutlined />}
                  color="#722ed1"
                  onClick={() => navigate("/PrioritiesPage")}
                  actionText="Edit priorities"
                />
              </Col>
            </Row>

            {/* Chart area similar to Cdashboard */}
            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
              <Col span={24}>
                <Card
                  bordered={false}
                  style={{
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                    borderRadius: borderRadiusLG,
                  }}
                  title={
                    <div>
                      <Title level={4} style={{ margin: 0 }}>
                        Statuses Trend
                      </Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Simple visual line based on total statuses
                      </Text>
                    </div>
                  }
                >
                  <div style={{ height: 320, width: "100%" }}>
                    {statusesLoading ? (
                      <Skeleton active />
                    ) : !statusesLineData.length ? (
                      <Text type="secondary">Not enough data to show trend yet.</Text>
                    ) : (
                      <ResponsiveContainer>
                        <LineChart
                          data={statusesLineData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f0f0f0"
                          />
                          <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#8c8c8c" }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#8c8c8c" }}
                            allowDecimals={false}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: 8,
                              border: "none",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                            cursor={{ stroke: "#1677ff", strokeWidth: 1 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#1677ff"
                            strokeWidth={3}
                            dot={{
                              r: 4,
                              fill: "#1677ff",
                              strokeWidth: 2,
                              stroke: "#fff",
                            }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Content>
    </Layout>
  );
}
