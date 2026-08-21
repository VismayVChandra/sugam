# Sugam

One accessibility layer for banking, government, healthcare and education apps — voice-first, in Indian languages, offline-capable. Built for a 24-hour hackathon (Problem Statement 2: Accessibility & Inclusive Technology).

Full concept, API stack, architecture and build plan: see the [pitch artifact](https://claude.ai/code/artifact/37181e55-e8b7-436f-87b6-47370d63e8fc).

## What's here

Two independent demo sites, proving the same layer works on both without any widget code changing between them:

- `src/pages/Dashboard.tsx` (route `/`) — a mock bank portal. Deliberately plain — the point is Sugam layers onto an ordinary site, not a bespoke one.
- `src/pages/GovPortal.tsx` (route `/gov`) — a mock National Scholarship Portal. Different domain, different data shape, deliberately different visual design (navy/serif/tricolour vs. the bank's blue/Arial), same `ContactDetailsForm` and same `SugamWidget` mounted unmodified.
- `src/context/TargetSiteContext.tsx` is what makes that reuse real rather than cosmetic: each page registers its own voice intents and page summary; `SugamWidget` never imports site-specific data directly.
- `src/components/AccessibilityBar.tsx` — always-visible chrome (not buried in the widget): the Bank/Government demo switcher, a one-tap "read this page aloud," and large-text/high-contrast toggles (`src/context/UiPrefsContext.tsx`).
- `src/components/SugamWidget.tsx` — the on-demand layer: a floating widget with four tabs.
  - **Voice** (Pillar 1): speak a command — per-site intents (balance/subsidy/transactions, or application status/amount/documents) plus universal actions available on every site for free (`src/lib/universalIntents.ts`): "scroll down/up," "submit," "large text," "high contrast." Web Speech API baseline — see `src/lib/speech.ts` for the Bhashini/Sarvam swap point.
  - **Read & simplify** (Pillar 2): photograph a document, OCR via Tesseract.js (`src/lib/ocr.ts`), simplified via Groq (`src/lib/simplify.ts`), read back aloud.
  - **Fill form** (Pillar 5): voice-guided field-by-field fill with a "sounds right? / try again" check per field, or photo-ID autofill via `src/lib/extractFields.ts`.
  - **Sign** (Pillar 3, honest proof-of-concept): MediaPipe hand-tracking (`@mediapipe/tasks-vision`), two gestures only — open palm reads the page aloud, fist stops it. See `src/lib/handGesture.ts` for why this is landmark geometry, not a trained classifier.
- PWA-enabled via `vite-plugin-pwa` (offline shell caching, installable).

## Setup

```bash
npm install
cp .env.example .env.local   # add VITE_GROQ_API_KEY at minimum
npm run dev
```

Voice recognition/synthesis and the Sign tab need Chrome/Brave (Web Speech API + camera) with Shields off if using Brave. OCR and both dashboards work in any browser. The Sign tab needs an internet connection the first time (it fetches the hand-tracking model from a CDN) and a webcam.

## Where this sits in the build plan

| Hours | Status |
|---|---|
| 0–1 Scope & skeleton | done |
| 1–7 Pillar 1: voice navigation | done |
| 7–13 Pillar 2: read-aloud & simplify | done |
| 13–17 Stretch: guided form fill | done |
| 17–20 Accessibility audit & polish | done — axe-core: 0 violations across both sites, all widget tabs, and both large-text/high-contrast states |
| 20–24 Buffer & pitch | in progress — added second target site, read-page-aloud, text/contrast toggle + voice actions, and the Sign tab during this window |

## Accessibility audit notes

Ran axe-core against both dashboards and every Sugam widget tab/state, including high-contrast mode on both sites. Fixed everything it found: missing `<main>`/`<h1>` landmarks, card labels not being real headings, and a color-contrast failure on the accessibility bar's own buttons (fixed by swapping to a solid white/teal pairing instead of translucent white on teal). Re-ran after each fix: 0 violations everywhere.

Not yet tested: real screen reader (NVDA/VoiceOver) pass, real throttled-network conditions, real low-end device, and the Sign tab's actual gesture accuracy (only verifiable with a real webcam, not this sandboxed environment — the model loads and runs, but hold-time/lighting tuning needs a live camera).

## Known gaps (by design, for the demo)

- Voice intent matching is keyword-based, not a real NLU — fine for a handful of intents per site, note it honestly if asked.
- No backend — everything runs client-side, calling Groq directly from the browser. Do not ship the Groq key in this form past the hackathon.
- Only English/Hindi keywords are populated per intent; other listed languages transcribe but won't always match an intent yet.
- The Sign tab is explicitly a proof-of-concept: two gestures via landmark geometry, not real ISL. Say so if asked — see `PITCH.md`.
