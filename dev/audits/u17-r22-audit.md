# Unit 17 · Machines with Memory — Round 22 audit (builder 17)

Baseline (26 Sep, before any change): `node assemble-u17.js && node build.js unit-17.html` → build ok; `verify-u17.js` green
(one timing flake on the first run, clean on the second); verify-math17.py green. 20 checks · 14 widgets (5 in 3-D) ·
16 derivations in 10 drawers · 14 problems. Screenshots taken at 1440 and 390 (dark) of every flagged widget and looked at.

## 1 · Sections — keep / deepen / rewrite
| old id | title | verdict | notes |
|---|---|---|---|
| s1 | Why order matters | keep + deepen | Good (headlines, quarter-turn (−2,2) vs (0,0)). Add: the real opening question, the Unit 16 neural-LM "fixed window" tie, a Trap (a plain running total is still a bag), a side-by-side table bag / window / note, one predict check (a half-turn 180° cannot tell A from B: note = x₁ − x₂ + x₃). Roadmap must become five acts. |
| s2 | The recurrent cell | keep + deepen | Worked 0.7616/0.3634/0.1797 good. Anchor "a card of fixed size" only half-used; read the formula aloud as the card being rewritten (W) and the new word written in (U); add "why it works" and a Trap (the note is a fixed-size summary, not a list of words). |
| s3 | Unrolling | keep + deepen | Add the *why* of sharing (same grammar at word 3 and word 300; learning at one position helps every position; reads lengths never seen), a Trap, one predict check (10-word training, 25-word test). |
| s4 | Many shapes | keep | Read-out example fine. Add Trap (two kinds of many→many). w-shapes needs fixes (below). |
| s5 | Backprop through time | keep + deepen → new s6 | Missing: the gradient of W as a vote from every step, the matrix Jacobian diag(1 − h²)W (seed of the next section), **truncated BPTT** (1 000 words, k = 20 → 50 chunks; no blame across k). |
| s6 | Fade or explode | keep + rewrite anchor → new s7 | Mic/speaker anchor → the brief's **whisper line**. Needs the subject–verb example ("The keys … are"), a fade/keep/explode comparison table, a Trap (small entries ≠ fading: eigenvalues decide). |
| s7 | Clipping | keep + extend → new s8 | Add "start at the right volume" (orthogonal / identity-like W, all |λ| = 1) and the clip-each-entry trap. |
| s8 | LSTM | keep + extend → new s9 | Strong (bahi-khata, express lane, honest 0.9⁵⁰). Missing: **full worked step from pre-activations** (0.8808, 0.5, 0.7311, 0.7616 → c 1.2616, h 0.6225), forget-bias 1–2 nugget, residual-path foreshadow, Trap ("forget gate" 1 = keep). |
| s9 | GRU | keep + extend → new s10 | Missing: full worked step (0.5, 0.8808, 0.8938, 0.6969), reset gate as "how much of the old note to consult", **comparison table plain / GRU / LSTM**. |
| — | (none) | NEW s5 | RNN language model: teacher forcing, generation by feeding back, greedy vs temperature (T = 0.5/1/2 numbers), exposure bias. New widget w-talk (trained tiny char-RNN). |
| — | (none) | NEW s11 | Bidirectional + stacked RNNs (Teddy example, forward (0,0,0.7616), backward (0.1797,0.3634,0.7616), params 24 704 / 49 408 / 57 600). New widget w-bidir. |
| s10 | Encoder–decoder | keep + fix → new s12 | Text good. Make the bottleneck unforgettable (5 vs 50 words into the same 8 numbers). w-seq2seq visual fixes. |
| s11 | Greedy / beam | keep + extend → new s13 | Add greedy vs beam vs sampling comparison, **BLEU** (1, 2/3, 0.7788, 0.636) + Trap; new widget w-bleu. |
| s12 | Carry forward | rewrite cards → new s14 | New cards for LM/temperature, truncated BPTT, bidir/stacked, BLEU. |
| spractice | 14 problems | rewrite to 16 | Keep the good ones (forward pass, matrix step, eigen, clipping, LSTM, GRU, beam, run diagnosis); add temperature, truncated BPTT, bidirectional notes, BLEU-2, stacked/two-way counts. |

Voice is clean everywhere (keep it). Common weakness across sections: *what* without *why*; formulas before the mechanism in §5/§6; most checks recall numbers (c7, c8, c10, c13, c14, c15, c17, c18, c19 are computations; only c6, c11, c16, c20 ask for behaviour).

## 2 · Widgets — tested behaviour, correctness, clutter
| widget | status | issues found (by testing / screenshots) |
|---|---|---|
| w-order | keep, fix | Numbers right ((−2,2)/(0,0), 0° → (2,2)). Window tab still shows the A/B sentence pickers and "read both" (irrelevant there). Running-note word labels can sit on tick labels ("1" near (0,1)). No state() reader. |
| w-rnn-step | keep, fix | Numbers right. Phone six-slot view: the "W" label collides with the first cell. |
| w-unroll (3-D) | keep | Count 32 right; W arrows fine. Label-overlap test needed. |
| w-shapes | keep, fix | **Phone "next word": the 4th bar ("the" 0.030) is cut off** (SVG 540 high, bar at y ≈ 550). "Mumbai" label runs into its bar. Steps 1, 2, 4 bars are hand-made toy numbers — not said on the widget. |
| w-bptt | keep | All numbers check (0.0896, −0.9104, −0.4655, 9.6×). Disc area ∝ |blame| (r ∝ √). OK at 390. |
| w-power | fix | **Bars clipped at 10⁻⁸ with no marker**: at w = 0.5, t ≥ 27 all look equal (0.5²⁷ ≈ 7.5e−9) — the picture lies. Floating value tag sits on the bars; "one thousandth" label hidden behind bars; at 390 "steps back t" collides with the 20/30 tick labels. |
| w-eigen-memory (3-D) | rebuild | **"bars: length of Wᵗv" — bars invisible** (keep: ‖Wᵗv‖ ≈ 0.82 → bars ~1 px, hidden under the lines). The λ₂ line flattens at the 10⁻⁶ floor from t ≈ 18 (clamped, misleading). 3-D "time as height" hard to read; "time ↑" label on top of the "λ₂ = 0.5" tag. |
| w-clip (3-D) | keep | Numbers match verify-math (off at step 9, gradient 10.86; c = 2 reaches the valley). Check labels/light theme. |
| w-notebook | keep, extend | Numbers right. Needs a "from scores" mode so the full LSTM step (pre-activations → gates) is visible (sliders step 0.05 cannot hold 0.8808). |
| w-lstm (3-D + chart) | keep, fix | Numbers match (51.2% at 20, 45.8% at 50, honest 85.5%). **At 390 the axis title "sentence length (words)" collides with the 20/30 ticks.** Chart has no state() for drawn geometry. |
| w-gru | fix | **"new note" label sits on the 0.5 tick**; at z = 1 "new note" lands exactly on "candidate h̃" (labels on top of each other); dial "old/new" labels touch the 0.5 grid label at 390. Numbers right ((0.5, 0), z = 0.5 → (0.2, 0.2)). |
| w-gates-compare | keep | Counts right. Fine at 390. |
| w-seq2seq (3-D) | fix | 0.9⁵ = 0.5905, 0.9⁴⁹ = 0.0057 right. Decoder cubes crowd each other at 1440; at 390 "summary · 8" and "word 1 · 0.5905" sit on the orb and the gold wires; the 5-vs-50 squeeze is not visible at a glance (only a slider). |
| w-beam | keep | 0.20 / 0.36 right. Fine at 390. |
| hero (3-D) | keep | HUD numbers right (0.031, 7.6, 0.86). Update lede + chips; check intro-text clearance at 1280/1440/1568×757/1920. |

No widget exposes a `state()` reader; no test compares drawn geometry with an independent computation; no overlap test exists. All of that is new work (R22 §3).

## 3 · Coverage gaps against dev/tpl/u17-R22.md
Language model / teacher forcing / text generation / temperature / exposure bias (none) · truncated BPTT (none) · matrix Jacobian of BPTT (drawer only) · whisper anchor + subject–verb agreement (none) · orthogonal/identity start (none) · full LSTM step from weights (P8 only) · forget-bias init (none) · full GRU step with reset gate (none) · plain/GRU/LSTM comparison table (none) · bidirectional + stacked RNNs (none) · BLEU (none) · greedy vs beam vs sampling comparison (none) · 16-problem arena (14 now).

## 4 · Numbers disagreed with
One: at T = 2 the plan gives softmax(2, 1, 0.5, −1) = (0.434, **0.264**, 0.205, 0.097). Recomputed: p(Mumbai) = e^0.5 / (e^1 + e^0.5 + e^0.25 + e^−0.5) = 1.64872 / 6.25756 = 0.26348 → **0.263** (the four still add to 1: 0.434 + 0.263 + 0.205 + 0.097 = 0.999 by rounding). The page uses 0.263; verify-math17.py checks it.
Everything else in u17-R22.md agrees with my recomputation (verify-math17.py: 138 checks, 139 with U17_RETRAIN=1).

## 5 · Found while finishing (after the build)
- Old practice P16 claimed "every morning we drink chai" does not mean the reference "we drink chai every morning" — it does. Rewritten: paraphrase A 0.6325 < wrong-fact B 0.7746, short C 0.5134 (BP e^(−2/3)).
- s7 wrote the transpose as W^T right next to the power W^T (T = number of steps). Now W^⊤ everywhere in the unit, and s7 says "the transpose".
- w-shapes' translate readout still said "this is §10" after the renumbering (now §12).
- Sandbox only: SwiftShader draws faint rectangular tiles over some glowing SVGs (seen in w-notebook, w-bleu element shots); a CPU-raster render (--disable-gpu) of the same page shows none, so it is not in the page.
- Hero: the belt used a fixed 26 % view shift, so at 1280 its first box touched the lede and at ≥ 1520 its loss crystal sat under the contents list. It now measures itself and fits between the lede (+40 px) and the right edge or the contents list (zoom ≥ 0.62); the HUD moves left of the list when the list is shown.
