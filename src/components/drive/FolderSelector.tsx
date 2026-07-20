import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, Folder, FolderPlus, Home, RefreshCw, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { N8N_DRIVE_MANAGER_URL, type DriveFolder } from "./types"

interface FolderSelectorProps {
  value: string | null
  onChange: (folderId: string | null) => void
}

export function FolderSelector({ value, onChange }: FolderSelectorProps) {
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [currentParentId, setCurrentParentId] = useState<string | null>("1lKvWCa7FR23qRYL_mBGpQOhs6JI58sxj")
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "Root" },
    { id: "1lKvWCa7FR23qRYL_mBGpQOhs6JI58sxj", name: "Arkbot Library" }
  ])
  const [expanded, setExpanded] = useState(false)

  const fetchFolders = async (parentId?: string | null) => {
    setLoading(true)
    try {
      const body: any = { action: "list_folders" }
      if (parentId) body.parent_id = parentId

      const res = await fetch(N8N_DRIVE_MANAGER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setFolders(data.folders || [])
    } catch (err) {
      toast.error("Gagal mengambil folder")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchFolders(currentParentId)
  }, [currentParentId])

  const navigateToFolder = (folder: DriveFolder) => {
    setCurrentParentId(folder.id)
    setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }])
  }

  const navigateToBreadcrumb = (index: number) => {
    const target = breadcrumbs[index]
    setCurrentParentId(target.id)
    setBreadcrumbs(breadcrumbs.slice(0, index + 1))
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    setCreating(true)
    try {
      const body: any = { action: "create_folder", name: newFolderName.trim() }
      if (currentParentId) body.parent_id = currentParentId

      const res = await fetch(N8N_DRIVE_MANAGER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success(`Folder "${newFolderName}" berhasil dibuat`)
      setNewFolderName("")
      fetchFolders(currentParentId)
    } catch (err) {
      toast.error("Gagal membuat folder")
    }
    setCreating(false)
  }

  const selectedFolder = value ? breadcrumbs[breadcrumbs.length - 1]?.name || "Unknown" : null

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-white/50">Folder Tujuan</label>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors flex-1 text-left",
            expanded
              ? "border-white/20 bg-white/5 text-white"
              : "border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/5"
          )}
        >
          <Folder className="h-4 w-4 shrink-0" />
          {value ? selectedFolder : "Root (tidak ada folder)"}
        </button>
        {value && (
          <button
            onClick={() => onChange(null)}
            className="shrink-0 rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white/60"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="rounded-xl border border-white/10 bg-[#1a1a1c] p-3 space-y-3">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-xs flex-wrap">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="h-3 w-3 text-white/20" />}
                <button
                  onClick={() => navigateToBreadcrumb(idx)}
                  className={cn(
                    "flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors",
                    idx === breadcrumbs.length - 1
                      ? "text-white/80 font-medium"
                      : "text-white/40 hover:text-white/60 hover:bg-white/5"
                  )}
                >
                  {idx === 0 && <Home className="h-3 w-3" />}
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>

          {/* Folder list */}
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-white/40" />
            </div>
          ) : folders.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-2">Tidak ada subfolder</p>
          ) : (
            <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => navigateToFolder(folder)}
                  className={cn(
                    "flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm transition-colors text-left",
                    value === folder.id
                      ? "bg-orange-500/15 text-orange-400"
                      : "text-white/70 hover:bg-white/5 hover:text-white/90"
                  )}
                >
                  <Folder className="h-4 w-4 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                  {value === folder.id && (
                    <span className="ml-auto text-[10px] text-orange-400">dipilih</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Create folder */}
          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              placeholder="Nama folder baru..."
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/20"
            />
            <Button
              size="sm"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || creating}
              className="h-7 shrink-0 bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 border border-orange-500/20"
            >
              {creating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FolderPlus className="h-3 w-3 mr-1" />
              )}
              Buat
            </Button>
          </div>

          {/* Refresh */}
          <div className="flex justify-end">
            <button
              onClick={() => fetchFolders(currentParentId)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-white/30 hover:text-white/50 hover:bg-white/5"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>

          {/* Select current folder */}
          <Button
            onClick={() => {
              onChange(currentParentId)
              setExpanded(false)
            }}
            className="w-full bg-orange-500 text-white hover:bg-orange-400"
            size="sm"
          >
            Pilih Folder Ini
          </Button>
        </div>
      )}
    </div>
  )
}
