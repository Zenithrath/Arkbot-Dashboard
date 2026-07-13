import { useState, useEffect } from "react"
import { getDashboardStats, getRecentUploads } from "@/services/api"
import type { DashboardStats, Document } from "@/lib/types"

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUploads, setRecentUploads] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const [s, uploads] = await Promise.all([
          getDashboardStats(),
          getRecentUploads(),
        ])
        if (!cancelled) {
          setStats(s)
          setRecentUploads(uploads)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Fetch failed")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  return { stats, recentUploads, loading, error }
}
