import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Loader2,
  Trash2,
  Search,
  FileText,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Wifi,
  Eye,
  ExternalLink,
  Download,
  Layers,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface DriveFile {
  id: string
  drive_file_id: string
  file_name: string
  last_modified_time: string
  last_synced_at: string
  status: string
}

const STATUS_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "synced", label: "Synced" },
  { value: "pending", label: "Pending" },
  { value: "error", label: "Error" },
]

export function DocumentsPage() {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleting, setDeleting] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10
  const [chunksFile, setChunksFile] = useState<DriveFile | null>(null)
  const [chunksLoading, setChunksLoading] = useState(false)
  const [chunksData, setChunksData] = useState<any[]>([])

  const fetchFiles = async () => {
    setLoading(true)
    const from = page * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from("drive_file_sync")
      .select("*", { count: "exact" })
      .order("last_synced_at", { ascending: false })
      .range(from, to)

    if (search) {
      query = query.ilike("file_name", `%${search}%`)
    }
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter)
    }

    const { data, error, count } = await query

    if (!error && data) {
      setFiles(data)
      setTotalCount(count ?? 0)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchFiles()
  }, [page, search, statusFilter])

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("drive_file_sync_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drive_file_sync" },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload

          if (eventType === "INSERT" && newRow) {
            setFiles((prev) => {
              if (prev.some((f) => f.id === newRow.id)) return prev
              return [newRow as DriveFile, ...prev]
            })
          } else if (eventType === "UPDATE" && newRow) {
            setFiles((prev) =>
              prev.map((f) => (f.id === newRow.id ? (newRow as DriveFile) : f))
            )
          } else if (eventType === "DELETE" && oldRow) {
            setFiles((prev) => prev.filter((f) => f.id !== oldRow.id))
          }
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED")
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setRealtimeConnected(false)
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(0)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(0)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)

    // Get the drive_file_id before deleting
    const file = files.find((f) => f.id === id)
    if (file) {
      // Delete related documents (drive_file_id is in metadata JSONB)
      const { error: docError } = await supabase
        .from("documents")
        .delete()
        .filter("metadata->>drive_file_id", "eq", file.drive_file_id)
      
      if (docError) {
        console.error("Error deleting documents:", docError)
      }
    }

    // Delete from drive_file_sync
    const { error } = await supabase
      .from("drive_file_sync")
      .delete()
      .eq("id", id)

    if (!error) {
      setFiles((prev) => prev.filter((f) => f.id !== id))
      toast.success("File berhasil dihapus")

      // Log activity
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from("activity_log").insert({
        action: "delete",
        details: `Deleted file: ${file?.file_name}`,
        user_email: user?.email,
      })
    } else {
      toast.error("Gagal menghapus file")
    }
    setDeleting(null)
  }

  const fetchChunks = async (file: DriveFile) => {
    setChunksFile(file)
    setChunksLoading(true)
    setChunksData([])
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .filter("metadata->>drive_file_id", "eq", file.drive_file_id)
    if (!error && data) {
      setChunksData(data)
    }
    setChunksLoading(false)
  }

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Documents</h1>
          <p className="mt-1 text-sm text-white/40">
            {totalCount} file di Google Drive
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs",
              realtimeConnected
                ? "text-green-400/70"
                : "text-white/30"
            )}
          >
            <Wifi className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {realtimeConnected ? "Live" : "Offline"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white/50 hover:text-white/70 hover:bg-white/5"
            onClick={fetchFiles}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusFilterChange(opt.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === opt.value
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:bg-white/5 hover:text-white/60"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <FileText className="mb-3 h-10 w-10 text-white/15" />
          <p className="text-sm text-white/30">
            {search || statusFilter !== "all"
              ? "No files found"
              : "No files yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40">
                    Key
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40">
                    Last Modified
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40">
                    Last Synced
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr
                    key={file.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                          <FileText className="h-4 w-4 text-white/30" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white/90 max-w-[280px]">
                            {file.file_name}
                          </p>
                          <p className="truncate text-xs text-white/30 max-w-[280px]">
                            {file.drive_file_id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
                          statusColor(file.status)
                        )}
                      >
                        {statusIcon(file.status)}
                        {file.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/40">
                      {formatDate(file.last_modified_time)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/40">
                      {formatDate(file.last_synced_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/30 hover:text-blue-400 hover:bg-blue-400/10"
                          onClick={() => setPreviewFile(file)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/30 hover:text-purple-400 hover:bg-purple-400/10"
                          onClick={() => fetchChunks(file)}
                        >
                          <Layers className="h-4 w-4" />
                        </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/30 hover:text-red-400 hover:bg-red-400/10"
                            disabled={deleting === file.id}
                          >
                            {deleting === file.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus File?</AlertDialogTitle>
                            <AlertDialogDescription>
                              File ini dan dokumen terkait akan dihapus permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(file.id)}>
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-white/30">
                Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-white/50 hover:text-white/70 hover:bg-white/5"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs text-white/40">
                  Page {page + 1} of {Math.ceil(totalCount / pageSize)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-white/50 hover:text-white/70 hover:bg-white/5"
                  disabled={(page + 1) * pageSize >= totalCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{previewFile?.file_name}</DialogTitle>
            <DialogDescription className="text-white/50">
              File details from Google Drive
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Drive File ID</span>
                <span className="font-mono text-xs text-white/70">{previewFile?.drive_file_id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Status</span>
                {previewFile && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
                      statusColor(previewFile.status)
                    )}
                  >
                    {statusIcon(previewFile.status)}
                    {previewFile.status}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Last Modified</span>
                <span className="text-white/70">{formatDate(previewFile?.last_modified_time ?? "")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Last Synced</span>
                <span className="text-white/70">{formatDate(previewFile?.last_synced_at ?? "")}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              asChild
            >
              <a
                href={`https://drive.google.com/file/d/${previewFile?.drive_file_id}/view`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View in Drive
              </a>
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              asChild
            >
              <a
                href={`https://drive.google.com/uc?id=${previewFile?.drive_file_id}&export=download`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chunks Dialog */}
      <Dialog open={!!chunksFile} onOpenChange={(open) => !open && setChunksFile(null)}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-400" />
              Chunks — {chunksFile?.file_name}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              RAG document chunks indexed for this file
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6 py-2">
            {chunksLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-white/40" />
              </div>
            ) : chunksData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Layers className="mb-3 h-8 w-8 text-white/15" />
                <p className="text-sm text-white/30">No chunks indexed yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chunksData.map((chunk, idx) => (
                  <div
                    key={chunk.id ?? idx}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-purple-400/80">
                        Chunk #{idx + 1}
                      </span>
                      {chunk.metadata?.page_number != null && (
                        <span className="text-xs text-white/30">
                          Page {chunk.metadata.page_number}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 whitespace-pre-wrap line-clamp-4">
                      {chunk.content?.slice(0, 200)}
                      {chunk.content?.length > 200 && "..."}
                    </p>
                    {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(chunk.metadata)
                          .filter(([k]) => k !== "drive_file_id")
                          .slice(0, 5)
                          .map(([key, val]) => (
                            <span
                              key={key}
                              className="inline-flex items-center rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/30"
                            >
                              {key}: {String(val)}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-white/30 pt-2 border-t border-white/[0.06]">
            {chunksData.length} chunk{chunksData.length !== 1 ? "s" : ""} found
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
