import { useState, useRef, useEffect, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import ReactMarkdown from "react-markdown"
import {
  Bot,
  Copy,
  RotateCcw,
  Check,
  Sparkles,
  Paperclip,
  Plus,
  X,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const CHAT_API_URL =
  "https://arkbot-n8n.6jkqbm.easypanel.host/webhook/chat-widget"

const STORAGE_KEY = "arkbot-chat"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

interface ChatStorage {
  sessionId: string
  messages: Message[]
}

function loadChat(): ChatStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { sessionId: uuidv4(), messages: [] }
}

function saveChat(data: ChatStorage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

export function ChatPage() {
  const [chat, setChat] = useState<ChatStorage>(loadChat)
  const sessionId = chat.sessionId
  const messages = chat.messages
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const openFilePicker = useCallback(() => {
    const el = document.createElement("input")
    el.type = "file"
    el.multiple = true
    el.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) {
        setSelectedFiles((prev) => [...prev, ...Array.from(files)])
      }
    }
    el.click()
  }, [])

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault()
        openFilePicker()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [openFilePicker])

  useEffect(() => {
    saveChat({ sessionId, messages })
  }, [sessionId, messages])

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const sendMessage = useCallback(
    async (text: string) => {
      if ((!text.trim() && selectedFiles.length === 0) || isLoading) return

      const userMsg: Message = {
        id: uuidv4(),
        role: "user",
        content:
          text.trim() ||
          (selectedFiles.length > 0
            ? `[${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} dilampirkan]`
            : ""),
        timestamp: Date.now(),
      }

      setChat((prev) => ({ ...prev, messages: [...prev.messages, userMsg] }))
      setInput("")
      setSelectedFiles([])
      setIsLoading(true)

      try {
        let res: Response

        if (selectedFiles.length > 0) {
          const formData = new FormData()
          formData.append("message", text.trim())
          formData.append("sessionId", sessionId)
          selectedFiles.forEach((file) => {
            formData.append("files", file)
          })

          res = await fetch(CHAT_API_URL, {
            method: "POST",
            body: formData,
          })
        } else {
          res = await fetch(CHAT_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text.trim(), sessionId }),
          })
        }

        if (!res.ok) {
          const errorBody = await res.text()
          console.error("API error response:", res.status, errorBody)
          throw new Error(`HTTP ${res.status}: ${errorBody}`)
        }

        const data = await res.json()
        const reply =
          data.reply ?? data.response ?? data.message ?? data.answer ?? ""

        const assistantMsg: Message = {
          id: uuidv4(),
          role: "assistant",
          content: reply || "Maaf, tidak ada jawaban yang diterima.",
          timestamp: Date.now(),
        }
        setChat((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMsg],
        }))
      } catch (err) {
        console.error("Chat API error:", err)
        const errorMsg: Message = {
          id: uuidv4(),
          role: "assistant",
          content:
            "Maaf, terjadi kesalahan saat menghubungi server. Silakan coba lagi.",
          timestamp: Date.now(),
        }
        setChat((prev) => ({
          ...prev,
          messages: [...prev.messages, errorMsg],
        }))
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, sessionId, selectedFiles]
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
    const fresh: ChatStorage = { sessionId: uuidv4(), messages: [] }
    setChat(fresh)
    setSelectedFiles([])
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-screen flex-col bg-background">
      {isEmpty ? (
        /* Welcome state */
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <h1 className="mb-10 text-center text-3xl font-light text-white/80 sm:text-4xl">
            Siap Anda gunakan kapan saja
          </h1>

          <div className="w-full max-w-3xl">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-orange-500/25 via-red-500/20 to-orange-400/15 blur-2xl" />
              <div className="relative rounded-2xl border border-white/15 bg-background px-2 py-1.5 transition-colors focus-within:border-white/25">
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-2 pt-2 pb-1">
                    {selectedFiles.map((file, i) => (
                      <div
                        key={`${file.name}-${i}`}
                        className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white/70"
                      >
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="max-w-[120px] truncate">
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeFile(i)}
                          className="ml-0.5 shrink-0 rounded-full p-0.5 hover:bg-white/10"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white/70"
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
                    disabled={
                      (!input.trim() && selectedFiles.length === 0) || isLoading
                    }
                    onClick={() => sendMessage(input)}
                    className={cn(
                      "h-10 w-10 shrink-0 rounded-lg transition-colors !bg-transparent !opacity-100",
                      (input.trim() || selectedFiles.length > 0) && !isLoading
                        ? "!text-white hover:bg-white/10"
                        : "!text-white/30 cursor-not-allowed"
                    )}
                  >
                    <Sparkles className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-white/20">
              ArkBot dapat membuat kesalahan. Mohon di periksa kembali informasi
              yang diberikan.
            </p>
          </div>
        </div>
      ) : (
        /* Conversation state */
        <>
          {/* Header */}
          <div className="flex shrink-0 items-center justify-end border-b border-white/[0.06] px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/5"
              onClick={handleNewChat}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto bg-background scrollbar-hide">
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
                            setChat((prev) => ({
                              ...prev,
                              messages: prev.messages.filter(
                                (m) => m.id !== msg.id
                              ),
                            }))
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

          {/* Input */}
          <div className="shrink-0 px-4 pb-4 pt-2 bg-background">
            <div className="mx-auto max-w-3xl">
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-orange-500/25 via-red-500/20 to-orange-400/15 blur-2xl" />
                <div className="relative rounded-2xl border border-white/15 bg-background px-2 py-1.5 transition-colors focus-within:border-white/25">
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-2 pt-2 pb-1">
                      {selectedFiles.map((file, i) => (
                        <div
                          key={`${file.name}-${i}`}
                          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white/70"
                        >
                          <FileText className="h-3 w-3 shrink-0" />
                          <span className="max-w-[120px] truncate">
                            {file.name}
                          </span>
                          <button
                            onClick={() => removeFile(i)}
                            className="ml-0.5 shrink-0 rounded-full p-0.5 hover:bg-white/10"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white/70"
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
                      disabled={
                        (!input.trim() && selectedFiles.length === 0) ||
                        isLoading
                      }
                      onClick={() => sendMessage(input)}
                      className={cn(
                        "h-10 w-10 shrink-0 rounded-lg transition-colors !bg-transparent !opacity-100",
                        (input.trim() || selectedFiles.length > 0) && !isLoading
                          ? "!text-white hover:bg-white/10"
                          : "!text-white/30 cursor-not-allowed"
                      )}
                    >
                      <Sparkles className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-white/20">
                ArkBot dapat membuat kesalahan. Pastikan informasi yang diberikan
                sudah benar.
              </p>
            </div>
          </div>
        </>
      )}
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
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
        <Bot className="h-4 w-4 text-white/60" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="prose prose-invert prose-sm max-w-none leading-relaxed text-white/90">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover/msg:opacity-100">
          <button
            onClick={() => onCopy(message.content, message.id)}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-white/40 transition-colors hover:bg-white/5 hover:text-white/60"
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
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-white/40 transition-colors hover:bg-white/5 hover:text-white/60"
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
        <span className="h-2 w-2 animate-pulse rounded-full bg-white/30" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-white/30 [animation-delay:0.2s]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-white/30 [animation-delay:0.4s]" />
      </div>
    </div>
  )
}
