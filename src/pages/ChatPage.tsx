import { useState, useRef, useEffect, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import ReactMarkdown from "react-markdown"
import {
  Bot,
  Copy,
  RotateCcw,
  Menu,
  Check,
  Sparkles,
  Paperclip,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/layout/Sidebar"

const CHAT_API_URL =
  "https://arkbot-n8n.6jkqbm.easypanel.host/webhook/chat-widget"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

function generateSessionId() {
  return uuidv4()
}

export function ChatPage() {
  const [sessionId] = useState(generateSessionId)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    const maxHeight = 152
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
  }, [input])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return

      const userMsg: Message = {
        id: uuidv4(),
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInput("")
      setIsLoading(true)

      try {
        const res = await fetch(CHAT_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), sessionId }),
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        const reply =
          data.reply ?? data.response ?? data.message ?? data.answer ?? ""

        const assistantMsg: Message = {
          id: uuidv4(),
          role: "assistant",
          content: reply || "Maaf, tidak ada jawaban yang diterima.",
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch {
        const errorMsg: Message = {
          id: uuidv4(),
          role: "assistant",
          content:
            "Maaf, terjadi kesalahan saat menghubungi server. Silakan coba lagi.",
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, errorMsg])
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, sessionId]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleNewChat = () => {
    setMessages([])
    setInput("")
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const isEmpty = messages.length === 0

  // Ctrl+U to open file picker
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault()
        fileInputRef.current?.click()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <div className="relative flex h-full flex-col bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-10 h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5 text-white/70" />
      </Button>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col">
        {isEmpty ? (
          /* Welcome state */
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <h1 className="mb-10 text-center text-3xl font-light text-white/80 sm:text-4xl">
              Siap Anda gunakan kapan saja
            </h1>

            {/* Input box with glow */}
            <div className="w-full max-w-3xl">
              <div className="relative">
                {/* Red-orange glow */}
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-orange-500/25 via-red-500/20 to-orange-400/15 blur-2xl" />
                <div className="relative flex items-center rounded-2xl border border-white/15 bg-background px-2 py-1.5 transition-colors focus-within:border-white/25">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 shrink-0 rounded-xl px-3 py-2 text-sm text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
                  >
                    <Paperclip className="h-4 w-4" />
                    <span>Add files</span>
                  </button>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tanya ArkBot..."
                    rows={1}
                    className="flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none leading-relaxed scrollbar-hide"
                  />
                  <Button
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    onClick={() => sendMessage(input)}
                    className={cn(
                      "h-10 w-10 shrink-0 rounded-lg transition-colors !bg-transparent !opacity-100",
                      input.trim() && !isLoading
                        ? "!text-white hover:bg-white/10"
                        : "!text-white/30 cursor-not-allowed"
                    )}
                  >
                    <Sparkles className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-white/20">
                ArkBot dapat membuat kesalahan. Pastikan informasi yang diberikan sudah benar.
              </p>
            </div>
          </div>
        ) : (
          /* Conversation state */
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onCopy={handleCopy}
                    onRegenerate={
                      msg.role === "assistant"
                        ? () => {
                            const msgIndex = messages.findIndex(
                              (m) => m.id === msg.id
                            )
                            const prevUserMsg = messages
                              .slice(0, msgIndex)
                              .reverse()
                              .find((m) => m.role === "user")
                            if (prevUserMsg) {
                              setMessages((prev) =>
                                prev.filter((m) => m.id !== msg.id)
                              )
                              sendMessage(prevUserMsg.content)
                            }
                          }
                        : undefined
                    }
                    copiedId={copiedId}
                  />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input box - bottom with glow */}
            <div className="shrink-0 px-4 pb-4 pt-2">
              <div className="mx-auto max-w-3xl">
                <div className="relative">
                  {/* Red-orange glow */}
                  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-orange-500/25 via-red-500/20 to-orange-400/15 blur-2xl" />
                  <div className="relative flex items-center rounded-2xl border border-white/15 bg-background px-2 py-1.5 transition-colors focus-within:border-white/25">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 shrink-0 rounded-xl px-3 py-2 text-sm text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
                    >
                      <Paperclip className="h-4 w-4" />
                      <span>Add files</span>
                    </button>
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Tanya ArkBot..."
                      rows={1}
                      className="flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none leading-relaxed scrollbar-hide"
                    />
                    <Button
                      size="icon"
                      disabled={!input.trim() || isLoading}
                      onClick={() => sendMessage(input)}
                      className={cn(
                        "h-10 w-10 shrink-0 rounded-lg transition-colors !bg-transparent !opacity-100",
                        input.trim() && !isLoading
                          ? "!text-white hover:bg-white/10"
                          : "!text-white/30 cursor-not-allowed"
                      )}
                    >
                      <Sparkles className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-center text-xs text-white/20">
                  ArkBot dapat membuat kesalahan. Pastikan informasi yang diverikan sudah benar.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          console.log("Selected files:", e.target.files)
          e.target.value = ""
        }}
      />
    </div>
  )
}

function MessageBubble({
  message,
  onCopy,
  onRegenerate,
  copiedId,
}: {
  message: Message
  onCopy: (text: string, id: string) => void
  onRegenerate?: () => void
  copiedId: string | null
}) {
  const isUser = message.role === "user"

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-3xl bg-white/10 px-5 py-3 text-[15px] text-white leading-relaxed">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="group/msg flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 mt-0.5">
        <Bot className="h-4 w-4 text-white/60" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="prose prose-invert prose-sm max-w-none text-white/90 leading-relaxed">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <div className="mt-2 flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
          <button
            onClick={() => onCopy(message.content, message.id)}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-white/40 hover:bg-white/5 hover:text-white/60 transition-colors"
          >
            {copiedId === message.id ? (
              <>
                <Check className="h-3 w-3" />
                Tersalin
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Salin
              </>
            )}
          </button>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-white/40 hover:bg-white/5 hover:text-white/60 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Ulangi
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
        <Bot className="h-4 w-4 text-white/60" />
      </div>
      <div className="flex items-center gap-1.5 py-3">
        <span className="h-2 w-2 rounded-full bg-white/30 animate-pulse" />
        <span className="h-2 w-2 rounded-full bg-white/30 animate-pulse [animation-delay:0.2s]" />
        <span className="h-2 w-2 rounded-full bg-white/30 animate-pulse [animation-delay:0.4s]" />
      </div>
    </div>
  )
}
