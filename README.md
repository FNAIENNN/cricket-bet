# 🏏 CricketBet — Toss Betting Platform

Full-stack MVP: Next.js 15 · Prisma · PostgreSQL · Telegram · Pusher · PWA

---

## ✅ What's Built

### User App (PWA)
| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Redirects to matches or admin |
| Login | `/login` | Email/password + Google OAuth |
| Register | `/register` | Creates account + wallet |
| Matches | `/matches` | List live/upcoming matches, filter by status |
| Match Detail | `/matches/[id]` | Full toss bet placement UI |
| My Bets | `/bets` | Bet history with P&L stats |
| Wallet | `/wallet` | Balance, Telegram deposit, Telegram withdraw request |
| Profile | `/profile` | Stats, KYC status, responsible gaming |

### Admin Panel
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/admin/dashboard` | Revenue, stats, recent bets, new users |
| Matches | `/admin/matches` | Create/manage matches, set toss winner, settle bets |
| Users | `/admin/users` | View all users, suspend/activate accounts |
| Payments | `/admin/payments` | Approve/reject withdrawal requests |

### API Routes
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | User registration |
| GET/POST | `/api/user/wallet` | Balance + Telegram deposit request |
| POST | `/api/user/wallet/withdraw` | Withdrawal request |
| GET/POST | `/api/user/bets` | Bet history + place bet |
| PATCH | `/api/user/profile` | Self-exclusion, settings |
| GET | `/api/matches` | List matches |
| GET | `/api/matches/[id]` | Single match |
| GET/POST | `/api/admin/matches` | Admin: list + create matches |
| GET/PATCH/DELETE | `/api/admin/matches/[id]` | Admin: update + settle + delete |
| GET/PATCH | `/api/admin/users` | Admin: manage users |
| GET/PATCH | `/api/admin/payments` | Admin: approve/reject withdrawals |
| GET | `/api/admin/dashboard` | Admin: stats |

---

## 🚀 Setup Guide

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase free tier recommended)
- Pusher account (free sandbox)

### 2. Clone & Install
```bash
git clone <your-repo>
cd cricket-bet
npm install
```

### 3. Environment Variables
```bash
cp .env.example .env.local
```
Fill in all values. Minimum required to start:
```
DATABASE_URL=postgresql://...
AUTH_SECRET=any-32-char-random-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_TELEGRAM_USERNAME=CRICKETBET_BOOK
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=ap2
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=ap2
```

### 4. Database Setup
```bash
npx prisma db push        # creates all tables
npx prisma db seed        # seeds admin user + test data
```

Seed creates:
- Admin: `admin@cricketbet.com` / `admin123`
- User: `test@example.com` / `user123` (₹1000 starting balance)
- 3 sample matches

### 5. Run Dev Server
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🏗️ Architecture

```
cricket-bet/
├── prisma/
│   ├── schema.prisma        # Data models
│   └── seed.ts              # Test data
├── src/
│   ├── app/
│   │   ├── (user pages)     # matches, bets, wallet, profile
│   │   ├── admin/           # dashboard, matches, users, payments
│   │   ├── api/             # all API routes
│   │   ├── login/           # auth pages
│   │   └── register/
│   ├── components/
│   │   ├── admin/           # AdminMatchCard, CreateMatchForm, etc.
│   │   ├── auth/            # LoginForm, RegisterForm
│   │   ├── providers/       # SessionProvider
│   │   ├── ui/              # Badge, Toaster
│   │   └── user/            # MatchCard, BetPlacement, WalletActions, etc.
│   ├── lib/
│   │   ├── auth.ts          # NextAuth config
│   │   ├── prisma.ts        # DB client singleton
│   │   ├── pusher.ts        # Real-time client/server
│   │   ├── settlement.ts    # 🔑 Bet settlement engine
│   │   ├── telegram.ts      # Telegram payment helper
│   │   └── utils.ts         # Formatting helpers
│   └── middleware.ts        # Route protection
└── public/
    └── manifest.json        # PWA config
```

### Key Business Logic — `src/lib/settlement.ts`
When admin marks toss winner → `settleBets()` runs atomically:
1. Finds all PENDING bets for the match
2. For each bet: marks WON/LOST, credits winner wallets
3. Creates transaction records
4. Fires Pusher events to update UIs in real time

---

## 🚢 Deployment (Vercel + Supabase)

### Supabase
1. Create project at supabase.com
2. Go to Settings → Database → Connection string (URI mode)
3. Copy to `DATABASE_URL`

### Vercel
```bash
npm i -g vercel
vercel --prod
```
Add all env vars in Vercel dashboard → Settings → Environment Variables.

After deploy:
```bash
# Run migrations on prod DB
DATABASE_URL=<prod_url> npx prisma db push
DATABASE_URL=<prod_url> npx prisma db seed
```

---

## 🔮 Phase 2 — What to Build Next

| Feature | Effort | Notes |
|---------|--------|-------|
| **KYC verification** | Medium | Integrate Digilocker / Aadhaar API or manual upload |
| **More bet markets** | Low | Add "Man of Match", "First Wicket", etc. — extend `Bet` model with `market` field |
| **Live odds** | Medium | Make `tossOdds` dynamic, pull from odds API or set manually |
| **UPI payments** | Medium | Integrate Razorpay or PayU instead of the current Telegram/manual flow |
| **Pusher live odds** | Low | Already wired — push odds changes from admin |
| **Mobile app** | Medium | Add Capacitor to wrap the Next.js PWA into native iOS/Android |
| **Referral system** | Low | Add `referredBy` to User, bonus on first deposit |
| **Bonus wallet** | Medium | Separate bonus balance with wagering requirements |
| **Audit log** | Low | Log every admin action to a separate table |
| **Email notifications** | Low | Resend/SendGrid for bet settlement, deposit confirmation |
| **Multi-market per match** | Medium | Refactor Bet to have a `market` + `matchMarket` table |
| **Responsible gaming AI** | High | Flag unusual betting patterns, send intervention emails |

### Schema changes needed for Phase 2:
```prisma
// Add to Bet model for multi-market:
model BetMarket {
  id        String   @id
  matchId   String
  name      String   // "toss" | "match_winner" | "top_scorer"
  options   Json     // [{ key: "teamA", label: "India", odds: 1.95 }]
  status    String   // OPEN | CLOSED | SETTLED
  result    String?  // winning option key
}

// Add to User for referrals:
referralCode String? @unique
referredBy   String? // userId
```

---

## 🛡️ Responsible Gaming
- ✅ Self-exclusion (1d / 7d / 30d / 180d / permanent)
- ✅ Deposit limits (admin can set per-user)
- ✅ Account suspension by admin
- ✅ 18+ declaration on register
- ⬜ Bet loss limits (Phase 2)
- ⬜ Session time reminders (Phase 2)
- ⬜ Pattern detection (Phase 2)

---

## 🔐 Security Notes
- Passwords hashed with bcrypt (12 rounds)
- All admin routes protected by middleware + session role check
- Bet placement validates: balance, match status, duplicate bets, self-exclusion
- Withdrawal funds deducted atomically on request (no double-spend)
- Settlement runs in a Prisma `$transaction` (atomic)

---

## 📞 Support Flow (Manual MVP)
1. Deposit issues → Check Telegram confirmation and admin payment status
2. Withdrawal requests → Admin panel → Payments tab → Approve/Reject
3. KYC → Manual process, admin sets `kycStatus` via Prisma Studio or future UI
4. Self-exclusion appeals → Email support only
