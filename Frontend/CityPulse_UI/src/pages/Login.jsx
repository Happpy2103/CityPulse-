// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import heroImage from "../assets/5.jpg";

const API_URL = "http://localhost:5028/api/Auth/login";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        let errMsg = "Login failed";
        try {
          const errJson = await res.json();
          errMsg = errJson?.message || JSON.stringify(errJson) || errMsg;
        } catch {
          try {
            errMsg = await res.text();
          } catch { }
        }
        throw new Error(errMsg);
      }

      const data = await res.json();

      // Save token and user details
      if (data?.token) localStorage.setItem("token", data.token);

      const userObj = data?.user ?? data;

      // Save user object
      localStorage.setItem("user", JSON.stringify(userObj));

      // Save a dedicated roleId if present anywhere
      const roleId =
        userObj?.roleId ?? // common field
        userObj?.role?.id ?? // nested
        userObj?.role ??     // sometimes role is a simple id
        data?.roleId ?? null;

      if (roleId !== null && roleId !== undefined) {
        localStorage.setItem("roleId", String(roleId));
      } else {
        // optionally remove stale
        localStorage.removeItem("roleId");
      }


      setSuccess(true);
setLoading(false);

// ✅ Role-based navigation
if (String(roleId) === "1") {
  navigate("/dashboard");
} else if (String(roleId) === "2") {
  navigate("/Cdashboard");
} else if (String(roleId) === "3") {
  navigate("/Odashboard");
} else {
  navigate("/Edashboard");
}


    } catch (err) {
      setError(err?.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        backgroundImage: `linear-gradient(
          rgba(0,0,0,0.2),
          rgba(0,0,0,0.2)
        ), url(${heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Poppins', sans-serif",
        position: "relative",
      }}
    >
      {/* Back Button */}
<Button
  type="text"
  icon={<ArrowLeftOutlined />}
  onClick={() => navigate("/")}
  style={{
    position: "absolute",
    top: 25,
    left: 25,
    color: "#fff",
    fontWeight: 500,
    fontSize: 15,
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(8px)",
    borderRadius: 8,
    padding: "6px 14px",
  }}
>
  Back
</Button>


      {/* Login Card */}
      <div
        style={{
          width: 450,
          background: "rgba(255, 255, 255, 0.25)",
          borderRadius: 20,
          padding: "45px 38px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.3)",
          color: "#222",
          animation: "fadeIn 0.8s ease-in-out",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: 25,
            fontWeight: "700",
            letterSpacing: "0.5px",
            fontSize: 26,
            color: "#2c3e50",
          }}
        >
          CityPulse Login
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 22 }}>
            <Input
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              size="large"
              style={{ borderRadius: 10, padding: "12px 14px", fontSize: 15 }}
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <Input.Password
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              size="large"
              style={{ borderRadius: 10, padding: "12px 14px", fontSize: 15 }}
            />
          </div>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{
              borderRadius: 10,
              padding: "12px 0",
              fontWeight: 600,
              fontSize: 15,
              background: "linear-gradient(135deg, #64b5f6, #81c784)",
              border: "none",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        {error && (
          <p style={{ color: "#e53935", marginTop: 18, textAlign: "center", fontWeight: 500, fontSize: 14 }}>
            {error}
          </p>
        )}
        {success && (
          <p style={{ color: "#43a047", marginTop: 18, textAlign: "center", fontWeight: 500, fontSize: 14 }}>
            🎉 Login successful! Redirecting...
          </p>
        )}

        <div style={{ marginTop: 15, textAlign: "center", fontSize: 14 }}>
          New to this?{" "}
          <a onClick={() => navigate("/register")} style={{ color: "#1976d2", fontWeight: 500, cursor: "pointer" }}>
            Register
          </a>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}
