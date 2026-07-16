import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Loader2,
  Users,
  RefreshCw,
  Trash2,
  AlertTriangle,
  UserPlus,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface AuthUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string
  banned: boolean
}

export function UsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [needsServiceKey, setNeedsServiceKey] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setNeedsServiceKey(false)

    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error("Error listing users:", error)
      setNeedsServiceKey(true)
      setLoading(false)
      return
    }

    if (data?.users) {
      setUsers(
        data.users.map((u) => ({
          id: u.id,
          email: u.email ?? "—",
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? "",
          banned: (u as unknown as { banned?: boolean }).banned === true,
        }))
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)

    const { error } = await supabase.auth.admin.inviteUserByEmail(
      inviteEmail.trim()
    )

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Invite sent to ${inviteEmail}`)
      setInviteOpen(false)
      setInviteEmail("")
      fetchUsers()
    }
    setInviting(false)
  }

  const handleDeleteUser = async (userId: string) => {
    setDeleting(userId)

    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("User deleted")
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    }
    setDeleting(null)
  }

  const formatDate = (date: string | null) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Users</h1>
          <p className="mt-1 text-sm text-white/40">
            Manage admin users and access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white/50 hover:text-white/70 hover:bg-white/5"
            onClick={fetchUsers}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {!needsServiceKey && (
            <Button
              onClick={() => setInviteOpen(true)}
              className="bg-white/10 text-white hover:bg-white/15 border border-white/10"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* Service Role Key Warning */}
      {needsServiceKey && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-amber-300">
                Service Role Key Required
              </h3>
              <p className="mt-1 text-sm text-white/50 leading-relaxed">
                User management requires the Supabase <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">service_role</code> key, which has
                admin privileges. The current client uses only the{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">anon</code> key.
              </p>
              <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-xs text-white/40 mb-2">To enable user management:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-white/50">
                  <li>
                    Create a Supabase Edge Function that uses the{" "}
                    <code className="rounded bg-white/10 px-1.5 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
                    environment variable
                  </li>
                  <li>
                    Expose admin endpoints: <code className="rounded bg-white/10 px-1.5 py-0.5">listUsers</code>,{" "}
                    <code className="rounded bg-white/10 px-1.5 py-0.5">inviteUser</code>,{" "}
                    <code className="rounded bg-white/10 px-1.5 py-0.5">deleteUser</code>
                  </li>
                  <li>
                    Call those endpoints from this page instead of the client-side SDK
                  </li>
                </ol>
              </div>
              <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-xs text-white/40">
                  <Shield className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                  Never expose the service role key to the browser. Always use a backend proxy or Edge Functions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Table */}
      {!needsServiceKey && (
        loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-white/40" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="mb-3 h-10 w-10 text-white/15" />
            <p className="text-sm text-white/30">No users found</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40">
                    Created At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40">
                    Last Sign In
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
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                          <Users className="h-4 w-4 text-white/30" />
                        </div>
                        <span className="text-sm font-medium text-white/90">
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/40">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/40">
                      {formatDate(user.last_sign_in_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
                          user.banned
                            ? "bg-red-500/15 text-red-400 border-red-500/20"
                            : "bg-green-500/15 text-green-400 border-green-500/20"
                        )}
                      >
                        {user.banned ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/30 hover:text-red-400 hover:bg-red-400/10"
                            disabled={deleting === user.id}
                          >
                            {deleting === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the user{" "}
                              <strong>{user.email}</strong> and revoke all their
                              access.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Invite User</DialogTitle>
            <DialogDescription className="text-white/50">
              Send an invitation email to grant admin access.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm text-white/60 mb-2 block">Email address</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setInviteOpen(false)}
              className="text-white/50 hover:text-white/70"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || inviting}
              className="bg-white/10 text-white hover:bg-white/15 border border-white/10"
            >
              {inviting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
