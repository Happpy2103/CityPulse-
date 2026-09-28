import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Card,
  Button,
  Skeleton,
  message,
  Modal,
  Form,
  Input,
  Popconfirm,
  Typography,
} from "antd";
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;
const API_BASE = "http://localhost:5028";

function fmtDateIsoToLocal(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  } catch {
    return iso;
  }
}

export default function CommentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [comment, setComment] = useState(location.state?.comment ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // edit modal
  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  const fetchComment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/Comments/${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        const errMsg = `Failed to load comment: ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`;
        console.warn(errMsg);
        setError(errMsg);
        setComment(null);
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text().catch(() => null);
        console.warn("Comment endpoint returned non-JSON", text);
        setError("Comment endpoint returned non-JSON response");
        setComment(null);
        return;
      }

      const data = await res.json();
      setComment(data);
    } catch (err) {
      console.warn("Failed to fetch comment", err);
      setError("Network or server error while fetching comment");
      setComment(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!comment) fetchComment();
  }, [fetchComment, comment]);

  const handleDelete = async () => {
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

      message.success("Comment deleted");
      navigate("/comments");
    } catch (err) {
      console.warn("Delete comment failed", err);
      message.error("Network or server error while deleting comment");
    }
  };

  const handleEdit = async (values) => {
    setEditing(true);
    try {
      const patchRes = await fetch(`${API_BASE}/api/Comments/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(values),
      });

      let updated;
      if (patchRes.status === 405) {
        const putRes = await fetch(`${API_BASE}/api/Comments/${encodeURIComponent(id)}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ...(comment || {}), ...values }),
        });
        if (!putRes.ok) {
          const text = await putRes.text().catch(() => null);
          console.warn("Update (PUT) failed", putRes.status, text);
          message.error("Failed to update comment");
          return;
        }
        const contentType = putRes.headers.get("content-type") || "";
        updated = contentType.includes("application/json") ? await putRes.json() : { ...(comment || {}), ...values };
      } else {
        if (!patchRes.ok) {
          const text = await patchRes.text().catch(() => null);
          console.warn("Update (PATCH) failed", patchRes.status, text);
          message.error("Failed to update comment");
          return;
        }
        const contentType = patchRes.headers.get("content-type") || "";
        updated = contentType.includes("application/json") ? await patchRes.json() : { ...(comment || {}), ...values };
      }

      message.success("Comment updated");
      setEditVisible(false);
      setComment(updated);
    } catch (err) {
      console.warn("Update failed", err);
      message.error("Network or server error while updating comment");
    } finally {
      setEditing(false);
    }
  };

  if (loading) return <Skeleton active />;

  return (
    <div style={{ padding: 24, minHeight: "100vh", background: "#f5f7fb" }}>
      <Card>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/comments")}>Back</Button>

          <h2 style={{ margin: 0 }}>{comment?.commentText ? `${String(comment.commentText).slice(0, 40)}...` : `Comment ${id}`}</h2>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                form.setFieldsValue({
                  issueId: comment?.issueId,
                  userId: comment?.userId,
                  commentText: comment?.commentText,
                });
                setEditVisible(true);
              }}
            >
              Edit
            </Button>

            <Popconfirm title="Delete comment?" description="This action cannot be undone." onConfirm={handleDelete} okText="Delete" cancelText="Cancel">
              <Button danger icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
          </div>
        </div>

        {error ? (
          <div style={{ padding: 16 }}>
            <Paragraph type="danger">{error}</Paragraph>
          </div>
        ) : !comment ? (
          <div style={{ padding: 16 }}>
            <Paragraph>No comment data.</Paragraph>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <Title level={5}>Comment</Title>
              <Paragraph>{comment.commentText}</Paragraph>
            </div>

            <div>
              <Title level={5}>Issue ID</Title>
              <Paragraph>{comment.issueId ?? "-"}</Paragraph>
            </div>

            <div>
              <Title level={5}>User ID</Title>
              <Paragraph>{comment.userId ?? "-"}</Paragraph>
            </div>

            <div>
              <Title level={5}>Created</Title>
              <Paragraph>{fmtDateIsoToLocal(comment.createdAt)}</Paragraph>
            </div>

            <div>
              <Title level={5}>Raw JSON</Title>
              <pre style={{ maxHeight: 300, overflow: "auto", background: "#f0f2f5", padding: 12, borderRadius: 6 }}>
                {JSON.stringify(comment, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      <Modal title="Edit Comment" visible={editVisible} onCancel={() => { setEditVisible(false); form.resetFields(); }} onOk={() => form.submit()} confirmLoading={editing} okText="Save">
        <Form form={form} layout="vertical" onFinish={handleEdit}>
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
