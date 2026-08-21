# Sugam — pitch script

Built for a ~3-4 minute demo + Q&A slot (typical hackathon pitch length — adjust the timing below if your actual slot is different; steps 1-6 below run closer to 4 minutes now that the second-site demo is in, so cut step 4 (guided form fill) first if you're tight on time — the second-site beat in step 5 matters more). Lead with the live demo, not slides. Rehearse this out loud at least twice before you're on stage; saying it once in your head is not the same as saying it with a mic in your hand.

---

## 0. Before you go up (2 min checklist)

- [ ] `npm run dev` already running, `localhost:5173` already open in a tab, zoomed to a readable size
- [ ] Brave Shields **off** for localhost:5173 (or use Chrome) — mic will fail otherwise
- [ ] Mic **and camera** permission already granted once before walking on stage (don't let the permission popup eat your demo time — this now matters for the Sign tab too if you're doing it)
- [ ] Both routes (`/` and `/gov`) already loaded once each, so switching between them on stage is instant
- [ ] Phone charged and unlocked with a document/photo ready if you're doing the photo-fill demo, OR a photo already saved that you'll upload from the laptop instead — laptop upload is safer than relying on venue WiFi + phone camera in the moment
- [ ] Groq key confirmed working (say something in the Read & Simplify tab once, backstage, to be sure)
- [ ] One teammate on the mic, one person quietly ready to click through the UI if the speaker's hands are full

---

## 1. Open with the barrier, not the tech (20 seconds)

> "Every accessibility tool we saw for this problem statement does the same thing: bolt a feature onto one app. A screen reader for a banking app. A simplifier for a form. That works for one app. It doesn't work for the hundred government and bank portals people actually have to use.
>
> So we built the layer instead."

Don't open with "we used Bhashini and Groq and Tesseract." Nobody in the room cares yet. Open with the reframe.

## 2. Live demo — voice navigation (45 seconds)

Say this while doing it, not before:

> "This is a plain bank portal — nothing special, that's the point. Sugam sits on top of it."

- Click the Sugam widget open
- Voice tab, pick a language
- Speak: **"What's my balance?"**
- Let it highlight the card and answer out loud
- If you're confident, do a second one in a different language: **"Check my LPG subsidy status"**

> "Same layer, any Indian language, no changes to the bank's site."

## 3. Live demo — read & simplify (45 seconds)

> "Now the other side of the barrier — not sensory, but literacy and cognitive load."

- Read & simplify tab
- Upload a photo of a dense form/bill/prescription (have this ready, don't fumble for it live)
- Let OCR + simplify run
- Read the simplified text out loud yourself while it's on screen — don't just point at it

> "Same pipeline that just answered a voice question is now turning a wall of text into something anyone can act on."

## 4. Live demo — guided form fill (30 seconds, cut this first if you're over time)

> "And the two chain together — for the moment that actually excludes people the most: filling out a form."

- Fill form tab → Fill by voice
- Do one field only (full name), show the "sounds right? / try again" check
- Say: "It confirms every field with you before anything gets submitted — no surprises."

Don't do all three fields live unless you have time to spare — one field proves the mechanism.

## 5. Live demo — the second site (30 seconds, your strongest beat)

Don't just claim "it works on any portal" — show it:

> "Here's the actual proof. Same Sugam layer, zero changes to its code, dropped onto a completely different site."

- Click "Government demo" in the top bar (a National Scholarship Portal — different data, different visual design, deliberately)
- Open Sugam, ask a domain question: **"What's my application status?"**
- Optionally: say "high contrast" or "scroll down" to show the universal voice *actions* work here too, unchanged

> "Nobody wrote government-specific code in the widget. It just reads whatever site registered itself."

This one demo beat is worth more than any slide claiming "scalable architecture" — you're proving it live.

## 6. Close — zoom back out (20 seconds)

> "This isn't a handful of separate hacks. It's one core that adapts to whatever's in front of it — you just watched it do that twice. That's what makes this scale to the actual size of the problem statement — five domains, four barriers — instead of one app at a time."

Stop talking. Let the demo be the last impression, not a slide.

## Bonus, only if time and confidence allow: the Sign tab

The widget also has a fourth tab — an honest, small MediaPipe hand-tracking proof-of-concept (open palm reads the page aloud, fist stops it). This is higher-risk live (needs decent lighting and a clear hand in frame) — only attempt it if you've rehearsed it working at least twice beforehand. If you do it and it works, say explicitly that it's a proof-of-concept, not full ISL translation — that honesty reads better to judges than an oversold claim.

---

## Anticipated questions (answer honestly, don't oversell)

**"Is the sign language feature real?"**
> "Not in this build — we scoped it out for the 24-hour window. It's designed as a MediaPipe-based fingerspelling recognizer, which is the honestly-achievable version of ISL support in this timeframe. Full ISL translation is a research problem, and we didn't want to fake it."

**"What happens if there's no internet?"**
> "Read & simplify's OCR step (Tesseract.js) runs fully offline. Voice currently depends on the browser's speech service, which needs a connection — swapping in AI4Bharat's open-source models is the documented next step for true offline voice."

**"How accurate is the voice recognition really?"**
> "Browser speech-to-text misses things sometimes, especially names and phone numbers — which is exactly why we built the per-field confirm step instead of trusting it blindly. You can always correct any field by hand on the form too."

**"Why not just make each portal itself accessible?"**
> "That's the ideal end state, and it's also unrealistic on any timeline that matters — hundreds of portals, no single owner. A layer that adapts to existing sites is deployable this year, not this decade."

**"What's next if you kept building?"**
> Point to the wave plan: harden the one pipeline with real users first, then widen input modes, then prove the "layer" claim by porting to a second real domain — not add features in parallel.

---

## If the demo breaks live

Have a 15-second fallback line ready and *move on* — don't debug on stage.

> "That's a live network hiccup, not the concept — here's what it looked like when we tested it an hour ago" → switch to a screen recording or screenshot backup if you have one. (Consider recording a 30-second backup video tonight, just in case.)
