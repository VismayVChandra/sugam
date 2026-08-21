# Sugam

One accessibility layer for banking, government, healthcare and education apps — voice-first, in Indian languages, offline-capable. Built for a 24-hour hackathon (Problem Statement 2: Accessibility & Inclusive Technology).

Full concept, API stack, architecture and build plan: see the [pitch artifact](https://claude.ai/code/artifact/37181e55-e8b7-436f-87b6-47370d63e8fc).

## What's here

- `src/pages/Dashboard.tsx` — a mock bank portal standing in for "the existing app" Sugam adapts. Deliberately plain — the point is Sugam layers onto an ordinary site, not a bespoke one.
- `src/components/SugamWidget.tsx` — the layer itself: a floating widget with two tabs.
  - **Voice** (Pillar 1): speak a command, matched against a small intent list (balance / subsidy / transactions), answered aloud. Web Speech API baseline — see `src/lib/speech.ts` for the Bhashini/Sarvam swap point.
  - **Read & simplify** (Pillar 2): photograph a document, OCR via Tesseract.js (`src/lib/ocr.ts`), simplified via Groq (`src/lib/simplify.ts`), read back aloud.
- `src/data/mockBank.ts` — the fake account data and voice intent matching.
- PWA-enabled via `vite-plugin-pwa` (offline shell caching, installable).

## Setup

```bash
npm install
cp .env.example .env.local   # add VITE_GROQ_API_KEY at minimum
npm run dev
```

Voice recognition and synthesis need Chrome (Web Speech API support). OCR and the mock dashboard work in any browser.

## Where this sits in the build plan

| Hours | Status |
|---|---|
| 0–1 Scope & skeleton | done — this scaffold |
| 1–7 Pillar 1: voice navigation | done — Web Speech API baseline, 6 languages, 3 intents |
| 7–13 Pillar 2: read-aloud & simplify | done — OCR → Groq simplify → TTS |
| 13–17 Stretch: guided form fill | done — voice walkthrough with per-field confirm, or photo autofill |
| 17–20 Accessibility audit & polish | done — axe-core: 0 violations across dashboard + all 3 widget tabs; verified no horizontal overflow at 375px mobile width |
| 20–24 Buffer & pitch | next |

## Accessibility audit notes (Hr 17–20)

Ran axe-core against the dashboard and every Sugam widget tab/state. Found and fixed 3 moderate issues (missing `<main>` landmark, missing `<h1>`, card labels not being real headings) — see `src/pages/Dashboard.tsx`. Re-ran after the fix: 0 violations everywhere, including mid-flow states (voice listening, form review step). Confirmed no horizontal scroll at a 375px mobile viewport.

Not yet tested: real screen reader (NVDA/VoiceOver) pass, real throttled-network conditions, real low-end device. If time remains before the pitch, prioritize a real screen reader pass over anything else — axe-core catches structural issues, not whether the experience actually flows well by ear.

## Known gaps (by design, for the demo)

- Voice intent matching is keyword-based, not a real NLU — fine for 3 intents, note it honestly if asked.
- No backend — everything runs client-side, calling Groq directly from the browser. Do not ship the Groq key in this form past the hackathon.
- Only English/Hindi keywords are populated per intent; other listed languages transcribe but won't always match an intent yet — extend `src/data/mockBank.ts`.
