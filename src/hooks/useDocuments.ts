import { useState, useEffect, useCallback } from "react"
import { getDocuments } from "@/services/api"
import type { Document, PaginatedResponse } from "@/lib/types"

interface UseDocumentsParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export function useDocuments(initial?: UseDocumentsParams) {
  const [data, setData] = useState<Document[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [params, setParams] = useState({
    page: initial?.page || 1,
    pageSize: initial?.pageSize || 20,
    search: initial?.search || "",
    status: initial?.status || "",
    sortBy: initial?.sortBy || "created_at",
    sortOrder: (initial?.sortOrder || "desc") as "asc" | "desc",
  })

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const result: PaginatedResponse<Document> = await getDocuments(params)
        if (!cancelled) {
          setData(result.data)
          setTotal(result.total)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Fetch failed")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [params.page, params.pageSize, params.search, params.status, params.sortBy, params.sortOrder])

  const setPage = useCallback((page: number) => setParams((p) => ({ ...p, page })), [])
  const setPageSize = useCallback((pageSize: number) => setParams((p) => ({ ...p, pageSize, page: 1 })), [])
  const setSearch = useCallback((search: string) => setParams((p) => ({ ...p, search, page: 1 })), [])
  const setStatus = useCallback((status: string) => setParams((p) => ({ ...p, status, page: 1 })), [])
  const setSort = useCallback((sortBy: string, sortOrder: "asc" | "desc") => {
    setParams((p) => ({ ...p, sortBy, sortOrder }))
  }, [])

  const refresh = useCallback(() => setParams((p) => ({ ...p })), [])

  return { data, total, loading, error, params, setPage, setPageSize, setSearch, setStatus, setSort, refresh }
}
