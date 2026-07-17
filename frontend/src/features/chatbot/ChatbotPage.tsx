import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from 'react';
import type React from 'react';
import { Bot, Send, User, Train, AlertCircle } from 'lucide-react';
import { sendMessage, GREETING, type ChatMessage } from '@/services/chatbot.service';

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
function renderText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    const parts: (string | React.ReactElement)[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch?.index !== undefined) {
        if (boldMatch.index > 0) parts.push(remaining.slice(0, boldMatch.index));
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
    <div className="flex items-end gap-2">
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

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isError }: { msg: ChatMessage; isError?: boolean }) {
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
          isError ? 'bg-red-100' : isBot ? 'bg-blue-100' : 'bg-gray-800'
        }`}
      >
        {isError ? (
          <AlertCircle className="h-4 w-4 text-red-500" />
        ) : isBot ? (
          <Bot className="h-4 w-4 text-blue-600" />
        ) : (
          <User className="h-4 w-4 text-white" />
        )}
      </div>

      <div className={`flex flex-col gap-1 max-w-[78%] ${isBot ? 'items-start' : 'items-end'}`}>
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
            isError
              ? 'bg-red-50 border border-red-200 text-red-700 rounded-bl-sm'
              : isBot
              ? 'bg-white border border-gray-200 rounded-bl-sm text-gray-800'
              : 'bg-blue-600 text-white rounded-br-sm'
          }`}
        >
          {isBot ? renderText(msg.text) : msg.text}
        </div>
        <span className="text-[11px] text-gray-400 px-1">{time}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setTyping(true);

      try {
        const botMsg = await sendMessage(trimmed);
        setMessages((prev) => [...prev, botMsg]);
      } catch (err: unknown) {
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'bot',
          text:
            err instanceof Error
              ? err.message
              : 'Something went wrong. Please try again.',
          timestamp: new Date(),
        };
        setErrorIds((prev) => new Set(prev).add(errMsg.id));
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setTyping(false);
      }
    },
    [typing],
  );

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend(input);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 shrink-0">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900 flex items-center gap-2">
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
            isError={errorIds.has(msg.id)}
          />
        ))}
        {typing && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="pt-3 border-t border-gray-200 shrink-0">
        <div className="flex items-end gap-2 bg-white border border-gray-300 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all shadow-sm">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            disabled={typing}
            placeholder="Ask me anything… (Enter to send, Shift+Enter for new line)"
            className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent max-h-32 leading-relaxed disabled:opacity-50"
            style={{ minHeight: '24px' }}
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
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
        <p className="text-[11px] text-gray-400 text-center mt-1.5">
          Powered by Vaprise AI · Responses may take a moment
        </p>
      </div>
    </div>
  );
}
