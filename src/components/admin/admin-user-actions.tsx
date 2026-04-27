"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminUserActions({ userId, isActive }: { userId: string; isActive: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    const action = isActive ? "suspend" : "activate";
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this user?`)) return;
    setLoading(true);
    const res = await fetch(`/api/admin/users`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isActive: !isActive }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else alert("Failed to update user");
  }

  return (
    <button
      onClick={toggleActive}
      disabled={loading}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        isActive
          ? "bg-red-950 text-red-400 hover:bg-red-900 border border-red-800"
          : "bg-green-950 text-green-400 hover:bg-green-900 border border-green-800"
      }`}
    >
      {loading ? "…" : isActive ? "Suspend" : "Activate"}
    </button>
  );
}
