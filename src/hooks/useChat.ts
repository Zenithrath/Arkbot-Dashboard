import { useState, useRef, useEffect, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import { supabase } from "@/lib/supabase"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  files?: string[]
}

interface ChatStorage {
  sessionId: string
  messages: Message[]
}

interface UseChatConfig {
  apiEndpoint: string
  apiKey: string
  localStorageKey: string
  emptyReplyMessage?: string
  errorMessage?: string
}

async function saveChatToSupabase(sessionId: string, messages: Message[]) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("chat_sessions").upsert(
      {
        session_id: sessionId,
        messages,
        user_email: user.email,
      },
      { onConflict: "session_id" }
    )
  } catch (err) {
    console.error("Failed to save chat to Supabase:", err)
  }
}

function sanitizeInput(text: string): string {
  return text
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
    .slice(0, 4000)
}

function loadChat(storageKey: string): ChatStorage {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { sessionId: uuidv4(), messages: [] }
}

function saveChat(storageKey: string, data: ChatStorage) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data))
  } catch {}
}

export function useChat({
  apiEndpoint,
  apiKey,
  localStorageKey,
  emptyReplyMessage = "Tidak ada jawaban.",
  errorMessage = "Gagal menghubungi server.",
}: UseChatConfig) {
  const [chat, setChat] = useState<ChatStorage>(() => loadChat(localStorageKey))
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
    saveChat(localStorageKey, { sessionId, messages })
  }, [sessionId, messages, localStorageKey])

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const sanitized = sanitizeInput(text)
      if ((!sanitized && selectedFiles.length === 0) || isLoading) return

      const fileNames = selectedFiles.map((f) => f.name)

      const userMsg: Message = {
        id: uuidv4(),
        role: "user",
        content: sanitized || "",
        timestamp: Date.now(),
        files: fileNames.length > 0 ? fileNames : undefined,
      }

      setChat((prev) => ({ ...prev, messages: [...prev.messages, userMsg] }))
      setInput("")
      setSelectedFiles([])
      setIsLoading(true)

      try {
        let res: Response

        if (selectedFiles.length > 0) {
          const formData = new FormData()
          formData.append("message", sanitized)
          formData.append("sessionId", sessionId)
          selectedFiles.forEach((file) => {
            formData.append("files", file)
          })

          res = await fetch(apiEndpoint, {
            method: "POST",
            headers: { "x-api-key": apiKey },
            body: formData,
            signal: AbortSignal.timeout(300000),
          })
        } else {
          res = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
            },
            body: JSON.stringify({ message: sanitized, sessionId }),
            signal: AbortSignal.timeout(300000),
          })
        }

        if (!res.ok) {
          let errorMsg = `Server error (HTTP ${res.status})`
          try {
            const errorBody = await res.json()
            if (errorBody.message || errorBody.error) {
              errorMsg = errorBody.message || errorBody.error
            }
          } catch {
            try {
              const textBody = await res.text()
              if (textBody) errorMsg = textBody.slice(0, 200)
            } catch {}
          }
          console.error("API error response:", res.status, errorMsg)
          throw new Error(errorMsg)
        }

        const data = await res.json()
        if (data.status === "error" || data.error) {
          throw new Error(data.message || data.error || "Workflow error")
        }

        const reply =
          data.reply ?? data.response ?? data.message ?? data.answer ?? ""

        const assistantMsg: Message = {
          id: uuidv4(),
          role: "assistant",
          content: reply || emptyReplyMessage,
          timestamp: Date.now(),
        }
        const updatedMessages = [...messages, userMsg, assistantMsg]
        setChat((prev) => ({
          ...prev,
          messages: updatedMessages,
        }))
        saveChatToSupabase(sessionId, updatedMessages)
      } catch (err) {
        console.error("Chat API error:", err)
        let detailedError = errorMessage
        if (err instanceof TypeError && err.message.includes("fetch")) {
          detailedError = "Server tidak dapat dijangkau. Periksa koneksi internet."
        } else if (err instanceof DOMException && err.name === "TimeoutError") {
          detailedError = "Server tidak merespon (timeout). Coba lagi nanti."
        } else if (err instanceof Error) {
          detailedError = err.message
        }

        const errorMsg: Message = {
          id: uuidv4(),
          role: "assistant",
          content: detailedError,
          timestamp: Date.now(),
        }
        const updatedMessages = [...messages, userMsg, errorMsg]
        setChat((prev) => ({
          ...prev,
          messages: updatedMessages,
        }))
        saveChatToSupabase(sessionId, updatedMessages)
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, sessionId, selectedFiles, apiEndpoint, apiKey, emptyReplyMessage, errorMessage]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        sendMessage(input)
      }
    },
    [sendMessage, input]
  )

  const handleCopy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const handleNewChat = useCallback(() => {
    setChat({ sessionId: uuidv4(), messages: [] })
    setSelectedFiles([])
  }, [])

  const handleRegenerate = useCallback(
    (msgId: string) => {
      const msgIndex = messages.findIndex((m) => m.id === msgId)
      const prevUserMsg = messages
        .slice(0, msgIndex)
        .reverse()
        .find((m) => m.role === "user")
      if (prevUserMsg) {
        setChat((prev) => ({
          ...prev,
          messages: prev.messages.filter((m) => m.id !== msgId),
        }))
        sendMessage(prevUserMsg.content)
      }
    },
    [messages, sendMessage]
  )

  return {
    messages,
    input,
    setInput,
    isLoading,
    copiedId,
    selectedFiles,
    removeFile,
    messagesEndRef,
    textareaRef,
    sendMessage,
    handleKeyDown,
    handleCopy,
    handleNewChat,
    handleRegenerate,
    openFilePicker,
    handleDrop,
    handleDragOver,
  }
}
