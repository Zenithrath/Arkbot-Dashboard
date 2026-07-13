export interface Document {
  id: string
  file_name: string
  file_type: string
  file_size: number
  drive_file_id: string
  folder: string
  category: string | null
  tags: string[]
  status: "synced" | "pending" | "error" | "processing"
  chunk_count: number
  last_synced_at: string | null
  last_modified: string | null
  created_at: string
}

export interface DashboardStats {
  totalDocuments: number
  indexedDocuments: number
  lastSyncAt: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface UploadPayload {
  file: File
  name?: string
  category?: string
  tags?: string[]
  folder?: string
}
