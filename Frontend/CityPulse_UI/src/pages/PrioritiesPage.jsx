// src/pages/PrioritiesPage.jsx
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
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const API_BASE = "http://localhost:5028";

export default function PrioritiesPage() {
  const navigate = useNavigate();

  const [priorities, setPriorities] = useState([]);
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

  const fetchPriorities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/Priorities`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text().catch(() => null);

      if (!res.ok) {
        const errMsg = `Priorities API returned ${res.status} ${res.statusText}${
          text ? ` — ${text}` : ""
        }`;
        console.warn(errMsg);
        setError(errMsg);
        setPriorities([]);
        message.error("Failed to load priorities");
        return;
      }

      if (!contentType.includes("application/json")) {
        const errMsg = "Priorities endpoint did not return JSON.";
        console.warn(errMsg, "raw:", text);
        setError(errMsg);
        setPriorities([]);
        message.error("Failed to load priorities (non-JSON response)");
        return;
      }

      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        console.warn("Unexpected priorities shape", data);
        setError("Unexpected response shape from Priorities API");
        setPriorities([]);
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
      setError("Network or server error while fetching priorities");
      setPriorities([]);
      message.error("Failed to load priorities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);

  const filtered = priorities.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(p.priorityId ?? "").toLowerCase().includes(q) ||
      (p.name ?? "").toLowerCase().includes(q) ||
      String(p.level ?? "").toLowerCase().includes(q)
    );
  });

  const columns = [
    { title: "ID", dataIndex: "priorityId", key: "priorityId", width: 100 },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (v) => <strong>{v}</strong>,
    },
    {
      title: "Level",
      dataIndex: "level",
      key: "level",
      render: (v) =>
        typeof v === "number" ? <Tag>{`Level ${v}`}</Tag> : <span>-</span>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space wrap size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRecord(record);
              editForm.setFieldsValue({
                name: record.name,
                level: record.level,
              });
              setEditVisible(true);
            }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Delete priority?"
            description="This will remove the priority entry."
            onConfirm={() => handleDelete(record)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // CREATE
  const handleCreate = async (values) => {
    setCreating(true);
    try {
      const payload = {
        name: values.name,
        level:
          values.level === undefined || values.level === null || values.level === ""
            ? null
            : Number(values.level),
      };

      const res = await fetch(`${API_BASE}/api/Priorities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => null);
      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        console.warn("Create priority failed:", res.status, text);
        message.error("Failed to create priority");
        return;
      }

      if (!contentType.includes("application/json")) {
        message.success("Priority created. Refreshing list...");
        setCreateVisible(false);
        createForm.resetFields();
        await fetchPriorities();
        return;
      }

      const created = JSON.parse(text);
      const normalized = {
        key: created.priorityId ?? String(Math.random()),
        priorityId: created.priorityId,
        name: created.name ?? payload.name ?? "",
        level:
          typeof created.level === "number"
            ? created.level
            : payload.level,
        raw: created,
      };

      setPriorities((prev) => [normalized, ...prev]);
      message.success("Priority created");
      setCreateVisible(false);
      createForm.resetFields();
    } catch (err) {
      console.warn("Create priority error", err);
      message.error("Network or server error while creating priority");
    } finally {
      setCreating(false);
    }
  };

  // UPDATE
  const handleUpdate = async (values) => {
    if (!editingRecord) return;
    setEditing(true);
    try {
      const id = editingRecord.priorityId ?? editingRecord.key;
      const payload = {
        name: values.name,
        level:
          values.level === undefined || values.level === null || values.level === ""
            ? null
            : Number(values.level),
      };

      const res = await fetch(`${API_BASE}/api/Priorities/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.status === 405) {
        // fallback to PUT
        const putRes = await fetch(`${API_BASE}/api/Priorities/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ ...editingRecord.raw, ...payload }),
        });

        if (!putRes.ok) {
          const text = await putRes.text().catch(() => null);
          console.warn("Update (PUT) failed", putRes.status, text);
          message.error("Failed to update priority");
          return;
        }

        const text = await putRes.text().catch(() => null);
        const contentType = putRes.headers.get("content-type") || "";
        const updated =
          contentType.includes("application/json") && text
            ? JSON.parse(text)
            : { ...editingRecord.raw, ...payload };

        setPriorities((prev) =>
          prev.map((r) =>
            r.key === editingRecord.key
              ? {
                  ...r,
                  ...updated,
                  level:
                    typeof updated.level === "number"
                      ? updated.level
                      : payload.level,
                  raw: updated,
                }
              : r
          )
        );
      } else {
        if (!res.ok) {
          const text = await res.text().catch(() => null);
          console.warn("Update (PATCH) failed", res.status, text);
          message.error("Failed to update priority");
          return;
        }

        const text = await res.text().catch(() => null);
        const contentType = res.headers.get("content-type") || "";
        const updated =
          contentType.includes("application/json") && text
            ? JSON.parse(text)
            : { ...editingRecord.raw, ...payload };

        setPriorities((prev) =>
          prev.map((r) =>
            r.key === editingRecord.key
              ? {
                  ...r,
                  ...updated,
                  level:
                    typeof updated.level === "number"
                      ? updated.level
                      : payload.level,
                  raw: updated,
                }
              : r
          )
        );
      }

      message.success("Priority updated");
      setEditVisible(false);
      setEditingRecord(null);
      editForm.resetFields();
    } catch (err) {
      console.warn("Update priority failed", err);
      message.error("Network or server error while updating priority");
    } finally {
      setEditing(false);
    }
  };

  // DELETE
  const handleDelete = async (record) => {
    const id = record.priorityId ?? record.key;
    try {
      const res = await fetch(`${API_BASE}/api/Priorities/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.warn("Delete priority failed", res.status, text);
        message.error("Failed to delete priority");
        return;
      }

      setPriorities((prev) => prev.filter((r) => r.key !== record.key));
      message.success("Priority deleted");
    } catch (err) {
      console.warn("Delete priority failed", err);
      message.error("Network or server error while deleting priority");
    }
  };

  return (
    <div style={{ padding: 24, minHeight: "100vh", background: "#f5f7fb" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button onClick={() => navigate(-1)}>← Back</Button>

          <div>
            <h2 style={{ margin: 0 }}>Priorities</h2>
            <div style={{ color: "#666" }}>List of Priorities</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button icon={<ReloadOutlined />} onClick={fetchPriorities} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateVisible(true)}
          >
            New Priority
          </Button>
        </div>
      </div>

      <Card>
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Input.Search
            placeholder="Search by id, name or level"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 520 }}
          />
          <div style={{ minWidth: 120, textAlign: "right" }}>
            <Tag color="blue">Total: {priorities.length}</Tag>
          </div>
        </div>

        {loading ? (
          <Skeleton active />
        ) : error ? (
          <div style={{ padding: 24 }}>
            <p style={{ color: "red" }}>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <Empty description="No priorities" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <Table
              dataSource={filtered}
              columns={columns}
              pagination={{ pageSize: 10 }}
            />
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        title="Create New Priority"
        visible={createVisible}
        onCancel={() => {
          setCreateVisible(false);
          createForm.resetFields();
        }}
        onOk={() => createForm.submit()}
        confirmLoading={creating}
        okText="Create"
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please provide a name" }]}
          >
            <Input placeholder="Priority name (e.g. High)" />
          </Form.Item>

          <Form.Item
            name="level"
            label="Level"
            rules={[
              {
                required: true,
                message: "Please provide a numeric level (e.g. 1, 2, 3)",
              },
            ]}
          >
            <Input type="number" placeholder="Level (e.g. 1 = highest)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Priority"
        visible={editVisible}
        onCancel={() => {
          setEditVisible(false);
          setEditingRecord(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        confirmLoading={editing}
        okText="Save"
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please provide a name" }]}
          >
            <Input placeholder="Priority name" />
          </Form.Item>

          <Form.Item
            name="level"
            label="Level"
            rules={[
              {
                required: true,
                message: "Please provide a numeric level",
              },
            ]}
          >
            <Input type="number" placeholder="Level (e.g. 1 = highest)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
