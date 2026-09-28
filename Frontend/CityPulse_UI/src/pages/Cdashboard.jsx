// src/pages/Cdashboard.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Card,
  Button,
  Avatar,
  Space,
  Typography,
  Layout,
  theme,
  Spin,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  FileExclamationOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  TagsOutlined,
  PlusOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const { Title, Text } = Typography;
const { Header, Content } = Layout;

const API_BASE = "http://localhost:5028";

export default function Cdashboard() {
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // --- STATE ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data States
  const [categories, setCategories] = useState([]);
  const [comments, setComments] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [issues, setIssues] = useState([]);

  // --- LOGIC ---
  const getUserFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      const [resStat, resCat, resCom, resUser, resPrio, resIss] =
        await Promise.all([
          fetch(`${API_BASE}/api/Status`),
          fetch(`${API_BASE}/api/Categories`),
          fetch(`${API_BASE}/api/Comments`),
          fetch(`${API_BASE}/api/Users`),
          fetch(`${API_BASE}/api/Priorities`),
          fetch(`${API_BASE}/api/Issues`),
        ]);

      const [statBody, catBody, comBody, userBody, prioBody, issBody] =
        await Promise.all([
          resStat.json(),
          resCat.json(),
          resCom.json(),
          resUser.json(),
          resPrio.json(),
          resIss.json(),
        ]);

      const extractList = (body) => {
        if (!body) return [];
        if (Array.isArray(body)) return body;
        if (Array.isArray(body.data)) return body.data;
        return [];
      };

      setStatuses(extractList(statBody));
      setCategories(extractList(catBody));
      setComments(extractList(comBody));
      setUsers(extractList(userBody));
      setPriorities(extractList(prioBody));
      setIssues(extractList(issBody));
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    }
  }, []);

  useEffect(() => {
    const u = getUserFromStorage();
    if (!u) {
      navigate("/login");
      return;
    }
    setUser(u);
    (async () => {
      await fetchAllData();
      setLoading(false);
    })();
  }, [getUserFromStorage, navigate, fetchAllData]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const getDisplayName = (u) =>
    u?.name || u?.displayName || u?.email || "User";

  // --- MY ISSUES + STATS ---
  const myIssues = useMemo(() => {
    if (!user || !Array.isArray(issues)) return [];
    const myId = Number(user.userId);
    if (!myId) return [];
    return issues.filter((it) => Number(it.reportedBy) === myId);
  }, [issues, user]);

  const myIssuesCount = useMemo(() => myIssues.length, [myIssues]);

  const myResolvedCount = useMemo(() => {
    if (!Array.isArray(statuses) || !statuses.length) return 0;

    const statusMap = new Map();
    statuses.forEach((s) => {
      const label = (s.name || s.statusName || "").toLowerCase();
      statusMap.set(s.statusId, label);
    });

    return myIssues.filter((it) => {
      const label = statusMap.get(it.statusId);
      if (!label) return false;
      return label.includes("resolved") || label.includes("closed");
    }).length;
  }, [myIssues, statuses]);

  const myPendingCount = useMemo(() => {
    if (!Array.isArray(statuses) || !statuses.length) return 0;

    const statusMap = new Map();
    statuses.forEach((s) => {
      const label = (s.name || s.statusName || "").toLowerCase();
      statusMap.set(s.statusId, label);
    });

    return myIssues.filter((it) => {
      const label = statusMap.get(it.statusId);
      if (!label) return false;
      return (
        label.includes("pending") ||
        label.includes("in progress") ||
        label.includes("reported") ||
        label.includes("open")
      );
    }).length;
  }, [myIssues, statuses]);

  // --- CHART DATA: My issues over time (by month) ---
  const issuesTrendData = useMemo(() => {
    if (!myIssues.length) return [];

    const monthsShort = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const counts = new Map();

    myIssues.forEach((issue) => {
      if (!issue.createdAt) return;
      const d = new Date(issue.createdAt);
      if (isNaN(d.getTime())) return;

      const key = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`; // e.g., 2025-03
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const arr = Array.from(counts.entries()).map(([key, count]) => {
      const [yearStr, monthStr] = key.split("-");
      const year = Number(yearStr);
      const monthIndex = Number(monthStr) - 1;
      return {
        key,
        label: `${monthsShort[monthIndex]} ${year}`,
        value: count,
        date: new Date(year, monthIndex, 1),
      };
    });

    arr.sort((a, b) => a.date - b.date);

    const lastSix = arr.slice(-6);

    return lastSix.map(({ label, value }) => ({ label, value }));
  }, [myIssues]);

  // Reusable stat card
  const StatCard = ({ title, value, icon, color, onClick, actionText }) => (
    <Card
      hoverable={!!onClick}
      bordered={false}
      style={{
        height: "100%",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        borderRadius: borderRadiusLG,
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {title}
          </Text>
          <Title level={2} style={{ margin: "4px 0 0" }}>
            {value ?? 0}
          </Title>
          {actionText && (
            <div
              style={{
                marginTop: 12,
                color: color,
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
            backgroundColor: `${color}15`,
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

  // --- RENDER ---
  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      {/* Header */}
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
              background: "linear-gradient(135deg,#1677ff,#36cfc9)",
              borderRadius: 6,
            }}
          />
          <Title level={4} style={{ margin: 0 }}>
            Citizen Portal
          </Title>
        </div>

        <Space size="large">
          <Space align="center" style={{ marginRight: 16 }}>
            <Avatar
              style={{ backgroundColor: "#1677ff" }}
              icon={<UserOutlined />}
            />
            <div style={{ lineHeight: 1.2 }}>
              <Text strong style={{ display: "block" }}>
                {getDisplayName(user)}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Citizen
              </Text>
            </div>
          </Space>
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
        {loading ? (
          <div
            style={{
              minHeight: "60vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <Spin size="large" />
            <Text type="secondary">Loading your dashboard...</Text>
          </div>
        ) : (
          <>
            {/* Welcome + action */}
            <div
              style={{
                marginBottom: 32,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  Dashboard Overview
                </Title>
                <Text type="secondary">
                  Track your reported issues, comments, and activity.
                </Text>
              </div>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                style={{ padding: "0 32px", height: 48, fontSize: 16 }}
                onClick={() => navigate("/report-issue")}
              >
                Report New Issue
              </Button>
            </div>

            {/* Stats Grid */}
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  title="My Issues"
                  value={myIssuesCount}
                  icon={<FileExclamationOutlined />}
                  color="#ff4d4f"
                  onClick={() => navigate("/ViewMyIssue")}
                  actionText="View my issues"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  title="Resolved Issues"
                  value={myResolvedCount}
                  icon={<CheckCircleOutlined />}
                  color="#52c41a"
                  onClick={() => navigate("/ViewMyIssue")}
                  actionText="Check resolutions"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  title="Pending / In Progress"
                  value={myPendingCount}
                  icon={<TagsOutlined />}
                  color="#faad14"
                  onClick={() => navigate("/ViewMyIssue")}
                  actionText="See pending"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  title="Total Comments"
                  value={comments.length}
                  icon={<MessageOutlined />}
                  color="#1677ff"
                  onClick={() => navigate("/ViewComments")}
                  actionText="View comments"
                />
              </Col>
            </Row>

            {/* Chart */}
            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
              <Col span={24}>
                <Card
                  title={
                    <Title level={4} style={{ margin: 0 }}>
                      My Issues Over Time
                    </Title>
                  }
                  bordered={false}
                  style={{
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                    borderRadius: borderRadiusLG,
                  }}
                >
                  {issuesTrendData.length === 0 ? (
                    <div
                      style={{
                        height: 260,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        padding: 16,
                      }}
                    >
                      <Text type="secondary">
                        No activity to show yet. Your issue trends will appear
                        here once you start reporting issues.
                      </Text>
                    </div>
                  ) : (
                    <div style={{ height: 320, width: "100%" }}>
                      <ResponsiveContainer>
                        <LineChart
                          data={issuesTrendData}
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
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#8c8c8c" }}
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
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Content>
    </Layout>
  );
}
