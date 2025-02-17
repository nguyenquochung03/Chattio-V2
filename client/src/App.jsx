import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useClientInfo } from "./contexts/ClientInfoContext";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import TwoStepVerification from "./components/TwoStepVerification";
import AuthPage from "./pages/AuthPage";
import NotFoundPage from "./pages/NotFoundPage";
import ChangePassword from "./components/ChangePassword";
import HandleLoginWithFacebookAndGoogle from "./pages/HandleLoginWithFacebookAndGoogle";
import Messages from "./components/sections/Messages/Messages";
import People from "./components/sections/People/People";
import FriendRequests from "./components/sections/FriendRequests/FriendRequests";
import Settings from "./components/sections/Settings/Settings";
import VideoCallPage from "./pages/VideoCallPage";
import CallPage from "./pages/CallPage";

function App() {
  const { token, emailLogin } = useClientInfo();

  return (
    <Routes>
      {/* Trang xử lý việc đăng nhập bằng Google */}
      <Route
        path="/handleLoginWithFacebookAndGoogle"
        element={<HandleLoginWithFacebookAndGoogle />}
      />
      {/* Trang đăng ký, đăng nhập */}
      <Route
        path="/"
        element={
          <ProtectedRoute condition={!token} redirectTo="/home">
            <AuthPage />
          </ProtectedRoute>
        }
      />
      {/* Trang xác minh email */}
      <Route
        path="/verification"
        element={
          <ProtectedRoute condition={!!emailLogin} redirectTo="/">
            <TwoStepVerification />
          </ProtectedRoute>
        }
      />
      {/* Trang đổi mật khẩu*/}
      <Route path="/passwordReset" element={<ChangePassword />} />
      {/* Trang chính sau khi đăng nhập */}
      <Route
        path="/home"
        element={
          <ProtectedRoute condition={!!token} redirectTo="/">
            <HomePage />
          </ProtectedRoute>
        }
      >
        {/* Nested routes cho HomePage */}
        <Route index element={<Navigate to="/home/messages" />} />
        <Route path="messages" element={<Messages />} />
        <Route path="people" element={<People />} />
        <Route path="friendRequests" element={<FriendRequests />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      {/* Trang gọi điện thoại bằng video */}
      <Route
        path="/videoCall"
        element={
          <ProtectedRoute condition={!!token} redirectTo="/">
            <VideoCallPage />
          </ProtectedRoute>
        }
      />
      {/* Trang gọi điện thoại bằng mic */}
      <Route
        path="/call"
        element={
          <ProtectedRoute condition={!!token} redirectTo="/">
            <CallPage />
          </ProtectedRoute>
        }
      />
      {/* Route fallback cho các trang không hợp lệ */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
