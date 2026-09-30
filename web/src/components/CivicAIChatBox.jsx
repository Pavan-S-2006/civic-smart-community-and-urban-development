import { useState, useRef, useEffect } from 'react';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY || '';

const QUICK_PROMPTS = [
  'How do I track this complaint?',
  'What is the expected timeline?',
  'Whom should I tag in comments?',
  'How do I file a formal complaint?',
];

export default function CivicAIChatBox({ issue }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello! I'm your CivicPulse Assistant. Ask me anything about "${issue.title}" — such as complaint procedures, escalation timelines, or who to contact.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  async function handleSend(queryText) {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      let aiText = '';

      if (API_KEY) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        const prompt = `You are CivicPulse Assistant, an empathetic and highly intelligent municipal advisor helping a citizen.
Current Issue Context:
- Title: "${issue.title}"
- Category: "${issue.category}"
- Location Coords: ${issue.lat?.toFixed(4)}, ${issue.lng?.toFixed(4)}
- Status: "${issue.status}"
- Upvotes: ${issue.upvotes || 0}
- Description: "${issue.description || 'No detailed description provided'}"

User Question: "${textToSend}"

Guidelines:
1. Provide a natural, helpful, conversational response (2-4 concise sentences).
2. Directly answer what the user asked.
3. DO NOT force or output a list of tags unless the user specifically asks who to tag or contact.
4. Be professional, clear, and reassuring.`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (res.ok) {
          const data = await res.json();
          aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      }

      if (!aiText) {
        aiText = generateConversationalFallback(textToSend, issue);
      }

      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: aiText.trim() },
      ]);
    } catch (err) {
      console.error('Chat AI Error:', err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `For "${issue.title}", community upvotes boost its visibility on the map. As the status updates to In Progress or Resolved, you'll receive real-time notifications.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function generateConversationalFallback(query, issue) {
    const q = query.toLowerCase();
    if (q.includes('timeline') || q.includes('time') || q.includes('long')) {
      return `Standard resolution for ${issue.category} reports is typically 24 to 72 hours once verified. High upvote counts help local municipal teams prioritize this issue faster.`;
    }
    if (q.includes('track') || q.includes('status')) {
      return `This report is currently marked as "${issue.status}". You can monitor its live progress right here on the map as ward officers update the status.`;
    }
    if (q.includes('tag') || q.includes('whom') || q.includes('who') || q.includes('contact')) {
      return `For "${issue.title}", you can tag @municipalOfficer or @${issue.category.replace(/\s+/g, '')}Dept in the Jukebox Public Talk section to direct the report to the local ward supervisor.`;
    }
    if (q.includes('complaint') || q.includes('file')) {
      return `Your issue is already registered on CivicPulse! To escalate further, gather upvotes from neighbors or post an update in the Jukebox discussion room.`;
    }
    return `I'm here to help with "${issue.title}". Feel free to ask about escalation timelines, tracking status updates, or filing procedures!`;
  }

  return (
    <div className="border-t border-ink-200 bg-surface-50">

      {/* Toggle Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-gradient-to-r from-ink-900 via-indigo-950 to-purple-950 text-white flex items-center justify-between transition-all hover:brightness-110"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">💬</span>
          <span className="font-bold text-xs">Ask CivicPulse AI Assistant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-extrabold bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 px-2 py-0.5 rounded-full">
            AI Help
          </span>
          <span className="text-xs font-bold">{isOpen ? '▼' : '▲'}</span>
        </div>
      </button>

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="p-3 bg-surface-100 flex flex-col h-72 border-b border-ink-200">

          {/* Quick Prompts Carousel */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-ink-200 mb-2 no-scrollbar">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                className="whitespace-nowrap text-[9px] font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-2 py-1 rounded-full transition-all shadow-2xs flex-shrink-0"
              >
                💡 {qp}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] text-xs p-2.5 rounded-xl leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none shadow-sm font-medium'
                      : 'bg-white text-ink-900 border border-ink-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start">
                <div className="bg-white border border-ink-200 text-ink-400 text-xs p-2 rounded-xl rounded-bl-none animate-pulse">
                  CivicPulse Assistant is responding…
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input & Send Form */}
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            className="mt-2 flex gap-1.5"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about this issue..."
              className="flex-1 bg-white border border-ink-200 text-ink-900 placeholder:text-ink-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm"
            >
              Send
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
