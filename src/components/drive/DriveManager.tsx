import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Trash2, Search, ExternalLink, FileText, RefreshCw, AlertTriangle, Copy } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { N8N_DRIVE_MANAGER_URL, type DriveCloudFile } from "./types"

interface DriveManagerProps {
  onCount?: (count: number) => void
  databaseFileIds?: Set<string>
  onDriveIds?: (ids: Set<string>) => void
}

const PAGE_SIZE = 10

export function DriveManager({ onCount, databaseFileIds, onDriveIds }: DriveManagerProps) {
  const [driveFiles, setDriveFiles] = useState<DriveCloudFile[]>([])
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveSearch, setDriveSearch] = useState("")
  const [page, setPage] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteDriveTarget, setDeleteDriveTarget] = useState<DriveCloudFile | null>(null)
  const [deleteDriveDialogOpen, setDeleteDriveDialogOpen] = useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false)
  const [showOrphansOnly, setShowOrphansOnly] = useState(false)

  const fetchDriveFiles = async () => {
    setDriveLoading(true)
    try {
      const res = await fetch(N8N_DRIVE_MANAGER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list" }),
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const files = data.files || []
      setDriveFiles(files)
      onCount?.(files.length)
      onDriveIds?.(new Set(files.map(f => f.id)))
    } catch (err) {
      let message = "Gagal mengambil file dari Google Drive"
      if (err instanceof DOMException && err.name === "TimeoutError") {
        message = "Timeout - server tidak merespon"
      } else if (err instanceof Error) {
        message = err.message
      }
      toast.error(message)
    }
    setDriveLoading(false)
  }

  const handleDeleteDriveFile = async (fileId: string, fileName: string) => {
    setDeleting(fileId)
    try {
      const res = await fetch(N8N_DRIVE_MANAGER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", drive_file_id: fileId }),
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json().catch(() => ({}))
      if (data.status === "error" || data.error) {
        throw new Error(data.message || data.error || "Gagal menghapus file")
      }
      toast.success(`${fileName} berhasil dihapus dari Drive`)
      setDriveFiles(prev => {
        const next = prev.filter(f => f.id !== fileId)
        onCount?.(next.length)
        return next
      })
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(fileId)
        return next
      })
    } catch (err) {
      let message = "Gagal menghapus file dari Drive"
      if (err instanceof DOMException && err.name === "TimeoutError") {
        message = "Timeout - server tidak merespon"
      } else if (err instanceof Error) {
        message = err.message
      }
      toast.error(message)
    }
    setDeleting(null)
    setDeleteDriveDialogOpen(false)
    setDeleteDriveTarget(null)
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setBulkDeleteDialogOpen(false)
    setDeleting("bulk")

    let successCount = 0
    let failCount = 0

    for (const id of selectedIds) {
      const file = driveFiles.find(f => f.id === id)
      if (!file) continue
      try {
        const res = await fetch(N8N_DRIVE_MANAGER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", drive_file_id: id }),
          signal: AbortSignal.timeout(30000),
        })
        if (!res.ok) {
          failCount++
          continue
        }
        const data = await res.json().catch(() => ({}))
        if (data.status === "error" || data.error) {
          failCount++
          continue
        }
        successCount++
      } catch {
        failCount++
      }
    }

    setDriveFiles(prev => {
      const next = prev.filter(f => !selectedIds.has(f.id))
      onCount?.(next.length)
      return next
    })
    setSelectedIds(new Set())
    setDeleting(null)

    if (successCount > 0 && failCount === 0) {
      toast.success(`${successCount} file berhasil dihapus`)
    } else if (failCount > 0 && successCount === 0) {
      toast.error(`${failCount} file gagal dihapus`)
    } else if (failCount > 0) {
      toast.warning(`${successCount} berhasil, ${failCount} gagal`)
    }
  }

  useEffect(() => {
    fetchDriveFiles()
  }, [])

  useEffect(() => {
    onCount?.(filteredFiles.length)
  }, [showDuplicatesOnly, showOrphansOnly, driveFiles])

  // Count duplicates and orphans
  const nameCounts = new Map<string, number>()
  driveFiles.forEach(f => nameCounts.set(f.name, (nameCounts.get(f.name) || 0) + 1))
  const duplicateNames = new Set<string>()
  nameCounts.forEach((count, name) => { if (count > 1) duplicateNames.add(name) })
  const duplicateCount = duplicateNames.size

  const orphanFiles = databaseFileIds
    ? driveFiles.filter(f => !databaseFileIds.has(f.id))
    : []
  const orphanCount = orphanFiles.length

  // Filter logic
  const filteredFiles = driveFiles.filter((f, idx, arr) => {
    if (driveSearch && !f.name.toLowerCase().includes(driveSearch.toLowerCase())) return false
    if (showDuplicatesOnly && !duplicateNames.has(f.name)) return false
    if (showOrphansOnly && databaseFileIds && databaseFileIds.has(f.id)) return false
    return true
  })

  const totalPages = Math.ceil(filteredFiles.length / PAGE_SIZE)
  const pagedFiles = filteredFiles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === pagedFiles.length && pagedFiles.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pagedFiles.map(f => f.id)))
    }
  }

  const handleSearchChange = (value: string) => {
    setDriveSearch(value)
    setPage(0)
    setSelectedIds(new Set())
  }

  if (driveLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    )
  }

  if (driveFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ExternalLink className="mb-3 h-10 w-10 text-white/15" />
        <p className="text-sm text-white/30">Tidak ada file di Google Drive</p>
        <p className="mt-1 text-xs text-white/20">Pastikan workflow n8n sudah aktif</p>
      </div>
    )
  }

  return (
    <>
      {/* Header with search, filters, refresh, and bulk actions */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={driveSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search files..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25 transition-colors"
          />
        </div>

        {/* Duplicate filter */}
        {duplicateCount > 0 && (
          <button
            onClick={() => { setShowDuplicatesOnly(!showDuplicatesOnly); setShowOrphansOnly(false); setPage(0); setSelectedIds(new Set()) }}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap",
              showDuplicatesOnly
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                : "text-white/40 hover:bg-white/5 hover:text-white/60 border border-white/10"
            )}
          >
            <Copy className="h-3 w-3" />
            {duplicateCount} duplikat
          </button>
        )}

        {/* Orphan filter */}
        {orphanCount > 0 && databaseFileIds && (
          <button
            onClick={() => { setShowOrphansOnly(!showOrphansOnly); setShowDuplicatesOnly(false); setPage(0); setSelectedIds(new Set()) }}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap",
              showOrphansOnly
                ? "bg-red-500/15 text-red-400 border border-red-500/20"
                : "text-white/40 hover:bg-white/5 hover:text-white/60 border border-white/10"
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            {orphanCount} tanpa database
          </button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-white/50 hover:text-white/70 hover:bg-white/5"
          onClick={fetchDriveFiles}
        >
          <RefreshCw className={cn("h-4 w-4", driveLoading && "animate-spin")} />
        </Button>

        {selectedIds.size > 0 && (
          <Button
            onClick={() => setBulkDeleteDialogOpen(true)}
            disabled={deleting === "bulk"}
            className="shrink-0 bg-red-600 text-white hover:bg-red-700"
          >
            {deleting === "bulk" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Hapus ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === pagedFiles.length && pagedFiles.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-orange-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40">
                  Nama File
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-white/40">
                  Drive File ID
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-white/40">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/40">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedFiles.map((file) => {
                const isDuplicate = duplicateNames.has(file.name)
                const isOrphan = databaseFileIds ? !databaseFileIds.has(file.id) : false
                return (
                  <tr
                    key={file.id}
                    className={cn(
                      "border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors",
                      selectedIds.has(file.id) && "bg-white/[0.04]",
                      isOrphan && "bg-red-500/[0.03]"
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(file.id)}
                        onChange={() => toggleSelect(file.id)}
                        className="h-4 w-4 rounded border-white/20 bg-white/5 accent-orange-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                          <FileText className="h-4 w-4 text-white/30" />
                        </div>
                        <p className="truncate text-sm font-medium text-white/90 max-w-[300px]">
                          {file.name}
                        </p>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      <span className="font-mono text-xs text-white/40">{file.id}</span>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {isDuplicate && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                            <Copy className="h-2.5 w-2.5" />
                            duplikat
                          </span>
                        )}
                        {isOrphan && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/15 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            tanpa DB
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/30 hover:text-blue-400 hover:bg-blue-400/10"
                          asChild
                        >
                          <a
                            href={`https://drive.google.com/file/d/${file.id}/view`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/30 hover:text-red-400 hover:bg-red-400/10"
                          disabled={deleting === file.id}
                          onClick={() => {
                            setDeleteDriveTarget(file)
                            setDeleteDriveDialogOpen(true)
                          }}
                        >
                          {deleting === file.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredFiles.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-white/30">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredFiles.length)} of {filteredFiles.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-white/50 hover:text-white/70 hover:bg-white/5"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-white/40">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-white/50 hover:text-white/70 hover:bg-white/5"
              disabled={(page + 1) * PAGE_SIZE >= filteredFiles.length}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Single Delete Dialog */}
      <AlertDialog open={deleteDriveDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setDeleteDriveDialogOpen(false)
          setDeleteDriveTarget(null)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus dari Google Drive?</AlertDialogTitle>
            <AlertDialogDescription>
              File <strong>{deleteDriveTarget?.name}</strong> akan dihapus permanen dari Google Drive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button
              onClick={() => {
                if (deleteDriveTarget) {
                  handleDeleteDriveFile(deleteDriveTarget.id, deleteDriveTarget.name)
                }
              }}
              disabled={!!deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && deleting !== "bulk" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={(open) => {
        if (!open) setBulkDeleteDialogOpen(false)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedIds.size} file dari Google Drive?</AlertDialogTitle>
            <AlertDialogDescription>
              File-file ini akan dihapus permanen dari Google Drive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button
              onClick={handleBulkDelete}
              disabled={deleting === "bulk"}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting === "bulk" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
