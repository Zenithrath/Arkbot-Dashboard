import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Bot, Loader2 } from "lucide-react"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      navigate("/admin")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/[0.06]">
            <Bot className="h-7 w-7 text-orange-500" />
          </div>
          <h1 className="text-xl font-semibold text-white">ArkBot</h1>
          <p className="mt-1 text-sm text-white/40">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/50">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-orange-500/50 transition-colors"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/50">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-orange-500/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-medium text-white hover:bg-orange-400 transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
