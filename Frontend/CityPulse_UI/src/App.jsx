import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import City from "./pages/City";
import Blog from "./pages/Blog";
import ContactUs from "./pages/ContactUs";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ReportIssue from "./pages/ReportIssue";
import Dashboard from "./pages/dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import CategoriesPage from "./pages/CategoriesPage";
import CommentsPage from "./pages/CommentsPage";
import CommentDetailsPage from "./pages/CommentDetailsPage";
import StatusesPage from "./pages/StatusesPage";
import UsersPage from "./pages/UsersPage";
import IssuesPage from "./pages/IssuesPage";
import PrioritiesPage from "./pages/PrioritiesPage";
import Cdashboard from "./pages/Cdashboard";
import ViewMyIssue from "./pages/ViewMyIssue";
import EditIssue from "./pages/EditIssue";
import ViewComments from "./pages/ViewComments";
import Odashboard from "./pages/Odashboard";
import Myissues from "./pages/Myissues";

function App() {
  const location = useLocation();
  const path = location.pathname;

  // Base paths where Header/Footer should be hidden
  const baseHidePaths = [
    "/login",
    "/register",
    "/report-issue",
    "/dashboard",
    "/CategoriesPage",
    "/CommentsPage",
    "/CommentDetailsPage",
    "/StatusesPage",
    "/UsersPage",
    "/IssuesPage",
    "/PrioritiesPage",
    "/Cdashboard",
    "/ViewMyIssue",
    "/ViewComments",
    "/Odashboard",
    "/Myissues",
  ];

  const hideLayout =
    baseHidePaths.includes(path) ||
    path.startsWith("/EditIssue"); // hide /EditIssue/:id

  return (
    <div className="App">
      {!hideLayout && <Header />}

      <main style={{ minHeight: "80vh" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/city" element={<City />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/report-issue" element={<ReportIssue />} />
          <Route path="/register" element={<Register />} />

          <Route path="/CategoriesPage" element={<CategoriesPage />} />
          <Route path="/CommentsPage" element={<CommentsPage />} />
          <Route path="/CommentDetailsPage" element={<CommentDetailsPage />} />
          <Route path="/StatusesPage" element={<StatusesPage />} />
          <Route path="/UsersPage" element={<UsersPage />} />
          <Route path="/IssuesPage" element={<IssuesPage />} />
          <Route path="/PrioritiesPage" element={<PrioritiesPage />} />
          <Route path="/Cdashboard" element={<Cdashboard />} />
          <Route path="/ViewMyIssue" element={<ViewMyIssue />} />
          <Route path="/EditIssue/:id" element={<EditIssue />} />
          <Route path="/ViewComments" element={<ViewComments />} />
          <Route path="/Odashboard" element={<Odashboard/>}/>
          <Route path="/Myissues" element={<Myissues/>}/>

          {/* Protected route: Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!hideLayout && <Footer />}
    </div>
  );
}

export default App;
