import { useState } from 'react'
import { Sparkles, Send } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'

const suggestedPrompts = [
  "What's driving today's revenue dip versus last Sunday?",
  'Which menu items should I discontinue this quarter?',
  'Summarize last week\'s negative feedback themes',
  'How much prawn stock do I need for the weekend?',
]

const seedMessages = [
  {
    role: 'assistant',
    text: "Hi Maliha, I'm your operations assistant. I can pull from your sales, inventory, staff, and feedback data to answer questions or flag things worth your attention. What would you like to know?",
  },
]

export default function AIAssistant() {
  const [messages, setMessages] = useState(seedMessages)
  const [input, setInput] = useState('')

  const send = (text) => {
    const content = text ?? input
    if (!content.trim()) return
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: content },
      {
        role: 'assistant',
        text: "I'll need a live data connection to answer that precisely — but here's the kind of breakdown I'd give: a short summary up top, the key numbers behind it, and one recommended next action.",
      },
    ])
    setInput('')
  }

  return (
    <div>
      <PageHeader
        title="AI assistant"
        description="Ask questions about your restaurant's operations in plain language."
      />

      <div className="panel flex flex-col h-[600px]">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-ticket-orange flex items-center justify-center shrink-0 mr-2.5">
                  <Sparkles size={13} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user' ? 'bg-ink text-paper' : 'bg-slate-50 text-ink border border-slate-100'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {messages.length === 1 && (
          <div className="px-6 pb-3 flex flex-wrap gap-2">
            {suggestedPrompts.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-ticket-orange hover:text-ticket-orange transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 border-t border-slate-100 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask about sales, inventory, staff, or feedback…"
            className="input-field"
          />
          <button onClick={() => send()} className="btn-accent shrink-0">
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
