import { useState, useEffect } from "react"
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useWorkflowErrors } from "@/hooks/useWorkflowErrors"
import { NotificationBell } from "@/components/NotificationBell"
import {
  FileText,
  MessageSquare,
  Upload,
  LogOut,
  Loader2,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/admin/documents", icon: FileText, label: "Documents" },
  { to: "/admin/chat", icon: MessageSquare, label: "Chat" },
  { to: "/admin/upload", icon: Upload, label: "Upload" },
]

export function AdminLayout() {
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useWorkflowErrors()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login")
      } else {
        setLoading(false)
      }
    })
  }, [navigate])

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.06] bg-[#131314] transition-transform duration-200 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4">
          <img
            src="/logo-arka.png"
            alt="Arka Logo"
            className="h-5 w-auto shrink-0 object-contain"
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white/50 hover:text-white/80 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.06] p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center h-14 px-4 border-b border-white/[0.06] shrink-0 bg-[#0a0a0a]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mr-3 text-white/60 hover:text-white/80 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </div>
        <div className="flex-1 overflow-auto overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
