# Unit 16 · Round 22 plan (16-main) — also my progress notes

## Files
- `tpl/u16-sec-a.html` Act I–II: s1–s4 · `u16-sec-b.html` Act III: s5–s7 · `u16-sec-c.html` Act IV-1: s8–s11 (W2V slots)
  · `u16-sec-d.html` Act IV-2: s12–s14 · `u16-sec-e.html` Act V: s15–s17 · `u16-practice.html` (§18, 16 problems) · `u16-derives.html`
- JS: `u16-kit.js` (helpers) · `u16-shared.js` (data + maths + `window.U16` registry) · `u16-hero.js` · `u16-w1.js` (Acts I–II)
  · `u16-w2.js` (Act III) · `u16-w3.js` (Act IV) · `u16-w4.js` (Act V) · then `u16-w2v.js` (16-w2v) last.
- Assembler contract (done day one): `tpl/u16-w2v.css` after `u16-head.css`; `<!--@W2V name-->` ← fragment
  `<!--@W2VFRAG name-->` of `tpl/u16-w2v.html`; `tpl/u16-w2v.js` last; each only if present (stub widget if absent).
- Every widget I own exposes `window.U16['w-…'] = {state(), …}`; verify-u16.js asserts state() against independent maths.

## Colour language
tokens `--s1` blue · context/neighbours `--s3` green · centre/target `--s4` gold · probability `--s6` cyan · loss `--critical`
· negatives `--s2` orange · topics: tea `--s2`, cricket `--s3`, travel/people `--s7`, animals `--s4`, places `--s6`, bat `--s5`.

## Sections (anchor picture · widgets · checks · drawers)
| id | title | anchor | widgets | checks | drawers |
|---|---|---|---|---|---|
| s1 | A word is just a label | phone directory vs city map | w-onehot (3-D) | c1 compute (√2), c2 predict (add "tea": nearest?) | one-hot √2 |
| s2 | A sentence is a chain of guesses | a guesser with a short memory; Shannon's game | w-bigram (`<s>`/`</s>`, path, memory selector, write) | c3 compute P(<s> I play cricket </s>)=1/4, c4 predict (bigram after "you drink") | chain rule; count ÷ total is MLE |
| s3 | Never seen is not impossible: smoothing | a new chaiwala in town | w-smooth (new 2-D) | c5 compute add-one 0.2, c6 predict V→50 000, c7 predict λ=0 | add-one sums to 1; interpolation sums to 1 |
| s4 | How surprised is the model? Perplexity | how many sides does the die have | w-perplexity | c8 compute 2, c9 compute V, c10 predict (different test texts) | geometric mean; uniform → V |
| s5 | You shall know a word by the company it keeps | kadak | w-cooc (+ term–document tab, substitutes vs topic-mates) | c11 compute 0.120, c12 predict (double chai), c13 predict (wide window) | cosine ignores scale |
| s6 | Not all company counts: TF-IDF and PMI | two people at the market | w-pmi (new: counts → expected → ratio → log → PPMI; TF-IDF tab) | c14 predict (word in every doc), c15 compute PMI(cricket, hot), c16 predict (rare pair) | PMI of independent words is 0; TF-IDF zero |
| s7 | Squeeze the table: friends of friends | the survey; friends of friends | w-svd-words (3-D, decluttered), w-friends (new 2-D) | c17 compute 9/14, c18 compute 0.5, c19 predict k=3 | energy; rank-k error; coffee makes chai and tea friends |
| s8 | From counting to predicting | train a guesser, then read its mind | static network figure; W2V window | c20 compute (5 words, C=1: 5 vs 8), c21 explain (keep the input table) | pair count 2Cn − C(C+1) |
| s9 | CBOW: the committee fills in the blank | the blank on the board / committee | W2V cbow | c22 predict swap, c23 predict window 2 | CBOW gradient: EH shared equally |
| s10 | Skip-gram: one word guesses its neighbours | new student guesses who sits around him | W2V skipgram | c24 predict (one distribution), c25 explain (rare words), c26 compute (lowest loss 2 ln 2) | skip-gram gradient; loss ≥ 2 ln 2 |
| s11 | CBOW or skip-gram? Race them | — (comparison table) | W2V lab | c27 predict (double C), c28 explain (small corpus) | — |
| s12 | Making it cheap | teacher: rank 50 000 / 5 yes-no / twenty questions | w-sgstep, w-cost (tabs: NS / tree / subsampling) | c29 compute 9 091, c30 compute 20 decisions, c31 predict football score | NS slope; pull/push; full softmax touches all; tree sums to 1; subsampling √ flattening |
| s13 | Why it works: counting and predicting meet | strangers who shop at the same stores | w-w2v (rebuilt 3-D convergence demo), w-ratio (new) | c32 predict (converge), c33 compute (k=1 → PMI), c34 predict (ratio 1) | SGNS optimum = PMI − ln k; GloVe ratio → difference |
| s14 | A neural language model | dabbawala relay | w-lookup, w-nlm | c35 compute row, c36 compute 150 | one-hot picks a row; only used rows move |
| s15 | The geometry of meaning | directions from the station | w-cosine, w-para, w-analogy (3-D, decluttered) | c37 compute (3,1,1), c38 explain skip inputs, c39 compute distance 1, c40 compute (3,4)/(6,8) | shadow keeps parallelograms; unit-vector distance |
| s16 | What one vector per word gets wrong — and how pieces help | bat / bank; pieces of a word | w-polysemy (3-D, decluttered), w-pieces (new) | c41 compute 0.707, c42 compute shared pieces, c43 predict BPE cut | blend cosine; BPE merges |
| s17 | What to carry forward | — | summary cards with mini-pictures | — | — |
| spractice | Practice arena (§18) | | | | |

## Practice (16)
P1 bigram + sentence prob with `<s>`/`</s>` · P2 add-one + interpolation · P3 perplexity (probabilities, uniform, reverse, diagnose)
· P4 TF-IDF · P5 PMI/PPMI · P6 cosine of count rows · P7 SVD energy / rank-k error · P8 window counts (general formula → apply)
· P9 CBOW pass + loss + error · P10 skip-gram pass + loss (two targets) · P11 NS loss + one update · P12 HS path probability
· P13 subsampling (reverse-engineer t) · P14 GloVe ratio · P15 BPE merges (tie rule) · P16 analogy + nearest by cosine.

## Progress log
- [x] audit written; plan numbers re-derived (all agree)
- [x] assembler contract + new file layout (stubs + warning when w2v files absent; counts widgets with extra classes)
- [x] Act I–II prose + w-bigram (<s>/</s>, chain path, memory tabs), w-smooth, w-onehot labels, w-perplexity preset — markers shown as ASCII <s> (⟨ ⟩ glyphs fall back to parens in UI fonts); in data-why write &amp;lt;s&amp;gt;
- [x] Act III prose + w-cooc (word×doc tab: nb 0.972 vs doc 0.8), w-pmi, w-friends, w-svd-words declutter (topic labels + hover)
- [x] Act IV prose (s8–s14) + figure, w-cost tabs, w-w2v rebuild (seed 118; cc ≥ 0.993 across 10 seeds), w-ratio
- [x] Act V prose + declutter w-analogy (layoutLabels, hover tips) / w-polysemy + w-pieces + cards with mini-pictures
- [x] hero (lede, phone camera), 30 derives in 15 drawers (compose_der.py), practice (16) — display maths fits 360/390 with drawers open
- [x] verify-math16.py rewritten: 147 checks — every number of s1–s17, the 30 derives and the 16 problems, data read from tpl/u16-shared.js (node) and the toy table from tpl/u16-w2v.js; every printed number also looked up in the page source (onpage)
- [x] verify-u16.js rewritten: 236 checks (4 clean runs in a row; the harness pokes the page awake if software GL stops painting) — counts, ids, chips, brand, nav; every widget's state() against independent maths and its Try line; controls, reset, NaN hunt; SVG labels (overlap by box or separating-axis for rotated text, clipping) at 1300/1440/390 incl. hidden tabs; 3-D sprite labels (labelRects) at 1300/390 and light; 360–1680 overflow; 390 label size ≥ 10.5 px; reduced motion; console
- [x] screenshots looked at: every widget at 1440 dark and 390 dark, 3-D stages + hero in light at 1440 and 390, prose tables at 390
- [x] fixes from the screenshots: 3-D labels now laid out on screen for every stage (layoutLabels: clamped inside, extra rings, optional labels hidden, drawn on top, ≥ 11 px, no flicker); one-hot/svd/w2v moved to it; tree tab narrow layout; fig-net spacing; cost bars narrow; cooc doc titles; ratio/w2v chart redraw on resize; tick labels ≥ 10.5 px; maths in upper-case table headers keeps its case (v ≠ V); narrow tables fit; phone hero framed below its caption; w2v trains without frames (fallback); stray-label guard in the explorer
- [x] student read-through: s11 "about a hundred sentences" (lab has 102); s12 and s7 openers sharpened; sgstep/cost/pieces Try lines made exact (verified)
- [x] report

## Notes
- old files backed up in the session scratchpad (u16-old/); derives composed by scratchpad/compose_der.py
- never write the word 'exam' (assembler regex); use 'test'

## Hand-off to the wiring pass (16-main)
- Counts: 43 checks · 23 widgets (5 in 3-D: w-onehot, w-svd-words, w-w2v, w-analogy, w-polysemy; 4 of the 23 are 16-w2v's) · 30 derivations in 15 drawers · 16 problems · sections s1–s17 + spractice (§ 18).
- verify-ux.js: EXPECT_CHECKS 16 → 43, EXPECT_PROBS 16 → 16 (ONLY=16 run: only these two mismatch). verify-practice.js: ['16',16,18].
- Old → new section ids: s1→s1 · s2→s2 (smoothing now s3) · s3→s4 · s4→s5 · s5→s7 (PPMI → s6) · s6→s8–s11 (NS round → s12, w-w2v → s13) · s7→s12 · s8→s14 · s9→s15 · s10→s16 · s11→s15 · s12→s17 · spractice → spractice (§13 → §18).
  Inbound links to fix elsewhere: Unit 17 → unit-16.html#s8 (neural LM) should become #s14; thread [16,'s11'] → 's15'; [16,'s5'] → 's7'.
- Suites: python3 verify-math16.py (147) · PW_CHROMIUM=… node verify-u16.js (236, ≈ 6 min under software GL; run alone).
- Proposed hub card: "Teaching a machine what words mean: guess the next word by counting (n-grams, smoothing, perplexity); know a word by its company (co-occurrence, TF-IDF, PMI, SVD); word2vec's two games — CBOW and skip-gram — made cheap with negative sampling; GloVe; subword pieces; and king − man + woman ≈ queen."
