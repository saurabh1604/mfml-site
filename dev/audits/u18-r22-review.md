# Unit 18 · Round 22 — independent review and fixes (reviewer-fixer, 2026-09-26)

Method: `dev/tpl/R22-REVIEW.md` steps 1–5, fixing as I went. Read every section's source as a first-time student;
recomputed every worked number, check, drawer and practice answer (python/node, independent of the page);
checked all 26 cross-unit anchors; screenshotted every section at 1440 and 390 dark, the hero and the four 3-D
stages plus the Hindi widgets in light, and every widget's non-default states (reviewer scripts
`dev/shots/u18-states.js`, `dev/shots/u18-stages.js`; images in `dev/shots/u18/` and `dev/shots/u18r/`), and looked at them.

**Verdict.** A strong unit: a real story from the interpreter's notes to the tiny transformer, clean tiny numbers,
honest "hand-made" labels, and widgets that are mostly correct and well tested. The three biggest problems were
(1) every "Rule of thumb" box collapsed to a 1-px line, so its text spilled under the next block on every width;
(2) the §12 handshake numbers were wrong (10 people make 45 handshakes, not 100); (3) the Hindi had no font of its
own, so हूँ was drawn by whatever fallback the device had (on the sandbox its chandrabindu sat in the wrong place).
All three are fixed.

## Must fix
| # | where | problem | status |
|---|---|---|---|
| M1 | all 11 `p.rule` (s1–s12) | The site CSS has `hr,.rule{height:1px}`; the unit's `p.rule` never reset it, so each rule-of-thumb box was 1 px tall and its text overflowed onto the next paragraph/callout (seen at 1440 in s1, s2, s4, s5… and at 390 over the Unit 19 cache preview). | **Fixed** — `u18-head.css`: `height:auto`, margin. New suite test: every box as tall as its text, ends before the next block. |
| M2 | s12 Imagine-this, hook | "10 people … about 100 handshakes", "1 000 guests … a million", "grown 10 000 times" — wrong: C(10,2) = 45, C(1000,2) = 499 500, growth ×11 100. | **Fixed** — correct numbers, plus one sentence on why attention counts more than handshakes (each pair from both sides, and each word with itself: 10 × 10 = 100). `verify-math18.py` now checks the combinatorics (was checking only (1000/10)²). |
| M3 | Hindi everywhere (w-align, w-families, §1 prose/readouts) | No Devanagari face on the page: labels fell back to the device's font; in the sandbox (FreeSans) the chandrabindu of हूँ was misplaced. | **Fixed** — Noto Sans Devanagari 500/700 (OFL, copyright kept in the font), subset to the 12 letters used (2.8 KB each), as its own family `U18 Deva`, placed after Inter/Newsreader in `--ui`/`--body` and on SVG labels with Hindi (`dv()` in `u18-kit.js`). Checked 1440/390, dark/light. Suite test added. |
| M4 | s3 prose | "That is self-attention (Vaswani and others, 2017…)" credits them with inventing self-attention; they built the transformer from it. | **Fixed** wording. |
| M5 | s8 rule of thumb | RoPE "nothing to learn, any length" overclaims (models read best at practised lengths). | **Fixed** with a one-line caveat. |
| M6 | w-layernorm | At the Try line's own state (γ = 2, β = 1) the result panel stayed ±3: the 3.828 bar was cut and its label sat on the panel title. | **Fixed** — panel grows to fit; coarser ticks on phones. Suite test added. |
| M7 | w-clocks › compare | At 1440 the three legend items ran into each other (text over the next swatch). The SAT text test cannot see swatches. | **Fixed** — measured, wrapping legend. Suite test: no swatch touches a text. |
| M8 | w-attnmap, 12-word sentence, 1440 | First and last beads (and "close") cut by the stage edge. | **Fixed** — camera backs off to fit the row (desktop; phones already squeeze the row). Suite now requires all 12 words + 12 shares on screen. |
| M9 | w-rope › three clocks | The three 3-D labels sat across the dials, covering the arrows of the dial above. | **Fixed** — each label beside its dial, shorter; readout lists the three cosines. |
| M10 | w-mask › every guess at once, 1440 | "(nothing after)" of the right block cut off at the SVG edge. | **Fixed** (block moved left). Suite test added at 1440. |

## Should fix (all fixed unless noted)
- **w-families**: Try line said "drag the text length to 512", but it starts at 512 → now "starts at 512 … drag it to 1 024: 153.6 against 1 023".
- **w-families › encoder–decoder**: cross-attention rows are labelled by the decoder's *input* (`<s>`, मैं …) while §1's map rows are labelled by the word *being written*, so row मैं looks at "tea" — confusing next to "= §1". Added a caption line ("each row writes the word after its →; row `<s>` looks at "I" before writing मैं"); weights shown as 0.10, not 0.1.
- **w-attnmap**: at temperature 0.3 the chips/readout printed "1" for 0.99985 → now "0.9999" (matches Try and c13).
- **w-scale** at d = 512 raw: printed "top share 1", "slope 0 — frozen" → "> 0.9999", "< 0.0001"; meter has a "weak" band.
- **w-context**: sentence-B shares printed unpadded (0.5 vs 0.500); the "the" pair said "two meanings" → "“the” hardly moves bank".
- **§6**: "it"'s thing bar 0.82 is 0.77 from head 1 plus a little from head 2 — now said.
- **§1**: "decoder's state" glossed (its running note, as in Unit 17); additive example states W₁h + W₂q = h + q; rule of thumb no longer implies only additive handles different lengths.
- **§3**: `q = W_Qᵀx` (unexplained transpose) → `q = x W_Q`, matching `Q = XW_Q`; "a thousand workers can still use only one" → steps must run one after another.
- **§4**: "drunkard's walk" → "coin-toss steps". **§12 Why**: "a relay keeps one busy" → accurate.
- **§11**: BERT's second pre-training game (next sentence) mentioned; "tokens" glossed at first use.
- **c5**: option "attention: all of it" → "nothing fades — word 1 is one hop away".
- Next card: "train them on the whole internet" → "a huge pile of text".
- Big numbers (1 048 576 …) no longer break across lines (no-break spaces in text and readouts).
- Card headings "DIVIDE BY √D", "THE N² PRICE": math letters kept lower-case.
- **w-align frame cost**: no SVG glow filters while the story plays (they return at rest); no drawing while off-screen (IntersectionObserver), catches up when seen. Sandbox: page work ≤ 26 ms per frame; rAF gap median 1 667 ms → 767 ms (SwiftShader raster), 4 → 9 frames in the 6-s story.
- **w-cost**: 100 000 words × 12 × 12 printed "≈ 2880 GB" → "≈ 2.88 TB".
- `assemble-u18.js`: brand/leftover scans skip embedded font data (the new base64 happened to contain "U15").

## Not changed (and why)
- w-align still rebuilds its SVG each animation frame (~100 nodes, ≤ 27 ms page work); a finite 5-s story, now paused off-screen. Worth one look on a real phone, as HANDOFF §7.5 says.
- c6 has two options that both say "(1, 1)" with different reasons — a deliberate reasoning check; kept.
- Tiny-transformer loss: prose "≈ 0.45", widget "0.446" (exact 0.4456) — consistent by rounding; kept.

## Verified correct (no change)
All worked numbers (additive 0.490, A₃₃ = 0.503, consistent in prose, widgets, practice, derivations); all 31 checks
(answers and every wrong option's feedback); all 16 practice problems; all 18 derivations; names/dates (Bahdanau–Cho–Bengio
2015, Luong 2015, Vaswani 2017, ELMo/BERT 2018, GPT 2018, T5 2019, RoPE in LLaMA, GPT-2 pre-norm, BERT 15 % · 80/10/10);
all 26 anchors into Units 1–17 point at the right sections (U16 #s16; U17 #s3/#s5/#s7/#s9/#s11/#s12); end card
"Unit 19 · The Maths Inside an LLM — upcoming", no link. Old overlaps: w-attnmap column labels clean at 1440 and 390;
w-cost ticks clean. Hero clear of the text at 390 (scene above the kicker); desktop sizes checked by the suite.

## What is excellent (keep)
The interpreter/notes anchor carried from §1 to cross-attention in §11; the chameleon "bank" with a slide formula in the
drawer; the √d three-way table; the class-covering-the-answers picture for the mask; the permission grids of w-families;
the 12-step tiny transformer; honest "hand-made" labels on every toy.

## Suite results (final build)
- `python3 verify-math18.py` — ALL 172 CHECKS PASS (was 170; the handshake check now tests C(10,2) = 45 and C(1000,2) = 499 500, plus the lab's "0.9999" print).
- `verify-u18.js` (under the shared lock) — ✓ UNIT 18 WIDGETS PASS · 189 checks (was 185). New reviewer tests: rule-of-thumb boxes are as tall as their text; the Devanagari face is loaded and used on every Hindi SVG label; the layer-norm result bar is drawn whole at γ = 2, β = 1; no clocks-legend swatch touches a text; every-guess-at-once has no cut label at 1440; a 12-word lab sentence keeps all 12 words and 12 shares on screen. Log: `audits/u18-r22-review-verify2.log`.
- Hero clear of the intro text: 70 / 76 / 67 / 79 px at 1280 / 1440 / 1568×757 / 1920 (suite); at 390 the scene sits above the kicker (screenshot).
- Counts unchanged: 18 widgets · 4 in 3-D · 31 checks · 18 derivations in 10 drawers · 16 problems; practice is §15; no id changed.

