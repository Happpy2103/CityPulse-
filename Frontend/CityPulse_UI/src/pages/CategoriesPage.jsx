// src/pages/CategoriesPage.jsx
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

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
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

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/Categories`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text().catch(() => null);

      if (!res.ok) {
        const errMsg = `Categories API returned ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`;
        console.warn(errMsg);
        setError(errMsg);
        setCategories([]);
        message.error("Failed to load categories");
        return;
      }

      if (!contentType.includes("application/json")) {
        const errMsg = "Categories endpoint did not return JSON.";
        console.warn(errMsg, "raw:", text);
        setError(errMsg);
        setCategories([]);
        message.error("Failed to load categories (non-JSON response)");
        return;
      }

      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        console.warn("Unexpected categories shape", data);
        setError("Unexpected response shape from Categories API");
        setCategories([]);
      } else {
        // normalize keys for Ant Table
        const normalized = data.map((c) => ({
          key: c.categoryId ?? c.id ?? String(Math.random()),
          categoryId: c.categoryId ?? c.id,
          name: c.name ?? c.categoryName ?? "",
          description: c.description ?? "",
          raw: c,
        }));
        setCategories(normalized);
      }
    } catch (err) {
      console.warn("Failed to fetch categories", err);
      setError("Network or server error while fetching categories");
      setCategories([]);
      message.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filtered = categories.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.name || "").toLowerCase().includes(s) || (c.description || "").toLowerCase().includes(s) || String(c.categoryId).includes(s);
  });

  const columns = [
    { title: "ID", dataIndex: "categoryId", key: "categoryId", width: 100 },
    { title: "Name", dataIndex: "name", key: "name", render: (v) => <strong>{v}</strong> },
    { title: "Description", dataIndex: "description", key: "description", ellipsis: true },
    {
      title: "Actions",
      key: "actions",
      // removed fixed width so the column can shrink on small screens
      render: (_, record) => (
        // Space uses wrap + small buttons so actions stack instead of pushing horizontal scroll
        <Space wrap size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              // open edit modal and populate form
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
            title="Delete category?"
            description="This action cannot be undone. Are you sure?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // CREATE handler (same as before but using createForm)
  const handleCreate = async (values) => {
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/Categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      });

      const text = await res.text().catch(() => null);
      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        const errMsg = `Create API returned ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`;
        console.warn(errMsg);
        message.error("Failed to create category");
        return;
      }

      if (!contentType.includes("application/json")) {
        message.success("Category created (no JSON return). Refreshing list...");
        setCreateVisible(false);
        createForm.resetFields();
        await fetchCategories();
        return;
      }

      const created = JSON.parse(text);
      const normalized = {
        key: created.categoryId ?? created.id ?? String(Math.random()),
        categoryId: created.categoryId ?? created.id,
        name: created.name ?? created.categoryName ?? values.name ?? "",
        description: created.description ?? values.description ?? "",
        raw: created,
      };

      setCategories((prev) => [normalized, ...prev]);
      message.success("Category created");
      setCreateVisible(false);
      createForm.resetFields();
    } catch (err) {
      console.warn("Create category failed", err);
      message.error("Network or server error while creating category");
    } finally {
      setCreating(false);
    }
  };

  // UPDATE handler
  const handleUpdate = async (values) => {
    if (!editingRecord) return;
    setEditing(true);
    try {
      // try PATCH first, fallback to PUT if you prefer one method; adjust path if different
      const id = editingRecord.categoryId ?? editingRecord.key;
      const res = await fetch(`${API_BASE}/api/Categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      });

      // if PATCH not allowed, server might respond 405; try PUT in that case
      if (res.status === 405) {
        // attempt PUT
        const putRes = await fetch(`${API_BASE}/api/Categories/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ ...editingRecord.raw, ...values }),
        });
        if (!putRes.ok) {
          const text = await putRes.text().catch(() => null);
          console.warn("Update (PUT) failed", putRes.status, text);
          message.error("Failed to update category");
          return;
        }
        const text = await putRes.text().catch(() => null);
        const contentType = putRes.headers.get("content-type") || "";
        const updated = contentType.includes("application/json") && text ? JSON.parse(text) : { ...editingRecord.raw, ...values };
        // apply update to list
        setCategories((prev) => prev.map((r) => (r.key === editingRecord.key ? {
          ...r,
          name: updated.name ?? values.name ?? r.name,
          description: updated.description ?? values.description ?? r.description,
          raw: updated,
        } : r)));
      } else {
        if (!res.ok) {
          const text = await res.text().catch(() => null);
          console.warn("Update (PATCH) failed", res.status, text);
          message.error("Failed to update category");
          return;
        }
        const text = await res.text().catch(() => null);
        const contentType = res.headers.get("content-type") || "";
        const updated = contentType.includes("application/json") && text ? JSON.parse(text) : { ...editingRecord.raw, ...values };
        setCategories((prev) => prev.map((r) => (r.key === editingRecord.key ? {
          ...r,
          name: updated.name ?? values.name ?? r.name,
          description: updated.description ?? values.description ?? r.description,
          raw: updated,
        } : r)));
      }

      message.success("Category updated");
      setEditVisible(false);
      setEditingRecord(null);
      editForm.resetFields();
    } catch (err) {
      console.warn("Update category failed", err);
      message.error("Network or server error while updating category");
    } finally {
      setEditing(false);
    }
  };

  // DELETE handler
  const handleDelete = async (record) => {
    const id = record.categoryId ?? record.key;
    try {
      const res = await fetch(`${API_BASE}/api/Categories/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.warn("Delete failed", res.status, text);
        message.error("Failed to delete category");
        return;
      }

      // remove from list
      setCategories((prev) => prev.filter((r) => r.key !== record.key));
      message.success("Category deleted");
    } catch (err) {
      console.warn("Delete category failed", err);
      message.error("Network or server error while deleting category");
    }
  };

  return (
    <div style={{ padding: 24, minHeight: "100vh", background: "#f0f0f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button onClick={() => navigate(-1)}>
            ← Back
          </Button>

          <div>
            <h2 style={{ margin: 0 }}>Categories</h2>
            <div style={{ color: "#666" }}>
              List of categories
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button icon={<ReloadOutlined />} onClick={fetchCategories} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
            New Category
          </Button>
        </div>
      </div>

      <Card>
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", gap: 12 }}>
          <Input.Search placeholder="Search categories by id, name or description" value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ maxWidth: 480 }} />
          <div style={{ minWidth: 120, textAlign: "right" }}>
            <Tag color="blue">Total: {categories.length}</Tag>
          </div>
        </div>

        {loading ? (
          <Skeleton active />
        ) : error ? (
          <div style={{ padding: 24 }}>
            <p style={{ color: "red" }}>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <Empty description="No categories" />
        ) : (
          // allow horizontal scroll only when absolutely necessary
          <div style={{ overflowX: "auto" }}>
            <Table dataSource={filtered} columns={columns} pagination={{ pageSize: 10 }} />
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        title="Create New Category"
        visible={createVisible}
        onCancel={() => { setCreateVisible(false); createForm.resetFields(); }}
        onOk={() => createForm.submit()}
        confirmLoading={creating}
        okText="Create"
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please provide a category name" }]}
          >
            <Input placeholder="Category name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Short description (optional)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Category"
        visible={editVisible}
        onCancel={() => { setEditVisible(false); setEditingRecord(null); editForm.resetFields(); }}
        onOk={() => editForm.submit()}
        confirmLoading={editing}
        okText="Save"
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please provide a category name" }]}
          >
            <Input placeholder="Category name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Short description (optional)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
