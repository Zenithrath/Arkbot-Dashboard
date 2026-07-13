import { useCallback } from "react"
import { uploadDocument, deleteDocument, downloadDocument } from "@/services/api"
import { toast } from "sonner"
import type { UploadPayload } from "@/lib/types"

export function useDocumentActions() {
  const upload = useCallback(async (payload: UploadPayload) => {
    try {
      const result = await uploadDocument(payload)
      if (result.success) {
        toast.success("Document uploaded", {
          description: "Your document is being processed.",
        })
        return true
      }
      return false
    } catch (e) {
      toast.error("Upload failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
      return false
    }
  }, [])

  const remove = useCallback(async (id: string, name: string) => {
    try {
      const result = await deleteDocument(id)
      if (result.success) {
        toast.success("Document deleted", {
          description: `"${name}" has been removed.`,
        })
        return true
      }
      return false
    } catch (e) {
      toast.error("Delete failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
      return false
    }
  }, [])

  const download = useCallback(async (id: string, fileName: string) => {
    try {
      const blob = await downloadDocument(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error("Download failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }, [])

  return { upload, remove, download }
}
