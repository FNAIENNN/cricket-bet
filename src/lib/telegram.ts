// src/lib/telegram.ts

// --- CONFIGURATION ---
const YOUR_TELEGRAM_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_USERNAME || "admin";
const YOUR_PHONE_NUMBER = process.env.NEXT_PUBLIC_PHONE_NUMBER || "";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

// --- INTERFACES ---

export interface AdminDecisionData {
  action: "APPROVED" | "REJECTED" | "COMPLETED";
  notes?: string;
  processedBy?: string;
  processedAt?: string;
}

// Alias for compatibility with both naming conventions
export interface AdminDecision {
  action: "COMPLETED" | "REJECTED";
  notes?: string;
  processedBy?: string;
  processedAt?: string;
}

export interface TransactionNotificationData {
  transactionId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  type: "DEPOSIT" | "WITHDRAWAL";
  status: string;
  userMessage?: string;
  paymentDetails?: any;
}

// --- ADMIN UTILITIES (JSON Management for DB) ---

/**
 * Append admin decision to transaction notes (Stored in DB as JSON string)
 * Version 1: Using AdminDecisionData
 */
export function appendAdminDecisionData(
  currentNotes: string | null,
  decision: AdminDecisionData
): string {
  const notesObj: any = {};

  try {
    if (currentNotes) {
      const parsed = JSON.parse(currentNotes);
      Object.assign(notesObj, parsed);
    } else if (currentNotes && !currentNotes.startsWith("{")) {
      notesObj.userMessage = currentNotes;
    }
  } catch {
    if (currentNotes && !currentNotes.startsWith("{")) {
      notesObj.userMessage = currentNotes;
    }
  }

  notesObj.adminDecision = {
    action: decision.action,
    notes: decision.notes,
    processedBy: decision.processedBy,
    processedAt: decision.processedAt || new Date().toISOString(),
  };

  return JSON.stringify(notesObj);
}

/**
 * Append admin decision to transaction notes
 * Version 2: Using AdminDecision (compatible with your API route)
 */
export function appendAdminDecision(
  currentNotes: string | null,
  decision: AdminDecision
): string {
  let notesObj: any = {};
  
  try {
    // Try to parse existing notes as JSON
    if (currentNotes) {
      try {
        notesObj = JSON.parse(currentNotes);
      } catch {
        // If not valid JSON, treat as user message
        notesObj = { userMessage: currentNotes };
      }
    }
  } catch (error) {
    console.error("Error parsing notes:", error);
    notesObj = { userMessage: currentNotes };
  }
  
  // Add admin decision
  notesObj.adminDecision = {
    action: decision.action,
    notes: decision.notes,
    processedBy: decision.processedBy,
    processedAt: decision.processedAt || new Date().toISOString(),
  };
  
  return JSON.stringify(notesObj);
}

/**
 * Extract admin decision from transaction notes
 */
export function extractAdminDecision(notes: string | null): AdminDecisionData | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    return parsed.adminDecision || null;
  } catch {
    return null;
  }
}

/**
 * Create/Parse transaction notes for DB storage
 */
export function createTransactionNotes(data: {
  userMessage?: string;
  payoutDetails?: any;
  redirectUrl?: string;
}): string {
  return JSON.stringify(data);
}

/**
 * Parse transaction notes to extract user message and payment details
 */
export function parseTransactionNotes(notes: string | null): {
  userMessage?: string;
  payoutDetails?: any;
  redirectUrl?: string;
  adminDecision?: AdminDecisionData;
} | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    return {
      userMessage: parsed.userMessage,
      payoutDetails: parsed.payoutDetails,
      redirectUrl: parsed.redirectUrl,
      adminDecision: parsed.adminDecision,
    };
  } catch {
    return { userMessage: notes };
  }
}

// --- TELEGRAM NOTIFICATIONS (Automated Bot) ---

/**
 * Send notification to admin Telegram Bot for real-time alerts
 */
export async function notifyAdmin(
  transactionData: TransactionNotificationData
): Promise<void> {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.log("Telegram bot not configured, skipping admin notification");
    return;
  }

  try {
    const isDeposit = transactionData.type === "DEPOSIT";
    const emoji = isDeposit ? "💰" : "🏦";
    
    // Format bank details for the bot message if it's a withdrawal
    let extraDetails = "";
    if (!isDeposit && transactionData.paymentDetails) {
      const d = transactionData.paymentDetails;
      extraDetails = `\n🏦 *Bank Details:*\n• Name: ${d.accountName}\n• Acc: ${d.accountNumber}\n• IFSC: ${d.ifsc}${d.upiId ? `\n• UPI: ${d.upiId}` : ""}`;
    }

    const message = `
${emoji} *NEW ${transactionData.type} REQUEST* ${emoji}

👤 *User:* ${transactionData.userName || "Unknown"}
📧 *Email:* ${transactionData.userEmail || "N/A"}
💵 *Amount:* ₹${transactionData.amount.toLocaleString()}
🆔 *Tx ID:* ${transactionData.transactionId}
⏳ *Status:* ${transactionData.status}
${extraDetails}
${transactionData.userMessage ? `\n💬 *Message:* ${transactionData.userMessage}` : ""}

Please process this in the Admin Panel.
    `.trim();

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
  }
}

// --- DEEP LINK GENERATORS (User Interactions) ---

export function getTelegramContactLink(message: string): string {
  return `https://t.me/${YOUR_TELEGRAM_USERNAME}?text=${encodeURIComponent(message)}`;
}

export function getTelegramDepositLink(amount: number, transactionId: string): string {
  const message = `💰 *New Deposit Request*\n\n🔹 *Amount:* ₹${amount}\n🔹 *Transaction ID:* ${transactionId}\n\nI have sent the payment. Please verify my screenshot.`;
  return getTelegramContactLink(message);
}

export function getTelegramWithdrawLink(amount: number, transactionId: string, bankDetails: any): string {
  const message = `🏦 *New Withdrawal Request*\n\n🔹 *Amount:* ₹${amount}\n🔹 *Transaction ID:* ${transactionId}\n🔹 *Bank:* ${bankDetails.accountName}`;
  return getTelegramContactLink(message);
}

// --- MESSAGE FORMATTERS (For the UI Component) ---

/**
 * Formats the detailed message that the user will send to the admin on Telegram
 */
export function getDepositMessage(amount: number, transactionId: string, userName: string): string {
  return `
💰 *DEPOSIT REQUEST* 💰
━━━━━━━━━━━━━━━━━━━
📋 *Details*
• *User:* ${userName}
• *Amount:* ₹${amount.toLocaleString()}
• *ID:* ${transactionId}
━━━━━━━━━━━━━━━━━━━
💳 *Admin UPI:* ${YOUR_PHONE_NUMBER}@okhdfcbank
━━━━━━━━━━━━━━━━━━━
_Please attach your payment screenshot below._
  `.trim();
}

/**
 * Formats the withdrawal request details for the Telegram redirect
 */
export function getWithdrawalMessage(amount: number, transactionId: string, userName: string, bankDetails: any): string {
  return `
🏦 *WITHDRAWAL REQUEST* 🏦
━━━━━━━━━━━━━━━━━━━
📋 *Details*
• *User:* ${userName}
• *Amount:* ₹${amount.toLocaleString()}
• *ID:* ${transactionId}
━━━━━━━━━━━━━━━━━━━
🏦 *Bank:* ${bankDetails.accountName}
🏦 *Acc:* ${bankDetails.accountNumber}
🏦 *IFSC:* ${bankDetails.ifsc}
━━━━━━━━━━━━━━━━━━━
_Requesting processing of my funds._
  `.trim();
}

// --- UI HELPERS ---

export function generateUPIQrCode(amount: number, transactionId: string): string {
  if (!YOUR_PHONE_NUMBER) return '';
  const upiUrl = `upi://pay?pa=${YOUR_PHONE_NUMBER}@okhdfcbank&pn=CricketBet&am=${amount}&tn=Deposit_${transactionId}&cu=INR`;
  return `https://quickchart.io/qr?text=${encodeURIComponent(upiUrl)}&size=200`;
}

export function redirectToTelegram(message: string): void {
  if (typeof window !== 'undefined') {
    window.location.href = getTelegramContactLink(message);
  }
}