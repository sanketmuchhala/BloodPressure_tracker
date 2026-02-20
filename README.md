# Gaurav Blood Pressure Tracker

A personal, mobile-first blood pressure logging web app built for one user. Log readings individually or in sessions, view a live BP trend chart, and get daily health insights — all in **Gujarati** or **English** with an instant language toggle.

---

## Features

| Feature | Details |
|---|---|
| 📱 **Mobile-First** | Designed for iPhone / Android browsers; large tap targets throughout |
| 🌐 **Bilingual** | Gujarati (default) and English; switches instantly without reloading |
| 📊 **BP Trend Chart** | Interactive line chart — Today / 5 Days / 10 Days / 30 Days views |
| 🏷️ **AHA Category Badges** | Every reading is automatically classified: Normal → Elevated → Stage 1 → Stage 2 → Crisis |
| 📋 **Session Mode** | Enter 2–10 readings, see a live running average, save as one averaged session |
| 💡 **Daily Insights** | Today's status, trend vs yesterday, logging streak, time-of-day pattern |
| 🔒 **PIN Auth** | Simple local-pin authentication — no email links or passwords to manage |
| 🗑️ **Swipe to Delete** | Swipe left on any reading card to reveal a delete button (mobile) |
| ⚡ **Fast** | Vite + React; sub-second loads |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend framework | Vite + React 18 |
| Styling | Tailwind CSS |
| Backend / Database | Supabase (PostgreSQL) |
| Auth | PIN-based (localStorage) + Supabase anon key |
| Charting | Recharts |
| Icons | Heroicons |
| Routing | React Router v6 |

---

## How It Works

### Authentication

This is a **single-user app**. Authentication is PIN-based and entirely client-side:

1. A hardcoded `SINGLE_USER_ID` (`00000000-0000-0000-0000-000000000001`) is used for all database rows.
2. Supabase RLS policies allow this fixed ID to read/write its own data without Supabase Auth being active.
3. The login page simply verifies a PIN and sets `localStorage.authenticated = 'true'`.
4. `ProtectedRoute` checks this flag on every protected page load.

> **Note**: This design is intentional for personal use. It avoids email magic-link friction while keeping data off the device.

### Entry Flow

1. Open the **Entry** tab (default page).
2. Enter **Systolic**, **Diastolic**, and **Pulse** values.
3. Click **+ Add Reading** to queue additional readings in the same session.
4. A live **Running Average** card with AHA category badge appears as you add readings.
5. Click **Save to Log** — all readings are saved atomically:
   - Individual readings → `bp_logs` table (with `session_id` foreign key).
   - Averaged values → `bp_sessions` table.

### Logs / History

The **Logs** tab shows:
- **Insights card** — today's AHA category, trend vs yesterday, streak, and usual logging time.
- **BP Trend Chart** — interactive Recharts line graph.
- **Session cards** — each session shows its averaged reading with an AHA badge; tap "Show Readings" to expand individual entries.
- **Single readings** — non-session entries shown as individual cards with swipe-to-delete.

### Language Toggle

Click **En / ગુ** in the navigation bar. Language state lives in a **React Context** (`LangContext`) that wraps the entire app — all components update instantly with no remount or navigation required.

### AHA Blood Pressure Classification

| Category | Systolic | | Diastolic | Badge colour |
|---|---|---|---|---|
| Normal | < 120 | and | < 80 | 🟢 Green |
| Elevated | 120–129 | and | < 80 | 🟡 Yellow |
| High BP Stage 1 | 130–139 | or | 80–89 | 🟠 Orange |
| High BP Stage 2 | ≥ 140 | or | ≥ 90 | 🔴 Red |
| Hypertensive Crisis | > 180 | or | > 120 | 🔴 Dark Red |

---

## Project Structure

```
BloodPressure_tracker/
├── src/
│   ├── App.jsx                  # Root — wraps app in LangProvider + BrowserRouter
│   ├── main.jsx                 # Vite entry point
│   ├── index.css                # Global CSS / Tailwind base
│   │
│   ├── pages/
│   │   ├── Login.jsx            # PIN login screen
│   │   ├── Entry.jsx            # New reading entry (session or single)
│   │   └── Logs.jsx             # History — insights + chart + cards
│   │
│   ├── components/
│   │   ├── Layout.jsx           # Sticky header + content wrapper
│   │   ├── Navigation.jsx       # Tab bar + language toggle + logout
│   │   ├── ProtectedRoute.jsx   # Auth gate (PIN check)
│   │   ├── BPChart.jsx          # Recharts trend chart
│   │   ├── InsightsCard.jsx     # Daily insights (category, trend, streak)
│   │   ├── SessionCard.jsx      # Session summary + expandable readings
│   │   ├── ImageModal.jsx       # Full-screen photo viewer (unused in current UI)
│   │   └── SessionEntry.jsx     # Legacy component (kept for reference)
│   │
│   ├── i18n/
│   │   ├── LangContext.jsx      # React Context — single shared language state
│   │   ├── useLang.js           # Re-exports useLang() + LangProvider from context
│   │   └── strings.js           # All UI strings in Gujarati (gu) and English (en)
│   │
│   └── utils/
│       ├── supabase.js          # Supabase client + SINGLE_USER_ID constant
│       ├── bpCategory.js        # getBPCategory() + getBPCategoryLabeled() — AHA classification
│       ├── sessionHelpers.js    # calculateAverages() + saveSession() + fetchSessions()
│       ├── imageCompression.js  # Client-side image compression helper
│       └── ocr.js               # Tesseract.js OCR parser (not exposed in current UI)
│
├── supabase/
│   ├── migration.sql            # Initial schema — bp_logs table + RLS
│   ├── sessions-migration.sql   # bp_sessions table + session_id on bp_logs
│   ├── fix-foreign-key.sql      # Patched foreign key constraints
│   ├── fix-rls-policies.sql     # RLS policy corrections for single-user setup
│   └── storage-policy.sql       # Storage bucket policies for bp-photos
│
├── .env                         # Local environment variables (not committed)
├── .env.example                 # Template for required env vars
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## Database Schema

### `bp_logs`
Stores individual BP readings. Single readings (not part of a session) have `session_id = NULL`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | Always `SINGLE_USER_ID` |
| `reading_at` | TIMESTAMPTZ | When the reading was taken |
| `systolic` | INTEGER | 50–250 mmHg |
| `diastolic` | INTEGER | 30–150 mmHg |
| `pulse` | INTEGER | 30–200 bpm |
| `photo_path` | TEXT | Optional path in `bp-photos` storage bucket |
| `session_id` | UUID | Foreign key → `bp_sessions.id` (nullable) |
| `created_at` | TIMESTAMPTZ | Row created timestamp |

### `bp_sessions`
Stores averaged readings from a multi-reading session.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | Always `SINGLE_USER_ID` |
| `session_at` | TIMESTAMPTZ | When the session was recorded |
| `reading_count` | INTEGER | Number of readings averaged (1–10) |
| `avg_systolic` | INTEGER | Rounded average |
| `avg_diastolic` | INTEGER | Rounded average |
| `avg_pulse` | INTEGER | Rounded average |
| `photo_path` | TEXT | Optional photo |
| `created_at` | TIMESTAMPTZ | Row created timestamp |

---

## Local Development

### Prerequisites

- Node.js ≥ 18
- npm
- A [Supabase](https://supabase.com) project (free tier is fine)

### 1. Install dependencies

```bash
cd BloodPressure_tracker
npm install
```

### 2. Set up Supabase

#### a. Run database migrations

In the **Supabase dashboard → SQL Editor**, run these files in order:

```
supabase/migration.sql          # Creates bp_logs table + RLS
supabase/sessions-migration.sql # Creates bp_sessions table
supabase/fix-foreign-key.sql    # Patches FK constraints
supabase/fix-rls-policies.sql   # Fixes RLS for single-user setup
```

#### b. Set up storage bucket

1. Go to **Storage** → **New bucket**
2. Name: `bp-photos` · Public: **No** · File size limit: 5 MB
3. Allowed types: `image/jpeg, image/jpg, image/png`
4. In **SQL Editor**, run `supabase/storage-policy.sql`

#### c. Get API credentials

**Settings → API** → copy:
- **Project URL** (`https://xxxxx.supabase.co`)
- **anon/public** key

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Start the dev server

```bash
npm run dev
```

App runs at **`http://localhost:5174`** (or next available port).

To test on mobile, connect your phone to the same Wi-Fi network and open the `Network` URL printed in the terminal (e.g. `http://192.168.x.x:5174`).

---

## Building for Production

```bash
npm run build      # Outputs to /dist
npm run preview    # Preview production build locally
```

Deploy the `/dist` folder to any static host:

| Host | Notes |
|---|---|
| **Vercel** | `vercel` CLI or connect GitHub repo — add env vars in dashboard |
| **Netlify** | `netlify deploy` CLI — add env vars under Site settings |
| **Cloudflare Pages** | Connect GitHub — build command `npm run build`, output dir `dist` |

---

## Adding Translations

1. Open `src/i18n/strings.js`
2. Add the new key to **both** the `gu` and `en` objects
3. Use `t('your.new.key')` in any component — it picks up the active language automatically

For AHA category label translations, the keys are under `bpCategory.*` in `strings.js`.

---

## Security Notes

- **No secrets in code** — Supabase URL and anon key are in `.env` (gitignored).
- **RLS** — All database policies are scoped to `SINGLE_USER_ID`; no other row is accessible even if the anon key is leaked.
- **PIN auth** — The PIN is checked client-side only. This is intentional for a personal device app; it is not suitable for a multi-user or sensitive production deployment.
- **Signed URLs** — Photos are in a private bucket and accessed via 1-hour signed URLs.

---

## Troubleshooting

**Blank screen / app won't load**
- Check browser console for missing env var errors.
- Verify `.env` has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

**Readings not saving**
- Check that both SQL migrations ran successfully (especially `sessions-migration.sql`).
- Verify RLS policies with `fix-rls-policies.sql`.
- Open Network tab in DevTools — look for 4xx errors from Supabase.

**Language doesn't switch immediately**
- Should work instantly. If not, hard-refresh (Cmd+Shift+R) to clear any cached JS bundle from before the Context refactor.

**Build errors**
```bash
rm -rf node_modules dist
npm install
npm run build
```

---

## License

Personal use only.

---

Built with ❤️ using Vite, React, Tailwind CSS, Recharts, and Supabase.
