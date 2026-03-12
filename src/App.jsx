import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppShell from "@/components/layout/AppShell";
import LoginPage from "@/pages/auth/login/Login";
import ChatPage from "@/pages/chat/Chat";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/chat"
        element={
          <AppShell>
            <ChatPage />
          </AppShell>
        }
      />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
