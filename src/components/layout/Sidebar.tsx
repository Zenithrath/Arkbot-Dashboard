import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Bot,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  { to: "/", icon: MessageSquare, label: "Chat" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/knowledge-base", icon: BookOpen, label: "Knowledge Base" },
]

interface SidebarProps {
  onClose?: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ onClose, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-white/[0.06] bg-[#131314] text-white/70 transition-all duration-200",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center gap-2 border-b border-white/[0.06] px-4">
        <Bot className="h-6 w-6 text-white/80 shrink-0" />
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-white">
            ArkBot
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {!collapsed && (
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-white/60">
              Admin
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onClose}
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

      {/* Collapse toggle + footer */}
      <div className="border-t border-white/[0.06] p-3 space-y-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-full rounded-lg text-white/40 hover:text-white/60 hover:bg-white/5",
            collapsed && "px-0"
          )}
          onClick={onToggleCollapse}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </Button>
        {!collapsed && (
          <p className="text-xs text-white/20 text-center">ArkBot Dashboard v0.1</p>
        )}
      </div>
    </aside>
  )
}
