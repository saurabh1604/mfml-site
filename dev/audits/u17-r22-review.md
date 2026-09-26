# Unit 17 · Machines with Memory — Round 22 independent review (and fixes)

Reviewer + fixer, 26 Sep 2026, 08:20–10:25 UTC. Method: `dev/tpl/R22-REVIEW.md` steps 1–5, except that every finding was fixed in the sources where it could be.

**What I did.** Extracted the built page section by section and read all of it as a first-time student: hero, §1–§14, all 23 drawer proofs, all 37 checks with every
option's feedback, and all 16 problems. Recomputed the worked numbers (python/node). Re-ran the tiny language model in node, independently of the page (`audits/u17rev/talk*.js`).
Screenshots, all looked at:
- every widget in every Try state at 1440 dark (`shots-u17.js 1440 dark try all`) and 390 dark;
- the 3-D stages and the hero in light;
- the sections at 1440 dark, and the table-heavy ones at 390;
- the hero at 1280×800, 1440×900, 1568×757, 1920×1080 and 390×844 (`shots/u17-hero-sizes.js`, which also prints every hero label's screen box).

A small probe (`shots/u17-ticks-probe.js`) lists the axis ticks that the declutter pass hides on the charts, over the key states, at 1300 and 390. Scratch and backups of
the original sources are in `dev/audits/u17rev/`.

## Verdict
Yes — with the fixes below, the owner can be proud of this unit. The text is clean, simple and correct, and the story builds act by act. Every section has its question, anchor,
mechanism before formula, "why it works", trap, checks and one-sentence hook, and the numbers all check.

The three biggest problems were:
1. **The new talking model's dice were broken.** Every sampled line began with "agra", at every temperature. Even at T = 0.2, where the first letter should be "p" 55 % of the
   time and "a" only 3.6 %, it still began "agra". So the widget contradicted §5's own lesson that a low T comes close to greedy.
2. **Wrong or confusing details in the text and checks.** The whisper line was off by one step, c9's answer did not match its own numbers, "W is used T − 1 times" was wrong,
   and the tank's "gold = how open the drain is" said the opposite of f = 1 = keep.
3. **The hero's "× 0.5 / × 1.5 each step" tag ran off the stage** at 1280 and 1440, and under the contents list at 1568 and 1920.

## Must fix — all fixed
1. **w-talk dice (§5) — FIXED.**
   - *The bug.* `park(seed)` was Park–Miller seeded with the dice number, so its first roll was ≈ 7.8·10⁻⁶ × the dice number. The first sampled character was therefore
     always the first character in the model's alphabet with a non-tiny probability, which is "a" (space and full stop have ~10⁻⁹ here). Dice #1–#5 all began "agra …" at
     T = 0.2, 0.5, 1 and 1.5 — though "a" should come first only 4–10 % of the time.
   - *The fix.* Replaced it with mulberry32, started from a hash of the dice number. The same generator is now used in four places: the page, `verify-u17.js`'s independent
     re-run, `verify-math17.py` (with a new "fair from the first roll" check) and `train-u17-talk.py`'s demo printout. The trained weights are untouched; their md5 is unchanged.
   - *The new Try line*, asserted in both suites. With dice #1:
     - T = 0.2 writes the greedy line again;
     - T = 0.5: "patna will leave from platform one. the train to agra will leave from platform three.";
     - T = 1: "patna is cancelled today. the train to surat is cancelled today.";
     - T = 2 babbles ("pendy mare tom frimn …").
   - *Checked over dice 1–100.* Share of lines made only of real words: 100 % at T = 0.5, 81 % at T = 1, 35 % at 1.5 and 8 % at 2. So §5's table holds.
   - *Unchanged claims, re-checked:* greedy "patna will arrive on platform three." then repeats; "p" 0.171; "buny misun"; 6.507 over 26 characters.
2. **§7 whisper line was off by one — FIXED.**
   - *Before:* "The first child whispers … by the tenth child a thousand times quieter … 58 times." That is only 9 passes, which gives 1/512 and 38×.
   - *Now:* the teacher whispers to the first child. That is ten halvings: 0.5¹⁰ ≈ 1/1000 and 1.5¹⁰ ≈ 58, matching the formula and w-power.
3. **c9 (§6) — FIXED.**
   - *Before:* the correct option said "≈ −0.466", and the feedback said "−0.144 − 0.159 − 0.162 ≈ −0.466". But those three numbers add to −0.465.
   - *Now:* the question gives the reports to four places (−0.1444, −0.1588, −0.1623). The options are −0.1623, ≈ −0.1552 (the average) and −0.4655, which is the value
     the widget, drawer and prose show. verify-math is updated to match.
4. **w-unroll said W is used T − 1 times — FIXED.**
   - *Before:* §2's cell uses W·h₀ at the first word too, but the chain drew no arrow into the first copy.
   - *Now:*
     - a gold W arrow h₀ → copy 1;
     - the readout says "W is used 5 times, once in every copy";
     - the folded cell reads hₜ / xₜ, not h₁ / x₁;
     - c4's feedback ("once per word (99 times after the first)") is rewritten to agree;
     - the suite now asserts that 8 words → 8 uses.
5. **The hero tag left the stage — FIXED.**
   - *Before:* the backward run's "× … each step" tag was pinned at the loss crystal. The hero probe measured its screen box:
     - at 1280 it ended at 1288 on a 1280 stage;
     - at 1440 it ended at 1452 on a 1440 stage;
     - at 1568×757 and 1920 it ran under the contents list.
   - *Now:* the tag sits over the last hop. A new suite test checks that it stays inside at 1300, 1600 and 1920.
   - *The belt itself* was already clear of the text at 1280, 1440, 1568×757, 1920 and 390. Measured: its first box is ≥ 55 px right of the lede, and the loss crystal is left
     of the edge or the contents list.
6. **Tank widget (§9): the forget gate's picture contradicted the text — FIXED.**
   - *Before:* the caption said "the drain valve is the forget gate … gold shows how open each valve is". So f = 1 drew a fully open drain, while the Try line says "close
     the drain (f = 1)" and the Trap says f = 1 keeps everything.
   - *Now:* the caption says f is how much is kept, the drain lets out 1 − f, and a full gold ring on f means "keep everything".
7. **Hidden axis ticks — FIXED.**
   - *w-power*, with tanh at w = 1.5 (the Try line's buttons, pressed in turn): the "▾ below the floor" markers were text next to the tick row, and the declutter hid the
     ticks they touched (seen at 45 and 50). The markers are now small shapes inside the plot.
   - *w-eigen-memory at 390:* tick 30 and the top "1" were hidden by the enlarged axis title and legend. Ticks and titles now have rows of their own on phones.
   - The probe now finds no hidden chart tick at 1300 or 390. The one exception is the GRU plane's "0.5", which sits under the old-note arrow by design.

## Should fix — all fixed
8. **§7 table vs the tanh view — FIXED.** The fade/keep/explode table said that above 1 the blame "explodes", while w-power with tanh (and the §7 drawer) show that tanh
   can turn it into fading. The cell now reads: "explodes while the note is small, and training jumps wildly (once tanh has squeezed the note flat, the blame fades instead)".
9. **§5 exposure-bias trap — FIXED.** It presented a typo in the *seed* as the model's own slip. Now it reads: "pretend the model had slipped and written 'trian' … it carries
   on with 'buny misun' — words that are in none of its 300 sentences." I checked this against the corpus.
10. **w-power tanh view — FIXED (deepened).**
   - *Before:* turning tanh on changed the bars with nothing to compare them against.
   - *Now:* dashed outlines show the plain powers. At w = 1.5 the readout explains the surprise: the note gets stuck near 0.86, where tanh is flat, so each step passes on
     about 0.39 and the explosion turns into fading. The Try line says so.
11. **w-seq2seq — FIXED.**
    - At 50 words the decoder still shows only the five Hindi words, so its label now says "writes Hindi (its first words)".
    - "word 1 speaks at …" moved to its own line under the word rows.
12. **w-gates-compare — FIXED.** The plain cell's one block was labelled "h̃ · tanh", but h̃ is the GRU's candidate. It is now "h · tanh".
13. **w-clip legend — FIXED.** It named gold and red steps but not the blue ones. It now says "blue ordinary, red a long unclipped step, gold clipped".
14. **Phones — FIXED.**
    - *w-lstm:* the chart's top row gives accuracies at 50 words, but it sat next to a table for the current length. The subtitle now says so.
    - *Comparison tables (§5, §6, §11, …):* at 390 the 4- and 5-column tables hid their last column off to the right. They now have tighter padding and a wrapping first
      column, and they fit.
    - *w-bidir:* the caption said "forward above, backward below", which is false in the phone layout (columns). It now says "on one side … on the other".
15. **Links and history — FIXED.**
    - §13 credited the chain rule of probability to Unit 14. It is taught in Unit 16 §2, and the link now points there (`unit-16.html#s2`).
    - §12 said "exactly what the first translation systems of 2014 showed". It now says "what researchers found with the first neural translation systems in 2014 (Cho and
      colleagues)" — Sutskever et al. (2014) did well on long sentences.
16. **Small text — FIXED.**
    - "How this little model was made" named a script that students cannot find. It now adds "kept with this site's source code".
    - §13's greedy line left a lone "." wrapped at 1440. Reworded.
    - The unroll readout "for 5 words, or 3000" now reads "the same for 5 words or for 3000".

## Tidy-ups, and regressions of my own that I caught
- **w-lstm chart.** It now has separate rows for the ticks and the axis title, and the phone "5" is nudged clear of "30 %". My first tweak here (moving the tick row 2 px
  down) made the declutter hide ticks 25 and 30 at 1440; the light-theme shot showed it, and the separate rows fixed it.
- **w-gru dial on phones.** "old" and "new" now sit beside the dial. My first placement clipped "new" at the edge; the suite caught it (8 failures) and it is fixed.
- **w-power on phones.** The axis title "t →" moved into the right margin.
- **w-unroll on phones.** The W labels are hidden from 6 words, where the chain is tiny; the gold arrows remain.

## Nice to have — not fixed, with reason
- **The memory lab's `seeded()`** has the same small-seed first roll: the very first filler of each length's first trial is ≈ −A. Its effect on the 400-trial accuracies
  is negligible, and changing it would move every verified lab number (51.2 %, 45.8 %, 85.5 %, …). Left alone.
- **w-talk's bars** print a probability of 0.99997 as "1", because of rounding to 4 places.
- **In the GRU plane,** the x tick "0.5" hides under the old-note arrow. This is the declutter working by design; the dashed ±1 frame still gives the scale.

## Checked and fine — keep
**Numbers.** All 140 checks of `verify-math17.py` pass: the builder's 138 plus two new dice checks. I also recomputed:
- §1: (−2, 2) and (0, 0), and all six orders;
- §2: 0.7616, 0.3634, 0.1797;
- §4: 0.609 … and 0.495;
- §5: T = 0.5 and T = 2 — 0.263 everywhere (page, drawer, verify), never 0.264;
- §6: 0.4838 × 0.4340 ≈ 0.2100, −0.4655 and −0.3211;
- §7: the eigen split and 0.8246;
- §8: (3, 4) and 53.13°;
- §9: 1.2616, 0.6225 and 0.281;
- §10: 0.6969, and 24 704 / 74 112 / 98 816;
- §11: 0.1797 and 57 600;
- §12: 0.9⁴⁹;
- §13: 0.20 and 0.36; BLEU 0.636, 0.450 and 0.2231; the "delayed" trap's 0.55;
- all 16 problems.

**Facts.** All correct: LSTM 1997 (Hochreiter & Schmidhuber); forget gate 2000 (Gers, Schmidhuber & Cummins); GRU 2014 (Cho et al.); BLEU 2002 (Papineni et al.); forget
bias 1–2; truncated BPTT; exposure bias; the GRU z-convention trap.

**Links.** Every cross-unit link resolves: U3 #s2d/#s9, U4 #s5, U6 #s8/#s10, U9 #s4, U11 #s5, U14 #s7/#s10/#s11, U15 #s1/#s2/#s4/#s6/#s8, U16 #s2/#s14, U18 #s1.

**Checks.** All 37 have one right answer each, plausible wrong options, and feedback that explains.

**Excellent, worth keeping:**
- the quarter-turn order example and its 180° check;
- the card-of-fixed-size anchor;
- the step machine;
- the whisper line with the "keys … are" example;
- the eigen-memory rebuild, which reads in 5 seconds;
- the LSTM express lane with the honest 0.9⁵⁰;
- the talking model's teacher-forcing tab;
- the Teddy example;
- BLEU's "same meaning" preset, and P16.

## Counts and ids
No count changed: 17 widgets (4 in 3-D) · 37 checks · 23 derivations · 16 problems, with practice as §15. The hero chips and `#score-total` still say 37. No section, widget,
check or control id changed. One link target changed: §13's chain-rule link now points to `unit-16.html#s2`, which exists.

## Suites (final build, `site/unit-17.html` md5 fde24085…)
- `python3 verify-math17.py`: ✓ all **140** checks pass. That is the builder's 138 plus two new ones: the dice's four Try-line lines, and "fair from the first roll".
  `train-u17-talk.py` still rebuilds the identical weights file (md5 90e68d59… unchanged; only its demo sampler changed). I smoke-tested it end to end with 5 steps into a
  scratch file, but did not re-run the full 6 000-step retrain on the shared machine.
- `verify-u17.js`, run under the shared lock: **171 / 171 pass**, "✓ UNIT 17 WIDGETS PASS", no console errors, in about 3½ minutes of run time.
  - That is the builder's 167 plus: dice #1 at T = 0.2 (+1), and the hero tag inside the stage at 1300 / 1600 / 1920 (+3).
  - Updated assertions: the dice lines, 8 words → W used 8 times, and c9.
  - Earlier runs: the first had 8 failures, all "clipped 'new'" in the phone GRU dial — a regression from my own first placement, fixed. The second was 171/171.
- Not run by me: `verify-practice.js` and `verify-ux.js` (not mine; they need the lead's §6 wiring first), and `gen-site.js`.

## Files changed
- **Sources:** `tpl/u17-sec-a.html`, `u17-sec-b.html`, `u17-sec-c.html`, `u17-sec-d.html`, `u17-sec-e.html`, `u17-w1.js`, `u17-w2.js`, `u17-w3.js`, `u17-w4.js`, `u17-w5.js`,
  `u17-hero.js`, `u17-head.css`.
- **Scripts:** `verify-u17.js`, `verify-math17.py`, `shots-u17.js` (new Try states: T = 0.5, tanh at w = 1.5, GRU z = 1 and z = 0), `train-u17-talk.py` (demo sampler only).
- **Generated:** `src/unit-17.html`, `site/unit-17.html`.
- **Untouched:** the talk weights `tpl/u17-talk-model.js` and `assemble-u17.js`.
- **Review helpers, safe to leave out of the commit:** `shots/u17-hero-sizes.js`, `shots/u17-ticks-probe.js`, and `audits/u17rev/` (scratch, logs, and backups of the original
  sources).
- **gen-site:** none of my edits changes a section title, "In one sentence" hook, realization or widget title, so the lead's 09:13 gen-site output (search index,
  ideas.html) is still accurate for Unit 17.
