// src/components/Header.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Layout, Menu, Dropdown, Button, Space } from "antd";
import {
  HomeOutlined, // optional now, can remove if not needed
  UserOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

// 👇 import your logo (adjust path if needed)
import logo from "../assets/mylogo.png";

const { Header: AntHeader } = Layout;

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  // safely read user from localStorage
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [scrolled, setScrolled] = useState(false);

  // Scroll effect for glassy background
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
    window.location.reload();
  };

  // Determine active menu key
  const getSelectedKey = () => {
    if (location.pathname.startsWith("/login")) return "login";
    if (location.pathname.startsWith("/register")) return "register";
    if (location.pathname.startsWith("/about")) return "about";
    if (location.pathname.startsWith("/contact")) return "contact";
    if (location.pathname.startsWith("/blog")) return "blog";
    return "home";
  };

  const selectedKeys = [getSelectedKey()];

  const isLanding = location.pathname === "/";
  // Light header on all inner pages, dark/transparent style only on landing before scroll
  const isLightHeader = !isLanding || scrolled;

  const primaryTextColor = isLightHeader ? "#001529" : "#fff";

  // Dropdown menu for logged-in users
  const userMenu = (
    <Menu
      onClick={({ key }) => {
        if (key === "profile") navigate("/profile");
        if (key === "logout") handleLogout();
      }}
      
    />
  );

  const menuItems = [
    {
      key: "home",
      label: (
        <Link style={{ color: primaryTextColor }} to="/">
          Home
        </Link>
      ),
    },
    {
      key: "about",
      label: (
        <Link style={{ color: primaryTextColor }} to="/about">
          About
        </Link>
      ),
    },
   
    {
      key: "contact",
      label: (
        <Link style={{ color: primaryTextColor }} to="/contact">
          Contact Us
        </Link>
      ),
    },
    {
      key: "blog",
      label: (
        <Link style={{ color: primaryTextColor }} to="/blog">
          Blog
        </Link>
      ),
    },
    !user && {
      key: "login",
      label: (
        <Link style={{ color: primaryTextColor }} to="/login">
          Login
        </Link>
      ),
    },
    !user && {
      key: "register",
      label: (
        <Link style={{ color: primaryTextColor }} to="/register">
          Register
        </Link>
      ),
    },
  ].filter(Boolean);

  const userLabel =
    user?.name || user?.displayName || user?.email || "Account";

  return (
    <AntHeader
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 100,
        padding: "0 48px",
        height: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.3s ease",
        background: isLightHeader
          ? "rgba(255,255,255,0.85)"
          : "linear-gradient(90deg, rgba(0,0,0,0.5), rgba(0,0,0,0.2))",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: isLightHeader
          ? "1px solid rgba(0,0,0,0.06)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: isLightHeader
          ? "0 4px 12px rgba(0,0,0,0.08)"
          : "0 2px 8px rgba(0,0,0,0.25)",
      }}
    >
      {/* Inner container to center content on large screens */}
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 32,
        }}
      >
        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: primaryTextColor,
            fontSize: 22,
            fontWeight: 700,
            cursor: "pointer",
            transition: "color 0.3s, transform 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {/* 👇 Logo image */}
          <img
            src={logo}
            alt="CityPulse logo"
            style={{
              height: 32,
              width: "auto",
              display: "block",
              borderRadius: 6,
              objectFit: "contain",
            }}
          />
          <span>CityPulse</span>
        </div>

        {/* Center Menu */}
        <Menu
          mode="horizontal"
          selectedKeys={selectedKeys}
          style={{
            flex: 1,
            justifyContent: "center",
            background: "transparent",
            borderBottom: "none",
            minWidth: 0,
          }}
          items={menuItems}
        />

        {/* Right Section */}
        <Space size="middle">
          <Button
            type="primary"
            icon={<ExclamationCircleOutlined />}
            onClick={() => navigate("/report-issue")}
            style={{
              borderRadius: 24,
              background: isLightHeader
                ? "linear-gradient(135deg, #1677ff, #722ed1)"
                : "rgba(255,255,255,0.18)",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              boxShadow: isLightHeader
                ? "0 6px 16px rgba(22,119,255,0.35)"
                : "0 4px 12px rgba(0,0,0,0.35)",
            }}
          >
            Report
          </Button>

          {user ? (
            <Dropdown
              overlay={userMenu}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Button
                icon={<UserOutlined />}
                style={{
                  borderRadius: 24,
                  background: isLightHeader
                    ? "rgba(0,0,0,0.03)"
                    : "rgba(255,255,255,0.2)",
                  color: primaryTextColor,
                  border: isLightHeader
                    ? "1px solid rgba(0,0,0,0.06)"
                    : "1px solid rgba(255,255,255,0.4)",
                  fontWeight: 500,
                }}
              >
                {userLabel}
              </Button>
            </Dropdown>
          ) : (
            <Button
              icon={<UserOutlined />}
              onClick={() => navigate("/login")}
              style={{
                borderRadius: 24,
                background: isLightHeader
                  ? "rgba(0,0,0,0.02)"
                  : "rgba(255,255,255,0.15)",
                color: primaryTextColor,
                border: isLightHeader
                  ? "1px solid rgba(0,0,0,0.08)"
                  : "1px solid rgba(255,255,255,0.4)",
                fontWeight: 500,
              }}
            >
              Login
            </Button>
          )}
        </Space>
      </div>
    </AntHeader>
  );
}

export default Header;
