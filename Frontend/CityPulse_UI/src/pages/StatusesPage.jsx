// src/pages/StatusesPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Skeleton,
  Empty,
  message,
  Tag,
  Modal,
  Form,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const API_BASE = "http://localhost:5028";

export default function StatusesPage() {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Create modal state
  const [createVisible, setCreateVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm] = Form.useForm();

  // Edit modal state
  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm] = Form.useForm();
  const [editingRecord, setEditingRecord] = useState(null);

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/Status`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text().catch(() => null);

      if (!res.ok) {
        const errMsg = `Status API returned ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`;
        console.warn(errMsg);
        setError(errMsg);
        setStatuses([]);
        message.error("Failed to load statuses");
        return;
      }

      if (!contentType.includes("application/json")) {
        const errMsg = "Status endpoint did not return JSON.";
        console.warn(errMsg, "raw:", text);
        setError(errMsg);
        setStatuses([]);
        message.error("Failed to load statuses (non-JSON response)");
        return;
      }

      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        console.warn("Unexpected status shape", data);
        setError("Unexpected response shape from Status API");
        setStatuses([]);
      } else {
        const normalized = data.map((s) => ({
          key: s.statusId ?? String(Math.random()),
          statusId: s.statusId,
          name: s.name ?? "",
          description: s.description ?? "",
          raw: s,
        }));
        setStatuses(normalized);
      }
    } catch (err) {
      console.warn("Failed to fetch statuses", err);
      setError("Network or server error while fetching statuses");
      setStatuses([]);
      message.error("Failed to load statuses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const filtered = statuses.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return String(s.statusId ?? "").includes(q) || (s.name ?? "").toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q);
  });

  const columns = [
    { title: "ID", dataIndex: "statusId", key: "statusId", width: 100 },
    { title: "Name", dataIndex: "name", key: "name", render: (v) => <strong>{v}</strong> },
    { title: "Description", dataIndex: "description", key: "description", ellipsis: true },
    {
      title: "Actions",
      key: "actions",
      // ⚠️ removed fixed width so the column can shrink
      render: (_, record) => (
        // use Space with wrap and small buttons so items don't force horizontal scroll
        <Space wrap size="small">
          

          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRecord(record);
              editForm.setFieldsValue({
                name: record.name,
                description: record.description,
              });
              setEditVisible(true);
            }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Delete status?"
            description="This will remove the status entry."
            onConfirm={() => handleDelete(record)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // CREATE
  const handleCreate = async (values) => {
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/Status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });

      const text = await res.text().catch(() => null);
      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        console.warn("Create status failed:", res.status, text);
        message.error("Failed to create status");
        return;
      }

      if (!contentType.includes("application/json")) {
        message.success("Status created. Refreshing list...");
        setCreateVisible(false);
        createForm.resetFields();
        await fetchStatuses();
        return;
      }

      const created = JSON.parse(text);
      const normalized = {
        key: created.statusId ?? String(Math.random()),
        statusId: created.statusId,
        name: created.name ?? values.name ?? "",
        description: created.description ?? values.description ?? "",
        raw: created,
      };

      setStatuses((prev) => [normalized, ...prev]);
      message.success("Status created");
      setCreateVisible(false);
      createForm.resetFields();
    } catch (err) {
      console.warn("Create status error", err);
      message.error("Network or server error while creating status");
    } finally {
      setCreating(false);
    }
  };

  // UPDATE
  const handleUpdate = async (values) => {
    if (!editingRecord) return;
    setEditing(true);
    try {
      const id = editingRecord.statusId ?? editingRecord.key;
      const res = await fetch(`${API_BASE}/api/Status/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });

      if (res.status === 405) {
        // fallback to PUT
        const putRes = await fetch(`${API_BASE}/api/Status/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...editingRecord.raw, ...values }),
        });
        if (!putRes.ok) {
          const text = await putRes.text().catch(() => null);
          console.warn("Update (PUT) failed", putRes.status, text);
          message.error("Failed to update status");
          return;
        }
        const text = await putRes.text().catch(() => null);
        const contentType = putRes.headers.get("content-type") || "";
        const updated = contentType.includes("application/json") && text ? JSON.parse(text) : { ...editingRecord.raw, ...values };
        setStatuses((prev) => prev.map((r) => (r.key === editingRecord.key ? { ...r, ...updated, raw: updated } : r)));
      } else {
        if (!res.ok) {
          const text = await res.text().catch(() => null);
          console.warn("Update (PATCH) failed", res.status, text);
          message.error("Failed to update status");
          return;
        }
        const text = await res.text().catch(() => null);
        const contentType = res.headers.get("content-type") || "";
        const updated = contentType.includes("application/json") && text ? JSON.parse(text) : { ...editingRecord.raw, ...values };
        setStatuses((prev) => prev.map((r) => (r.key === editingRecord.key ? { ...r, ...updated, raw: updated } : r)));
      }

      message.success("Status updated");
      setEditVisible(false);
      setEditingRecord(null);
      editForm.resetFields();
    } catch (err) {
      console.warn("Update status failed", err);
      message.error("Network or server error while updating status");
    } finally {
      setEditing(false);
    }
  };

  // DELETE
  const handleDelete = async (record) => {
    const id = record.statusId ?? record.key;
    try {
      const res = await fetch(`${API_BASE}/api/Status/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.warn("Delete failed", res.status, text);
        message.error("Failed to delete status");
        return;
      }

      setStatuses((prev) => prev.filter((r) => r.key !== record.key));
      message.success("Status deleted");
    } catch (err) {
      console.warn("Delete status failed", err);
      message.error("Network or server error while deleting status");
    }
  };

  return (
    <div style={{ padding: 24, minHeight: "100vh", background: "#f5f7fb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Button onClick={() => navigate(-1)}>
                    ← Back
                  </Button>
        
                  <div>
                    <h2 style={{ margin: 0 }}>Statuses</h2>
                    <div style={{ color: "#666" }}>
                      List of Statuses
                    </div>
                  </div>
                </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button icon={<ReloadOutlined />} onClick={fetchStatuses} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
            New Status
          </Button>
        </div>
      </div>

      <Card>
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", gap: 12 }}>
          <Input.Search placeholder="Search by id, name or description" value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ maxWidth: 520 }} />
          <div style={{ minWidth: 120, textAlign: "right" }}>
            <Tag color="blue">Total: {statuses.length}</Tag>
          </div>
        </div>

        {loading ? (
          <Skeleton active />
        ) : error ? (
          <div style={{ padding: 24 }}><p style={{ color: "red" }}>{error}</p></div>
        ) : filtered.length === 0 ? (
          <Empty description="No statuses" />
        ) : (
          // ensure table container can scroll horizontally only if necessary
          <div style={{ overflowX: "auto" }}>
            <Table dataSource={filtered} columns={columns} pagination={{ pageSize: 10 }} />
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        title="Create New Status"
        visible={createVisible}
        onCancel={() => { setCreateVisible(false); createForm.resetFields(); }}
        onOk={() => createForm.submit()}
        confirmLoading={creating}
        okText="Create"
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please provide a name" }]}>
            <Input placeholder="Status name (e.g. Reported)" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Status"
        visible={editVisible}
        onCancel={() => { setEditVisible(false); setEditingRecord(null); editForm.resetFields(); }}
        onOk={() => editForm.submit()}
        confirmLoading={editing}
        okText="Save"
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please provide a name" }]}>
            <Input placeholder="Status name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
