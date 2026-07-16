import { useState, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const UPLOAD_URL =
  "https://arkbot-n8n.6jkqbm.easypanel.host/webhook/web-upload"

interface UploadItem {
  id: string
  file: File
  status: "pending" | "uploading" | "success" | "error"
  message?: string
}

export function UploadPage() {
  const [items, setItems] = useState<UploadItem[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const newItems: UploadItem[] = Array.from(files).map((file) => ({
      id: uuidv4(),
      file,
      status: "pending",
    }))
    setItems((prev) => [...prev, ...newItems])
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const uploadAll = async () => {
    const pending = items.filter((item) => item.status === "pending")
    if (pending.length === 0) return

    setUploading(true)

    let batchSuccess = 0
    let batchFailed = 0

    for (const item of pending) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "uploading" } : i
        )
      )

      try {
        const formData = new FormData()
        formData.append("file", item.file)

        const res = await fetch(UPLOAD_URL, {
          method: "POST",
          body: formData,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "success" } : i
          )
        )
        toast.success(`${item.file.name} berhasil diupload`)
        batchSuccess++
      } catch {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "error", message: "Upload failed" }
              : i
          )
        )
        toast.error(`Gagal upload ${item.file.name}`)
        batchFailed++
      }
    }

    setUploading(false)

    if (batchSuccess > 0 && batchFailed === 0) {
      toast.success(`${batchSuccess} file berhasil diupload`)
    } else if (batchFailed > 0) {
      toast.error(`${batchFailed} file gagal diupload`)
    }
  }

  const clearCompleted = () => {
    setItems((prev) => prev.filter((item) => item.status !== "success"))
  }

  const pendingCount = items.filter((i) => i.status === "pending").length
  const successCount = items.filter((i) => i.status === "success").length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Upload Files</h1>
          <p className="mt-1 text-sm text-white/40">
            Upload files to Google Drive via n8n workflow
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            {successCount > 0 && (
              <Button
                variant="ghost"
                onClick={clearCompleted}
                className="rounded-xl text-sm text-white/40 hover:text-white/60"
              >
                Clear completed
              </Button>
            )}
            <Button
              disabled={pendingCount === 0 || uploading}
              onClick={uploadAll}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                pendingCount > 0 && !uploading
                  ? "bg-orange-500 text-white hover:bg-orange-400"
                  : "bg-white/5 text-white/30 cursor-not-allowed"
              )}
            >
              {uploading ? (
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 inline h-4 w-4" />
              )}
              Upload{pendingCount > 0 ? ` (${pendingCount})` : ""}
            </Button>
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          addFiles(e.dataTransfer.files)
        }}
        className="mb-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] py-16 transition-colors hover:border-orange-500/30 hover:bg-orange-500/[0.02]"
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10">
          <Upload className="h-6 w-6 text-orange-500" />
        </div>
        <p className="text-sm font-medium text-white/60">
          Click or drag & drop files here
        </p>
        <p className="mt-1 text-xs text-white/30">
          PDF, DOCX, TXT, or any other format
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = ""
        }}
      />

      {/* File list */}
      {items.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40">
                  File
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/40">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                        <FileText className="h-4 w-4 text-white/30" />
                      </div>
                      <span className="truncate text-sm text-white/80 max-w-[300px]">
                        {item.file.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/40">
                    {(item.file.size / 1024).toFixed(1)} KB
                  </td>
                  <td className="px-4 py-3">
                    {item.status === "pending" && (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                        Pending
                      </span>
                    )}
                    {item.status === "uploading" && (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-500/20 bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Uploading
                      </span>
                    )}
                    {item.status === "success" && (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-green-500/20 bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        Success
                      </span>
                    )}
                    {item.status === "error" && (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        {item.message}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.status === "pending" && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="rounded-lg p-1.5 text-white/30 hover:bg-white/5 hover:text-white/60"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
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
