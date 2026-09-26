# Unit 18 · Round 22 plan (builder 18) — also the progress log

## Files I own
`tpl/u18-*` (hero.html, head.css, sec-a..e.html, derives.html, practice.html, kit.js, shared.js, hero.js, w1..w5.js), `assemble-u18.js`, `verify-u18.js`, `verify-math18.py`, `shots-u18.js`, `src/unit-18.html` (generated).
Markup conventions: Trap = `<div class="callout watch reveal"><span class="tag">Trap</span>…`; Why = `<div class="callout aha reveal"><span class="tag">Why does this work?</span>…`; comparisons = `<table class="cmp">` (new CSS in u18-head.css) + "Rule of thumb" line.

## Sections (new ids) · anchor picture · widgets
Act I — Look back instead of remembering (sec-a)
- **s1 · The bottleneck, and the fix: look back** · interpreter glancing at the speaker's notes · **w-align** (new, 2-D) · checks 2 · drawer: blame reaches every note in one hop. Worked: notes I/drink/tea one-hot, q(चाय) = (0, 0.5, 2) → (0.100, 0.164, 0.736); मैं (2,0,0) → (0.787, 0.107, 0.107); पीता (0,2,0.5) → (0.100, 0.736, 0.164); हूँ (1,1,0) → (0.422, 0.422, 0.155). Scoring table dot / general / additive + additive example (0.443, 0.924, 1.367) → (0.195, 0.315, 0.490). Roadmap (four acts).
- **s2 · Attention is a soft lookup** · strict vs kind shopkeeper; library (query / spine labels / book contents) · **w-lookup** (keep, de-clutter) · checks 2 · drawers (2, keep).
Act II — Every word asks every word (sec-b)
- **s3 · Self-attention: every word asks every word** · pass-the-message vs everyone asks at once; three badges · **w-relay** (moved), **w-qkv** 3-D · checks 3 · drawers (2, keep).
- **s4 · Why divide by √d** · two judges · **w-scale** · checks 2 · drawers (2) · ÷d trap: 8/64 → (0.531, 0.469).
- **s5 · The payoff: one word, many meanings** · a chameleon takes the colour of its leaf · **w-context** (new, 2-D) · checks 2 · drawer: a word slides toward its neighbour by σ(gap). river (2,0), money (0,2), bank (1,1) → (1.5, 0.5) / (0.5, 1.5), cos 0.6 (53.13°); stream (3,0) → (2.340, 0.330).
- **s6 · The attention lab** · "it" grabs "ball" · **w-attnmap** 3-D (fix labels) · checks 2.
- **s7 · Many heads: many questions at once** · commentary box; each head its own glasses · **w-heads**, **w-subspace** (rebuilt 2-D) · checks 2 · drawer (1).
Act III — Order and depth (sec-c)
- **s8 · Where is each word? Three ways to add position** · clock hands / a turning dial · **w-shuffle**, **w-clocks** (+ d switch + compare tab), **w-rope** 3-D · checks 3 · drawers (3 + sinusoidal distance).
- **s9 · The transformer block** · the residual notebook: read, add a note, never erase · **w-layernorm**, **w-block** 3-D · checks 2 · drawers (3).
Act IV — How transformers learn, and the three families (sec-d)
- **s10 · No peeking: the mask, and every guess at once** · the class answers at once, each covering the answers to the right · **w-mask** (+ one-pass tab) · checks 3 · drawer (extended: one pass = n honest runs).
- **s11 · Three families: BERT, GPT and the encoder–decoder** · proofreader / storyteller / interpreter · **w-families** (new) · checks 3 · 512 → 76.8 ≈ 77 masked (61.44 / 7.68 / 7.68), 511 guesses.
- **s12 · The price: every pair of words** · handshakes · **w-cost** (fix ticks) · checks 2 · KV-cache teaser.
- **s13 · A tiny transformer, whole** · the notebook's pages · **w-tiny** · checks 3 · weight tying 25 600 000 · drawer: tying = logit is h·e_w.
- **s14 · What to carry forward** · 12 mini-picture cards (sec-e).
- **spractice** (§15) · 16 problems.

Old → new ids: s1→s1 (rewritten; relay moved to s3) · s2→s2 · s3→s3 · s4→s4 · (new s5) · s5→s6 · s6→s7 · s7→s8 · s8→s9 · s9→s10 · (new s11) · s10→s12 · s11→s13 · s12→s14 · spractice→spractice.

## Widgets (18 · 4 in 3-D)
w-align (new) · w-lookup · w-relay · w-qkv (3-D) · w-scale · w-context (new) · w-attnmap (3-D) · w-heads · w-subspace (rebuilt 2-D) · w-shuffle · w-clocks (+compare) · w-rope (3-D) · w-layernorm · w-block (3-D) · w-mask (+one pass) · w-families (new) · w-cost · w-tiny.
Every widget exposes `window.U18.<name>.state()`; verify-u18 re-computes independently and checks drawn geometry; SAT overlap test on every SVG at 1440 and 390.

## Checks (31, renumbered c1… in page order; ≥ half predict behaviour)
s1 2 · s2 2 · s3 3 · s4 2 · s5 2 · s6 2 · s7 2 · s8 3 · s9 2 · s10 3 · s11 3 · s12 2 · s13 3.

## Practice (16)
P1 seq2seq weights + context · P2 additive vs dot · P3 one lookup · P4 whole table · P5 reverse-engineer a key (c = 1 + ln2/√2) · P6 diagnose a frozen row (√d) · P7 contextual vectors + slide formula · P8 heads shapes/weights · P9 sinusoidal + distance property · P10 RoPE · P11 layer norm + residual · P12 block count · P13 causal-mask weights · P14 BERT vs GPT signals · P15 weight tying (reverse-engineer V = 50 257 from 38 597 376) · P16 attention bill.

## Progress log
- [x] audit written · [x] plan written
- [x] sec-a (s1, s2) + w-align · [x] sec-b (s3–s7) + w-context + w-subspace · [x] sec-c (s8, s9) · [x] sec-d (s10–s13) + w-families · [x] sec-e (s14) · [x] practice 16 · [x] derives 18 · [x] builds clean (31 checks, 18 widgets, 4 in 3-D, 16 problems, 18 derives), zero console errors
- [x] first screenshot pass at 1440 (all 18 widgets + alternate views) → fixes applied: 3-decimal weights, lookup label bounds, qkv key labels, round fixed-size stars, subspace columns, clocks 4-dp, families seed 19 + legend
- [x] verify-math18: 170 checks pass (every Try claim, drawer, practice number and wrong-option value)
- [x] verify-u18 rewritten (state() readers, drawn geometry, Try claims, extremes, SAT text overlap + text-cut-off test on every SVG at 1440/390 and in all alternate states, 3-D label overlap at 8 camera angles per stage, reduced motion, main-thread work per animation frame (long-animation-frame records), 360–1680 overflow, hero clearance at 1280/1440/1568×757/1920, light theme, console)
- Fixes from the verify + sweep passes: `F` shadowed by local font sizes (→ `FX`); fz() read the old viewBox in w-clocks and w-families (viewBox now set first); relayout redraws on >2.5 % width change (was 12 %, so 360-px drawings stayed at 390); placeLabel falls back to the least-overlapping in-bounds spot; placeLines (name + price blocks) in w-lookup; 3-D labels decluttered every frame (bigger/prio label wins, the other fades until the view frees it); share labels, legends and footnotes that were cut off at 360/768/1440 re-laid; 5 display equations that overflowed at 360 split; stray `\'` in practice text removed; block/align readouts rebuilt only when their text changes (per-frame work down).
- [x] 360/390/600/768/1024/1440 default-state sweeps clean (no overlap, no cut-off label, no text < 11 px)
- [x] full re-read as a student (small fixes: §1 double "Unit 17", §6 residual pointer, §10 Try names its sentence, §11 realization as text lines, families caption)
- [x] 390 (dark, all 18 widgets + alternate views) and light (hero, 4 stages, align, families) screenshot pass after the fixes, looked at: w-relay now draws its voice bars on phones too; layer-norm arrows moved off the panel titles; lab/block 3-D labels ≥ 11.8 px on phones (block uses short floor names there); qkv's 3-D "answer" label fades on phones where the HUD already shows it.
- 3-D stages: a resize across the phone lines (640 px CSS height / 560 px layout) now unpins cinema's inline height and rebuilds the stage (`watchLayout`); before, a desktop stage kept its 500-px height and camera on a phone and cut the lab's end words.
- [x] final suite run: `verify-u18.js` ✓ 185 checks (rAF gaps on this 2-CPU sandbox are set by SwiftShader's GPU raster, 0.5–2 s per SVG frame even with the page idle; the page's own work per frame is ≤ 27 ms, which is what the test gates). `verify-math18.py` ✓ 170.
- Shared suites (not edited): verify-practice → unit-18 "problems 16≠14 | sec-num 15≠13" only; verify-ux ONLY=18 → "check count 31 ≠ 20", "solutions 16 ≠ 14" only (overflow, drawer, resume, print all pass). A full verify-ux run stopped in unit-11 (reading-position test) — not a Unit 18 file.
- Wiring: verify-practice `['18',16,15]`; verify-ux `EXPECT_CHECKS 18: 31`, `EXPECT_PROBS 18: 16`; hub card foot "18 widgets · 31 checks · 16 problems"; ideas.html lists the old U18 titles/anchors (regenerate).
- JS layout: w1 = align, lookup · w2 = relay, qkv, scale, context · w3 = lab, heads, subspace · w4 = shuffle, clocks, rope, layernorm, block · w5 = mask, families, cost, tiny. Registry: window.U18.<name>.state(); 3-D: .labels() → spriteRects.
