# Unit 16 · Words as Vectors — Round 22 independent review (and fixes)

Reviewer-fixer, 2026-09-26, 08:20–09:25 UTC. Method: `dev/tpl/R22-REVIEW.md` steps 1–5, but every finding below was
also fixed in the sources unless it says otherwise. Sources touched: `tpl/u16-sec-a|b|c|d|e.html`, `tpl/u16-derives.html`,
`tpl/u16-practice.html`, `tpl/u16-head.css`, `tpl/u16-kit.js`, `tpl/u16-w1.js`, `tpl/u16-w2.js`, `tpl/u16-w3.js`,
`tpl/u16-w4.js`, `tpl/u16-hero.js`, `tpl/u16-w2v.css`, `tpl/u16-w2v.js`, `verify-math16.py`, `verify-u16-w2v.js`.
Reviewer helpers (not part of the site): `audits/u16-extract.py`, `u16-katex-wide.js`, `u16-monkey.js`, `u16-wshots.js`,
`u16-montage.py`, `u16-probe*.js`; screenshots in `shots/u16/` and `shots/review-u16/`.

## Verdict
Yes — with these fixes the owner can be proud of it. The teaching was already at the R22 standard: every
section has a real question, one anchor picture, the mechanism in tiny hand numbers before the formula, a "why", a trap
and a hook; CBOW and skip-gram are taught twice (by hand and in the lab) and compared side by side. The three biggest
problems were all *visual/finish* problems, not teaching ones: (1) eight display equations were silently **cut off** on
phones (no scrollbar — the suites' `scrollWidth` test cannot see it); (2) three widget tables needed sideways scrolling on
phones, hiding columns the Try lines talk about; (3) a few labels lied or collided (w-polysemy's "cricket words" floating
over the *animal* cluster, w-cbow's highlight bar on the "c" of "chai", the lab's "CBOW 0 / skip-gram 0" overprint).

## What I did (steps 1–5)
1. **Student read-through** of all 17 sections + 16 problems from the extracted text (`audits/u16-text.txt`,
   `audits/u16-practice-text.txt`), then the rendered page at 1440 and 390.
2. **Teaching standard** section by section: all 17 sections have the full rhythm; no section needed a rewrite (rule 12).
3. **Expert check**: every formula, name, date and attribution checked (below); `verify-math16.py` re-run after every
   edit (147 ✓); the key worked examples of s2–s16 and every practice answer re-derived independently.
4. **Every widget** by its Try line (the suites automate these), then a break-it pass (`audits/u16-monkey.js`: every button
   twice fast, every slider min → max → back, checkboxes, selects, text inputs with '', 'zzzz', 99999, theme flip twice) —
   **0 NaN/Infinity/undefined, 0 page errors in all 23 widgets**. Screenshots: every section at 1440 dark and 390 dark;
   hero at 1440/390 light at the "queen" moment; the five 3-D stages in their key states; changed widgets re-shot.
5. **Whole page**: hero clear of the text (1440, 390), no horizontal page overflow 360–1440, checks score 43/43 (suite),
   drawers open and KaTeX renders, practice renders.

## Must fix — all FIXED
1. **Display maths cut off on phones** (s1, s2@360, s3, s6, s9, s10, s12@360, s15). The glyphs ran up to 290 px past the
   right edge and were clipped with no scrollbar (e.g. s3 read "= 0.55" / "= 0.01" instead of 0.5583 / 0.0125).
   `.katex-display` reports `scrollWidth == clientWidth`, so the suites' overflow test passed. Found by measuring the
   descendants' right edge (`audits/u16-katex-wide.js`). **Fixed** by breaking each into `aligned` lines; now 0 clipped
   at 390 and 360 (the only hits left are KaTeX's hidden 400em SVG strips, not visible). verify-math16's on-page strings
   for e and E updated to the new TeX.
2. **w-cbow / w-skipgram tables**: the row-highlight bar (3 px inset) sat on the first letter of the word ("c" of chai).
   **Fixed** in `u16-w2v.css` (row headers padded .5rem left); checked at 1440 and 390.
3. **w-polysemy at 100 %**: "cricket words" was pushed ~200 px away and sat on top of the **animal** cluster — a lying
   label. **Fixed**: `layoutLabels` (u16-kit.js) gained an optional `maxFar` cap; the two group labels are optional and
   hide rather than drift (they now sit by their own group at 0/50/100 %, 1440 and 390).
4. **verify-u16-w2v.js page --quick timed out** (HANDOFF §7.1) waiting 10 s for the lab to notice it was off-screen, then
   used fixed sleeps. **Fixed**: the lab exposes `looping`; the test scrolls to the practice arena (no 3-D stage there, so
   software GL keeps painting) and waits on state `!visible && !looping` (120 s cap in page mode) before comparing two
   readings.
5. **Missing drawer note (HANDOFF §5)**: added to the §9 drawer, in words — the lab gives each committee member 1/n of the
   blame on h (the slope of an average, as §9 proves); the original word2vec C code averages to make h but hands every
   member the full blame. No new derive (counts unchanged).
6. **Wrong cross-reference** in the §2 drawer: "the same trick as fitting a Gaussian in Unit 14" — Unit 14's Gaussian fit
   uses no Lagrange multiplier. Now "the Lagrange recipe of Unit 11" (linked).
7. **A step missing from the §6 PMI worked example**: P(the) = 0.5 and P(match) = 0.25 were used but never derived.
   Added the row/column totals sentence.

## Should fix — FIXED
1. **Tables needing sideways scrolling on phones**: w-bigram counts (+122 px at 390), w-pmi steps (+38), w-friends
   rebuilt table (+157 — the "bat" column the Try line needs was off-screen). Compact phone CSS; below 380 px the bigram
   table drops its "total" column (the readout still gives it). Now 0 scrolling at 390 and 360.
2. **w-lab charts**: at the start both end labels clamped to the floor after separation → "CBOW 0" printed over
   "skip-gram 0". Clamp first, then separate.
3. **w-lab maps**: two names could touch ("sabzi"+"train" read "sabzitrain" at 1440). 3 px/1 px gap in the collision test.
4. **w-nlm map**: "football" ran into "we", "chai / coffee / cricket" stacked, "." sat on dots. New collision-free
   placement around each dot with thin leader lines (I and we still visibly share one spot, as the Try line says).
5. **w-pmi legend** said "blue = more than chance, red = less" in steps ① and ②, where the shade is only size. The legend
   now changes per step; the subtitle says so.
6. **Hero**: the "over" label was covered by bat's dot (1440 light/dark). Label moved beside its dot.
7. **§17 cards**: "2^1.75" typed with a caret → real superscript; a stray 4-px dash in the smoothing card → a small
   before→after arrow.
8. **Check options**: tiny stacked `\tfrac` fractions in c3, c5, c7 options → readable slash fractions; c5's wrong option
   now shows the actual slip ((1+1)/(3+1)) and its feedback names it.
9. **c38 distractors** "their cosine is always zero" / "the computer cannot compute their cosine" were not plausible →
   "A − B + C cancels them out, so their cosines are tiny" and "to make the search faster", each with a why.
10. **Wording**: §12 drawer "neighbour lists" (undefined) → "output vectors"; §15 "The peace treaty:" (literary) → plain;
    §6 why "the number of documents for IDF" → "the share of documents that contain the word"; §16 debiasing "can remove a
    direction" → removing it hides only part of the pattern; §16 "the tokens of the language models in Unit 19 are made this
    way" → most LLMs use BPE or a close cousin; P3(d) said "tested on text they had never seen" and then quoted training
    scores → reworded.
11. **Two small jumps** a first-time reader hits: why P(w₁) becomes P(I | ⟨s⟩) (one sentence added in §2), and the name
    "skip-gram" (CBOW's name is explained; skip-gram's now is too, in §10, tied to the bigram of §2).
12. Parentheses split from their formula at line ends on phones (§9 "(0.229, 0.229)", §12 "(√0.25 = 0.5)") → moved inside
    the maths.
13. **§13 precision**: Levy & Goldberg's result was introduced as what SGNS aims for "if it could train forever"; the
    real condition is that the vectors have room to give every pair its best score (the drawer already says so). Reworded.

## Nice to have — NOT fixed (why)
- w-analogy: the small grey neighbour chips (London, Kathmandu, prince…) sometimes sit on a dot or a parallelogram edge.
  Readable, optional labels; the ranked list beside the stage is the real readout. Left.
- §7 is the densest section (two worked SVDs); it reads in order and every step is there. Left (rule 12).
- w-w2v's seeded start has cos(chai, coffee) = −0.926 — dramatic but honest ("new start" shows others). Left.
- The site's fixed 2 px reading bar appears in *element* screenshots only. Not a page issue.
- Thousands separators: the 16-main widgets print "50,000" (u16-shared.js `commas`), the prose and the lab print "50 000".
  The site as a whole mixes both; cosmetic, left.
- At 390 px a full stop after inline maths sometimes wraps to the next line in the practice text (e.g. P6 "‖(3,4,0)‖ = 5 /
  ."). Cosmetic, left.

## What is excellent (keep)
- §8–§11 as a story: the register vs the guessing teacher, the committee on the board, the newspaper wicket, coaching
  class vs home tuition — each anchor carries the mechanism, and the exemplar's numbers are on the page, in the widget, the
  drawer and a practice problem.
- w-cbow / w-skipgram: seven honest moves with every number of the prose, the tables under the planes (look-up = a lit
  row), the 2 ln 2 floor for skip-gram vs 0 for CBOW.
- w-lab: claims limited to what 20 seeds show (and no k = 1 claim), "PCA shadow" said on the page, same start for both.
- w-friends and the §7 "friends of friends" drawer: the LSA aha with numbers a student can redo by hand.
- The traps are genuinely the ones students fall into (add-one drowning, perplexity across test sets, "the vectors we keep
  are not the answers", NS scores are not probabilities, analogies only work because inputs are skipped).

## Expert check (no errors found beyond the items above)
Firth 1957; Shannon 1948 (hand-made word approximations); Bengio et al. 2003 (tanh hidden layer, shared table);
Mikolov et al. 2013 at Google (CBOW, skip-gram; CBOW faster / better for frequent words, skip-gram better for rare words and
small data; HS better for rare words, NS for frequent; k 5–20 small data, 2–5 large; unigram^¾ noise; Huffman tree;
subsampling keep √(t/f), t = 10⁻⁵); Levy & Goldberg 2014 (SGNS optimum u·v = PMI − ln k, plain-count noise);
Pennington, Socher & Manning 2014 (ratios, ice/steam/solid/gas on 6 B tokens, f(x) = (x/100)^¾); Bojanowski et al. 2017
(fastText, n = 3…6 plus the word); BPE merge loop and tie rule; LSA; the "don't count, predict" myth (Levy, Goldberg &
Dagan 2015). Prose ↔ widget ↔ drawer ↔ practice agree (same toy numbers everywhere; lab claims = HANDOFF §5: ~10 passes,
2.95×, kadak far higher in skip-gram, chai close, nothing about k = 1).

## Counts and ids
Unchanged: 23 widgets (5 in 3-D) · 43 checks · 30 derivations in 15 drawers · 16 problems · practice §18. No section,
widget, check or control id changed; hero chips and `#score-total` (43) are true.

## Suites (final runs, after the last build, under the shared lock)
- `python3 verify-math16.py` — ✓ 147 checks (every number of s1–s17, the 30 derives and the 16 problems).
- `node verify-u16.js` — ✓ 236 pass, 0 fail (09:13–09:16 UTC; log `shots/review-u16/final-verify-u16.log`).
- `node verify-u16-w2v.js page` — ✓ 214 passed, 0 failed (09:16–09:18 UTC; log `shots/review-u16/final-verify-w2v-page.log`).
- `node verify-u16-w2v.js page --quick` — ✓ 212 passed, 0 failed (09:07–09:10 UTC, the build before the last two
  wording edits; log `shots/review-u16/verify-w2v-quick.log`) — the §7.1 time-out is gone.
- Break-it pass (`audits/u16-monkey.js 1440`): 23/23 widgets, no NaN/Infinity/undefined, no page errors.
- Clipped maths (`audits/u16-katex-wide.js 390,360`): 0 visible; widget tables: 0 sideways scrolling at 390 and 360.

## For the lead
- Nothing to rewire: ids and counts are unchanged (43 checks, 16 problems, practice §18) — HANDOFF §6 stands as written.
- The suites' `.katex-display` overflow test cannot see clipped maths (scrollWidth stays equal to clientWidth while the
  glyphs run past the edge). `node audits/u16-katex-wide.js 390,360 unit-17.html` (or unit-18.html) measures glyph
  boxes instead and works on any built page. Measured read-only on the current builds at 390 px (09:20 UTC): **Unit 17
  has 8 clipped displays** (s2 +73 px — "≈ 0.761" loses its last digit and h₃'s result; s3; s6; s7; s9; s10; two in
  practice, one +145 px) and **Unit 18 has one that matters** (s13 +86 px, "≈ ½(0.76 + 0.1…"; s8 is +1 px; s9's
  +4989 px is a hidden √ strip). Screenshots: `shots/review-u16/clip-u17-s2.png`, `clip-u18-s13.png`. Sent to the lead
  at 09:21 for the U17/U18 reviewers.
