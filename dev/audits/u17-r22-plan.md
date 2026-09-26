# Unit 17 · Round 22 plan + progress notes (builder 17)

## Files (all mine)
tpl/u17-hero.html · tpl/u17-sec-a (Act I: s1–s3) · sec-b (Act II: s4–s5) · sec-c (Act III: s6–s8) · sec-d (Act IV: s9–s11) · **sec-e (Act V: s12–s14, new file)** ·
tpl/u17-derives.html (groups keyed by NEW ids) · tpl/u17-practice.html (16) · tpl/u17-kit.js · u17-shared.js (+ `U17W` registry, label-rect helper) · u17-hero.js ·
u17-w1.js (order, rnn-step, unroll) · u17-w2.js (shapes, bptt, power, eigen-memory 2-D rebuild) · u17-w3.js (clip, notebook, lstm, gru, gates-compare) · u17-w4.js (seq2seq, beam) ·
**u17-w5.js (talk)** · **u17-w6.js (bidir, bleu)** · **u17-talk-model.js (generated weights)** · assemble-u17.js · verify-u17.js · verify-math17.py · shots-u17.js · **train-u17-talk.py**.

## Section map (old → new)
s1→s1 · s2→s2 · s3→s3 · s4→s4 · (new) s5 LM/talking · s5→s6 BPTT(+truncated) · s6→s7 fade/explode · s7→s8 clip(+init) · s8→s9 LSTM · s9→s10 GRU · (new) s11 two-way+stacked · s10→s12 enc–dec · s11→s13 greedy/beam/BLEU · s12→s14 carry forward · spractice→spractice.
gen-site THREADS use 17/s6 ("memory that fades") → s7 and 17/s5 ("backprop through time") → s6. ideas.html links s1–s12 (lead fixes).

## Sections (content)
s1 order: question, headlines, 3 ideas + Unit 16 NLM window tie, quarter-turn example, table bag/window/note, Trap (running total = bag), roadmap 5 acts. Checks c1, c2, **c21** (180° half-turn: note = x₁ − x₂ + x₃ → A = B = (0,0)).
s2 cell: card of fixed size; formula read aloud; 0.7616/0.3634/0.1797; why it works; Trap (fixed-size summary). c3, c4.
s3 unroll: why share (same grammar everywhere; any length); 32; Trap. c5, **c22** (train 10 words, read 25).
s4 shapes: read-out 0.609/0.224/0.136/0.030, loss 0.495; Trap (two kinds of many→many). c6, c7.
s5 NEW talk: phone-keyboard autocomplete; teacher forcing; feed back; temperature T=1/0.5/2: (0.609,0.224,0.136,0.030)/(0.842,0.114,0.042,0.002)/(0.434,**0.263**,0.205,0.097); table greedy/T<1/T=1/T>1; exposure-bias Trap. w-talk. **c23** (T=0.5 → 0.842), **c24** (T→0 = greedy), **c25** (exposure bias).
s6 BPTT: relay; step machine; 0.4838×0.4340≈0.2100; sum over time (vote); Jacobian diag(1−h²)W; truncated k=20 → 50 chunks, table full vs truncated; Trap (note still flows forward). c8, c9, **c26** (words 5 and 45, k=20).
s7 fade/explode: whisper line; 0.5¹⁰≈0.000977, 1.5¹⁰≈57.67, 0.9²⁰≈0.1216, 1.1²⁰≈6.7275; keys…are (0.5⁹≈0.00195); W eigen 1, 0.5 → (0.8,0.2); table fade/keep/explode; Trap (entries < 1 ≠ fading). w-power (fix), w-eigen-memory (2-D rebuild). c10, c11, c12, **c27**.
s8 clip + init: (30,40)→(3,4); clip-each-entry Trap ((5,5) turns 53.13°→45°); orthogonal/identity W. c13, **c28**.
s9 LSTM: + full step (0.8808, 0.5, 0.7311, 0.7616 → 1.2616, tanh 0.8515, h 0.6225); forget bias σ(1)≈0.73, σ(2)≈0.88 (0.8808¹⁰≈0.281 vs 0.5¹⁰); residual foreshadow; Trap (forget gate 1 = keep). w-notebook (+ "from scores" tab), w-lstm (fix). c14, c15, c16, **c29**.
s10 GRU: + full step (z 0.5, r 0.8808, 1.4404 → h̃ 0.8938, h 0.6969); reset = how much old note to consult; table plain/GRU/LSTM. w-gru (fix), w-gates-compare. c17, c18, **c30** (r = 0), **c37** (z = 0 for 50 steps).
s11 NEW two-way + stacked: Teddy; toy x=(0,0,1): fwd (0,0,0.7616), bwd (0.1797,0.3634,0.7616), word 1 (0, 0.1797); Trap (cannot generate); floors; params 24 704 / 49 408 / 57 600; table. w-bidir. **c31**, **c32**, **c33**.
s12 enc–dec: 5 vs 50 words into 8 numbers; 0.9⁴⁹≈0.0057. w-seq2seq (fix). c19, **c34**.
s13 greedy/beam/BLEU: 0.20 vs 0.36; greedy/beam/sampling table; BLEU (1, 2/3, 0.7788, 0.636); clipped counts; Trap. w-beam, w-bleu. c20, **c35**, **c36**.
s14 cards + Unit 18 thread.

## Widgets (17; 3-D: unroll, clip, lstm, seq2seq)
kept+checked: w-order, w-rnn-step, w-unroll, w-bptt, w-clip, w-gates-compare, w-beam · fixed: w-shapes, w-power, w-lstm, w-gru, w-seq2seq, w-notebook(+tab) · rebuilt: w-eigen-memory (2-D plane + log chart with real bars + eigen-part lines) · new: w-talk, w-bidir, w-bleu.
Every widget: `window.U17W['w-…'].state()` → numbers drawn; verify compares with independent JS; SVG text-overlap test at 1440 + 390; 3-D label-rect overlap test; control sweep (min/max, no NaN, reset).

## Derivations (drawer groups by new id) ≈ 24 in 12 drawers
s2 (2), s3 (1), s4 (1), s5 (2 new: temperature limits; loss = −ln P(sentence)), s6 (3 + 1 new Jacobian/truncation), s7 (3), s8 (1 + 1 new orthogonal keeps length), s9 (2), s10 (2), s11 (1 new counts), s12 (1), s13 (1 + 1 new BLEU pieces).

## Practice (16)
P1 forward pass (w=0.8) · P2 2-D step · P3 counts one-way/two-way/stacked (+GRU/LSTM) · P4 read-out + loss · P5 temperature (compute + reverse-engineer T) · P6 BPTT 3 steps · P7 truncated BPTT chunks/reach · P8 first T below 10⁻³ · P9 eigen 2×2 · P10 clipping · P11 LSTM full step (c_prev = 2) · P12 diagnose recorded runs (+ f for half at 100) · P13 GRU full step · P14 bidirectional notes · P15 greedy vs beam · P16 BLEU-2.

## Progress log
- [x] audit written · [x] plan written
- [x] train-u17-talk.py + weights (48-unit char RNN, 300 sentences, 6000 Adam steps, loss/char 0.163; md5 reproducible). Greedy from any seed → "…patna will arrive on platform three." loop; "the trian to" → "drincoo."; T=2 misspells. First char after "the train to ": p 0.171.
- [x] ALL section HTML written (sec-a…e), derives (23 in 12 drawers), practice (16). Page builds, 37 checks, 17 widgets, no errors.
- NOTE: scratchpad is shared with builders 16/18 → my scratch lives in scratchpad/u17/ (p17.js probe, s17.js element shots, orig/ backups).
- [x] JS done: w-talk (w5) · w-bidir + w-bleu (w6, phone = vertical rows) · w-eigen 2-D rebuild · w-power (fixed axis 1e-16..1e9, no clipping) · w-shapes · w-bptt trunc (−0.3211) · w-notebook scores tab · w-gru labels · w-lstm chart · w-seq2seq 5/50 + HUD · every widget reg('w-…',{state}) · hero lede. kit: declutter() (fixed labels first, movable data-alt), tickify(), labelRects(); sweep.js (scratch/u17) = SVG overlap/outside/NaN sweep over ~150 states → clean at 1440 and 390.
- [x] verify-math17: 138 checks (139 with U17_RETRAIN=1, which re-trains and compares the md5).
- [x] verify-u17 (new, Round 22): page counts, every widget's state() against independent JS, geometry, every Try claim, control sweeps (retry after another button; hidden sliders skipped), SVG overlap sweep ~150 states at 1300/390 + light, 3-D label rects at 1300/390, reduced motion, checks/drawers/practice, narrow screens. All pass except two phone equations (fixed: s5/s13 realizations split into more lines).
- [x] "Why it works" added to s1 (stamps W², W, 1) and s4 (where the loss is attached). w-order: "↻ another order for B" cycles the 5 other orders (old swap was a no-op); prog in state.
- [x] shots-u17.js `try` mode: every widget in each Try state (1440/390, dark; light for 3-D). Looked at all 1440 shots → fixes: ticks hidden under arrows/dots/arcs (hideTicksOn), glow no longer haloes SVG text (unglowText in mfont), rnn-step/shapes labels beside arrows, unroll chain fits at 8 words, window tiles sized to words, eigen legend card covers the title + bar colours explained, clip hops scale with step length + full reset + fling wording, lab "coin toss" placed where no curve passes, talk legend + end-of-sentence line, notebook slider spacing, seq2seq short sentences match the Hindi, BLEU svg fits content, stale "§10" in w-shapes → §12.
- [x] student read-through (sections, derives, practice) → W^⊤ notation (was W^T next to powers W^T), forget-gate history (2000), BLEU preset label, P16 rewritten (old "B moves words around" was the same meaning; now A paraphrase 0.6325 < B wrong fact 0.7746, C short 0.5134).
- [x] 390 shots + light 3-D shots, looked at → unroll chain measured on screen and fitted (phones: labels ×1.6, uses the width), clip labels bigger on phones and "flung off" kept on stage, seq2seq phone labels moved clear of the sparks. Light lab stage checked alone (the tall-element capture misses lazily mounted stages — capture artifact only).
- [x] hero: belt measured and fitted between the lede and the right edge / on-screen contents list at 1280–1920 (+ verify test at 1300/1600/1920); 390 fine.
- [x] shared suites (not edited): verify-ux ONLY=17 → only "checks 37 ≠ 20", "solutions 16 ≠ 14"; verify-practice → unit-17 "16 ≠ 14", "§15 ≠ 13". Wiring pass: EXPECT_CHECKS[17]=37, EXPECT_PROBS[17]=16, hub foot '17 widgets · 37 checks · 16 problems', practice ['17',16,15], gen-site THREADS 17/s6→s7 and 17/s5→s6, regenerate ideas.html. Unit 18 already links to the new ids (s3, s5, s7, s9, s11, s12).
- [x] final: verify-u17 167/167 ✓ (fold/GRU/hero waits now poll the state: SwiftShader frames take up to ~1.6 s here); verify-math17 138 ✓.
- [x] report sent.
