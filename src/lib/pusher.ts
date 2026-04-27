// src/lib/pusher.ts
import Pusher from "pusher";
import PusherJs from "pusher-js";

// Server-side Pusher (only used in API routes)
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher singleton
let pusherClient: PusherJs | null = null;

export function getPusherClient(): PusherJs {
  if (!pusherClient) {
    pusherClient = new PusherJs(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return pusherClient;
}

// Channel & event names (single source of truth)
export const PUSHER_CHANNELS = {
  matches: "matches",
  match: (id: string) => `match-${id}`,
  user: (id: string) => `private-user-${id}`,
};

export const PUSHER_EVENTS = {
  matchUpdated: "match-updated",
  matchLive: "match-live",
  tossDone: "toss-done",
  betSettled: "bet-settled",
  walletUpdated: "wallet-updated",
};
