# Unit 16 · word2vec widgets (16-w2v) — progress notes

Owner files: `tpl/u16-w2v.html`, `tpl/u16-w2v.css`, `tpl/u16-w2v.js`, `verify-u16-w2v.js`, `shots-u16-w2v.js`, `w2v-harness.html`.

## Day 1 · prototype of the lab (Node, scratchpad)
- Corpus: 102 short sentences (drinks / cricket / travel / food + little words), 582 tokens, 108 word types; kadak ×3 (drinks), googly ×3 (cricket).
- Both models: negative sampling, unigram^0.75 noise, fixed window C, same init (input uniform ±0.5/d, output 0), same sentence order per pass (seeded), separate negative-sampling streams.
- CBOW splits the blame for h equally among the committee (exact gradient of the average, as in s9). NOTE: the original C code gives every member the full blame — we follow the maths of s9 and say so.
- d = 2 is unstable across seeds (skip-gram topic score 0.01…0.40). d = 8 with a PCA shadow of the (length-1) vectors reads best; 4 groups visible for skip-gram.
- Defaults chosen: d = 8, C = 2, k = 5, η0 = 0.1 decaying linearly to 0 over 40 passes, no subsampling.
- 20 seeds at defaults: cost ratio exactly 2.95 (pairs / positions); topic score skip-gram > CBOW at passes 5, 10, 20, 40 in 20/20 seeds (end means 0.48 vs 0.32); rare-word fit (mean cos to own topic − mean cos to other topics) kadak 0.57 vs 0.35 (20/20), googly 0.46 vs 0.25 (20/20); chai 0.51 vs 0.46 (17/20 — close; both list 3–4 drinks in the top 4).
- Holds for C = 1…4, k = 10, η0 ∈ {0.05, 0.2}. Does NOT hold for k = 1 (CBOW topic score higher) — no claim about k = 1.
- Subsampling (t = 0.02 for this tiny text): ratio 2.79; CBOW improves most (end 0.45 vs 0.32); rare-word gap shrinks (kadak 19/20, googly 15/20).

## Day 1 · build
- Engine (`W2VE`, pure maths between `/*@ENGINE*/` markers so Node can load exactly the page's code): toy CBOW/skip-gram rounds (full softmax), window stops, the lab corpus + negative-sampling trainer, metrics (topic score, word fit, neighbours), PCA shadow (Jacobi 8×8, exact).
- w-window: adaptive SVG (row layout on wide screens, column layout on phones); arrows run into the middle word (CBOW) or out of it (skip-gram); tally squares per stop; trays of every example; running sums.
- w-cbow / w-skipgram: one renderer, seven moves each, three pixel-exact panels (input plane, output plane, guess + error), the input/output tables under the planes (lookup = rows light up), narration with the exact numbers, loss-by-round strip, η slider, window-2 committee (we all drink chai daily after cricket; all = (2,−1), after = (−1,2) keep h = (0.5, 0.5), V = 7).
- w-lab: two canvases (PCA shadows, Procrustes-aligned frame to frame, topic clouds as wide as each topic's spread), stat chips, neighbour lists with "fits" scores, three charts (topic score, work, loss), slow motion (the examples and noise words of each position), settings restart the race, off-screen pause, reduced motion = finished race.
- Sandbox note: with the SwiftShader GL flags this sandbox composites large pages at 1–5 fps (software GL); default flags give ~60 fps. The widgets use no WebGL, so the harness verify runs with default flags and every animated check waits for widget state, not wall-clock time.
- Scratchpad is shared with other agents: my helpers live in scratchpad/w2v/.

## Verified lab behaviours (defaults; engine run in the browser; `node verify-u16-w2v.js`)
- Cost: 23 280 CBOW guesses vs 68 640 skip-gram guesses per race (ratio 2.948, window 2 on short sentences; window 1 → 1.65×, window 4 → 4.49×). Dot products 137 133 vs 404 612 for seed 1.
- Topic score (mean within-topic cosine − mean between-topic cosine, 19 topic words): skip-gram > CBOW at passes 5, 10, 20 and 40 in 20/20 seeds. Pass 10: skip-gram 0.38–0.49, CBOW 0.05–0.13. End: skip-gram 0.428–0.511 (mean 0.475), CBOW 0.243–0.371 (mean 0.318).
- Rare words (seen 3×): fit(kadak) skip-gram 0.50–0.66 vs CBOW 0.23–0.40, higher in 20/20 seeds (gap ≥ 0.11); googly 0.38–0.57 vs 0.18–0.30, 20/20 (gap ≥ 0.10). Frequent word chai: skip-gram ahead by only 0.048 on average (13/20 seeds) vs 0.262 for kadak.
- Subsampling (t = 0.02 for this tiny text): ~20 300 positions instead of 23 280; CBOW end topic 0.46, skip-gram 0.51; kadak still better in skip-gram 10/10.
- k = 1 reverses the topic score (CBOW higher in 10/10) — no claim is made about k = 1.

## State at hand-off
- Fragments (tpl/u16-w2v.html, markers `<!--@W2VFRAG name-->`): `window` → #w-window · `cbow` → #w-cbow · `skipgram` → #w-skipgram · `lab` → #w-lab. Placeholders in 16-main's sections: `<!--@W2V window|cbow|skipgram|lab-->` (s8, s9, s10, s11). Control ids are prefixed w2w-, w2c-, w2s-, w2l-; CSS is scoped to the four widget ids. 4 widgets, 0 in 3-D (SVG + 2-D canvas).
- `node verify-u16-w2v.js harness` → 214 passed, 0 failed (≈3 min). `node verify-u16-w2v.js page` (after assemble + gen-site + build) → 214 passed (≈10 min: the real page composites at < 1 fps with software GL in this sandbox; my widgets' own frame work is 2–4 ms with default compositing, ≤ 22 ms under software GL).
- Screenshots: shots/u16-w2v/ — 25 states × {1440, 390} × {dark, light} from the harness; 1440 dark also from the real page. Looked at: window (rest, mid-slide, skip-gram, C4 on 10 words), machines (every move, window 2, rounds 5–6), lab (start, pass 5/10, end, googly, slow motion, subsampling).
- Machine additions beyond the brief: the exact input/output tables under the planes (lookup = rows light up), the skip-gram floor 2 ln 2 ≈ 1.386 (each slot creeps to 0.5; CBOW's loss heads to 0 — both tested), labels that fit the frame (no forced placements in any normal state, tested).
- Not done / for the lead: CBOW in the lab uses the exact 1/n share of the blame (as s9 teaches) — the original C code gives each member the full blame; the page never needs to say so unless it discusses implementation. No claim about k = 1 (it reverses the topic score).
