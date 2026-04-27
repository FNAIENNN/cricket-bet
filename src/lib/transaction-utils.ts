// src/lib/transaction-utils.ts

export interface TransactionNotesData {
  userMessage?: string;
  payoutDetails?: {
    payoutMethod: string;
    accountName: string;
    accountNumber?: string;
    ifsc?: string;
    upiId?: string;
    bankName?: string;
  };
  redirectUrl?: string;
  adminDecision?: {
    action: string;
    notes?: string;
    processedBy?: string;
    processedAt?: string;
  };
}

export function parseTransactionNotes(notes: string | null): TransactionNotesData | null {
  if (!notes) return null;

  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(notes);
    return parsed as TransactionNotesData;
  } catch {
    // If not JSON, treat as plain text user message
    return {
      userMessage: notes,
    };
  }
}

export function formatTransactionNotes(data: TransactionNotesData): string {
  return JSON.stringify(data);
}

export function extractUpiId(text: string): string | null {
  const upiRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9]+/;
  const match = text.match(upiRegex);
  return match ? match[0] : null;
}

export function extractBankDetails(text: string): Partial<TransactionNotesData['payoutDetails']> {
  const details: any = {};
  
  // Extract account number
  const accountMatch = text.match(/account(?:\s+no|number)?[:\s]+(\d{9,18})/i);
  if (accountMatch) details.accountNumber = accountMatch[1];
  
  // Extract IFSC
  const ifscMatch = text.match(/ifsc[:\s]+([A-Za-z0-9]{11})/i);
  if (ifscMatch) details.ifsc = ifscMatch[1];
  
  // Extract UPI
  const upiMatch = extractUpiId(text);
  if (upiMatch) details.upiId = upiMatch;
  
  // Extract bank name
  const bankMatch = text.match(/bank[:\s]+([A-Za-z\s]+)/i);
  if (bankMatch) details.bankName = bankMatch[1].trim();
  
  return details;
}