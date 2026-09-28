import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button } from "antd";
import heroImage from "../assets/5.jpg";

const API_URL = "http://localhost:5028/api/Auth/register";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // ✅ Phone: only digits, max length 10
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, ""); // remove non-digits
      const trimmed = digitsOnly.slice(0, 10); // max 10 digits
      setFormData((prev) => ({ ...prev, phone: trimmed }));
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ Phone validation: exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Mobile number must be exactly 10 digits (numbers only).");
      return;
    }

    // ✅ Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 0,
          name: formData.name,
          email: formData.email,
          passwordHash: formData.password,
          phone: formData.phone,
          roleId: 0,
          createdAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Registration failed");
      }

      await res.json();
      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        backgroundImage: `linear-gradient(
          rgba(0, 0, 0, 0.2),
          rgba(0, 0, 0, 0.2)
        ), url(${heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div
        style={{
          width: 500,
          background: "rgba(255, 255, 255, 0.25)",
          borderRadius: 20,
          padding: "45px 38px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.3)",
          color: "#222",
          animation: "fadeIn 0.8s ease-in-out",
          transition: "all 0.3s ease",
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
          CityPulse Registration
        </h2>

        <form onSubmit={handleSubmit}>
          {["name", "email", "phone"].map((field) => (
            <div key={field} style={{ marginBottom: 22 }}>
              <Input
                name={field}
                placeholder={`Enter your ${field}`}
                value={formData[field]}
                onChange={handleChange}
                size="large"
                style={{
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 15,
                }}
              />
            </div>
          ))}

          <div style={{ marginBottom: 22 }}>
            <Input.Password
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              size="large"
              style={{
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 15,
              }}
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
            {loading ? "Registering..." : "Create Account"}
          </Button>
        </form>

        {/* Already have account link */}
        <div style={{ marginTop: 15, textAlign: "center", fontSize: 14 }}>
          Already have an account?{" "}
          <a
            onClick={() => navigate("/login")}
            style={{ color: "#1976d2", fontWeight: 500, cursor: "pointer" }}
          >
            Login
          </a>
        </div>

        {error && (
          <p
            style={{
              color: "#e53935",
              marginTop: 18,
              textAlign: "center",
              fontWeight: "500",
              fontSize: 14,
            }}
          >
            {error}
          </p>
        )}
        {success && (
          <p
            style={{
              color: "#43a047",
              marginTop: 18,
              textAlign: "center",
              fontWeight: "500",
              fontSize: 14,
            }}
          >
            🎉 Registration successful! Redirecting...
          </p>
        )}
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
