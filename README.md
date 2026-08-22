# Sugam

One accessibility layer for banking, government, healthcare and education apps — voice-first, in Indian languages, offline-capable. Built for a 24-hour hackathon (Problem Statement 2: Accessibility & Inclusive Technology).

Full concept, API stack, architecture and build plan: see the [pitch artifact](https://claude.ai/code/artifact/37181e55-e8b7-436f-87b6-47370d63e8fc).

## Flow

`/` → **login** (if not signed in) → **home** (choose a demo site) → `/bank`, `/gov`, or `/health`, each protected by `RequireAuth`.

## What's here

**Real authentication, via Supabase.** `src/context/AuthContext.tsx` wraps Supabase Auth: passwords are hashed and verified server-side, sessions are signed JWTs Supabase issues and refreshes — none of that logic lives in this app, which is exactly why it's actually secure rather than a rolled-your-own scheme. `src/pages/LoginScreen.tsx` is a real email/password sign-in/sign-up form. It still demonstrates the accessibility pitch, honestly this time: 🎙 say your email and 📷 photograph any document with an email on it both autofill the *email* field only (`lib/email.ts`) — the password is always typed, masked, never spoken or photographed, because dictating or photographing a password would defeat the point of having one.

**Three independent demo sites**, proving the same layer works on all of them without any widget code changing between them:

- `src/pages/Dashboard.tsx` (`/bank`) — a mock bank portal. Deliberately plain — the point is Sugam layers onto an ordinary site, not a bespoke one.
- `src/pages/GovPortal.tsx` (`/gov`) — a mock National Scholarship Portal. Navy/serif/tricolour, entirely different data shape.
- `src/pages/HealthPortal.tsx` (`/health`) — a mock hospital appointment/prescription portal. Rounded/teal, a third domain again.
- `src/context/TargetSiteContext.tsx` is what makes the reuse real rather than cosmetic: each page registers its own voice intents and page summary; `SugamWidget` never imports site-specific data directly. `src/pages/HomePage.tsx` is the post-login site chooser.

**Always-visible accessibility bar** (`src/components/AccessibilityBar.tsx`, not buried in the widget): site switcher, one-tap "read this page aloud," large-text/high-contrast toggles (`src/context/UiPrefsContext.tsx`), log out.

**`src/components/SugamWidget.tsx`** — the on-demand layer: a floating widget with four tabs.

- **Voice** (Pillar 1): a grounded AI assistant, not a command list. Ask in your own words, by voice *or* by typing (`src/lib/assistant.ts`, Groq-backed) — "how much money do I have", "kitna paisa hai", "and what about the gas one?" all work, including follow-ups that depend on the previous turn. It can also perform page actions ("make it easier to read" → toggles large text). Two hard guardrails in the prompt: it may only answer from the current page's facts (never inventing an account number or date), and it refuses financial/medical advice. Falls back to the original keyword matcher (`src/lib/intentMatch.ts`) if no Groq key is set. Conversation resets when you switch portals, so one site's facts can't leak into another's answers.
- **Read & simplify** (Pillar 2): photograph a document, OCR via Tesseract.js, simplified via Groq **in the language you pick** — English or any of the 6 listed Indian languages, not English-only.
- **Fill form** (Pillar 5): voice-guided field-by-field fill with a "sounds right? / try again" check per field, or photo-ID autofill.
- **Sign** (Pillar 3, honest proof-of-concept): MediaPipe hand-tracking, two gestures only — open palm reads the page aloud, fist stops it. See `src/lib/handGesture.ts` for why this is landmark geometry, not a trained classifier.

PWA-enabled via `vite-plugin-pwa` (offline shell caching, installable).

## Setup

```bash
npm install
cp .env.example .env.local   # add VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_GROQ_API_KEY
npm run dev
```

Create a real account on the sign-up form (any email/password) — there's no seeded demo login for auth, since it's real. The mock data shown on all three sites (name "Ramesh Kumar", balances, etc.) is unrelated to whichever account you sign in with — see `src/data/registeredUser.ts`.

**For a smooth demo:** Supabase requires email confirmation by default, which will block sign-in on stage if you can't reach the confirmation inbox. In your Supabase dashboard: Authentication → Providers → Email → turn off "Confirm email" before your pitch, or use an email account you can actually check.

Voice recognition/synthesis and the Sign tab need Chrome/Brave (Web Speech API + camera) with Shields off if using Brave. OCR and the dashboards work in any browser. The Sign tab needs an internet connection the first time (it fetches the hand-tracking model from a CDN) and a webcam.

## Where this sits in the build plan

| Hours | Status |
|---|---|
| 0–1 Scope & skeleton | done |
| 1–7 Pillar 1: voice navigation | done |
| 7–13 Pillar 2: read-aloud & simplify | done |
| 13–17 Stretch: guided form fill | done |
| 17–20 Accessibility audit & polish | done — axe-core: 0 violations across login, home, all three sites, all widget tabs, and high-contrast state on each |
| 20–24 Buffer & pitch | in progress — added real Supabase authentication (replacing an earlier demo-only login), a home/login flow with accessible email-autofill helpers, a third target site, per-language read & simplify, and a commands helper during this window, on top of the earlier second site + accessibility bar + voice actions + Sign tab |

## Accessibility audit notes

Ran axe-core against every page and every widget tab/state, including high-contrast mode. Fixed everything found across two passes: missing `<main>`/`<h1>` landmarks (dashboard, login, home), card labels not being real headings, a color-contrast failure on the accessibility bar's own buttons, an unlandmarked "Log out" link, and three color-contrast failures in the health portal's teal/amber palette. Re-ran after each fix: 0 violations everywhere.

Not yet tested: real screen reader (NVDA/VoiceOver) pass, real throttled-network conditions, real low-end device, and the Sign tab's actual gesture accuracy (only verifiable with a real webcam — the model loads and runs here, but hold-time/lighting tuning needs a live camera).

## Known gaps (by design, for the demo)

- Authentication is real (Supabase), but there's no email/password strength policy or rate-limiting configured beyond Supabase's defaults — fine for a hackathon demo, worth hardening (and adding MFA) before any real deployment.
- The assistant is grounded in a short page summary, not a live read of the DOM — it knows the headline facts each site registers, not every element on screen. Ask it something the summary doesn't cover and it will correctly say it can't see that.
- No backend beyond Supabase Auth — Groq, OCR, and everything else still runs client-side. Do not ship the Groq key in this form past the hackathon.
- Only English/Hindi keywords are populated per intent; other listed languages transcribe but won't always match an intent yet.
- The Sign tab is explicitly a proof-of-concept: two gestures via landmark geometry, not real ISL. Say so if asked — see `PITCH.md`.
