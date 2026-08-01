import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Send,
  User,
  Train,
  AlertCircle,
  MapPin,
  ShoppingBag,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  sendMessage,
  stationSearch,
  stationConfirm,
  makeOrderSearch,
  makeOrderConfirm,
  GREETING,
  type ChatMessage,
  type WorkflowPayload,
} from '@/services/chatbot.service';
import { useAuthState } from '@/hooks';

// ─── helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Detect command prefix → returns the workflow kind or 'chat' */
function detectMode(text: string): 'station' | 'makeorder' | 'chat' {
  const t = text.trim().toLowerCase();
  if (t.startsWith('/station')) return 'station';
  if (t.startsWith('/makeorder')) return 'makeorder';
  return 'chat';
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────

function renderText(text: string) {
  return text.split('\n').map((line, li, arr) => {
    const parts: (string | React.ReactElement)[] = [];
    let remaining = line;
    let k = 0;
    while (remaining.length > 0) {
      const m = remaining.match(/\*\*(.+?)\*\*/);
      if (m?.index !== undefined) {
        if (m.index > 0) parts.push(remaining.slice(0, m.index));
        parts.push(<strong key={k++}>{m[1]}</strong>);
        remaining = remaining.slice(m.index + m[0].length);
      } else {
        parts.push(remaining);
        break;
      }
    }
    return (
      <span key={li}>
        {parts}
        {li < arr.length - 1 && <br />}
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

// ─── Station confirmation card ────────────────────────────────────────────────

function StationConfirmCard({
  payload,
  onConfirm,
  onDeny,
  disabled,
}: {
  payload: WorkflowPayload;
  onConfirm: () => void;
  onDeny: () => void;
  disabled: boolean;
}) {
  const s = payload.station;
  if (!s) return null;
  return (
    <div className="mt-2 rounded-2xl border border-sky-200 bg-sky-50 p-4 space-y-3 max-w-xs">
      <div className="flex items-center gap-2 text-sky-700 font-semibold text-sm">
        <MapPin className="h-4 w-4" />
        Station found
      </div>
      <div className="text-sm text-slate-700 space-y-0.5">
        <p><span className="text-slate-400">Name</span> <span className="font-medium">{s.name}</span></p>
        <p><span className="text-slate-400">ID</span> <span className="font-medium">{s.stationId}</span></p>
        <p><span className="text-slate-400">Location</span> <span className="font-medium">{s.location}</span></p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white text-xs font-medium rounded-xl transition-colors"
        >
          <Check className="h-3.5 w-3.5" />
          Yes, that's right
        </button>
        <button
          onClick={onDeny}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Not quite
        </button>
      </div>
    </div>
  );
}

// ─── Station result card (after confirmed) ───────────────────────────────────

function StationResultCard({
  payload,
  onNavigate,
}: {
  payload: WorkflowPayload;
  onNavigate: () => void;
}) {
  if (!payload.confirmedStation) return null;
  const s = payload.confirmedStation;
  return (
    <div className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3 max-w-xs">
      <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
        <Check className="h-4 w-4" />
        Station confirmed
      </div>
      <div className="text-sm text-slate-700 space-y-0.5">
        <p><span className="font-medium">{s.name}</span> — {s.location}</p>
        <p className="text-xs text-slate-400">ID: {s.stationId}</p>
      </div>
      <button
        onClick={onNavigate}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Go to Stations page
      </button>
    </div>
  );
}

// ─── Make-order confirmation card ────────────────────────────────────────────

function MakeOrderConfirmCard({
  payload,
  onConfirm,
  onDeny,
  disabled,
}: {
  payload: WorkflowPayload;
  onConfirm: () => void;
  onDeny: () => void;
  disabled: boolean;
}) {
  const d = payload.orderDetails;
  if (!d) return null;
  return (
    <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3 max-w-xs">
      <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
        <ShoppingBag className="h-4 w-4" />
        Order details
      </div>
      <div className="text-sm text-slate-700 space-y-0.5">
        {d.location && (
          <p><span className="text-slate-400">Destination</span> <span className="font-medium">{d.location}</span></p>
        )}
        {d.ticketCount !== undefined && (
          <p><span className="text-slate-400">Tickets</span> <span className="font-medium">{d.ticketCount}</span></p>
        )}
        {d.itemOrEventName && (
          <p><span className="text-slate-400">Event/Trip</span> <span className="font-medium">{d.itemOrEventName}</span></p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white text-xs font-medium rounded-xl transition-colors"
        >
          <Check className="h-3.5 w-3.5" />
          Confirm order
        </button>
        <button
          onClick={onDeny}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Make-order result card (after confirmed) ────────────────────────────────

function MakeOrderResultCard({
  payload,
  onNavigate,
}: {
  payload: WorkflowPayload;
  onNavigate: () => void;
}) {
  if (!payload.success || !payload.orderId) return null;
  return (
    <div className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3 max-w-xs">
      <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
        <Check className="h-4 w-4" />
        Order placed
      </div>
      <p className="text-sm text-slate-700">
        Booking reference: <span className="font-mono font-semibold">{payload.orderId}</span>
      </p>
      <button
        onClick={onNavigate}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Go to My Orders
      </button>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isError,
  isAwaitingConfirm,
  onConfirm,
  onDeny,
  onNavigate,
  confirmDisabled,
}: {
  msg: ChatMessage;
  isError?: boolean;
  isAwaitingConfirm?: boolean;
  onConfirm?: () => void;
  onDeny?: () => void;
  onNavigate?: () => void;
  confirmDisabled?: boolean;
}) {
  const isBot = msg.role === 'bot';
  const wp = msg.workflow;
  const time = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
        {/* Text bubble */}
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

        {/* Workflow cards — only on bot messages with workflow payload */}
        {wp && isAwaitingConfirm && wp.status === 'AWAITING_CONFIRMATION' && wp.kind === 'station' && onConfirm && onDeny && (
          <StationConfirmCard
            payload={wp}
            onConfirm={onConfirm}
            onDeny={onDeny}
            disabled={confirmDisabled ?? false}
          />
        )}
        {wp && isAwaitingConfirm && wp.status === 'AWAITING_CONFIRMATION' && wp.kind === 'makeorder' && onConfirm && onDeny && (
          <MakeOrderConfirmCard
            payload={wp}
            onConfirm={onConfirm}
            onDeny={onDeny}
            disabled={confirmDisabled ?? false}
          />
        )}
        {wp && wp.status === 'COMPLETED' && wp.kind === 'station' && wp.success && onNavigate && (
          <StationResultCard payload={wp} onNavigate={onNavigate} />
        )}
        {wp && wp.status === 'COMPLETED' && wp.kind === 'makeorder' && wp.success && onNavigate && (
          <MakeOrderResultCard payload={wp} onNavigate={onNavigate} />
        )}

        <span className="text-[11px] text-gray-400 px-1">{time}</span>
      </div>
    </div>
  );
}

// ─── Suggestion chips ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { label: '🗺 Find a station', text: '/station Hanoi' },
  { label: '🎫 Book a trip', text: '/makeorder 2 tickets to Hanoi' },
  { label: '❓ How do I register?', text: 'How do I register?' },
  { label: '📦 Track my order', text: 'How do I view my orders?' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

type PendingConfirm = {
  msgId: string;
  kind: 'station' | 'makeorder';
  userId: string;
};

export function ChatbotPage() {
  const navigate = useNavigate();
  const auth = useAuthState();
  // Use auth userId; fall back to a stable anonymous id stored in sessionStorage
  const userId = (() => {
    const fromAuth =
      auth.user && 'customerId' in auth.user
        ? auth.user.customerId
        : auth.user && 'staffId' in auth.user
        ? auth.user.staffId
        : null;
    if (fromAuth) return fromAuth;
    let anon = sessionStorage.getItem('chatbot_anon_id');
    if (!anon) { anon = uid(); sessionStorage.setItem('chatbot_anon_id', anon); }
    return anon;
  })();

  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // ── core send ────────────────────────────────────────────────────────────────
  const dispatch = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || typing) return;

      setShowSuggestions(false);

      const userMsg: ChatMessage = {
        id: `user-${uid()}`,
        role: 'user',
        text: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      setTyping(true);

      try {
        let botMsg: ChatMessage;

        // 1. If we're mid-confirmation, route the reply to the right workflow
        if (pendingConfirm) {
          const { kind } = pendingConfirm;
          if (kind === 'station') {
            botMsg = await stationConfirm(userId, trimmed);
          } else {
            botMsg = await makeOrderConfirm(userId, trimmed);
          }
          // Clear pending regardless of what the user said
          setPendingConfirm(null);
        } else {
          // 2. Fresh message — detect command
          const mode = detectMode(trimmed);
          if (mode === 'station') {
            botMsg = await stationSearch(userId, trimmed);
            if (botMsg.workflow?.status === 'AWAITING_CONFIRMATION') {
              setPendingConfirm({ msgId: botMsg.id, kind: 'station', userId });
            }
          } else if (mode === 'makeorder') {
            botMsg = await makeOrderSearch(userId, trimmed);
            if (botMsg.workflow?.status === 'AWAITING_CONFIRMATION') {
              setPendingConfirm({ msgId: botMsg.id, kind: 'makeorder', userId });
            }
          } else {
            botMsg = await sendMessage(trimmed);
          }
        }

        setMessages((prev) => [...prev, botMsg]);
      } catch (err: unknown) {
        const errMsg: ChatMessage = {
          id: `err-${uid()}`,
          role: 'bot',
          text: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
          timestamp: new Date(),
        };
        setErrorIds((prev) => new Set(prev).add(errMsg.id));
        setMessages((prev) => [...prev, errMsg]);
        setPendingConfirm(null);
      } finally {
        setTyping(false);
      }
    },
    [typing, pendingConfirm, userId],
  );

  // ── card button handlers ─────────────────────────────────────────────────────
  async function handleCardConfirm(_kind: 'station' | 'makeorder') {
    await dispatch('yes');
  }
  async function handleCardDeny(_kind: 'station' | 'makeorder') {
    await dispatch('no');
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void dispatch(input);
    }
  }

  // Find the last bot message that is awaiting confirmation (to render its card)
  const lastPendingMsgId = pendingConfirm?.msgId ?? null;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 shrink-0">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
            Vaprise Assistant
            <span className="inline-flex items-center gap-1 text-xs font-normal text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Online
            </span>
            {pendingConfirm && (
              <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                {pendingConfirm.kind === 'station' ? <MapPin className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
                Awaiting your confirmation
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
            <Train className="h-3 w-3 shrink-0" />
            Use /station or /makeorder for AI-powered workflows
          </p>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg) => {
          const isThisPending = msg.id === lastPendingMsgId;
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isError={errorIds.has(msg.id)}
              isAwaitingConfirm={isThisPending}
              confirmDisabled={typing}
              onConfirm={isThisPending && pendingConfirm ? () => void handleCardConfirm(pendingConfirm.kind) : undefined}
              onDeny={isThisPending && pendingConfirm ? () => void handleCardDeny(pendingConfirm.kind) : undefined}
              onNavigate={
                msg.workflow?.status === 'COMPLETED' && msg.workflow.success
                  ? () => {
                      if (msg.workflow?.kind === 'station') {
                        navigate('/customer/stations');
                      } else {
                        navigate('/customer/orders');
                      }
                    }
                  : undefined
              }
            />
          );
        })}
        {typing && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggestion chips ── */}
      {showSuggestions && (
        <div className="flex flex-wrap gap-2 py-2 shrink-0">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.text}
              onClick={() => void dispatch(s.text)}
              disabled={typing}
              className="text-xs px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full transition-colors disabled:opacity-50"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="pt-3 border-t border-gray-200 shrink-0">
        <div className="flex items-end gap-2 bg-white border border-gray-300 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all shadow-sm">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            disabled={typing}
            placeholder={
              pendingConfirm
                ? 'Type "yes" to confirm or "no" to cancel…'
                : 'Ask me anything… (Enter to send, Shift+Enter for new line)'
            }
            className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent max-h-32 leading-relaxed disabled:opacity-50"
            style={{ minHeight: '24px' }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = `${t.scrollHeight}px`;
            }}
          />
          <button
            onClick={() => void dispatch(input)}
            disabled={!input.trim() || typing}
            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
        <p className="text-[11px] text-gray-400 text-center mt-1.5">
          Powered by Vaprise AI · /station and /makeorder for smart workflows
        </p>
      </div>
    </div>
  );
}
