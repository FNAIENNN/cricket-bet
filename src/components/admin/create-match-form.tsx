"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateMatchForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    teamA: "",
    teamB: "",
    venue: "",
    series: "",
    startTime: "",
    tossOdds: "1.95",
  });

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tossOdds: parseFloat(form.tossOdds),
        startTime: new Date(form.startTime).toISOString(),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      setForm({ title: "", teamA: "", teamB: "", venue: "", series: "", startTime: "", tossOdds: "1.95" });
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create match");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-brand-700 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-lg">+</span> Create New Match
      </button>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-white">New Match</h2>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-red-400 text-sm">{error}</div>
        )}

        <div>
          <label className="block text-xs text-gray-500 mb-1">Match Title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="India vs Australia - 1st T20I"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Team A *</label>
            <input
              required
              value={form.teamA}
              onChange={(e) => set("teamA", e.target.value)}
              placeholder="India"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Team B *</label>
            <input
              required
              value={form.teamB}
              onChange={(e) => set("teamB", e.target.value)}
              placeholder="Australia"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Start Time *</label>
          <input
            required
            type="datetime-local"
            value={form.startTime}
            onChange={(e) => set("startTime", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Venue</label>
            <input
              value={form.venue}
              onChange={(e) => set("venue", e.target.value)}
              placeholder="Wankhede, Mumbai"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Toss Odds</label>
            <input
              type="number"
              step="0.01"
              min="1"
              max="5"
              value={form.tossOdds}
              onChange={(e) => set("tossOdds", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Series / Tournament</label>
          <input
            value={form.series}
            onChange={(e) => set("series", e.target.value)}
            placeholder="IPL 2025"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {loading ? "Creating…" : "Create Match"}
          </button>
        </div>
      </form>
    </div>
  );
}
