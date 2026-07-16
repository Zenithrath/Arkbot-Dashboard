import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { ChatPage } from "@/pages/ChatPage"
import { LoginPage } from "@/pages/LoginPage"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { DashboardPage } from "@/pages/DashboardPage"
import { DocumentsPage } from "@/pages/DocumentsPage"
import { AdminChatPage } from "@/pages/AdminChatPage"
import { UploadPage } from "@/pages/UploadPage"
import { ActivityPage } from "@/pages/ActivityPage"
import { ChatHistoryPage } from "@/pages/ChatHistoryPage"
import { UsersPage } from "@/pages/UsersPage"
import { ErrorBoundary } from "@/components/ErrorBoundary"

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster theme="dark" position="bottom-right" />
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="chat" element={<AdminChatPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="chat-history" element={<ChatHistoryPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
