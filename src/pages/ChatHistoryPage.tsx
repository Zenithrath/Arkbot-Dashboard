import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Search,
  ArrowLeft,
  Download,
  Bot,
  Clock,
  Loader2,
} from "lucide-react"

interface ChatSession {
  id: string
  session_id: string
  messages: Array<{
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: number
  }>
  user_email: string
  created_at: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function exportAsText(session: ChatSession) {
  const lines = session.messages.map((m) => {
    const role = m.role === "user" ? "User" : "Bot"
    return `[${role}]\n${m.content}`
  })
  return lines.join("\n\n---\n\n")
}

function exportAsJson(session: ChatSession) {
  return JSON.stringify(
    {
      session_id: session.session_id,
      user_email: session.user_email,
      created_at: session.created_at,
      messages: session.messages,
    },
    null,
    2
  )
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ChatHistoryPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  async function fetchSessions() {
    setLoading(true)
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setSessions(data as ChatSession[])
    }
    setLoading(false)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions
    const q = search.toLowerCase()
    return sessions.filter((s) =>
      s.messages.some((m) => m.content.toLowerCase().includes(q))
    )
  }, [sessions, search])

  if (selectedSession) {
    return (
      <div className="flex h-full flex-col bg-background">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5"
            onClick={() => setSelectedSession(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              Session {selectedSession.session_id.slice(0, 8)}...
            </p>
            <p className="text-xs text-white/40">
              {selectedSession.messages.length} messages · {formatDate(selectedSession.created_at)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-white/50 hover:text-white/80 hover:bg-white/5"
              onClick={() =>
                downloadFile(
                  exportAsText(selectedSession),
                  `chat-${selectedSession.session_id.slice(0, 8)}.txt`,
                  "text/plain"
                )
              }
            >
              <Download className="h-3.5 w-3.5" />
              TXT
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-white/50 hover:text-white/80 hover:bg-white/5"
              onClick={() =>
                downloadFile(
                  exportAsJson(selectedSession),
                  `chat-${selectedSession.session_id.slice(0, 8)}.json`,
                  "application/json"
                )
              }
            >
              <Download className="h-3.5 w-3.5" />
              JSON
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          <div className="mx-auto max-w-2xl px-4 py-4 space-y-4">
            {selectedSession.messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl bg-white/10 px-4 py-2.5 text-sm text-white">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <Bot className="h-3.5 w-3.5 text-white/60" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm leading-relaxed text-white/90 whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-white/[0.06] px-4 py-3">
        <h1 className="mb-3 text-lg font-semibold text-white">Chat History</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
          />
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-white/40" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <Clock className="mb-3 h-8 w-8" />
            <p className="text-sm">
              {search ? "No matching conversations" : "No chat history yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filtered.map((session) => {
              const firstMsg = session.messages[0]?.content || "Empty session"
              const preview =
                firstMsg.length > 100 ? firstMsg.slice(0, 100) + "..." : firstMsg
              const msgCount = session.messages.length

              return (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Bot className="h-4 w-4 text-white/60" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white/80">
                        Session {session.session_id.slice(0, 8)}...
                      </span>
                      <span className="text-xs text-white/30">
                        {msgCount} msg{msgCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-white/40 line-clamp-2">
                      {preview}
                    </p>
                    <p className="mt-1 text-xs text-white/25">
                      {formatDate(session.created_at)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}