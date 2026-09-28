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

function fmtDateIsoToLocal(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  } catch {
    return iso;
  }
}

export default function CommentsPage() {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
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

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/Comments`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text().catch(() => null);

      if (!res.ok) {
        const errMsg = `Comments API returned ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`;
        console.warn(errMsg);
        setError(errMsg);
        setComments([]);
        message.error("Failed to load comments");
        return;
      }

      if (!contentType.includes("application/json")) {
        console.warn("Comments endpoint did not return JSON:", text);
        setError("Comments endpoint did not return JSON");
        setComments([]);
        message.error("Failed to load comments (non-JSON response)");
        return;
      }

      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        console.warn("Unexpected comments shape", data);
        setError("Unexpected response shape from Comments API");
        setComments([]);
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
        setComments(normalized);
      }
    } catch (err) {
      console.warn("Failed to fetch comments", err);
      setError("Network or server error while fetching comments");
      setComments([]);
      message.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const filtered = comments.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      String(c.commentId ?? "").includes(s) ||
      String(c.issueId ?? "").includes(s) ||
      String(c.userId ?? "").includes(s) ||
      (c.commentText || "").toLowerCase().includes(s)
    );
  });

  const columns = [
    { title: "ID", dataIndex: "commentId", key: "commentId", width: 100 },
    { title: "Issue", dataIndex: "issueId", key: "issueId", width: 100 },
    { title: "User", dataIndex: "userId", key: "userId", width: 100 },
    {
      title: "Comment",
      dataIndex: "commentText",
      key: "commentText",
      ellipsis: true,
      render: (t) => <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 300 }}>{t}</span>,
    },
    { title: "Created", dataIndex: "createdAt", key: "createdAt", width: 180, render: (d) => fmtDateIsoToLocal(d) },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => navigate(`/comments/${record.commentId}`, { state: { comment: record.raw } })}>
            View
          </Button>

          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRecord(record);
              editForm.setFieldsValue({
                issueId: record.issueId,
                userId: record.userId,
                commentText: record.commentText,
              });
              setEditVisible(true);
            }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Delete comment?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
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
        issueId: values.issueId,
        userId: values.userId,
        commentText: values.commentText,
      };

      const res = await fetch(`${API_BASE}/api/Comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => null);
      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        console.warn("Create comment failed:", res.status, text);
        message.error("Failed to create comment");
        return;
      }

      if (!contentType.includes("application/json")) {
        message.success("Comment created. Refreshing list...");
        setCreateVisible(false);
        createForm.resetFields();
        await fetchComments();
        return;
      }

      const created = JSON.parse(text);
      const normalized = {
        key: created.commentId ?? String(Math.random()),
        commentId: created.commentId,
        issueId: created.issueId,
        userId: created.userId,
        commentText: created.commentText ?? payload.commentText,
        createdAt: created.createdAt,
        raw: created,
      };

      setComments((prev) => [normalized, ...prev]);
      message.success("Comment created");
      setCreateVisible(false);
      createForm.resetFields();
    } catch (err) {
      console.warn("Create comment error", err);
      message.error("Network or server error while creating comment");
    } finally {
      setCreating(false);
    }
  };

  // UPDATE (PATCH/PUT)
  const handleUpdate = async (values) => {
    if (!editingRecord) return;
    setEditing(true);
    try {
      const id = editingRecord.commentId ?? editingRecord.key;
      const res = await fetch(`${API_BASE}/api/Comments/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });

      if (res.status === 405) {
        // fallback to PUT
        const putRes = await fetch(`${API_BASE}/api/Comments/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...editingRecord.raw, ...values }),
        });
        if (!putRes.ok) {
          const text = await putRes.text().catch(() => null);
          console.warn("Update (PUT) failed", putRes.status, text);
          message.error("Failed to update comment");
          return;
        }
        const text = await putRes.text().catch(() => null);
        const contentType = putRes.headers.get("content-type") || "";
        const updated = contentType.includes("application/json") && text ? JSON.parse(text) : { ...editingRecord.raw, ...values };
        setComments((prev) => prev.map((r) => (r.key === editingRecord.key ? { ...r, ...updated, raw: updated } : r)));
      } else {
        if (!res.ok) {
          const text = await res.text().catch(() => null);
          console.warn("Update (PATCH) failed", res.status, text);
          message.error("Failed to update comment");
          return;
        }
        const text = await res.text().catch(() => null);
        const contentType = res.headers.get("content-type") || "";
        const updated = contentType.includes("application/json") && text ? JSON.parse(text) : { ...editingRecord.raw, ...values };
        setComments((prev) => prev.map((r) => (r.key === editingRecord.key ? { ...r, ...updated, raw: updated } : r)));
      }

      message.success("Comment updated");
      setEditVisible(false);
      setEditingRecord(null);
      editForm.resetFields();
    } catch (err) {
      console.warn("Update comment failed", err);
      message.error("Network or server error while updating comment");
    } finally {
      setEditing(false);
    }
  };

  // DELETE
  const handleDelete = async (record) => {
    const id = record.commentId ?? record.key;
    try {
      const res = await fetch(`${API_BASE}/api/Comments/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.warn("Delete failed", res.status, text);
        message.error("Failed to delete comment");
        return;
      }

      setComments((prev) => prev.filter((r) => r.key !== record.key));
      message.success("Comment deleted");
    } catch (err) {
      console.warn("Delete comment failed", err);
      message.error("Network or server error while deleting comment");
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
                   <h2 style={{ margin: 0 }}>Comments</h2>
                   <div style={{ color: "#666" }}>
                     List of Comments
                   </div>
                 </div>
               </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button icon={<ReloadOutlined />} onClick={fetchComments} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>New Comment</Button>
        </div>
      </div>

      <Card>
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", gap: 12 }}>
          <Input.Search placeholder="Search by id, issue, user, or text" value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ maxWidth: 520 }} />
          <div style={{ minWidth: 120, textAlign: "right" }}>
            <Tag color="blue">Total: {comments.length}</Tag>
          </div>
        </div>

        {loading ? (
          <Skeleton active />
        ) : error ? (
          <div style={{ padding: 24 }}><p style={{ color: "red" }}>{error}</p></div>
        ) : filtered.length === 0 ? (
          <Empty description="No comments" />
        ) : (
          <Table dataSource={filtered} columns={columns} pagination={{ pageSize: 10 }} />
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        title="Create New Comment"
        visible={createVisible}
        onCancel={() => { setCreateVisible(false); createForm.resetFields(); }}
        onOk={() => createForm.submit()}
        confirmLoading={creating}
        okText="Create"
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="issueId" label="Issue ID" rules={[{ required: true, message: "Provide issueId" }]}>
            <Input type="number" placeholder="Issue ID" />
          </Form.Item>

          <Form.Item name="userId" label="User ID" rules={[{ required: true, message: "Provide userId" }]}>
            <Input type="number" placeholder="User ID" />
          </Form.Item>

          <Form.Item name="commentText" label="Comment" rules={[{ required: true, message: "Provide comment text" }]}>
            <Input.TextArea rows={4} placeholder="Comment content" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Comment"
        visible={editVisible}
        onCancel={() => { setEditVisible(false); setEditingRecord(null); editForm.resetFields(); }}
        onOk={() => editForm.submit()}
        confirmLoading={editing}
        okText="Save"
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="issueId" label="Issue ID" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>

          <Form.Item name="userId" label="User ID" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>

          <Form.Item name="commentText" label="Comment" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
