# Unit 18 · Round 22 audit (builder 18) — written before any page change

Baseline (2026-09-26): `assemble-u18.js` + `build.js unit-18.html` ok; `verify-math18.py` 104/104; `verify-u18.js` all green.
Screenshots of every widget at 1440 dark and the dense ones at 390 were taken and looked at (`shots/u18/`).
An oriented-box (SAT) text-overlap probe was run over every widget SVG at 1440 and 390.

## Sections (old ids)
| old id | title | verdict |
|---|---|---|
| s1 | The problem Unit 17 left behind (relay vs ask directly) | **Rewrite / move.** Unit opener must be the seq2seq bottleneck + Bahdanau/Luong look-back (missing today). The relay-vs-direct story moves to the opening of self-attention (new s3) where it motivates dropping recurrence. |
| s2 | Attention is a soft lookup | **Keep, deepen.** Add the real question, the library picture for Q/K/V, the *why* (a blend has a slope, a hard pick does not), dictionary-vs-attention comparison table, trap. |
| s3 | Q, K, V worked by hand | **Keep, deepen.** Add three views of one word (W_Q, W_K, W_V roles in words), every shape, read the formula aloud, why shared weights work, trap. |
| s4 | Why divide by √d | **Keep (strong).** Add the ÷d trap with numbers (8/64 → 0.531 vs 0.469), no-scale / ÷√d / ÷d comparison, one predict-check. |
| s5 | The attention map (lab) | **Keep → new s6.** Honest toy label kept; add trap "a bright cell is not an explanation". |
| s6 | Many heads | **Keep → new s7.** Rebuild w-subspace. Add why (one softmax row = one blend), trap (more heads ≠ more weights), comparison one big head vs many small. |
| s7 | Positions | **Deepen → new s8.** Missing: learned positions, side-by-side comparison, the sinusoidal distance property (PE(p)·PE(p+k) depends only on k). |
| s8 | The block | **Deepen → new s9.** Anchor becomes the residual notebook (read everything, add a note, never erase); talk (attention) vs think (FFN); pre-norm vs post-norm; trap (layer norm is per word, not per batch). |
| s9 | Causal mask (+ encoder/decoder/cross paragraph) | **Deepen → new s10.** Missing: *one pass trains every next-word guess at once* (the whole point of the mask). Cross-attention moves to the new families section. |
| s10 | The price | **Keep → new s12.** Add RNN-vs-attention comparison table, KV-cache teaser, trap (n² is compute/memory, not weights). |
| s11 | Tiny transformer | **Keep → new s13.** Add weight tying (25 600 000 saved for V = 50 000, d = 512). |
| s12 | Carry forward | **Rewrite → new s14** with mini-picture cards for the new arc. |
| spractice | 14 problems | **Extend to 16** (plan list), keep a reverse-engineer and a diagnose-a-run shape. |

### Coverage gaps against `u18-R22.md`
No seq2seq attention (Bahdanau/Luong, context vector, alignment map); no scoring-function comparison (dot / general / additive); no contextual-embedding payoff (bank/bat); no BERT / GPT / encoder–decoder families, masked-LM vs next-token, 15 % / 80-10-10; no learned-vs-sinusoidal-vs-rotary comparison; no sinusoidal distance property; no parallel training of every next-word guess; no weight tying; no KV-cache teaser; no pre-norm vs post-norm; no residual-stream "notebook"; no explicit Trap / Why-it-works blocks; most checks are recall-computations (only ~5 of 20 ask to predict behaviour).

## Widgets — what testing found
| widget | correctness (tested) | clutter / bugs seen | verdict |
|---|---|---|---|
| w-relay | counts right (7 hand-overs, 0.5⁷ = 0.0078, n²) | fine; no state() for geometry | keep, move to s3, add state(); test bar heights ∝ 0.5^i |
| w-lookup | shares (0.694, 0.099, 0.199, 0.008), ₹15.01 right | "your wish" label sits on chai's halo/label (1440 and 390); drink names drawn over the share bars (b|ack coffee) | keep, fix label placement (labels beside bars, wish label collision-avoided), add state() + geometry test |
| w-qkv (3-D) | readouts right | pillar label "0.446" covers k₃ label; no test that pillar heights / chain arrows equal the numbers | keep, add state() of drawn geometry (pillar heights = 2.2·share, chain tip = answer), de-clutter labels |
| w-scale | spread ≈ √d measured; top share, slope right | ok | keep; add state() test that bar heights ∝ shares |
| w-attnmap (3-D lab) | 0.766 / 0.029 / 0.816 right, causal zeros exact | 3-D weight labels collide with beams (the "0.029" over "because" hidden under the 0.766 arc); at 390 the 3-D word labels are ~6 px (unreadable) | keep; stagger / thin labels on narrow screens, only top labels near beams; heat-map column labels already clear (SAT: 0 overlaps) |
| w-heads | arcs right (ball 0.77, because 0.78) | head-2 value labels float far from their arcs | keep; put value labels at the arc apex |
| w-subspace (3-D) | shares right (c11: 1/8 each) | unreadable at a glance: labels piled ("bat" under "cricket", "sport head" over beads, "drink head" through a bead) | **replace** with a 2-D "three pairs of glasses" picture (feature table + three shadow lines with gold share bars) |
| w-shuffle | (1.723, 0.277) etc. right | clean | keep |
| w-clocks | tags right (d = 8) | clean | keep; add d = 4 / 8 switch (plan numbers are d = 4) and a "compare the three" tab (learned / sinusoidal / rotary) |
| w-rope (3-D) | 0.5, −1, move-both right | clean | keep; add state() of arrow angles |
| w-layernorm | (−1.069, −0.535, 0, 1.604) right | "mean 3" / "mean 0" labels sit on top of bars; value labels can hit the dashed ±1 lines | keep; move the mean label outside the bars |
| w-block (3-D) | numbers right | floor labels ~7 px at 1440 — unreadable; story hard to read | keep; bigger labels, fewer words, talk/think tags |
| w-mask | rows (1,0,0), (0.196, 0.804, 0), (0.248, 0.248, 0.503) right | clean | keep; cross-attention tab moves to w-families; add a "one pass, every guess" view |
| w-cost | counts right | **SAT overlap: y-tick "10⁰" × x-tick "10¹"** in the corner; the green dot hides the "10³" tick; no y-axis name | keep; fix ticks, add axis names |
| w-tiny | 0.944 / 0.196 / 0.877 / 0.874 / loss 0.446 right | fine | keep |
| hero | fit() keeps it clear of text at 1440 | lede must change with the new arc | keep scene; re-check 1280/1440/1568×757/1920 |

Numbers in the plan checked independently (scratch python): all agree except the additive-attention weights — 0.49046 rounds to **0.490**, not 0.491.
