import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LuSparkles,
  LuSend,
  LuPlus,
  LuTrash2,
  LuBot,
  LuUser,
  LuRefreshCw,
  LuChevronRight,
  LuChevronLeft,
  LuMessageSquare,
} from 'react-icons/lu'
import PageHeader from '../../components/ui/PageHeader'
import {
  useGetSessionsQuery,
  useGetSessionQuery,
  useGetOrCreateLatestSessionQuery,
  useCreateSessionMutation,
  useDeleteSessionMutation,
} from '../../store/api/aiChatApi'

const PRESET_PROMPTS = [
  "What were today's top-selling items?",
  "Are there any low-stock inventory alerts?",
  "Summarize last week's sales performance",
  "How many active staff members are on shift?",
]

export default function AIAssistant() {
  // Collapsed state for sidebar history
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Current session ID and active session queries
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [inputText, setInputText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedText, setStreamedText] = useState('')

  // Query sessions list
  const { data: listData, refetch: refetchSessions } = useGetSessionsQuery({ page: 1, per_page: 25 })
  const sessions = listData?.data || []

  // Query latest session on mount
  const { data: latestSessionData, isLoading: isLoadingLatest } = useGetOrCreateLatestSessionQuery(null)

  // Query active session detail
  const { data: activeSessionData, isLoading: isLoadingActive, refetch: refetchActive } = useGetSessionQuery(
    currentSessionId,
    { skip: !currentSessionId }
  )

  const [createSession, { isLoading: isStartingNew }] = useCreateSessionMutation()
  const [deleteSession] = useDeleteSessionMutation()

  // Set initial session
  useEffect(() => {
    if (latestSessionData?.data?.id && !currentSessionId) {
      setCurrentSessionId(latestSessionData.data.id)
    }
  }, [latestSessionData, currentSessionId])

  const chatEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Scroll to bottom helper
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeSessionData?.data?.messages, streamedText, isStreaming])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [inputText])

  const handleStartNewSession = async () => {
    try {
      const res = await createSession({}).unwrap()
      if (res.success && res.data?.id) {
        setCurrentSessionId(res.data.id)
        setStreamedText('')
        setInputText('')
        refetchSessions()
        toast.success('Started a new chat session')
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to start a new chat session')
    }
  }

  const handleDeleteSession = async (id, e) => {
    if (e) e.stopPropagation()
    const confirm = window.confirm('Are you sure you want to delete this chat session?')
    if (!confirm) return

    try {
      await deleteSession(id).unwrap()
      toast.success('Chat session deleted')
      refetchSessions()
      if (currentSessionId === id) {
        setCurrentSessionId(null)
        setStreamedText('')
        setInputText('')
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete chat session')
    }
  }

  const handleSend = async (textToSend) => {
    const finalMsg = (textToSend || inputText).trim()
    if (!finalMsg || isStreaming) return

    if (!currentSessionId) {
      toast.error('No active chat session. Starting one...')
      await handleStartNewSession()
      return
    }

    setIsStreaming(true)
    setStreamedText('')
    setInputText('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/v1/ai/chat/sessions/${currentSessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ message: finalMsg }),
      })

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}))
        throw new Error(errorJson.message || `Server returned HTTP ${response.status}`)
      }

      // Read SSE stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // last incomplete line

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          try {
            const parsed = JSON.parse(trimmed.slice(6))
            if (parsed.type === 'token') {
              setStreamedText((prev) => prev + parsed.content)
            } else if (parsed.type === 'error') {
              toast.error(parsed.message || 'Stream error')
            } else if (parsed.type === 'done') {
              // Successfully finished streaming
            }
          } catch (_) {
            // Ignore parse errors on incomplete chunk JSON
          }
        }
      }
    } catch (err) {
      toast.error(err.message || 'Connection failed. Please check your network.')
    } finally {
      setIsStreaming(false)
      setStreamedText('')
      refetchActive()
      refetchSessions()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Formatting assistant messages into paragraphs and lists
  const renderMessageContent = (content) => {
    if (!content) return null
    return content.split('\n\n').map((paragraph, index) => {
      const isListItem = paragraph.trim().startsWith('-') || paragraph.trim().startsWith('*') || /^\d+\./.test(paragraph.trim())
      if (isListItem) {
        const items = paragraph.split('\n').filter(Boolean)
        return (
          <ul key={index} className="list-disc pl-5 space-y-1 mb-3 text-sm">
            {items.map((item, itemIdx) => {
              const cleanedText = item.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '')
              return <li key={itemIdx}>{cleanedText}</li>
            })}
          </ul>
        )
      }
      return <p key={index} className="mb-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{paragraph}</p>
    })
  }

  const currentMessages = activeSessionData?.data?.messages || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Operations AI Assistant"
          description="Ask questions about sales performance, staff shifts, low-stock warnings, and metrics using conversational language."
        />
        <button
          onClick={handleStartNewSession}
          disabled={isStartingNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-all"
        >
          <LuPlus size={15} />
          New Thread
        </button>
      </div>

      {/* Main chat layout */}
      <div className="panel flex h-[650px] overflow-hidden border border-slate-200 shadow-xl rounded-2xl">
        
        {/* Collapsible Sidebar for History */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-slate-100 flex flex-col h-full bg-slate-50/50 shrink-0 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Previous Threads</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-semibold">{sessions.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessions.map((sess) => (
                  <button
                    key={sess.id}
                    onClick={() => {
                      setCurrentSessionId(sess.id)
                      setStreamedText('')
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-sm transition-all ${
                      currentSessionId === sess.id
                        ? 'bg-orange-50 text-orange-600 font-semibold shadow-inner'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <LuMessageSquare className={currentSessionId === sess.id ? 'text-orange-500' : 'text-slate-400'} size={14} />
                      <span className="truncate">
                        {new Date(sess.last_message_at).toLocaleDateString()} at{' '}
                        {new Date(sess.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-slate-200 transition-colors"
                    >
                      <LuTrash2 size={13} />
                    </button>
                  </button>
                ))}
                {sessions.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">No active threads. Start a new one!</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat window */}
        <div className="flex-1 flex flex-col h-full bg-white relative min-w-0">
          
          {/* Sidebar Toggle Handle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[1px] z-10 w-4 h-12 bg-slate-100 hover:bg-orange-100 border border-slate-200 hover:border-orange-200 rounded-r-lg flex items-center justify-center text-slate-400 hover:text-orange-500 transition-all font-bold"
          >
            {sidebarOpen ? <LuChevronLeft size={10} /> : <LuChevronRight size={10} />}
          </button>

          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                <LuBot size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">Manager Copilot</h3>
                <span className="text-xs text-slate-400">Context is loaded from active database items</span>
              </div>
            </div>
            {currentSessionId && (
              <button
                onClick={() => handleDeleteSession(currentSessionId)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center gap-1.5 transition-all"
              >
                <LuTrash2 size={13} />
                Delete Thread
              </button>
            )}
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            
            {isLoadingActive ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3">
                <LuRefreshCw className="animate-spin text-orange-400" size={32} />
                <p className="text-sm text-slate-400 font-medium">Loading session history...</p>
              </div>
            ) : currentMessages.length === 0 && !isStreaming ? (
              <div className="h-full flex flex-col items-center justify-center space-y-8">
                <div className="text-center max-w-sm space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto text-orange-500 mb-2">
                    <LuSparkles size={28} />
                  </div>
                  <h4 className="font-bold text-ink text-base">Ask anything about operations</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Query active staff performance, 7-day sales totals, average ticket cost, low stock ingredient alerts, and more.
                  </p>
                </div>

                {/* Preset Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                  {PRESET_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="text-left p-3 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-100 hover:border-orange-200 rounded-xl transition-all shadow-sm flex items-start gap-2"
                    >
                      <span className="leading-tight shrink-0 mt-0.5">•</span>
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Standard Message loops */}
                {currentMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-sm ${
                        msg.role === 'user' ? 'bg-orange-500 text-white font-bold' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {msg.role === 'user' ? <LuUser size={15} /> : <LuBot size={15} />}
                    </div>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-50 text-slate-800 border border-slate-100'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                      ) : (
                        renderMessageContent(msg.content)
                      )}
                    </div>
                  </div>
                ))}

                {/* Live stream block */}
                {isStreaming && (
                  <div className="flex items-start gap-3.5 flex-row">
                    <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-slate-100 text-slate-600">
                      <LuBot size={15} />
                    </div>
                    <div className="max-w-[75%] rounded-2xl px-4 py-3 text-sm bg-slate-50 text-slate-800 border border-slate-100 shadow-sm min-h-[44px]">
                      {streamedText ? (
                        renderMessageContent(streamedText)
                      ) : (
                        <div className="flex items-center gap-1 py-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Footer input container */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/20">
            <div className="relative flex items-end gap-2.5 bg-white border border-slate-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 rounded-xl px-3 py-2.5 transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                placeholder="Ask about sales, inventory warnings, staff lists..."
                className="w-full resize-none bg-transparent py-1 text-sm border-0 focus:outline-none focus:ring-0 leading-relaxed max-h-44 text-slate-800 placeholder-slate-400"
              />
              <button
                onClick={() => handleSend()}
                disabled={isStreaming || !inputText.trim()}
                className="shrink-0 w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-slate-100 text-white disabled:text-slate-400 flex items-center justify-center transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                {isStreaming ? <LuRefreshCw className="animate-spin" size={15} /> : <LuSend size={15} />}
              </button>
            </div>
            <div className="mt-2 text-center text-[10px] text-slate-400 select-none">
              Press Enter to send, Shift+Enter for new line. Powered by Claude 3.5 Haiku.
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
