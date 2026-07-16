/**
 * Chatbot service — rule-based local engine.
 *
 * The public API is intentionally shaped like a real async API call:
 *   sendMessage(text, history) => Promise<ChatMessage>
 *
 * When the backend AI endpoint is ready, replace only the body of
 * `callBackend` and export the same `sendMessage` signature — zero
 * changes required in the UI layer.
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
  suggestions?: string[];
}

// ─── Knowledge base ──────────────────────────────────────────────────────────

interface Rule {
  patterns: RegExp[];
  response: string;
  suggestions?: string[];
}

const RULES: Rule[] = [
  // Greetings
  {
    patterns: [/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))/i],
    response:
      'Hello! 👋 I\'m the Vaprise Railway assistant. I can help you with booking tickets, managing orders, account settings, and more.\n\nWhat would you like to know?',
    suggestions: [
      'How do I book a ticket?',
      'How do I cancel a ticket?',
      'What is Vaprise?',
    ],
  },

  // What is Vaprise
  {
    patterns: [/what is vaprise|about (this|the) (app|website|system|platform)/i],
    response:
      'Vaprise is a railway management platform for Vaprise Station. It lets passengers browse upcoming trips, book seats, manage their orders and tickets, and give feedback — all in one place.\n\nStaff members use a separate portal to approve orders, manage trips, stations, shifts, and seat classes.',
    suggestions: ['How do I register?', 'How do I browse trips?'],
  },

  // Register
  {
    patterns: [/(how (do i|to)|create|sign up|register).*(account|register|sign up)/i, /register/i],
    response:
      '**To create an account:**\n1. Click **"Register"** on the login page\n2. Fill in your **ID**, **full name**, **email**, **phone**, and a **password** (min. 8 characters)\n3. Submit the form — you\'ll be redirected to the login page\n\n⚠️ Your ID and email must be unique. If you see a conflict error, the account already exists.',
    suggestions: ['How do I log in?', 'I forgot my password'],
  },

  // Login
  {
    patterns: [/(how (do i|to)|sign in|log in|login).*(login|sign in|account)/i, /^log ?in/i],
    response:
      '**To log in as a customer:**\n1. Go to the **Login** page\n2. Enter your **Customer ID**, **email**, and **password**\n3. Click **"Sign in"**\n\nIf you\'re staff, use the **Staff login** link at the bottom of the page.',
    suggestions: ['I forgot my password', 'How do I register?'],
  },

  // Forgot password
  {
    patterns: [/forgot.*(password|pass)|reset.*(password|pass)|change.*password/i],
    response:
      '**Forgot your password?**\n1. Click **"Forgot your password?"** on the login page\n2. Enter your **email address** — we\'ll send a 6-digit code\n3. Enter the code from your email\n4. Set a new password (min. 8 characters)\n\nThe code expires in **10 minutes**. Check your spam folder if you don\'t see it.',
    suggestions: ['How do I log in?', 'How do I update my profile?'],
  },

  // Browse trips
  {
    patterns: [/(browse|view|see|find|search|look).*(trip|train|schedule|route)/i, /^trips?$/i],
    response:
      '**Browsing trips:**\n1. Go to the **Trips** page from the top navigation\n2. All upcoming trips are listed with their route (track) and arrival date\n3. Use the **search bar** to filter by station name\n4. Click any trip card to see the **seat map** and available seats\n\nSeats are colour-coded:\n🟢 **Green** — Available\n⬛ **Gray** — Booked\n🔴 **Red** — Unavailable',
    suggestions: ['How do I book a ticket?', 'What are seat classes?'],
  },

  // Seat classes
  {
    patterns: [/seat (class|type|tier)|class.*seat|economy|business/i],
    response:
      'Each trip has seats grouped into **seat classes** (e.g. Economy, Business). Classes differ in price and comfort level.\n\nWhen viewing a trip\'s seat map, seats are grouped by class with the price shown for each group. Simply click an available seat to select it.',
    suggestions: ['How do I book a ticket?', 'How do I browse trips?'],
  },

  // Book / make order
  {
    patterns: [/(how (do i|to)|make|place|create|buy).*(order|ticket|book|seat)/i, /^book(ing)?/i],
    response:
      '**Booking tickets:**\n1. Open a trip from the **Trips** page\n2. Click the seats you want on the seat map (they turn blue when selected)\n3. Click **"Book Selected Seats"**\n4. For each seat, enter the **passenger name** and **CCCD/ID number**\n5. Choose a **payment method**\n6. Click **"Confirm Order"** — a loading spinner will show while your order is processed\n\n✅ Your order starts as **Pending** and becomes **Confirmed** once a staff member approves it.',
    suggestions: [
      'How do I view my orders?',
      'Can I cancel a ticket?',
      'Can I change a ticket?',
    ],
  },

  // View orders
  {
    patterns: [/(view|see|check|my).*(order|booking)/i, /^orders?$/i],
    response:
      '**Viewing your orders:**\n1. Click **"My Orders"** in the top navigation\n2. All your orders are listed with their status badge:\n   - 🟡 **Pending** — waiting for staff approval\n   - 🟢 **Confirmed** — approved and active\n   - 🔴 **Denied** — rejected by staff\n3. Click any order to see its full details, including tickets and payment info',
    suggestions: ['Can I cancel a ticket?', 'Can I change a ticket?'],
  },

  // Cancel ticket
  {
    patterns: [/(cancel|void|remove).*(ticket|seat)/i],
    response:
      '**Cancelling a ticket:**\n1. Open the order containing the ticket (**My Orders → Order detail**)\n2. Find the ticket you want to cancel\n3. Click the **"Cancel"** button on that ticket\n\n⚠️ Cancellation is permanent. The seat will become available again for other passengers. The ticket status changes to **Cancelled** — the order itself remains.',
    suggestions: ['Can I change a ticket instead?', 'How do I view my orders?'],
  },

  // Change ticket
  {
    patterns: [/(change|update|modify|switch).*(ticket|seat|passenger)/i],
    response:
      '**Changing a ticket:**\n1. Open the order detail page\n2. Click **"Change"** on a ticket\n3. Select a **new seat** from the same trip\n4. Update the **passenger name** and **CCCD** if needed\n5. Confirm the change\n\n✅ The old seat is freed and the new seat is reserved automatically.',
    suggestions: ['Can I cancel a ticket instead?', 'How do I view my orders?'],
  },

  // Feedback
  {
    patterns: [/(feedback|review|comment|report)/i],
    response:
      '**Submitting feedback:**\n1. Click **"Feedback"** in the top navigation\n2. Type your message in the text area\n3. Click **"Submit"**\n\nYour previous feedback entries are shown below the form, sorted by date. Feedback helps improve the Vaprise service!',
    suggestions: ['How do I update my profile?'],
  },

  // Profile / account
  {
    patterns: [/(profile|account|personal|my info|update.*(name|phone|info))/i],
    response:
      '**Updating your profile:**\n1. Click **"Profile"** in the top navigation\n2. Click **"Edit"** next to your account info\n3. Update your **full name** or **phone number** (email and ID cannot be changed)\n4. Click **"Save"**\n\nFor password changes, use the **"Change Password"** section at the bottom of the profile page.',
    suggestions: ['How do I change my password?', 'I forgot my password'],
  },

  // Points / rank
  {
    patterns: [/(point|rank|loyalty|reward)/i],
    response:
      'Your **loyalty points and rank** are shown on your Profile page in the stats block. Points are awarded through bookings and activity. Your rank increases as you accumulate more points.\n\nCheck the **Profile → Loyalty** block to see your current rank and point total.',
    suggestions: ['How do I view my profile?', 'How do I book a ticket?'],
  },

  // Staff — approve orders
  {
    patterns: [/(staff|approve|confirm|deny|reject).*(order)/i],
    response:
      '**For staff — approving orders:**\n1. Log in through the **Staff login** page\n2. Go to **Orders** in the staff portal\n3. Pending orders are listed with customer and ticket details\n4. Click **"Confirm"** to approve or **"Deny"** to reject\n\n✅ The order status updates immediately and the customer can see the change.',
    suggestions: ['How does staff login work?'],
  },

  // Staff login
  {
    patterns: [/staff.*(login|sign in)|login.*staff/i],
    response:
      '**Staff login:**\n1. Click **"Staff login"** on the customer login page\n2. Enter your **Staff ID**, **email**, and **password**\n3. You\'ll be taken to the Staff portal\n\nStaff accounts are created by administrators — you cannot self-register as staff.',
    suggestions: ['What can staff do?'],
  },

  // Payment
  {
    patterns: [/(pay|payment|method|how (do i|to) pay)/i],
    response:
      '**Payment methods** are set up by station administrators and shown as a dropdown when you create an order. Select your preferred method before confirming.\n\nPayment details (method and total price) are shown on the Order detail page after booking.',
    suggestions: ['How do I book a ticket?'],
  },

  // Help / what can you do
  {
    patterns: [/(help|what can you (do|help)|support|assist|guide)/i, /^help$/i],
    response:
      'I can help you with:\n\n🎫 **Booking** — finding trips, selecting seats, placing orders\n📦 **Orders** — viewing, cancelling, or changing tickets\n👤 **Account** — registration, login, profile updates, password reset\n💬 **Feedback** — how to submit and view your feedback\n🛡️ **Staff** — approving orders, managing trips and shifts\n\nJust ask me anything!',
    suggestions: [
      'How do I book a ticket?',
      'How do I cancel a ticket?',
      'How do I register?',
    ],
  },

  // Thank you
  {
    patterns: [/^(thanks?|thank you|thx|ty|cheers|great|awesome|perfect)/i],
    response:
      "You're welcome! 😊 Is there anything else I can help you with?",
    suggestions: ['How do I book a ticket?', 'How do I view my orders?'],
  },

  // Goodbye
  {
    patterns: [/^(bye|goodbye|see you|cya|exit|quit)/i],
    response: 'Goodbye! Have a great journey with Vaprise Railway! 🚂',
    suggestions: [],
  },
];

const FALLBACK: Pick<Rule, 'response' | 'suggestions'> = {
  response:
    "I'm not sure I understand. Could you rephrase?\n\nHere are some things I can help with:",
  suggestions: [
    'How do I book a ticket?',
    'How do I cancel a ticket?',
    'I forgot my password',
    'What is Vaprise?',
  ],
};

// ─── Local engine ─────────────────────────────────────────────────────────────

function matchLocal(text: string): Pick<Rule, 'response' | 'suggestions'> {
  const trimmed = text.trim();
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(trimmed))) {
      return { response: rule.response, suggestions: rule.suggestions };
    }
  }
  return FALLBACK;
}

// ─── Backend stub ─────────────────────────────────────────────────────────────
// Replace this function body with a real API call when the backend is ready.
// Expected contract:
//   POST /chat  { message: string, history: { role, text }[] }
//   → { reply: string, suggestions?: string[] }

async function callBackend(
  _message: string,
  _history: ChatMessage[],
): Promise<Pick<Rule, 'response' | 'suggestions'>> {
  // TODO: replace with:
  //   const { data } = await axios.post('/chat', { message: _message, history: _history });
  //   return { response: data.reply, suggestions: data.suggestions };
  throw new Error('Backend not connected yet');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a user message and receive a bot reply.
 * Falls back to the local rule engine when the backend is unavailable.
 */
export async function sendMessage(
  text: string,
  history: ChatMessage[],
): Promise<ChatMessage> {
  let result: Pick<Rule, 'response' | 'suggestions'>;

  try {
    result = await callBackend(text, history);
  } catch {
    // Backend not connected — use local engine
    result = matchLocal(text);
  }

  return {
    id: `bot-${Date.now()}`,
    role: 'bot',
    text: result.response ?? '',
    timestamp: new Date(),
    suggestions: result.suggestions,
  };
}

export const GREETING: ChatMessage = {
  id: 'bot-greeting',
  role: 'bot',
  text: 'Hi there! 👋 I\'m your Vaprise Railway assistant. I can help you with bookings, tickets, account settings, and anything else on this platform.\n\nWhat would you like to know?',
  timestamp: new Date(),
  suggestions: [
    'How do I book a ticket?',
    'How do I register?',
    'What is Vaprise?',
    'Help',
  ],
};
