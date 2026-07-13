import type {
  Document,
  DashboardStats,
  PaginatedResponse,
  UploadPayload,
} from "@/lib/types"

const API_BASE = "/api"

// Simulate network delay for development
const delay = (ms: number = 600) => new Promise((r) => setTimeout(r, ms))

// ─── Documents ───────────────────────────────────────────

export async function getDocuments(params: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}): Promise<PaginatedResponse<Document>> {
  const query = new URLSearchParams()
  if (params.page) query.set("page", String(params.page))
  if (params.pageSize) query.set("pageSize", String(params.pageSize))
  if (params.search) query.set("search", params.search)
  if (params.status) query.set("status", params.status)
  if (params.sortBy) query.set("sortBy", params.sortBy)
  if (params.sortOrder) query.set("sortOrder", params.sortOrder)

  // TODO: Replace with real API call
  // const res = await fetch(`${API_BASE}/documents?${query}`)
  // return res.json()

  await delay()
  return {
    data: [],
    total: 0,
    page: params.page || 1,
    pageSize: params.pageSize || 20,
  }
}

export async function getDocument(id: string): Promise<Document> {
  // TODO: Replace with real API call
  // const res = await fetch(`${API_BASE}/documents/${id}`)
  // return res.json()

  await delay()
  throw new Error("Not implemented — connect backend API")
}

export async function uploadDocument(
  payload: UploadPayload
): Promise<{ success: boolean; documentId: string }> {
  const formData = new FormData()
  formData.append("file", payload.file)
  if (payload.name) formData.append("name", payload.name)
  if (payload.category) formData.append("category", payload.category)
  if (payload.tags) formData.append("tags", JSON.stringify(payload.tags))
  if (payload.folder) formData.append("folder", payload.folder)

  // TODO: Replace with real API call
  // const res = await fetch(`${API_BASE}/documents/upload`, {
  //   method: "POST",
  //   body: formData,
  // })
  // return res.json()

  await delay(1500)
  return { success: true, documentId: "mock-id" }
}

export async function deleteDocument(
  id: string
): Promise<{ success: boolean }> {
  // TODO: Replace with real API call
  // const res = await fetch(`${API_BASE}/documents/${id}`, {
  //   method: "DELETE",
  // })
  // return res.json()

  await delay()
  return { success: true }
}

export async function downloadDocument(
  id: string
): Promise<Blob> {
  // TODO: Replace with real API call
  // const res = await fetch(`${API_BASE}/documents/${id}/download`)
  // return res.blob()

  await delay()
  throw new Error("Not implemented — connect backend API")
}

// ─── Dashboard ───────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  // TODO: Replace with real API call
  // const res = await fetch(`${API_BASE}/dashboard/stats`)
  // return res.json()

  await delay()
  return {
    totalDocuments: 0,
    indexedDocuments: 0,
    lastSyncAt: null,
  }
}

export async function getRecentUploads(): Promise<Document[]> {
  // TODO: Replace with real API call
  // const res = await fetch(`${API_BASE}/documents?sortBy=created_at&sortOrder=desc&pageSize=5`)
  // return res.json()

  await delay()
  return []
}
