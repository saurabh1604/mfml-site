# Unit 16 · Round 22 audit (16-main) — written before any page change

Baseline: `node assemble-u16.js && node build.js unit-16.html` builds; `verify-u16.js` passes except one timing
flake (`sg run`: ten animated steps did not finish inside 7.5 s on swiftshader — the loss itself was 0.026 < 0.03).
Screenshots of every widget at 1440 dark + hero at 390 were taken and looked at (shots/u16/, round-22 baseline).
Every number of the plan (u16-R22.md §B) was re-derived in a scratch script: all agree, including the BPE tie at
merge 5 (p+ug vs hug+s, both 5 — the "earliest pair in reading order" rule picks p+ug).

## 1 · Sections (old id → verdict)
| old | title | verdict | notes |
|---|---|---|---|
| s1 | Why a computer can't read a word | **keep + deepen** | shopkeeper codes and one-hot facts are good. Missing: what a *token* is (`<s>`, `</s>`, lower-casing, punctuation), the unit's anchor picture (phone directory vs city map), a five-act roadmap, a predict-type check. |
| s2 | Guess the next word by counting | **rewrite** (→ s2 + s3) | only says *what* (count ÷ total). No chain rule, no Markov assumption ("a guesser with a short memory"), no MLE link to Unit 14, no `<s>`/`</s>`, no Shannon's game, no trap. Smoothing is squeezed into two lines; no add-k, interpolation or backoff; no "add-one drowns the data" trap. |
| s3 | Perplexity | **keep + deepen** (→ s4) | good. Add the bigram sentence (P = 1/2 over 4 predictions → 1.189), the "how many sides does the die have" anchor, the same-test-text trap. |
| s4 | Company it keeps | **keep + deepen** (→ s5) | kadak + Firth are strong. Missing: term–document matrix; the insight that window size decides the *kind* of similarity (substitutes vs topic-mates). |
| s5 | Squeeze with the SVD | **split** (→ s6 PMI/TF-IDF, s7 SVD) | PPMI is only a paragraph and a drawer; TF-IDF absent. SVD part good (survey, 4×4 numbers) but has no "aha" — add latent similarity (chai/tea never meet, coffee makes them friends; LSA). |
| s6 | word2vec | **rewrite** (→ s8–s11 + s12) | only skip-gram-with-negative-sampling as a yes/no game. No CBOW, no real skip-gram (softmax over V), no network picture, no "throw the game away, keep the input table", no comparison. The negative-sampling worked round (0.948 → 0.505) and w-sgstep are good → move to s12. |
| s7 | Why not full softmax | **extend** (→ s12) | keep the teacher anchor + 8 333× + unigram^¾. Add hierarchical softmax and subsampling. |
| s8 | Neural language model | **keep + deepen** (→ s14) | good relay story; add that the table is the same object word2vec learns and that the fixed window is what Unit 17 removes. |
| s9 | Geometry of meaning | **merge with s11** (→ s15) | parallelogram is good. Add nearest neighbours, how embeddings are tested, projection caveat in the prose. |
| s10 | What embeddings get wrong | **extend** (→ s16) | polysemy + bias good; add unknown words, fastText, BPE, road to Unit 18. |
| s11 | Measuring similarity | **merge** (→ s15) | shoppers example is good; becomes the "three rulers" part of s15. |
| s12 | Carry forward | **rewrite** (→ s17) | text-only cards; spec wants a mini-picture per card and threads to Units 17–19. |
| spractice | 14 problems | **extend to 16** | P1–P14 mostly fine; rebalance to the spec's list (add CBOW pass, skip-gram pass, TF-IDF, PMI, smoothing/interpolation, HS path, subsampling, GloVe ratio, BPE). |

Explanations overall: clean, short sentences (keep the voice), but most sections stop at *what*; there is no
"Why does this work?" paragraph anywhere, no explicit "Trap:" callouts, and 14 of 20 checks are recall/compute
checks (the rule wants ≥ half predict/explain).

## 2 · Widgets (tested in the browser; screenshots looked at)
| widget | correctness (tested) | clutter / bugs | verdict |
|---|---|---|---|
| hero (3-D) | hand-placed points (code says so; page doesn't) | at 390 px the "woman" label sits under the kicker, over/six labels touch; queen ring overlaps the arrow head | keep, relabel for the new arc, declutter phone layout |
| w-onehot (3-D) | distances/cosines computed from the drawn vectors ✓ (1.414, cos 0); "meaning" mode is hand-made — page doesn't say | "coffee" label sits on the arrow-tip halo; stray dot by "drag to orbit" | keep; offset labels outward, say "hand-made" |
| w-bigram | bar height ∝ p ✓; fractions ✓; sentence score ✓ | uses "." instead of `<s>`/`</s>`; empty "I" column; no chain-of-guesses path; no memory selector | **update** per spec |
| w-perplexity | bars ∝ surprise ✓, spinner = PP equal slices (last partial) ✓ | fine | keep |
| w-cooc | arrow lengths ∝ ‖row‖, angle = acos(cos) ✓; bars ∝ counts ✓ | no term–document tab; window demo shows only count changes, not substitutes vs topic-mates | **extend** |
| w-svd-words (3-D) | directions = normalised rows of U_kΣ_k ✓; energies ✓; PPMI k=3 within 0.998 / between 0.022 ✓ | group labels ("chai · coffee · milk…") lie on top of dots and of each other; "direction 2" axis label inside the travel cluster | keep, **declutter** (one label per cluster with leader line, hover for the rest) |
| w-sgstep | arrows at exact coordinates ✓; loss 0.948 → 0.505 ✓ | loss mini-chart clamps at 1 and has no scale | keep (add loss scale) |
| w-w2v (3-D) | trains ✓ (within 0.99, between 0.16 after 96 k pairs) | **worst clutter on the page**: 27 labels on a small globe, many overlapping even before training; story unclear | **rebuild** as the s13 convergence demo (two words that never meet but share company converge; an unrelated word drifts off; only highlighted words labelled) |
| w-cost | ratio V/(k+1) ✓; log bars ✓ | fine | **extend** into three tabs (NS / hierarchical softmax / subsampling) |
| w-lookup | ✓ | fine | keep |
| w-nlm | q from the stored weights ✓ (0.256 / 0.258) | small map: "football we", "chai coffee cricket" stacked but readable | keep |
| w-para | parallelogram M→K→D→W ✓, cosine ranking ✓ | "queen" label half hidden by the answer ring; "man"/"king" labels touch the arrow tails | keep, fix labels |
| w-analogy (3-D) | answers ✓ (queen, princess, Tokyo, kitten, prince, Rome, actress) | "all names" on by default → people / places / animals clusters are piles of labels | keep, **declutter** (default: only A, B, C, answer and top neighbours; hover shows any word) |
| w-polysemy (3-D) | bat = s·CM + (1−s)·AM, straight path in the projection ✓; nearest words ✓ | heavy overlap: batsman/wicket, bowler/six, "cricket meaning"/over, "animal meaning" over dots, lion/dog/cat/cub | keep, **declutter** |
| w-cosine | ✓ | with the default (collinear) shoppers, label "a (2, 1)" is drawn over b's arrow | keep, offset label |

Coverage gaps against u16-R22.md: tokens/`<s>`; chain rule + Markov; add-k/interpolation/backoff; term–document;
TF-IDF; PMI worked table; latent similarity/LSA; CBOW; full skip-gram; CBOW vs skip-gram comparison; hierarchical
softmax; subsampling; count-meets-predict (Levy & Goldberg); GloVe ratios; fastText; BPE; summary cards with pictures.
New widgets needed: w-smooth, w-pmi, w-friends, w-ratio, w-pieces, static network figure (s8); w2v widgets by 16-w2v.

## 3 · Machinery
- No `state()` readers: tests read `data-*` attributes. Add `window.U16['w-…'].state()` for every widget I own.
- `assemble-u16.js` has no W2V contract yet; section list is fixed to a–d.
- verify-math16.py already reads data straight from u16-shared.js (good pattern; keep).
- verify-practice.js / verify-ux.js still expect 14 problems, § 13, 20 checks (lead's wiring pass).
- Links from elsewhere into U16: unit-17 → `#s2` (n-grams) and `#s8` (neural LM); ideas.html/threads → s1–s12
  (threads: `[16,'s11','three rulers']`, `[16,'s5','the SVD squeeze']`).
