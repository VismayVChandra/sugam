# Sugam — pitch script

Built for a ~3-4 minute demo + Q&A slot (typical hackathon pitch length — adjust if your slot differs). The build has grown a lot since this script was first written — there's now more here than fits in 4 minutes, so beats are marked **MUST** / **IF TIME** / **CUT FIRST** below. Lead with the live demo, not slides. Rehearse this out loud at least twice before you're on stage.

---

## 0. Before you go up (2 min checklist)

- [ ] `npm run dev` already running, `localhost:5173` already open in a tab, zoomed to a readable size
- [ ] Brave Shields **off** for localhost:5173 (or use Chrome) — mic will fail otherwise
- [ ] Mic **and camera** permission already granted once before walking on stage
- [ ] A real account already created on this Supabase project (sign up once beforehand — with email confirmation turned off in Supabase settings, or using an email you can actually confirm), and already clicked through `/bank`, `/gov`, and `/health` once each — but leave the tab **signed out** on the login screen so you can open with the sign-in demo
- [ ] Know your demo account's email and password cold — you'll type the password live, no cheat sheet needed but don't fumble it
- [ ] Phone charged and unlocked with a document/photo ready if you're doing the photo-fill or photo-login demo, OR a photo already saved that you'll upload from the laptop instead
- [ ] Groq key confirmed working (say something in the Read & Simplify tab once, backstage)
- [ ] One teammate on the mic, one person quietly ready to click through the UI if the speaker's hands are full

---

## 1. MUST — Open by signing in, not by explaining (20 seconds)

Don't open with a slide or an abstract framing line. Open by doing the thing:

- On the login screen, click **🎙 Say your email**, speak it (say "at" and "dot" for the symbols), let it fill the field — then type your password as normal and sign in
- While it's filling in, say:

> "Real authentication, real Supabase account, hashed password — you just watched someone fill in the one part of that (the email) without touching the keyboard. Every accessibility tool we saw for this problem statement bolts a feature onto one app — a screen reader for a banking app, a simplifier for a form. That works for one app. It doesn't work for the hundred portals people actually have to use. So we built the layer instead — starting with the login screen itself."

If voice-fill feels risky in the room's acoustics, just type the email and say "we'll show voice-fill live in a second" — don't lose the moment to a misheard address on stage. Either way, **always type the password** — that's not a fallback, that's the design (see the security Q&A below).

## 2. MUST — Live demo: the assistant (45 seconds)

> "This is a plain bank portal — nothing special, that's the point."

- From the home screen, enter **Bank demo**
- Open Sugam, Voice tab. **Deliberately do not use the 'right' words** — ask by voice or type: **"how much money do I have left?"**
- Then a follow-up that only makes sense in context: **"and what about the gas one?"**

> "Notice I never said 'balance' or 'subsidy'. It's not matching keywords — it understands, and it remembers what we were just talking about. That matters, because someone with low literacy doesn't know your magic words."

If asked — or to pre-empt the obvious question — show the guardrail:

- Ask: **"what's my IFSC code?"** → it says it can't see that on this page rather than inventing one.

> "It can only answer from what's actually on the page. It will never make up a number for someone managing real money."

Note the typed input too: **"Voice-first isn't voice-only — someone who's Deaf or can't speak types the same question and gets the same help."**

## 3. IF TIME — Read & simplify, now with translation (35 seconds)

> "The other side of the barrier — literacy and language, not just sight."

- Read & simplify tab, pick a language **other than English** in the dropdown
- Upload a photo of a dense form/bill/prescription
- Let it simplify — read the result out loud yourself, in that language if you can, or just point out it's not English anymore

> "Same pipeline, but now it comes back in the language the person actually reads."

## 4. IF TIME — Snap-to-form auto-fill (30 seconds)

> "And here's the moment that actually excludes people most: filling out a form."

- Fill form tab → **snap a photo of an Aadhaar card** (have one ready — a printed dummy, or a photo already on the laptop)
- Let it run: it names the document, then fills name, date of birth, ID number and address at once

> "It recognised the document type, and filled four fields from one photo."

**Then point at the ID number field — this is the bit worth pausing on:**

> "Notice the Aadhaar number is masked to the last four digits. That's on purpose. Real KYC forms do that, and it matters more here than anywhere: the person using this may need someone else to read their screen. We also never send the ID number off the device at all — it's pulled out locally with pattern matching, and stripped from the text before anything goes to an API. The AI only ever sees the name and address."

That one answer covers accessibility, privacy and domain awareness in about fifteen seconds.

If short on time, do **Fill by voice** for one field instead and show the "sounds right? / try again" check.

## 5. MUST — The second/third site (30 seconds, your strongest beat)

Don't just claim "it works on any portal" — show it:

> "Here's the actual proof. Same Sugam layer, zero changes to its code, dropped onto a completely different site."

- Switch to **Government demo** (or **Health demo** — pick whichever you're more confident narrating) via the top bar
- Ask a domain question: **"What's my application status?"** (or "When's my next appointment?")
- Mention, don't demo, the third: "There's a third one too — a hospital portal — same widget, same zero changes."

> "Nobody wrote government-specific or hospital-specific code in the widget. It just reads whatever site registered itself."

## 6. MUST — Close (15 seconds)

> "This isn't a handful of separate hacks. It's one core that adapts to whatever's in front of it — including its own login screen. That's what makes this scale to the actual size of the problem statement, instead of one app at a time."

Stop talking. Let the demo be the last impression.

## Bonus, only if time and confidence allow: the Sign tab

A fourth widget tab: an honest, small MediaPipe hand-tracking proof-of-concept (open palm reads the page aloud, fist stops it). Higher-risk live — needs decent lighting and a clear hand in frame. Only attempt if rehearsed working at least twice beforehand. If it works, say explicitly it's a proof-of-concept, not full ISL translation.

---

## Anticipated questions (answer honestly, don't oversell)

**"Is that login screen actually secure?"**
> "Yes — it's real Supabase authentication. Passwords are hashed and verified server-side; we never see or store them. The voice and photo helpers only ever fill the email field, never the password — dictating or photographing a password would defeat the point of having one, so we deliberately didn't build that, even though it would have been the 'easier' accessibility demo."

**"Is the sign language feature real?"**
> "Not full ISL — that's a research problem. What's here is an honest, small proof-of-concept: two hand gestures via geometry, not a trained model. We didn't want to fake 'solved.'"

**"What happens if there's no internet?"**
> "OCR (Tesseract.js) runs fully offline. Voice and the Sign tab's model both need a connection today — swapping in AI4Bharat's open-source models is the documented next step for true offline voice."

**"Does the AI hallucinate? Can it make up someone's bank balance?"**
> "Structurally, no. It's given only the facts on the current page and told to say 'I can't see that' for anything else — you can watch it do that live with the IFSC question. It also can't invent an action; we only accept an action id that actually exists on that page. And it's told to refuse financial and medical advice — it explains what's on the page, it doesn't tell you what to do with your money or medication."

**"How accurate is the voice recognition really?"**
> "Browser speech-to-text misses things sometimes, especially names and phone numbers — which is why we built a per-field confirm step instead of trusting it blindly. You can always correct any field by hand, too."

**"Why not just make each portal itself accessible?"**
> "That's the ideal end state, and unrealistic on any timeline that matters — hundreds of portals, no single owner. A layer that adapts to existing sites is deployable this year, not this decade."

**"What's next if you kept building?"**
> Point to the wave plan: harden the one pipeline with real users first, then widen input modes, then prove the "layer" claim with a real (not mock) second domain — not add features in parallel.

---

## If the demo breaks live

Have a 15-second fallback line ready and *move on* — don't debug on stage.

> "That's a live network hiccup, not the concept — here's what it looked like when we tested it earlier" → switch to a screen recording or screenshot backup if you have one. (Consider recording a 30-second backup video tonight, just in case.)
