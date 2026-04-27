"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, AlertCircle, Loader2 } from "lucide-react";

interface PaymentActionsProps {
  transactionId: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  amount?: number;
  userId?: string;
}

export function PaymentActions({ transactionId, type, amount, userId }: PaymentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [action, setAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleAction = async (actionType: "APPROVE" | "REJECT") => {
    setLoading(true);
    setError("");
    
    try {
      // Validate required fields
      if (!transactionId) {
        throw new Error("Transaction ID is missing");
      }

      // Prepare the request body
      const requestBody = {
        transactionId,
        action: actionType,
        notes: notes.trim() || undefined,
        type,
        amount,
        userId,
      };

      console.log("Sending request:", requestBody); // Debug log

      const response = await fetch("/api/admin/transactions/process", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Parse response
      let data;
      const responseText = await response.text();
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response:", responseText);
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `Failed to ${actionType.toLowerCase()} transaction`);
      }

      // Success - refresh the page
      router.refresh();
      
      // Close modal and reset form
      setShowConfirm(false);
      setAction(null);
      setNotes("");
      
      // Optional: Show success toast/notification
      console.log(`Transaction ${actionType.toLowerCase()}d successfully`);
      
    } catch (err: any) {
      console.error("Error processing transaction:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openConfirm = (actionType: "APPROVE" | "REJECT") => {
    setAction(actionType);
    setShowConfirm(true);
    setError("");
  };

  const cancelConfirm = () => {
    setShowConfirm(false);
    setAction(null);
    setNotes("");
    setError("");
  };

  // Don't show actions if already processed
  if (showConfirm) {
    return (
      <div className="mt-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Admin Notes (Optional)
          </label>
          <textarea
            placeholder="Add notes about this transaction..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
            disabled={loading}
          />
        </div>
        
        {error && (
          <div className="flex items-center gap-2 p-2 text-sm text-red-400 bg-red-950/20 border border-red-800/50 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={() => handleAction(action as "APPROVE" | "REJECT")}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              action === "APPROVE"
                ? "bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                : "bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : action === "APPROVE" ? (
              <>
                <Check className="w-4 h-4" />
                Confirm Approve
              </>
            ) : (
              <>
                <X className="w-4 h-4" />
                Confirm Reject
              </>
            )}
          </button>
          
          <button
            onClick={cancelConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 mt-2">
      <button
        onClick={() => openConfirm("APPROVE")}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-all flex items-center gap-1 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        <Check className="w-3 h-3" />
        Approve
      </button>
      <button
        onClick={() => openConfirm("REJECT")}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-1 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        <X className="w-3 h-3" />
        Reject
      </button>
    </div>
  );
}