import { useState, useEffect } from "react"
import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Upload,
  Users,
  Activity,
  History,
  LogOut,
  Loader2,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/documents", icon: FileText, label: "Documents" },
  { to: "/admin/chat", icon: MessageSquare, label: "Chat" },
  { to: "/admin/upload", icon: Upload, label: "Upload" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/chat-history", icon: History, label: "Chat History" },
  { to: "/admin/activity", icon: Activity, label: "Activity" },
]

export function AdminLayout() {
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login")
      } else {
        setLoading(false)
      }
    })
  }, [navigate])

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
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-white/[0.06] bg-[#131314] transition-all duration-200",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center gap-2 border-b border-white/[0.06] px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <FileText className="h-4 w-4 text-white/80" />
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-white">
              ArkBot Admin
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="space-y-2 border-t border-white/[0.06] p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-lg py-2 text-sm font-medium text-white/40 transition-colors hover:bg-white/5 hover:text-white/60",
              collapsed && "px-0"
            )}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white/80",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
