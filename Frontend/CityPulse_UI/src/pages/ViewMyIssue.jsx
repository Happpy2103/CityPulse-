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
  Modal,
  Input,
  theme,
  Image,
} from "antd";
import {
  ArrowLeftOutlined,
  LogoutOutlined,
  UserOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const API_BASE = "http://localhost:5028";

export default function ViewMyIssue() {
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [user, setUser] = useState(null);

  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [issueMedias, setIssueMedias] = useState([]);

  const [loading, setLoading] = useState(true);

  // View modal state
  const [viewIssue, setViewIssue] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [locationName, setLocationName] = useState("");

  // Withdraw modal state
  const [withdrawIssue, setWithdrawIssue] = useState(null);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

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

  // Reverse geocode lat/long → human-readable address
  const getLocationName = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      if (data?.display_name) {
        setLocationName(data.display_name);
      } else {
        setLocationName("");
      }
    } catch {
      setLocationName("");
    }
  };

  const fetchAll = useCallback(
    async (currentUser) => {
      setLoading(true);
      try {
        const [resIssues, resCats, resPrio, resStatus, resMedias] =
          await Promise.all([
            fetch(`${API_BASE}/api/Issues`, { credentials: "include" }),
            fetch(`${API_BASE}/api/Categories`, { credentials: "include" }),
            fetch(`${API_BASE}/api/Priorities`, { credentials: "include" }),
            fetch(`${API_BASE}/api/Status`, { credentials: "include" }),
            fetch(`${API_BASE}/api/IssueMedias`, { credentials: "include" }),
          ]);

        if (
          !resIssues.ok ||
          !resCats.ok ||
          !resPrio.ok ||
          !resStatus.ok ||
          !resMedias.ok
        ) {
          throw new Error("Failed to load data");
        }

        const [issuesBody, catsBody, prioBody, statusBody, mediasBody] =
          await Promise.all([
            resIssues.json(),
            resCats.json(),
            resPrio.json(),
            resStatus.json(),
            resMedias.json(),
          ]);

        const extractData = (body) => {
          if (!body) return [];
          if (Array.isArray(body)) return body;
          if (Array.isArray(body.data)) return body.data;
          return [];
        };

        if (
          issuesBody?.success === false ||
          catsBody?.success === false ||
          prioBody?.success === false ||
          statusBody?.success === false ||
          mediasBody?.success === false
        ) {
          const msg =
            issuesBody?.message ||
            catsBody?.message ||
            prioBody?.message ||
            statusBody?.message ||
            mediasBody?.message ||
            "Failed to load data";
          throw new Error(msg);
        }

        const issuesData = extractData(issuesBody);
        const catsData = extractData(catsBody);
        const prioData = extractData(prioBody);
        const statusData = extractData(statusBody);
        const mediasData = extractData(mediasBody);

        const myId = Number(currentUser?.userId);
        const filteredIssues = issuesData.filter(
          (it) => Number(it.reportedBy) === myId
        );

        // ✅ sort by issueId DESC (newest / biggest ID first)
        const sortedIssues = [...filteredIssues].sort(
          (a, b) => Number(b.issueId) - Number(a.issueId)
        );

        setIssues(sortedIssues || []);
        setCategories(catsData || []);
        setPriorities(prioData || []);
        setStatuses(statusData || []);
        setIssueMedias(mediasData || []);
      } catch (err) {
        console.error(err);
        message.error(err.message || "Failed to load your issues");
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

  // Lookup maps
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => {
      map.set(c.categoryId, c.name || `Category #${c.categoryId}`);
    });
    return map;
  }, [categories]);

  const priorityMap = useMemo(() => {
    const map = new Map();
    priorities.forEach((p) => {
      map.set(p.priorityId, p.name || `Priority #${p.priorityId}`);
    });
    return map;
  }, [priorities]);

  const statusMap = useMemo(() => {
    const map = new Map();
    statuses.forEach((s) => {
      const label = s.name || s.statusName || `Status #${s.statusId}`;
      map.set(s.statusId, label);
    });
    return map;
  }, [statuses]);

  // media: issueId -> [IssueMedia...]
  const issueMediaMap = useMemo(() => {
    const map = new Map();
    issueMedias.forEach((m) => {
      const issueId = m.issueId ?? m.IssueId;
      if (!issueId) return;
      const list = map.get(issueId) || [];
      list.push(m);
      map.set(issueId, list);
    });
    return map;
  }, [issueMedias]);

  const statusColor = (statusLabel = "") => {
    const s = statusLabel.toLowerCase();
    if (s.includes("resolved") || s.includes("closed")) return "success";
    if (s.includes("in progress") || s.includes("processing")) return "processing";
    if (s.includes("rejected") || s.includes("cancel") || s.includes("withdraw"))
      return "error";
    if (s.includes("hold") || s.includes("pending")) return "warning";
    if (s.includes("reported")) return "default";
    return "default";
  };

  const priorityColor = (label = "") => {
    const p = label.toLowerCase();
    if (p.includes("high")) return "red";
    if (p.includes("medium")) return "orange";
    if (p.includes("low")) return "green";
    return "blue";
  };

  // View Issue (opens modal + loads location name)
  const handleViewIssue = (record) => {
    setViewIssue(record);
    setViewModalVisible(true);

    if (record.latitude && record.longitude) {
      getLocationName(record.latitude, record.longitude);
    } else {
      setLocationName("");
    }
  };

  // real withdraw logic (API call)
  const confirmWithdraw = async () => {
    if (!withdrawIssue) return;
    try {
      setWithdrawing(true);
      console.log("[Withdraw] starting for issue:", withdrawIssue.issueId, withdrawIssue);

      const payload = {
        issueId: withdrawIssue.issueId,
        title: withdrawIssue.title,
        description: withdrawIssue.description,
        categoryId: Number(withdrawIssue.categoryId),
        priorityId: Number(withdrawIssue.priorityId),
        statusId: 7, // Withdrawn
        reportedBy: Number(withdrawIssue.reportedBy),
        latitude: withdrawIssue.latitude ? Number(withdrawIssue.latitude) : 0,
        longitude: withdrawIssue.longitude ? Number(withdrawIssue.longitude) : 0,
        createdAt: withdrawIssue.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resolvedAt: withdrawIssue.resolvedAt || null,
      };

      console.log("[Withdraw] PUT payload:", payload);

      const res = await fetch(
        `${API_BASE}/api/Issues/${withdrawIssue.issueId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      console.log("[Withdraw] response status:", res.status);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[Withdraw] error body:", text);
        throw new Error(text || `Failed to withdraw issue #${withdrawIssue.issueId}`);
      }

      message.success("Issue withdrawn successfully");
      setWithdrawModalVisible(false);
      setWithdrawIssue(null);
      setWithdrawReason("");

      const u = getUserFromStorage();
      if (u) {
        await fetchAll(u);
      }
    } catch (err) {
      console.error("[Withdraw] error:", err);
      message.error(err.message || "Failed to withdraw issue");
    } finally {
      setWithdrawing(false);
    }
  };

  // Withdraw Issue (open custom modal, ask reason)
  const handleWithdraw = (record) => {
    console.log("[Withdraw] clicked for issue:", record.issueId);
    setWithdrawIssue(record);
    setWithdrawReason("");
    setWithdrawModalVisible(true);
  };

  // Table columns
  const columns = [
    {
      title: "Issue ID",
      dataIndex: "issueId",
      key: "issueId",
      width: 80,
      render: (id) => <Text type="secondary">#{id}</Text>,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 220,
      ellipsis: { showTitle: false },
      render: (text) => (
        <Text strong ellipsis={{ tooltip: text || "(untitled issue)" }}>
          {text || "(untitled issue)"}
        </Text>
      ),
    },
    {
      title: "Category",
      dataIndex: "categoryId",
      key: "categoryId",
      width: 130,
      render: (id) => (
        <Tag>{categoryMap.get(id) || `Category #${id ?? "-"}`}</Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priorityId",
      key: "priorityId",
      width: 120,
      render: (id) => {
        const label = priorityMap.get(id) || `#${id ?? "-"}`;
        return <Tag color={priorityColor(label)}>{label}</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "statusId",
      key: "statusId",
      width: 150,
      render: (id) => {
        const label = statusMap.get(id) || `Status #${id ?? "-"}`;
        return <Tag color={statusColor(label)}>{label}</Tag>;
      },
    },
    {
      title: "Created at",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (date) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {fmtDateIsoToLocal(date)}
        </Text>
      ),
    },
    {
      title: "Media",
      key: "media",
      width: 120,
      render: (_, record) => {
        const medias = issueMediaMap.get(record.issueId) || [];
        if (!medias.length) {
          return <Text type="secondary">No files</Text>;
        }

        const first = medias[0];
        const path = first.filePath || first.FilePath;
        const src = `${API_BASE}${path}`;

        return (
          <Image
            src={src}
            width={64}
            height={48}
            style={{ objectFit: "cover", borderRadius: 6 }}
            preview={{
              mask: `${medias.length} file${medias.length > 1 ? "s" : ""}`,
            }}
          />
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_, record) => {
        const stId = Number(record.statusId);

        return (
          <Space size={8}>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewIssue(record)}
            >
              View
            </Button>

            {stId === 1 && (
              <Button
                type="link"
                onClick={() => navigate(`/EditIssue/${record.issueId}`)}
              >
                Edit
              </Button>
            )}

            {(stId === 2 || stId === 3) && (
              <Button type="link" danger onClick={() => handleWithdraw(record)}>
                Withdraw
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
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
              My Reported Issues
            </Title>
            <Text type="secondary">
              Review all issues you’ve reported and track their status in one
              place.
            </Text>
          </div>
          <Button type="primary" onClick={() => navigate("/report-issue")}>
            Report new issue
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
              rowKey={(record) => record.issueId}
              columns={columns}
              dataSource={issues}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              locale={{
                emptyText: "You haven’t reported any issues yet.",
              }}
              style={{ width: "100%" }}
            />
          )}
        </Card>
      </Content>

      {/* View Issue Modal */}
      <Modal
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setViewModalVisible(false)}
          >
            Close
          </Button>,
        ]}
        title={
          viewIssue ? (
            <div>
              <Text type="secondary">Issue #{viewIssue.issueId}</Text>
              <br />
              <Text strong>{viewIssue.title || "(untitled issue)"}</Text>
            </div>
          ) : (
            "Issue details"
          )
        }
        width={720}
      >
        {viewIssue && (
          <div style={{ marginTop: 8 }}>
            <p>
              <Text type="secondary">Status: </Text>
              <Tag color={statusColor(statusMap.get(viewIssue.statusId))}>
                {statusMap.get(viewIssue.statusId) ||
                  `Status #${viewIssue.statusId ?? "-"}`}
              </Tag>
            </p>

            <p>
              <Text type="secondary">Category: </Text>
              <Tag>
                {categoryMap.get(viewIssue.categoryId) ||
                  `Category #${viewIssue.categoryId ?? "-"}`}
              </Tag>
            </p>

            <p>
              <Text type="secondary">Priority: </Text>
              <Tag color={priorityColor(priorityMap.get(viewIssue.priorityId))}>
                {priorityMap.get(viewIssue.priorityId) ||
                  `Priority #${viewIssue.priorityId ?? "-"}`}
              </Tag>
            </p>

            <p>
              <Text type="secondary">Description:</Text>
              <br />
              <Text style={{ whiteSpace: "pre-wrap" }}>
                {viewIssue.description || "No description provided."}
              </Text>
            </p>

            <p>
              <Text type="secondary">Location:</Text>
              <br />
              {locationName ? (
                <Text strong>📍 {locationName}</Text>
              ) : viewIssue.latitude && viewIssue.longitude ? (
                <Text type="secondary">
                  📍 {viewIssue.latitude}, {viewIssue.longitude}
                </Text>
              ) : (
                <Text type="secondary">Location not available</Text>
              )}
            </p>

            <p>
              <Text type="secondary">Created at: </Text>
              <Text>{fmtDateIsoToLocal(viewIssue.createdAt)}</Text>
            </p>

            {viewIssue.updatedAt && (
              <p>
                <Text type="secondary">Last updated: </Text>
                <Text>{fmtDateIsoToLocal(viewIssue.updatedAt)}</Text>
              </p>
            )}

            <p>
              <Text type="secondary">Media:</Text>
              <br />
              {(() => {
                const medias = issueMediaMap.get(viewIssue.issueId) || [];
                if (!medias.length) {
                  return <Text type="secondary">No media attached.</Text>;
                }

                return (
                  <Image.PreviewGroup>
                    {medias.map((m) => {
                      const path = m.filePath || m.FilePath;
                      const src = `${API_BASE}${path}`;
                      const key = m.mediaId || m.MediaId || `${path}`;
                      return (
                        <Image
                          key={key}
                          src={src}
                          width={96}
                          style={{
                            marginRight: 8,
                            marginBottom: 8,
                            borderRadius: 6,
                            objectFit: "cover",
                          }}
                        />
                      );
                    })}
                  </Image.PreviewGroup>
                );
              })()}
            </p>
          </div>
        )}
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        open={withdrawModalVisible}
        onCancel={() => {
          if (withdrawing) return;
          setWithdrawModalVisible(false);
          setWithdrawIssue(null);
          setWithdrawReason("");
        }}
        title={
          withdrawIssue ? (
            <div>
              <Text type="secondary">
                Withdraw Issue #{withdrawIssue.issueId}
              </Text>
              <br />
              <Text strong>{withdrawIssue.title || "(untitled issue)"}</Text>
            </div>
          ) : (
            "Withdraw this issue?"
          )
        }
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              if (withdrawing) return;
              setWithdrawModalVisible(false);
              setWithdrawIssue(null);
              setWithdrawReason("");
            }}
          >
            Cancel
          </Button>,
          <Button
            key="withdraw"
            type="primary"
            danger
            loading={withdrawing}
            onClick={confirmWithdraw}
          >
            Confirm Withdraw
          </Button>,
        ]}
      >
        {withdrawIssue && (
          <div style={{ marginTop: 8 }}>
            <p>
              <Text type="secondary">Current status: </Text>
              <Tag color={statusColor(statusMap.get(withdrawIssue.statusId))}>
                {statusMap.get(withdrawIssue.statusId) ||
                  `Status #${withdrawIssue.statusId ?? "-"}`}
              </Tag>
            </p>

            <p>
              <Text type="secondary">
                Briefly tell us why you’re withdrawing this report:
              </Text>
              <TextArea
                rows={4}
                placeholder="Example: Issue got resolved privately, duplicate report, submitted by mistake, etc."
                style={{ marginTop: 8 }}
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                (Optional, but it helps us improve the service.)
              </Text>
            </p>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
