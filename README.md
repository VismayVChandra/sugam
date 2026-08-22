# Sugam

One accessibility layer for banking, government, healthcare and other digital services — voice-first, hands-free, translated, and present from the moment you sign in to the moment you're done. Built for a 24-hour hackathon (Problem Statement 2: Accessibility & Inclusive Technology).

Full pitch script: see [PITCH.md](PITCH.md).

## Flow

`/` → **login** (Sugam-guided, if not signed in) → **home** (Sugam opens automatically, say what you want) → `/bank`, `/gov`, or `/health`, each protected by `RequireAuth` — the accessibility bar and Sugam widget follow you across all of it.

## What's here

### Real authentication, with Sugam helping through it

`src/context/AuthContext.tsx` wraps Supabase Auth — passwords are hashed and verified server-side, sessions are signed JWTs Supabase issues and refreshes, none of that logic lives in this app. `src/pages/LoginScreen.tsx` is a real email/password sign-in/sign-up form, with three levels of help:

- **🧭 Guided sign-in** — tap one button and Sugam speaks you through the whole thing: asks for your email by voice, reads back what it heard for confirmation ("✅ Sounds right" / "🔁 Try again"), fills the field once confirmed, then gives spoken instructions for the password step.
- **🎙 Say your email** / **📷 Autofill email from a photo** — standalone versions of the same email-fill helpers, for anyone who doesn't need the full walkthrough.
- The password is **always typed, masked, never spoken or photographed** — dictating or photographing a password would defeat the point of having one. This is a deliberate boundary, not a gap.

### Sugam is present for the whole session, not bolted onto one screen

The widget and accessibility bar render on the login screen, the home/site-chooser screen, and all three demo portals — the same components, the same `TargetSiteProvider` pattern, no per-page rewrite. On the home screen specifically, the widget **auto-opens for everyone** (not just vision-onboarded users) because choosing a service by saying "I want to check my bank balance" beats reading three cards and tapping the right one — especially for someone with low literacy. Say it, and Sugam navigates you straight to `/bank`.

### Three independent demo sites

Proving the same layer works on all of them without any widget code changing between them:

- `src/pages/Dashboard.tsx` (`/bank`) — a mock bank portal.
- `src/pages/GovPortal.tsx` (`/gov`) — a mock National Scholarship Portal. Different visual design, different data shape.
- `src/pages/HealthPortal.tsx` (`/health`) — a mock hospital appointment/prescription portal. A third domain again.
- `src/context/TargetSiteContext.tsx` is what makes the reuse real rather than cosmetic: each page (including login and home) registers its own voice intents and page summary; `SugamWidget` never imports site-specific data directly.

### Always-visible accessibility bar

`src/components/AccessibilityBar.tsx` — not buried in the widget, present on every screen:

- Site switcher, **read this page aloud**, reading-speed cycle (0.75x–2x)
- **Large text**, **high contrast**, **dyslexia-friendly font** (OpenDyslexic) toggles (`src/context/UiPrefsContext.tsx`)
- **Language selector** — retranslates the app's own UI chrome (not just what's spoken), see below
- **Caregiver mode** toggle and **Emergency contact** one-tap-call button, see below
- Link to `/preferences` to revisit accessibility choices anytime, and log out

### `src/components/SugamWidget.tsx` — the on-demand layer

A floating widget with up to four tabs (fewer where a tab wouldn't make sense, e.g. no "Fill form" on the login/home screens):

- **Voice** — a grounded AI assistant, not a command list. Ask in your own words, by voice or by typing (`src/lib/assistant.ts`, Groq-backed) — "how much money do I have", "kitna paisa hai", "and what about the gas one?" all work, including follow-ups that depend on the previous turn. It can also perform page actions (navigate, scroll, toggle accessibility prefs). Two hard guardrails in the prompt: it may only answer from the current page's facts, and it refuses financial/medical advice. Falls back to a keyword matcher (`src/lib/intentMatch.ts`) if no Groq key is set.
  - **🗣️ "Hey Sugam" hands-free mode** — tap once to arm it, then it keeps listening on its own. Say "Hey Sugam" followed by your question and it answers hands-free, no more touching the screen needed; say "Hey Sugam, stop" to turn it off. Only acts on speech that starts with the wake phrase, so ambient conversation between turns is ignored, and it never listens while Sugam itself is talking.
- **Simplify** — photograph a document, OCR via Tesseract.js, simplified via Groq in the language you pick.
  - **Tap-to-explain** — tap any word in the simplified text for an even-simpler, one-sentence explanation.
  - **Document vault** — every simplified document is auto-saved (Supabase `user_metadata`, most recent 8, capped length) and reachable later without re-photographing anything.
- **Fill form** — voice-guided field-by-field fill with a "sounds right? / try again" check per field, or **snap-to-form auto-fill** — photograph an Aadhaar card, ration card, PAN or mark sheet and the form populates itself.
  - On-device regex (`src/lib/documentFields.ts`) pulls document type, ID number and date of birth — government ID numbers never leave the browser, and Aadhaar is masked to its last 4 digits, the way real KYC forms handle it.
  - An LLM pass (`src/lib/extractFields.ts`) handles names and addresses, on text that's already had the ID number and DOB redacted first.
- **Sign** — an honest proof-of-concept: MediaPipe hand-tracking, two gestures only (open palm reads the page aloud, fist stops it). See `src/lib/handGesture.ts` for why this is landmark geometry, not a trained classifier.

### Built for the person who can't read the form, not just the person who can't see it

- **Accessibility onboarding** (`src/pages/AccessibilityOnboarding.tsx`), asked once after first sign-in, reachable again anytime at `/preferences`: vision / hearing / motor / reading & cognitive, plus a reading-speed picker. Answers only set better *defaults* — nothing is ever locked to them.
  - Vision → large text + high contrast, and the widget auto-opens on every visit.
  - Reading & cognitive → large text + the dyslexia-friendly font.
  - Motor → **switch/scan navigation** (`src/components/SwitchScanController.tsx`): a highlight cycles through every interactive element on the page; one input (spacebar or the on-screen button, standing in for a real external switch) activates whatever's highlighted. Pauses automatically while the Sugam widget is open, since the two would otherwise fight for focus and CPU.
- **Caregiver mode** (`src/components/CaregiverBanner.tsx`): a huge share of real usage in this demographic is a literate family member operating the phone for someone else. One toggle makes that a first-class state — a visible "helping someone else today" banner, plus a running activity log of what's been read aloud or filled in, so the caregiver can show the account holder what happened.
- **Emergency contact** (`src/components/EmergencyButton.tsx`): save a contact once, then one tap anywhere in Sugam calls them — relevant specifically in banking/health contexts where something going wrong needs a fast, low-effort escalation path.
- **Whole-UI translation** (`src/lib/i18n.ts`): the language selector doesn't just change what's *spoken* — it retranslates the accessibility bar, home screen, all three portals, the shared KYC form, and the widget's own chrome. Hindi is fully translated now; the dictionary shape is built to extend to the other five listed languages without code changes. Live data values (balances, transaction descriptions, names) are deliberately left untranslated — Sugam localizes its own layer, not the underlying mock site's content, the same boundary a real integration would have.

PWA-enabled via `vite-plugin-pwa` (offline shell caching, installable).

## Setup

```bash
npm install
cp .env.example .env.local   # add VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_GROQ_API_KEY
npm run dev
```

Create a real account on the sign-up form (any email/password) — there's no seeded demo login for auth, since it's real. The mock data shown on all three sites (name "Ramesh Kumar", balances, etc.) is unrelated to whichever account you sign in with — see `src/data/registeredUser.ts`.

**For a smooth demo:** Supabase requires email confirmation by default, which will block sign-in on stage if you can't reach the confirmation inbox. In your Supabase dashboard: Authentication → Providers → Email → turn off "Confirm email" before your pitch, or use an email account you can actually check.

Voice recognition/synthesis, hands-free mode, and the Sign tab need Chrome/Brave (Web Speech API + camera) with Shields off if using Brave. OCR and the dashboards work in any browser. The Sign tab needs an internet connection the first time (it fetches the hand-tracking model from a CDN) and a webcam.

## Accessibility audit notes

Ran axe-core repeatedly across every page and screen added this session — login (guided sign-in included), home, all three portals, the accessibility bar (including a new language selector and emergency-contact modal), and high-contrast mode. Fixed everything found: a color-contrast failure on the emergency button specifically in high-contrast mode (the danger color was too light against white text), an unlandmarked accessibility bar and caregiver banner, and a scrollable chat log with no keyboard focus path. 0 violations on the last full pass.

Not yet tested: real screen reader (NVDA/VoiceOver) pass, real throttled-network conditions, real low-end device, and the Sign tab's actual gesture accuracy (only verifiable with a real webcam).

## Known gaps (by design, for the demo)

- Authentication is real (Supabase), but there's no email/password strength policy or rate-limiting configured beyond Supabase's defaults — fine for a hackathon demo, worth hardening (and adding MFA) before any real deployment.
- The assistant is grounded in a short page summary, not a live read of the DOM — it knows the headline facts each site registers, not every element on screen.
- No backend beyond Supabase Auth — Groq, OCR, and everything else still runs client-side. Do not ship the Groq key in this form past the hackathon.
- Whole-UI translation covers Hindi only right now; the other five listed languages transcribe/synthesize speech correctly but the visible chrome falls back to English until more dictionary entries are added.
- "Hey Sugam" is an armed-and-listening hands-free mode, not true background wake-word detection — the browser can't listen for a wake phrase while the tab isn't focused or the mic isn't already granted, unlike a dedicated device assistant.
- The Sign tab is explicitly a proof-of-concept: two gestures via landmark geometry, not real ISL. Say so if asked — see `PITCH.md`.
- Document vault, caregiver log, and emergency contact all live in Supabase `user_metadata` rather than a dedicated table — deliberate, to avoid needing database migrations/RLS policies within the hackathon window; real usage at scale would want a proper table.
