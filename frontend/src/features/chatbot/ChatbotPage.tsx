import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from 'react';
import type React from 'react';
import { Bot, Send, User, Train } from 'lucide-react';
import { sendMessage, GREETING, type ChatMessage } from '@/services/chatbot.service';

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
// Renders **bold**, *italic*, and newlines — no extra dependencies needed.
function renderText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    const parts: (string | React.ReactElement)[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch?.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(remaining.slice(0, boldMatch.index));
        }
        parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      } else {
        parts.push(remaining);
        break;
      }
    }

    return (
      <span key={li}>
        {parts}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 max-w-[75%]">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <Bot className="h-4 w-4 text-blue-600" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: '800ms' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Bubble ───────────────────────────────────────────────────────────────────
function MessageBubble({
  msg,
  onSuggestion,
  isLast,
}: {
  msg: ChatMessage;
  onSuggestion: (s: string) => void;
  isLast: boolean;
}) {
  const isBot = msg.role === 'bot';
  const time = msg.timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex items-end gap-2 ${isBot ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isBot ? 'bg-blue-100' : 'bg-gray-800'
        }`}
      >
        {isBot ? (
          <Bot className="h-4 w-4 text-blue-600" />
        ) : (
          <User className="h-4 w-4 text-white" />
        )}
      </div>

      <div className={`flex flex-col gap-1.5 max-w-[75%] ${isBot ? 'items-start' : 'items-end'}`}>
        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
            isBot
              ? 'bg-white border border-gray-200 rounded-bl-sm text-gray-800'
              : 'bg-blue-600 text-white rounded-br-sm'
          }`}
        >
          {isBot ? renderText(msg.text) : msg.text}
        </div>

        {/* Timestamp */}
        <span className="text-[11px] text-gray-400 px-1">{time}</span>

        {/* Suggestion chips — only on the last bot message */}
        {isBot && isLast && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {msg.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSuggestion(s)}
                className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-full transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || typing) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setTyping(true);

      // Simulate thinking delay
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

      const botMsg = await sendMessage(trimmed, [...messages, userMsg]);
      setTyping(false);
      setMessages((prev) => [...prev, botMsg]);
    },
    [messages, typing],
  );

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend(input);
    }
  }

  function onSuggestion(text: string) {
    void handleSend(text);
  }

  // Find index of last bot message for suggestion chips
  const lastBotIndex = [...messages].reverse().findIndex((m) => m.role === 'bot');
  const lastBotMsgId =
    lastBotIndex >= 0 ? messages[messages.length - 1 - lastBotIndex].id : null;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900 flex items-center gap-1.5">
            Vaprise Assistant
            <span className="inline-flex items-center gap-1 text-xs font-normal text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Online
            </span>
          </h1>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Train className="h-3 w-3" />
            Vaprise Railway help assistant
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            onSuggestion={onSuggestion}
            isLast={msg.id === lastBotMsgId}
          />
        ))}
        {typing && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-end gap-2 bg-white border border-gray-300 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            disabled={typing}
            placeholder="Ask me anything… (Enter to send, Shift+Enter for new line)"
            className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent max-h-32 leading-relaxed disabled:opacity-50"
            style={{ height: 'auto', minHeight: '24px' }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = `${t.scrollHeight}px`;
            }}
          />
          <button
            onClick={() => void handleSend(input)}
            disabled={!input.trim() || typing}
            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4 text-white disabled:text-gray-400" />
          </button>
        </div>
        <p className="text-[11px] text-gray-400 text-center mt-1.5">
          AI responses are pre-programmed guides. For urgent issues, contact station staff.
        </p>
      </div>
    </div>
  );
}
