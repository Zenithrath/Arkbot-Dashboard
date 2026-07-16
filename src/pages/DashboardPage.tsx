import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Loader2,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Files,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Metrics {
  totalFiles: number
  totalDocuments: number
  synced: number
  pending: number
  error: number
}

interface RecentFile {
  id: string
  file_name: string
  status: string
  last_synced_at: string
}

export function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalFiles: 0,
    totalDocuments: 0,
    synced: 0,
    pending: 0,
    error: 0,
  })
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)

    const [filesResult, docsResult, syncedResult, pendingResult, errorResult, recentResult] =
      await Promise.all([
        supabase.from("drive_file_sync").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("drive_file_sync").select("id", { count: "exact", head: true }).eq("status", "synced"),
        supabase.from("drive_file_sync").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("drive_file_sync").select("id", { count: "exact", head: true }).eq("status", "error"),
        supabase
          .from("drive_file_sync")
          .select("id, file_name, status, last_synced_at")
          .order("last_synced_at", { ascending: false })
          .limit(5),
      ])

    setMetrics({
      totalFiles: filesResult.count ?? 0,
      totalDocuments: docsResult.count ?? 0,
      synced: syncedResult.count ?? 0,
      pending: pendingResult.count ?? 0,
      error: errorResult.count ?? 0,
    })

    if (recentResult.data) {
      setRecentFiles(recentResult.data)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatDate = (date: string) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "synced":
        return "bg-green-500/15 text-green-400 border-green-500/20"
      case "error":
        return "bg-red-500/15 text-red-400 border-red-500/20"
      default:
        return "bg-amber-500/15 text-amber-400 border-amber-500/20"
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "synced":
        return <CheckCircle className="h-3.5 w-3.5" />
      case "error":
        return <AlertCircle className="h-3.5 w-3.5" />
      default:
        return <Clock className="h-3.5 w-3.5" />
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-white/40">
            Overview of your system
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/[0.06] bg-[#131314]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/60">
              Total Files
            </CardTitle>
            <Files className="h-4 w-4 text-white/30" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.totalFiles}</div>
            <p className="text-xs text-white/40">Google Drive files</p>
          </CardContent>
        </Card>

        <Card className="border-white/[0.06] bg-[#131314]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/60">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-white/30" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.totalDocuments}</div>
            <p className="text-xs text-white/40">Processed chunks</p>
          </CardContent>
        </Card>

        <Card className="border-white/[0.06] bg-[#131314]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/60">
              Synced
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{metrics.synced}</div>
            <p className="text-xs text-white/40">Successfully synced</p>
          </CardContent>
        </Card>

        <Card className="border-white/[0.06] bg-[#131314]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/60">
              Errors
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{metrics.error}</div>
            <p className="text-xs text-white/40">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-white/[0.06] bg-[#131314]">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-white">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentFiles.length === 0 ? (
            <p className="py-4 text-center text-sm text-white/30">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                      <FileText className="h-4 w-4 text-white/30" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white/90">
                        {file.file_name}
                      </p>
                      <p className="text-xs text-white/30">
                        {formatDate(file.last_synced_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
                      statusColor(file.status)
                    )}
                  >
                    {statusIcon(file.status)}
                    {file.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}