import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  RefreshCw,
  Trash2,
  Users,
  AlertTriangle,
} from "lucide-react"

type PendingUser = {
  id: string
  email: string
  user_id: string
  status: "pending" | "approved" | "rejected"
  created_at: string
}

export function AdminRegistrationsPage() {
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<PendingUser | null>(null)
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending")

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("pending_users")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setUsers(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleApprove = async (user: PendingUser) => {
    setActionLoading(user.id)
    const { error } = await supabase
      .from("pending_users")
      .update({ status: "approved" })
      .eq("id", user.id)

    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: "approved" } : u))
      )
    }
    setActionLoading(null)
  }

  const handleReject = async (user: PendingUser) => {
    setActionLoading(user.id)
    const { error } = await supabase
      .from("pending_users")
      .update({ status: "rejected" })
      .eq("id", user.id)

    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: "rejected" } : u))
      )
    }
    setActionLoading(null)
  }

  const handleDelete = async (user: PendingUser) => {
    setActionLoading(user.id)

    // Delete auth user via Edge Function
    if (user.user_id) {
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-auth-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ user_id: user.user_id }),
        })
        const data = await res.json()
        if (data.error) {
          console.error("Edge Function error:", data.error)
        }
      } catch (e) {
        console.error("Failed to delete auth user:", e)
      }
    }

    // Delete from pending_users
    const { error } = await supabase
      .from("pending_users")
      .delete()
      .eq("id", user.id)

    if (!error) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      setDeleteConfirm(null)
    }
    setActionLoading(null)
  }

  const pendingUsers = users.filter((u) => u.status === "pending")
  const approvedUsers = users.filter((u) => u.status === "approved")
  const pendingCount = pendingUsers.length

  const statusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />
    }
  }

  const statusBadge = (status: string) => {
    const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
    switch (status) {
      case "approved":
        return `${base} bg-green-500/10 text-green-400 border border-green-500/20`
      case "rejected":
        return `${base} bg-red-500/10 text-red-400 border border-red-500/20`
      default:
        return `${base} bg-yellow-500/10 text-yellow-400 border border-yellow-500/20`
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Users</h1>
          <p className="text-sm text-white/40 mt-1">
            Manage user registrations and accounts
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={fetchUsers}
          variant="outline"
          size="sm"
          className="border-white/10 text-white/60 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "pending"
              ? "bg-orange-500 text-white"
              : "bg-white/5 text-white/50 hover:text-white/70"
          }`}
        >
          <Clock className="h-4 w-4" />
          Pending
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "approved"
              ? "bg-green-600 text-white"
              : "bg-white/5 text-white/50 hover:text-white/70"
          }`}
        >
          <Users className="h-4 w-4" />
          Active Users
          <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
            {approvedUsers.length}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        </div>
      ) : activeTab === "pending" ? (
        pendingUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/40">
            <UserCheck className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">No pending registrations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-500/10">
                    <span className="text-sm font-medium text-yellow-400">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {new Date(user.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={statusBadge("pending")}>
                    {statusIcon("pending")}
                    pending
                  </span>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(user)}
                      disabled={actionLoading === user.id}
                      size="sm"
                      className="h-8 bg-green-600 hover:bg-green-500 text-white"
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleReject(user)}
                      disabled={actionLoading === user.id}
                      size="sm"
                      variant="outline"
                      className="h-8 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <UserX className="h-3.5 w-3.5 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : approvedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-white/40">
          <Users className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">No active users</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                  <span className="text-sm font-medium text-green-400">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.email}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    Approved {new Date(user.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={statusBadge("approved")}>
                  {statusIcon("approved")}
                  active
                </span>

                <Button
                  onClick={() => setDeleteConfirm(user)}
                  disabled={actionLoading === user.id}
                  size="sm"
                  variant="outline"
                  className="h-8 border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-white/[0.06] bg-[#1a1a1b] p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Delete User</h3>
                <p className="text-xs text-white/40">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-white/60 mb-6">
              Are you sure you want to delete <span className="font-medium text-white">{deleteConfirm.email}</span>?
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => setDeleteConfirm(null)}
                variant="outline"
                className="flex-1 border-white/10 text-white/60"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={actionLoading === deleteConfirm.id}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white"
              >
                {actionLoading === deleteConfirm.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
