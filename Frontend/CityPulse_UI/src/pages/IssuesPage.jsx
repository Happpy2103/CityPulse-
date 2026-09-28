// src/pages/IssuesPage.jsx 
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Skeleton,
  Empty,
  message,
  Modal,
  Descriptions,
  Typography,
  Input,
  Select,
  Timeline,
} from "antd";
import {
  EyeOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Paragraph, Text } = Typography;
const { Option } = Select;
const API_BASE = "http://localhost:5028";

export default function IssuesPage() {
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState(null);

  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [issueMedias, setIssueMedias] = useState([]);
  const [issueHistories, setIssueHistories] = useState([]);

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const [search, setSearch] = useState("");

  // filters
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterPriority, setFilterPriority] = useState(null);

  // Assign Officer modal
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assigningIssue, setAssigningIssue] = useState(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState(null);

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

  // unwrap { data: [...] } / { $values: [...] } / [...]
  const extractList = (body) => {
    if (!body) return [];
    if (Array.isArray(body)) return body;
    if (Array.isArray(body.data)) return body.data;
    if (Array.isArray(body.$values)) return body.$values;
    return [];
  };

  const fetchIssues = useCallback(async () => {
    setIssuesLoading(true);
    setIssuesError(null);
    try {
      const url = `${API_BASE}/api/Issues`;
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
        setIssues([]);
        setIssuesError(err);
        console.warn(err);
        message.error("Failed to load issues");
        return;
      }

      if (!contentType.includes("application/json")) {
        const err =
          "Issues endpoint did not return JSON. Raw body logged to console.";
        setIssues([]);
        setIssuesError(err);
        console.warn(err, "raw:", text);
        message.error("Failed to load issues (non-JSON response)");
        return;
      }

      const data = JSON.parse(text); // { success, message, data: [...] }
      const list = extractList(data);

      if (!Array.isArray(list)) {
        setIssues([]);
        setIssuesError("Unexpected response shape from Issues API");
        console.warn("Unexpected issues shape", data);
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
      setIssues([]);
      setIssuesError("Network or server error while fetching issues");
      message.error("Failed to load issues");
    } finally {
      setIssuesLoading(false);
    }
  }, []);

  const fetchStatuses = useCallback(async () => {
    try {
      const url = `${API_BASE}/api/Status`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const text = await res.text().catch(() => null);
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        setStatuses([]);
        return;
      }
      const data = JSON.parse(text);
      const list = extractList(data);
      setStatuses(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Failed to fetch statuses", err);
      setStatuses([]);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const url = `${API_BASE}/api/Users`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const text = await res.text().catch(() => null);
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        setUsers([]);
        return;
      }
      const data = JSON.parse(text);
      const list = extractList(data);
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Failed to fetch users", err);
      setUsers([]);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const url = `${API_BASE}/api/Categories`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const text = await res.text().catch(() => null);
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        setCategories([]);
        return;
      }
      const data = JSON.parse(text);
      const list = extractList(data);
      setCategories(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Failed to fetch categories", err);
      setCategories([]);
    }
  }, []);

  const fetchPriorities = useCallback(async () => {
    try {
      const url = `${API_BASE}/api/Priorities`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const text = await res.text().catch(() => null);
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        setPriorities([]);
        return;
      }
      const data = JSON.parse(text); // plain array
      const list = extractList(data);
      setPriorities(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Failed to fetch priorities", err);
      setPriorities([]);
    }
  }, []);

  const fetchIssueMedias = useCallback(async () => {
    try {
      const url = `${API_BASE}/api/IssueMedias`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const text = await res.text().catch(() => null);
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        setIssueMedias([]);
        return;
      }
      const data = JSON.parse(text); // plain array
      const list = extractList(data);
      setIssueMedias(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Failed to fetch issue medias", err);
      setIssueMedias([]);
    }
  }, []);

  const fetchIssueHistories = useCallback(async () => {
    try {
      const url = `${API_BASE}/api/IssueHistories`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const text = await res.text().catch(() => null);
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        setIssueHistories([]);
        return;
      }
      const data = JSON.parse(text); // plain array
      const list = extractList(data);
      setIssueHistories(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Failed to fetch issue histories", err);
      setIssueHistories([]);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
    fetchUsers();
    fetchCategories();
    fetchPriorities();
    fetchIssueMedias();
    fetchIssueHistories();
    fetchIssues();
  }, [
    fetchIssues,
    fetchStatuses,
    fetchUsers,
    fetchCategories,
    fetchPriorities,
    fetchIssueMedias,
    fetchIssueHistories,
  ]);

  const getUserDisplay = (userId) => {
    const u = users.find((x) => String(x.userId) === String(userId));
    if (!u) return userId ? String(userId) : "Unknown";
    return u.name || u.displayName || u.email || `User ${u.userId}`;
  };

  const getStatusName = (statusId) => {
    const s = statuses.find((x) => Number(x.statusId) === Number(statusId));
    return s
      ? s.name || s.statusName || `Status ${s.statusId}`
      : statusId
      ? String(statusId)
      : "Unknown";
  };

  const getCategoryName = (catId) => {
    const c = categories.find((x) => Number(x.categoryId) === Number(catId));
    return c
      ? c.name || c.title || `Category ${c.categoryId}`
      : catId
      ? String(catId)
      : "Unknown";
  };

  const getPriorityName = (priorityId) => {
    const p = priorities.find(
      (x) => Number(x.priorityId) === Number(priorityId)
    );
    if (!p) {
      return priorityId !== null && priorityId !== undefined
        ? String(priorityId)
        : "-";
    }
    return p.name;
  };

  const buildMediaUrl = (filePath) => {
    if (!filePath) return "";
    return `${API_BASE}${filePath}`;
  };

  const getIssueMedias = (issueId) =>
    issueMedias.filter((m) => Number(m.issueId) === Number(issueId));

  const getIssueHistory = (issueId) => {
    const list = issueHistories.filter(
      (h) => Number(h.issueId) === Number(issueId)
    );
    return list.sort(
      (a, b) =>
        new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
    );
  };

  const getCurrentAssigneeUserId = (issueId) => {
    const history = getIssueHistory(issueId);
    const entry = history.find(
      (h) => h.newAssignee && Number(h.newAssignee) !== 0
    );
    return entry ? entry.newAssignee : null;
  };

  // officers = users with roleId 3
  const officers = users.filter((u) => Number(u.roleId) === 3);

  // FILTERED DATA (search + dropdown filters)
  const filtered = issues.filter((it) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        String(it.issueId ?? "").toLowerCase().includes(q) ||
        (it.title ?? "").toLowerCase().includes(q) ||
        (it.description ?? "").toLowerCase().includes(q);
      if (!match) return false;
    }

    if (
      filterCategory !== null &&
      Number(it.categoryId) !== Number(filterCategory)
    ) {
      return false;
    }

    if (
      filterStatus !== null &&
      Number(it.statusId) !== Number(filterStatus)
    ) {
      return false;
    }

    if (
      filterPriority !== null &&
      Number(it.priorityId) !== Number(filterPriority)
    ) {
      return false;
    }

    return true;
  });

  const openDetail = (rec) => {
    setSelectedIssue(rec);
    setDetailVisible(true);
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setSelectedIssue(null);
  };

  // open assign officer modal
  const openAssignModal = (issue) => {
    setAssigningIssue(issue);
    const current = getCurrentAssigneeUserId(issue.issueId);
    setSelectedOfficerId(current || null);
    setAssignModalVisible(true);
  };

  const closeAssignModal = () => {
    setAssignModalVisible(false);
    setAssigningIssue(null);
    setSelectedOfficerId(null);
  };

  // save IssueHistory when officer is assigned
  const handleAssignOfficer = async () => {
    if (!assigningIssue || !selectedOfficerId) {
      message.warning("Please select an officer");
      return;
    }

    // old status = current issue status
    const oldStatusId = assigningIssue.statusId || 0;

    // new status = status with name "Assigned" (if exists), else keep old
    const assignedStatus = statuses.find((s) => {
      const n = (s.name || s.statusName || "").toLowerCase().trim();
      return n === "assigned";
    });
    const newStatusId = assignedStatus ? assignedStatus.statusId : oldStatusId;

    // old assignee from history
    const oldAssigneeId = getCurrentAssigneeUserId(assigningIssue.issueId) || 0;

    // TODO: replace with actual logged-in admin user id
    const adminUserId = 1;

    const payload = {
      issueId: assigningIssue.issueId,
      changedBy: adminUserId,
      oldStatus: oldStatusId,
      newStatus: newStatusId,
      oldAssignee: oldAssigneeId,
      newAssignee: selectedOfficerId,
    };

    try {
      const res = await fetch(`${API_BASE}/api/IssueHistories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Failed to create issue history", res.status, text);
        message.error("Failed to assign officer");
        return;
      }

      const created = await res.json().catch(() => null);

      const historyEntry = created || {
        ...payload,
        historyId: Math.random(),
        changedAt: new Date().toISOString(),
      };

      // update local histories
      setIssueHistories((prev) => [historyEntry, ...prev]);

      // update issue status locally
      setIssues((prev) =>
        prev.map((it) =>
          it.issueId === assigningIssue.issueId
            ? { ...it, statusId: newStatusId }
            : it
        )
      );

      message.success("Officer assigned & history saved");
      closeAssignModal();
    } catch (err) {
      console.error(err);
      message.error("Network error while assigning officer");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "issueId",
      key: "issueId",
      width: 70,
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
            {fmtDateIsoToLocal(r.createdAt)}
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "categoryId",
      key: "categoryId",
      render: (c) => getCategoryName(c),
    },
    {
      title: "Reported By",
      dataIndex: "reportedBy",
      key: "reportedBy",
      render: (u) => getUserDisplay(u),
    },
    {
      title: "Status",
      dataIndex: "statusId",
      key: "statusId",
      render: (s) => <Tag>{getStatusName(s)}</Tag>,
    },
    {
      title: "Priority",
      dataIndex: "priorityId",
      key: "priorityId",
      render: (p) => <Tag>{getPriorityName(p)}</Tag>,
    },
    {
      title: "Assigned To",
      key: "assignedTo",
      render: (_, r) => {
        const uid = getCurrentAssigneeUserId(r.issueId);
        return uid ? getUserDisplay(uid) : <Text type="secondary">-</Text>;
      },
    },
    {
      title: "Media",
      key: "media",
      width: 90,
      render: (_, r) => {
        const medias = getIssueMedias(r.issueId);
        if (!medias.length) return "-";
        const first = medias[0];
        const src = buildMediaUrl(first.filePath);
        return (
          <img
            src={src}
            alt={first.fileName}
            style={{
              width: 64,
              height: 64,
              objectFit: "cover",
              borderRadius: 8,
              border: "1px solid #eee",
            }}
          />
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, rec) => (
        <Space wrap size="small">
          <Button
            icon={<EyeOutlined />}
            type="link"
            onClick={() => openDetail(rec)}
          >
            View Details
          </Button>
          <Button size="small" onClick={() => openAssignModal(rec)}>
            Assign Officer
          </Button>
        </Space>
      ),
    },
  ];

  const renderLocation = (issue) => {
    if (!issue.latitude || !issue.longitude) return "-";
    const { latitude, longitude } = issue;
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    return (
      <div>
        <div>
          {latitude}, {longitude}
        </div>
        <a href={url} target="_blank" rel="noreferrer">
          View on Map
        </a>
      </div>
    );
  };

  const clearFilters = () => {
    setFilterCategory(null);
    setFilterStatus(null);
    setFilterPriority(null);
    setSearch("");
  };

  return (
    <div
      style={{
        padding: 24,
        minHeight: "100vh",
        background: "#f5f7fb",
      }}
    >
      {/* Header line */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Back
          </Button>

          <div>
            <h2 style={{ margin: 0 }}>Issues</h2>
            <div style={{ color: "#666" }}>List of issues across the city</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button icon={<ReloadOutlined />} onClick={fetchIssues}>
            Refresh
          </Button>
        </div>
      </div>

      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Input.Search
            placeholder="Search by id, title or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 320 }}
          />

          <Space wrap>
            <Select
              allowClear
              placeholder="Filter Category"
              value={filterCategory}
              onChange={(value) => setFilterCategory(value ?? null)}
              style={{ minWidth: 160 }}
            >
              {categories.map((c) => (
                <Option key={c.categoryId} value={c.categoryId}>
                  {c.name || c.title || `Category ${c.categoryId}`}
                </Option>
              ))}
            </Select>

            <Select
              allowClear
              placeholder="Filter Status"
              value={filterStatus}
              onChange={(value) => setFilterStatus(value ?? null)}
              style={{ minWidth: 160 }}
            >
              {statuses.map((s) => (
                <Option key={s.statusId} value={s.statusId}>
                  {s.name || s.statusName || `Status ${s.statusId}`}
                </Option>
              ))}
            </Select>

            <Select
              allowClear
              placeholder="Filter Priority"
              value={filterPriority}
              onChange={(value) => setFilterPriority(value ?? null)}
              style={{ minWidth: 160 }}
            >
              {priorities.map((p) => (
                <Option key={p.priorityId} value={p.priorityId}>
                  {p.name}
                </Option>
              ))}
            </Select>

            <Button onClick={clearFilters}>Clear Filters</Button>

            <Tag color="blue">Total: {filtered.length}</Tag>
          </Space>
        </div>

        {issuesLoading ? (
          <Skeleton active />
        ) : issuesError ? (
          <div style={{ padding: 24 }}>
            <Text type="danger">{issuesError}</Text>
          </div>
        ) : filtered.length === 0 ? (
          <Empty description="No issues" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <Table
              rowKey={(r) => r.key}
              dataSource={filtered}
              columns={columns}
              pagination={{ pageSize: 10 }}
              size="middle"
            />
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        open={detailVisible} // if antd v4: use "visible"
        title={selectedIssue ? selectedIssue.title : "Issue details"}
        onCancel={closeDetail}
        footer={
          <Space>
            <Button onClick={closeDetail}>Close</Button>
          </Space>
        }
        width={800}
      >
        {!selectedIssue ? (
          <Skeleton active />
        ) : (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Issue ID">
              {selectedIssue.issueId}
            </Descriptions.Item>

            <Descriptions.Item label="Title">
              {selectedIssue.title}
            </Descriptions.Item>

            <Descriptions.Item label="Description">
              <Paragraph style={{ marginBottom: 0 }}>
                {selectedIssue.description || "No description provided."}
              </Paragraph>
            </Descriptions.Item>

            <Descriptions.Item label="Category">
              {getCategoryName(selectedIssue.categoryId)}
            </Descriptions.Item>

            <Descriptions.Item label="Reported By">
              {getUserDisplay(selectedIssue.reportedBy)}
            </Descriptions.Item>

            <Descriptions.Item label="Status">
              <Tag>{getStatusName(selectedIssue.statusId)}</Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Priority">
              {getPriorityName(selectedIssue.priorityId)}
            </Descriptions.Item>

            <Descriptions.Item label="Assigned Officer">
              {(() => {
                const uid = getCurrentAssigneeUserId(selectedIssue.issueId);
                return uid ? getUserDisplay(uid) : "Not assigned";
              })()}
            </Descriptions.Item>

            <Descriptions.Item label="Location">
              {renderLocation(selectedIssue)}
            </Descriptions.Item>

            <Descriptions.Item label="Media">
              {(() => {
                const medias = getIssueMedias(selectedIssue.issueId);
                if (!medias.length) return "No media attached.";
                return (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {medias.map((m) => (
                      <div key={m.mediaId}>
                        <img
                          src={buildMediaUrl(m.filePath)}
                          alt={m.fileName}
                          style={{
                            width: 140,
                            height: 140,
                            objectFit: "cover",
                            borderRadius: 8,
                            border: "1px solid #eee",
                          }}
                        />
                        <div
                          style={{
                            maxWidth: 140,
                            fontSize: 11,
                            marginTop: 4,
                            wordBreak: "break-all",
                          }}
                        >
                          {m.fileName}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </Descriptions.Item>

            <Descriptions.Item label="History">
              {(() => {
                const history = getIssueHistory(selectedIssue.issueId);
                if (!history.length) return "No history available.";
                return (
                  <Timeline style={{ marginTop: 8 }}>
                    {history.map((h) => (
                      <Timeline.Item key={h.historyId}>
                        <div style={{ fontSize: 12 }}>
                          <div>
                            <b>{fmtDateIsoToLocal(h.changedAt)}</b>
                          </div>
                          <div>By: {getUserDisplay(h.changedBy)}</div>
                          {(h.oldStatus || h.newStatus) && (
                            <div>
                              Status:{" "}
                              {h.oldStatus
                                ? getStatusName(h.oldStatus)
                                : "-"}{" "}
                              {" → "}
                              {h.newStatus
                                ? getStatusName(h.newStatus)
                                : "-"}
                            </div>
                          )}
                          {(h.oldAssignee || h.newAssignee) && (
                            <div>
                              Assignee:{" "}
                              {h.oldAssignee
                                ? getUserDisplay(h.oldAssignee)
                                : "-"}{" "}
                              {" → "}
                              {h.newAssignee
                                ? getUserDisplay(h.newAssignee)
                                : "-"}
                            </div>
                          )}
                        </div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                );
              })()}
            </Descriptions.Item>

            <Descriptions.Item label="Created At">
              {fmtDateIsoToLocal(selectedIssue.createdAt)}
            </Descriptions.Item>

            <Descriptions.Item label="Updated At">
              {fmtDateIsoToLocal(selectedIssue.updatedAt)}
            </Descriptions.Item>

            <Descriptions.Item label="Resolved At">
              {selectedIssue.resolvedAt
                ? fmtDateIsoToLocal(selectedIssue.resolvedAt)
                : "-"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Assign Officer Modal */}
      <Modal
        open={assignModalVisible}
        title={
          assigningIssue
            ? `Assign Officer – Issue #${assigningIssue.issueId}`
            : "Assign Officer"
        }
        onCancel={closeAssignModal}
        onOk={handleAssignOfficer}
        okText="Assign"
        destroyOnClose
      >
        {!assigningIssue ? (
          <Skeleton active />
        ) : officers.length === 0 ? (
          <Text type="secondary">No officers (roleId = 3) found.</Text>
        ) : (
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <b>Issue:</b> #{assigningIssue.issueId} – {assigningIssue.title}
            </div>
            <Select
              style={{ width: "100%" }}
              placeholder="Select officer"
              value={selectedOfficerId ?? undefined}
              onChange={(val) => setSelectedOfficerId(val)}
            >
              {officers.map((o) => (
                <Option key={o.userId} value={o.userId}>
                  {o.name} ({o.email})
                </Option>
              ))}
            </Select>
          </Space>
        )}
      </Modal>
    </div>
  );
}
