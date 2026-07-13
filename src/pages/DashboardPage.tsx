import { FileText, CheckCircle, RefreshCw } from "lucide-react"
import { TopBar } from "@/components/layout/TopBar"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "@/hooks/useDashboard"
import { formatDate } from "@/lib/utils"

export function DashboardPage() {
  const { stats, recentUploads, loading } = useDashboard()

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                icon={FileText}
                label="Total Documents"
                value={stats?.totalDocuments ?? 0}
              />
              <StatCard
                icon={CheckCircle}
                label="Total Indexed"
                value={stats?.indexedDocuments ?? 0}
              />
              <StatCard
                icon={RefreshCw}
                label="Last Synchronization"
                value={
                  stats?.lastSyncAt
                    ? formatDate(stats.lastSyncAt)
                    : "No sync yet"
                }
              />
            </>
          )}
        </div>

        {/* Recent Uploads */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="font-semibold">Recent Uploads</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentUploads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No documents uploaded yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentUploads.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-medium uppercase">
                      {doc.file_type.slice(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {doc.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.file_type.toUpperCase()} &middot;{" "}
                        {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-16" />
    </div>
  )
}
