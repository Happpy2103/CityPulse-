// src/pages/UsersPage.jsx
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
  Select,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const API_BASE = "http://localhost:5028";

export default function UsersPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Create modal
  const [createVisible, setCreateVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm] = Form.useForm();

  // Edit modal
  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm] = Form.useForm();
  const [editingRecord, setEditingRecord] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/Users`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text().catch(() => null);

      if (!res.ok) {
        const errMsg = `Users API returned ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`;
        console.warn(errMsg);
        setError(errMsg);
        setUsers([]);
        message.error("Failed to load users");
        return;
      }

      if (!contentType.includes("application/json")) {
        const errMsg = "Users endpoint did not return JSON.";
        console.warn(errMsg, "raw:", text);
        setError(errMsg);
        setUsers([]);
        message.error("Failed to load users (non-JSON response)");
        return;
      }

      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        console.warn("Unexpected users shape", data);
        setError("Unexpected response shape from Users API");
        setUsers([]);
      } else {
        const normalized = data.map((u) => ({
          key: u.userId ?? String(Math.random()),
          userId: u.userId,
          name: u.name ?? u.displayName ?? "",
          email: u.email ?? "",
          phone: u.phone ?? "",
          roleId: typeof u.roleId !== "undefined" ? Number(u.roleId) : undefined,
          createdAt: u.createdAt,
          raw: u,
        }));
        setUsers(normalized);
      }
    } catch (err) {
      console.warn("Failed to fetch users", err);
      setError("Network or server error while fetching users");
      setUsers([]);
      message.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return String(u.userId ?? "").includes(q) || (u.name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q);
  });

  const columns = [
    { title: "ID", dataIndex: "userId", key: "userId", width: 100 },
    { title: "Name", dataIndex: "name", key: "name", render: (v) => <strong>{v}</strong> },
    { title: "Email", dataIndex: "email", key: "email", ellipsis: true },
    { title: "Phone", dataIndex: "phone", key: "phone", width: 140 },
    { title: "Role", dataIndex: "roleId", key: "roleId", width: 110, render: (r) => r ?? "—" },
  ];

  // CREATE
  const handleCreate = async (values) => {
    setCreating(true);
    try {
      // caution: many APIs expect password to be hashed server-side; only send if your API supports plain passwords
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        roleId: values.roleId,
        // password: values.password || undefined,
      };

      const res = await fetch(`${API_BASE}/api/Users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => null);
      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        const errMsg = `Create user failed ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`;
        console.warn(errMsg);
        message.error("Failed to create user");
        return;
      }

      if (!contentType.includes("application/json")) {
        message.success("User created. Refreshing list...");
        setCreateVisible(false);
        createForm.resetFields();
        await fetchUsers();
        return;
      }

      const created = JSON.parse(text);
      const normalized = {
        key: created.userId ?? String(Math.random()),
        userId: created.userId,
        name: created.name ?? values.name ?? "",
        email: created.email ?? values.email ?? "",
        phone: created.phone ?? values.phone ?? "",
        roleId: typeof created.roleId !== "undefined" ? Number(created.roleId) : values.roleId,
        raw: created,
      };

      setUsers((prev) => [normalized, ...prev]);
      message.success("User created");
      setCreateVisible(false);
      createForm.resetFields();
    } catch (err) {
      console.warn("Create user failed", err);
      message.error("Network or server error while creating user");
    } finally {
      setCreating(false);
    }
  };

  // UPDATE
  const handleUpdate = async (values) => {
    if (!editingRecord) return;
    setEditing(true);
    try {
      const id = editingRecord.userId ?? editingRecord.key;
      const res = await fetch(`${API_BASE}/api/Users/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });

      if (res.status === 405) {
        // fallback to PUT
        const putRes = await fetch(`${API_BASE}/api/Users/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...editingRecord.raw, ...values }),
        });
        if (!putRes.ok) {
          const txt = await putRes.text().catch(() => null);
          console.warn("Update user (PUT) failed", putRes.status, txt);
          message.error("Failed to update user");
          return;
        }
        const txt = await putRes.text().catch(() => null);
        const contentType = putRes.headers.get("content-type") || "";
        const updated = contentType.includes("application/json") && txt ? JSON.parse(txt) : { ...editingRecord.raw, ...values };
        setUsers((prev) => prev.map((r) => (r.key === editingRecord.key ? { ...r, ...updated, raw: updated } : r)));
      } else {
        if (!res.ok) {
          const txt = await res.text().catch(() => null);
          console.warn("Update user (PATCH) failed", res.status, txt);
          message.error("Failed to update user");
          return;
        }
        const txt = await res.text().catch(() => null);
        const contentType = res.headers.get("content-type") || "";
        const updated = contentType.includes("application/json") && txt ? JSON.parse(txt) : { ...editingRecord.raw, ...values };
        setUsers((prev) => prev.map((r) => (r.key === editingRecord.key ? { ...r, ...updated, raw: updated } : r)));
      }

      message.success("User updated");
      setEditVisible(false);
      setEditingRecord(null);
      editForm.resetFields();
    } catch (err) {
      console.warn("Update user failed", err);
      message.error("Network or server error while updating user");
    } finally {
      setEditing(false);
    }
  };

  // DELETE
  const handleDelete = async (record) => {
    const id = record.userId ?? record.key;
    try {
      const res = await fetch(`${API_BASE}/api/Users/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        console.warn("Delete user failed", res.status, txt);
        message.error("Failed to delete user");
        return;
      }

      setUsers((prev) => prev.filter((r) => r.key !== record.key));
      message.success("User deleted");
    } catch (err) {
      console.warn("Delete user failed", err);
      message.error("Network or server error while deleting user");
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
                    <h2 style={{ margin: 0 }}>Users</h2>
                    <div style={{ color: "#666" }}>
                      List of Users
                    </div>
                  </div>
                </div>
      </div>

      <Card>
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", gap: 12 }}>
          <Input.Search placeholder="Search by id, name or email" value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ maxWidth: 520 }} />
          <div style={{ minWidth: 120, textAlign: "right" }}>
            <Tag color="blue">Total: {users.length}</Tag>
          </div>
        </div>

        {loading ? (
          <Skeleton active />
        ) : error ? (
          <div style={{ padding: 24 }}><p style={{ color: "red" }}>{error}</p></div>
        ) : filtered.length === 0 ? (
          <Empty description="No users" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <Table dataSource={filtered} columns={columns} pagination={{ pageSize: 10 }} />
          </div>
        )}
      </Card>
    </div>
  );
}
