import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  Activity,
  Trash2,
  Upload,
  RefreshCw,
  Clock,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityLog {
  id: string
  action: string
  details: string
  user: string
  created_at: string
}

const ACTION_OPTIONS = [
  { value: "all", label: "All" },
  { value: "delete", label: "Delete" },
  { value: "upload", label: "Upload" },
  { value: "sync", label: "Sync" },
]

export function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState("all")

  const fetchLogs = async () => {
    setLoading(true)
    let query = supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (actionFilter !== "all") {
      query = query.eq("action", actionFilter)
    }

    const { data, error } = await query

    if (!error && data) {
      setLogs(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
  }, [actionFilter])

  const formatDate = (date: string) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const actionIcon = (action: string) => {
    switch (action) {
      case "delete":
        return <Trash2 className="h-3.5 w-3.5" />
      case "upload":
        return <Upload className="h-3.5 w-3.5" />
      case "sync":
        return <RefreshCw className="h-3.5 w-3.5" />
      default:
        return <Activity className="h-3.5 w-3.5" />
    }
  }

  const actionColor = (action: string) => {
    switch (action) {
      case "delete":
        return "bg-red-500/15 text-red-400 border-red-500/20"
      case "upload":
        return "bg-blue-500/15 text-blue-400 border-blue-500/20"
      case "sync":
        return "bg-green-500/15 text-green-400 border-green-500/20"
      default:
        return "bg-white/10 text-white/60 border-white/10"
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Activity Log</h1>
          <p className="mt-1 text-sm text-white/40">
            Audit trail of system actions
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white/50 hover:text-white/70 hover:bg-white/5"
          onClick={fetchLogs}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter */}
      <div className="mb-4 flex items-center gap-1.5">
        <Filter className="h-4 w-4 text-white/30 mr-1" />
        {ACTION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActionFilter(opt.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              actionFilter === opt.value
                ? "bg-white/10 text-white"
                : "text-white/40 hover:bg-white/5 hover:text-white/60"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Activity className="mb-3 h-10 w-10 text-white/15" />
          <p className="text-sm text-white/30">
            {actionFilter !== "all"
              ? "No activity found for this filter"
              : "No activity recorded yet"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40">
                  Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40">
                  User
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Clock className="h-3.5 w-3.5 text-white/30" />
                      {formatDate(log.created_at)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
                        actionColor(log.action)
                      )}
                    >
                      {actionIcon(log.action)}
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60 max-w-[400px] truncate">
                    {log.details}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/40">
                    {log.user || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
