// src/pages/Myissues.jsx
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Select,
  Typography,
  Input,
  Skeleton,
  Empty,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  EditOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

// 📄 PDF generator (frontend only)
import jsPDF from "jspdf";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const API_BASE = "http://localhost:5028";

const extractList = (body) => {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.$values)) return body.$values;
  return [];
};

export default function Myissues() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState(null);

  const [statuses, setStatuses] = useState([]);
  const [statusesLoading, setStatusesLoading] = useState(false);

  const [issueHistories, setIssueHistories] = useState([]);
  const [historiesLoading, setHistoriesLoading] = useState(false);

  const [search, setSearch] = useState("");

  // status change modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);

  // ✅ view detail modal
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewIssue, setViewIssue] = useState(null);

  const getUserFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // --- FETCHES ---

  const fetchIssues = useCallback(async () => {
    setIssuesLoading(true);
    setIssuesError(null);
    try {
      const url = `${API_BASE}/api/Issues`;
      console.log("[MyIssues] requesting issues", url);

      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text().catch(() => null);

      if (!res.ok) {
        const err = `Issues API returned ${res.status} ${res.statusText}${
          text ? ` — ${text}` : ""
        }`;
        console.warn(err);
        setIssuesError(err);
        setIssues([]);
        message.error("Failed to load issues");
        return;
      }

      if (!contentType.includes("application/json")) {
        const err =
          "Issues endpoint did not return JSON. Raw body logged to console.";
        console.warn(err, "raw:", text);
        setIssuesError(err);
        setIssues([]);
        message.error("Failed to load issues (non-JSON response)");
        return;
      }

      const data = JSON.parse(text);
      const list = extractList(data);

      if (!Array.isArray(list)) {
        console.warn("Unexpected issues shape", data);
        setIssuesError("Unexpected response shape from Issues API");
        setIssues([]);
        return;
      }

      const normalized = list.map((it) => ({
        key: it.issueId ?? String(Math.random()),
        issueId: it.issueId,
        title: it.title ?? "(untitled)",
        description: it.description ?? "",
        categoryId: it.categoryId,
        reportedBy: it.reportedBy,
        statusId: it.statusId,
        priorityId: it.priorityId,
        latitude: it.latitude,
        longitude: it.longitude,
        createdAt: it.createdAt,
        updatedAt: it.updatedAt,
        resolvedAt: it.resolvedAt,
        raw: it,
      }));

      normalized.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });

      setIssues(normalized);
    } catch (err) {
      console.warn("Failed to fetch issues", err);
      setIssuesError("Network or server error while fetching issues");
      setIssues([]);
      message.error("Failed to load issues");
    } finally {
      setIssuesLoading(false);
    }
  }, []);

  const fetchStatuses = useCallback(async () => {
    setStatusesLoading(true);
    try {
      const url = `${API_BASE}/api/Status`;
      console.log("[MyIssues] requesting statuses", url);

      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const text = await res.text().catch(() => null);
      const contentType = res.headers.get("content-type") || "";

      if (!res.ok || !contentType.includes("application/json")) {
        console.warn("Status API error or non-JSON", res.status, text);
        setStatuses([]);
        return;
      }

      const data = JSON.parse(text);
      const list = extractList(data);
      const normalized = Array.isArray(list)
        ? list.map((s) => ({
            statusId: s.statusId,
            name: s.name || s.statusName || `Status ${s.statusId}`,
          }))
        : [];

      setStatuses(normalized);
    } catch (err) {
      console.warn("Failed to fetch statuses", err);
      setStatuses([]);
    } finally {
      setStatusesLoading(false);
    }
  }, []);

  const fetchIssueHistories = useCallback(async () => {
    setHistoriesLoading(true);
    try {
      const url = `${API_BASE}/api/IssueHistories`;
      console.log("[MyIssues] requesting issue histories", url);

      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const text = await res.text().catch(() => null);
      const contentType = res.headers.get("content-type") || "";

      if (!res.ok || !contentType.includes("application/json")) {
        console.warn("IssueHistories API error or non-JSON", res.status, text);
        setIssueHistories([]);
        return;
      }

      const data = JSON.parse(text);
      const list = extractList(data);
      setIssueHistories(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Failed to fetch issue histories", err);
      setIssueHistories([]);
    } finally {
      setHistoriesLoading(false);
    }
  }, []);

  // init
  useEffect(() => {
    const u = getUserFromStorage();
    if (!u) {
      localStorage.clear();
      navigate("/login");
      return;
    }
    setUser(u);

    fetchIssues();
    fetchStatuses();
    fetchIssueHistories();
  }, [getUserFromStorage, navigate, fetchIssues, fetchStatuses, fetchIssueHistories]);

  const currentUserId = useMemo(() => {
    if (!user) return null;
    return user.userId ?? user.id ?? null;
  }, [user]);

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

  const getStatusName = (statusId) => {
    const s = statuses.find((x) => Number(x.statusId) === Number(statusId));
    return s ? s.name : statusId ? String(statusId) : "Unknown";
  };

  const getStatusColor = (statusId) => {
    const name = getStatusName(statusId).toLowerCase();
    if (name.includes("open") || name.includes("reported")) return "blue";
    if (name.includes("progress") || name.includes("assigned")) return "gold";
    if (name.includes("resolved") || name.includes("closed")) return "green";
    if (name.includes("rejected")) return "red";
    return "default";
  };

  // latest assignee for an issue from histories
  const getCurrentAssigneeUserId = useCallback(
    (issueId) => {
      if (!issueHistories.length) return null;

      const histForIssue = issueHistories
        .filter((h) => Number(h.issueId) === Number(issueId))
        .sort(
          (a, b) =>
            new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
        );

      const latestWithAssignee = histForIssue.find(
        (h) => h.newAssignee && Number(h.newAssignee) !== 0
      );

      return latestWithAssignee ? latestWithAssignee.newAssignee : null;
    },
    [issueHistories]
  );

  // issues assigned to this officer
  const myIssues = useMemo(() => {
    if (!currentUserId) return [];
    return issues.filter((it) => {
      const assignee = getCurrentAssigneeUserId(it.issueId);
      return assignee && Number(assignee) === Number(currentUserId);
    });
  }, [issues, currentUserId, getCurrentAssigneeUserId]);

  // search
  const filteredIssues = useMemo(() => {
    if (!search) return myIssues;
    const q = search.toLowerCase();
    return myIssues.filter(
      (it) =>
        String(it.issueId ?? "").toLowerCase().includes(q) ||
        (it.title ?? "").toLowerCase().includes(q) ||
        (it.description ?? "").toLowerCase().includes(q)
    );
  }, [myIssues, search]);

  const openStatusModal = (issue) => {
    setSelectedIssue(issue);
    setSelectedStatusId(issue.statusId ?? null);
    setStatusModalVisible(true);
  };

  const closeStatusModal = () => {
    setStatusModalVisible(false);
    setSelectedIssue(null);
    setSelectedStatusId(null);
  };

  // ✅ view detail modal handlers
  const openViewModal = (issue) => {
    setViewIssue(issue);
    setViewModalVisible(true);
  };

  const closeViewModal = () => {
    setViewModalVisible(false);
    setViewIssue(null);
  };

  // 🚀 FRONTEND PDF GENERATION (no backend)
  const handleDownloadReport = (issue) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      let y = 15;

      // Header
      doc.setFontSize(18);
      doc.text(`Issue Report - #${issue.issueId}`, 10, y);
      y += 8;

      doc.setFontSize(11);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Generated at: ${fmtDateIsoToLocal(new Date().toISOString())}`,
        10,
        y
      );
      y += 8;

      doc.setDrawColor(200, 200, 200);
      doc.line(10, y, 200, y);
      y += 6;

      doc.setTextColor(0, 0, 0);

      // Basic Info
      doc.setFontSize(13);
      doc.text("Basic Details", 10, y);
      y += 6;

      doc.setFontSize(11);

      const addLine = (label, value) => {
        const text = `${label}: ${value ?? "-"}`;
        const split = doc.splitTextToSize(text, 190);
        split.forEach((line) => {
          doc.text(line, 12, y);
          y += 5;
        });
      };

      addLine("Title", issue.title);
      addLine("Description", issue.description || "No description provided");
      addLine("Status", getStatusName(issue.statusId));
      addLine("PriorityId", issue.priorityId ?? "-");
      addLine("CategoryId", issue.categoryId ?? "-");
      addLine("ReportedBy (UserId)", issue.reportedBy ?? "-");
      addLine(
        "Coordinates",
        issue.latitude && issue.longitude
          ? `${issue.latitude}, ${issue.longitude}`
          : "-"
      );
      addLine("Created At", fmtDateIsoToLocal(issue.createdAt));
      addLine("Updated At", fmtDateIsoToLocal(issue.updatedAt));
      addLine(
        "Resolved At",
        issue.resolvedAt ? fmtDateIsoToLocal(issue.resolvedAt) : "-"
      );

      y += 4;
      doc.setDrawColor(220, 220, 220);
      doc.line(10, y, 200, y);
      y += 7;

      // History section
      const historyForIssue = issueHistories
        .filter((h) => Number(h.issueId) === Number(issue.issueId))
        .sort(
          (a, b) =>
            new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
        );

      doc.setFontSize(13);
      doc.text("Status & Assignment History", 10, y);
      y += 6;
      doc.setFontSize(11);

      if (!historyForIssue.length) {
        doc.text("No history recorded for this issue.", 12, y);
        y += 6;
      } else {
        historyForIssue.forEach((h, index) => {
          if (y > 270) {
            doc.addPage();
            y = 15;
          }

          const line1 = `#${index + 1}  On ${fmtDateIsoToLocal(
            h.changedAt
          )} by UserId ${h.changedBy}`;
          const line2 = `Status: ${h.oldStatus} → ${h.newStatus}`;
          const line3 = `Assignee: ${h.oldAssignee ?? "-"} → ${
            h.newAssignee ?? "-"
          }`;

          doc.text(line1, 12, y);
          y += 5;
          doc.text(line2, 16, y);
          y += 5;
          doc.text(line3, 16, y);
          y += 7;
        });
      }

      // Footer
      if (y > 280) {
        doc.addPage();
        y = 15;
      }
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("Generated by CityPulse Officer Portal", 10, 290);

      const fileName = `Issue_${issue.issueId}_Report.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("Failed to generate PDF report", err);
      message.error("Failed to generate report PDF");
    }
  };

  const handleSaveStatus = async () => {
    if (!selectedIssue || !selectedStatusId) {
      message.warning("Select a status first");
      return;
    }
    if (!currentUserId) {
      message.error("User not found. Please login again.");
      return;
    }

    const payload = {
      issueId: selectedIssue.issueId,
      changedBy: currentUserId,
      oldStatus: selectedIssue.statusId ?? 0,
      newStatus: Number(selectedStatusId),
      oldAssignee: currentUserId,
      newAssignee: currentUserId,
    };

    try {
      setSavingStatus(true);
      const url = `${API_BASE}/api/IssueHistories`;
      console.log("[MyIssues] posting IssueHistory", payload);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => null);
      if (!res.ok) {
        console.warn("Failed to save issue history", res.status, text);
        message.error("Failed to update status");
        return;
      }

      message.success("Status updated successfully");
      closeStatusModal();
      // refresh issues + histories
      await Promise.all([fetchIssues(), fetchIssueHistories()]);
    } catch (err) {
      console.warn("Error while saving status", err);
      message.error("Error while updating status");
    } finally {
      setSavingStatus(false);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "issueId",
      key: "issueId",
      width: 80,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (t, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{t}</div>
          {r.description && (
            <div
              style={{
                color: "#555",
                fontSize: 12,
                marginTop: 2,
                maxWidth: 400,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.description}
            </div>
          )}
          <div style={{ color: "#888", fontSize: 11, marginTop: 4 }}>
            Created: {fmtDateIsoToLocal(r.createdAt)}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "statusId",
      key: "statusId",
      render: (s) => (
        <Tag color={getStatusColor(s)}>{getStatusName(s)}</Tag>
      ),
    },
    {
      title: "Last Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (d) => fmtDateIsoToLocal(d),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, rec) => (
        <Space>
          {Number(rec.statusId) === 7 ? (
            // ✅ If statusId == 7 -> only show Download Report (frontend PDF)
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadReport(rec)}
            >
              Download Report
            </Button>
          ) : (
            // ✅ Otherwise -> Change Status + View Detail (modal)
            <>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openStatusModal(rec)}
              >
                Change Status
              </Button>
              <Button
                size="small"
                type="link"
                onClick={() => openViewModal(rec)}
              >
                View Detail
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fb" }}>
      <Header
        style={{
          background: "#fff",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          zIndex: 1,
        }}
      >
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            My Assigned Issues
          </Title>
        </Space>
      </Header>

      <Content style={{ padding: "24px 48px" }}>
        <Card
          bordered={false}
          style={{
            borderRadius: 16,
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Search
              placeholder="Search by id, title or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ maxWidth: 420 }}
            />
            <Space>
              <Text type="secondary">
                Total Assigned: <b>{myIssues.length}</b>
              </Text>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchIssues();
                  fetchIssueHistories();
                }}
              >
                Refresh
              </Button>
            </Space>
          </div>

          {issuesLoading || historiesLoading || statusesLoading ? (
            <Skeleton active />
          ) : issuesError ? (
            <div style={{ padding: 24 }}>
              <Text type="danger">{issuesError}</Text>
            </div>
          ) : filteredIssues.length === 0 ? (
            <Empty description="No issues assigned to you yet." />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <Table
                rowKey={(r) => r.key}
                dataSource={filteredIssues}
                columns={columns}
                pagination={{ pageSize: 10 }}
                size="middle"
              />
            </div>
          )}
        </Card>
      </Content>

      {/* View Detail Modal */}
      <Modal
        open={viewModalVisible}
        title={
          viewIssue
            ? `Issue Detail – #${viewIssue.issueId} ${viewIssue.title}`
            : "Issue Detail"
        }
        onCancel={closeViewModal}
        footer={null}
        width={600}
      >
        {!viewIssue ? (
          <Skeleton active />
        ) : (
          <div style={{ lineHeight: 1.8 }}>
            <p>
              <Text strong>ID:</Text> {viewIssue.issueId}
            </p>
            <p>
              <Text strong>Title:</Text> {viewIssue.title}
            </p>
            <p>
              <Text strong>Description:</Text>{" "}
              {viewIssue.description || "-"}
            </p>
            <p>
              <Text strong>Status:</Text>{" "}
              <Tag color={getStatusColor(viewIssue.statusId)}>
                {getStatusName(viewIssue.statusId)}
              </Tag>
            </p>
            <p>
              <Text strong>PriorityId:</Text>{" "}
              {viewIssue.priorityId ?? "-"}
            </p>
            <p>
              <Text strong>CategoryId:</Text>{" "}
              {viewIssue.categoryId ?? "-"}
            </p>
            <p>
              <Text strong>ReportedBy (UserId):</Text>{" "}
              {viewIssue.reportedBy ?? "-"}
            </p>
            <p>
              <Text strong>Coordinates:</Text>{" "}
              {viewIssue.latitude && viewIssue.longitude
                ? `${viewIssue.latitude}, ${viewIssue.longitude}`
                : "-"}
            </p>
            <p>
              <Text strong>Created At:</Text>{" "}
              {fmtDateIsoToLocal(viewIssue.createdAt)}
            </p>
            <p>
              <Text strong>Updated At:</Text>{" "}
              {fmtDateIsoToLocal(viewIssue.updatedAt)}
            </p>
            <p>
              <Text strong>Resolved At:</Text>{" "}
              {viewIssue.resolvedAt
                ? fmtDateIsoToLocal(viewIssue.resolvedAt)
                : "-"}
            </p>
          </div>
        )}
      </Modal>

      {/* Status Change Modal */}
      <Modal
        open={statusModalVisible}
        title={
          selectedIssue
            ? `Change Status – #${selectedIssue.issueId} ${selectedIssue.title}`
            : "Change Status"
        }
        onCancel={closeStatusModal}
        onOk={handleSaveStatus}
        confirmLoading={savingStatus}
        okText="Save"
        width={480}
      >
        {!selectedIssue ? (
          <Skeleton active />
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Current Status: </Text>
              <Tag color={getStatusColor(selectedIssue.statusId)}>
                {getStatusName(selectedIssue.statusId)}
              </Tag>
            </div>

            <div style={{ marginBottom: 8 }}>
              <Text>Select new status:</Text>
            </div>
            <Select
              style={{ width: "100%" }}
              placeholder="Select status"
              value={selectedStatusId}
              onChange={(val) => setSelectedStatusId(val)}
            >
              {statuses.map((s) => (
                <Option key={s.statusId} value={s.statusId}>
                  {s.name}
                </Option>
              ))}
            </Select>

            <div style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
              This will update the issue status and create an entry in Issue
              History with you as the actor.
            </div>
          </>
        )}
      </Modal>
    </Layout>
  );
}
