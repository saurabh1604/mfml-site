# Round 22 · Rework of Units 16, 17, 18 — common brief (read fully before anything else)

## 0 · Why this round exists
The owner (Prof. Saurabh) reviewed the live Units 16–18 and wrote, verbatim:

> "Unit 16, 17, and 18 are not as per how they should have been. For example you missed continuous bag of words and skipgram technique and also the explanations are not great. I told the explanations needs to be great with good conceptual and visual intuitions. People should understand the topics really well, so well that they never forget, so we need to. Also please check all visuals for correctness and make sure everything works fine."

He chose: **cover the complete standard syllabus** for each topic (not only what the first version had), and **publish directly** once every check passes. So there is no second chance: what you ship is what students read.

### The lead's diagnosis of the current pages
1. **Coverage gaps.** Unit 16 has no CBOW and no real skip-gram architecture (only the negative-sampling yes/no game), no GloVe, no hierarchical softmax, no subsampling, no TF-IDF / term–document matrix, no chain rule / Markov assumption for n-grams, no interpolation/backoff, no subwords (fastText, BPE). Unit 17 has no bidirectional or stacked RNNs, no text generation / temperature, no truncated BPTT, no BLEU, no full LSTM/GRU worked step. Unit 18 has no seq2seq attention (Bahdanau/Luong, alignment), no contextual-embedding payoff for Unit 16's polysemy problem, no BERT / GPT / encoder–decoder families, no masked-LM vs next-token objectives, no learned-vs-sinusoidal-vs-rotary comparison, no weight tying.
2. **Explanations.** The sentences are clean and simple — keep that — but many sections only say *what* happens, not *why it works*. Formulas arrive before the reader has a mechanism in their head. Sections read like a list of facts rather than a story that builds. There are too few "aha" moments that make the idea impossible to forget, and most "Pause & predict" checks ask the reader to recall a number rather than to predict behaviour.
3. **Visuals.** They mostly run, but several are cluttered or misleading: labels piled on top of each other in the 3-D scenes (U16 w-w2v, w-polysemy, w-svd-words, hero "queen"), overlapping axis/tick labels (U17 w-power, w-lstm chart, w-gru; U18 w-attnmap column labels, w-cost ticks), a chart that promises bars and shows none (U17 w-eigen-memory: "bars: length of Wᵗv"), 3-D scenes whose story is hard to read at first glance (U17 w-eigen-memory, U18 w-subspace). **No widget has been independently checked for mathematical correctness of what it draws.** That must change this round (§3).

## 1 · The teaching standard (non-negotiable)
The site's voice rules still apply (`dev/tpl/ROUND15-BRIEF.md`): plain read-aloud English, short sentences, the everyday word before the term, Indian-life examples, tiny hand-sized numbers first, proofs only in the collapsed "If you want the algebra" drawers, "Unit N of 20", brand rules. On top of that, every section must now pass **the never-forget test**: a reader who has never met the topic can, after one reading,
- (a) explain the idea to a friend in three sentences,
- (b) draw the key picture from memory,
- (c) predict what happens when one knob changes, and
- (d) redo the worked example by hand.

How to get there — twelve rules:
1. **Open with a real question** the reader would ask ("How could a computer ever know that chai is like coffee?"), then the Imagine-this story that answers it in everyday terms.
2. **One anchor picture per section** that *carries the mechanism* (not decoration) — e.g. "a committee of neighbours votes on the blank" for CBOW, "a whisper passed down a line of people" for vanishing gradients, "an interpreter glancing back at the speaker's notes" for attention. Name it, draw it in the widget, and call back to it later in the unit.
3. **Mechanism before formula.** Walk through the steps in words and tiny numbers first. Then show the formula, then **read the formula aloud** piece by piece ("this term carries the old note; this one writes the new word…").
4. **Always say why it works** — a short "Why does this work?" paragraph with the causal story (e.g. "words that keep the same company receive the same pulls, so they end up in the same place").
5. **Compare the variants side by side** — the owner's standing rule. CBOW vs skip-gram, count vs predict, full softmax vs negative sampling vs hierarchical softmax, window 2 vs 10, RNN vs LSTM vs GRU, one-way vs two-way, greedy vs beam vs sampling, dot vs additive attention, learned vs sinusoidal vs rotary positions, encoder-only vs decoder-only vs encoder–decoder. A comparison table or a two-panel widget, plus the rule of thumb for when to use which.
6. **Name the trap.** One explicit "Trap:" callout per section where a student typically goes wrong (e.g. "Trap: the embedding table is not an extra part of the network — it *is* the first layer's weights.").
7. **Flow, not fragments.** Short sentences, but connected with plain transitions ("So…", "Here is the trick.", "That is why…"). No paragraph that is only a list of facts. No clever asides.
8. **Every number is real and checked** (verify-math file). Where toy data stands in for real data (hand-made vectors, a corpus we wrote, weights we set by hand), say so plainly on the page.
9. **Checks test understanding.** At least half of each section's checks ask the reader to predict behaviour or explain a consequence ("Swap the two neighbours. What happens to CBOW's guess?"), the rest can be quick computations. Wrong options must be *plausible misconceptions*, and each check's feedback explains why.
10. **Connect back and forward** with explicit links: which earlier unit gives the tool (Unit 3 dot product, Unit 5 SVD, Unit 14 softmax/cross-entropy/PMI-like surprise, Unit 15 "prediction − truth" and Rules A/B, Unit 4 eigenvalues…), and which later section/unit uses it.
11. **End every section with the memory hook**: the existing `<p class="onesent">In one sentence: …</p>` — make it vivid and exact.
12. **Keep what is already strong.** Several sections are good (e.g. U16 "kadak", U17 LSTM express lane, U18 √d). Don't rewrite for the sake of it — deepen, clarify, fix, extend.

## 2 · Exemplar — the level of writing we want (Unit 16, CBOW)
Read this once and match its depth and flow in every section. (Numbers are pre-verified.)

> **Imagine this.** The teacher writes on the board: *"Every morning my grandfather drinks a hot cup of ____."* Nobody asks what the missing word is. "Chai," says the whole class. You did not look anything up. The words around the blank — *drinks, hot, cup* — each pointed somewhere, and together they pointed at one word.
>
> That game — fill in the blank from the words around it — is the first way word2vec learns. It is called **CBOW**, the *continuous bag of words*.
>
> Take the tiny sentence *we drink chai daily* and hide the middle word. The neighbours inside the window are *drink* and *daily*. The machine plays in four moves.
>
> **1. Look up the neighbours.** Every word has an *input vector*, a row of the input table. Here drink = (1, 0) and daily = (0, 1).
> **2. Average them.** h = ((1, 0) + (0, 1)) / 2 = (0.5, 0.5). This single point is the neighbours' combined opinion. Averaging throws away their order — that is the "bag" in the name. The vectors are dense numbers, not counts — that is the "continuous".
> **3. Score every word in the vocabulary.** Every word also has an *output vector*. Its score is the dot product with h (Unit 3): we 0, drink 0.5, chai 1, daily 0.5, cricket −1.
> **4. Turn scores into a guess.** Softmax (Unit 14) gives 0.135, 0.223, **0.368**, 0.223, 0.050. The true word is chai, so the surprise is −ln 0.368 ≈ 1.00.
>
> **How it learns.** Unit 15 told us the error at the output of a softmax is just *prediction − truth*: (0.135, 0.223, **−0.632**, 0.223, 0.050). Chai's output vector gets pulled toward h; every other word's output vector gets pushed away from h, each in proportion to how much probability it wrongly took. The blame then flows back into h and, because h was an average of two neighbours, it is **shared equally** between drink and daily. After one step (η = 1) the model gives chai 0.594 instead of 0.368, and the surprise drops from 1.00 to 0.52.
>
> **Why does this learn meaning?** Every time chai is the blank, its output vector is pulled toward the average of the neighbours it had. Coffee is the blank in the same kinds of sentences, so it is pulled toward the same places. Two words pulled toward the same places end up in the same place. Nobody told the machine that chai and coffee are drinks — the blanks did.
>
> **Trap:** the vectors we keep are not the answers to the blanks. After training we throw the game away and keep the *input table* — the neighbours' vectors. The game was only the exam that forced the table to be good.
>
> *In one sentence:* CBOW averages the neighbours' vectors, scores every word against that average, and nudges the vectors until the true middle word wins — a committee of neighbours filling in the blank.

Notice: a real question, one anchor picture (the blank on the board / the committee), mechanism in numbered moves with tiny numbers, the link to Units 3/14/15, the "why", the trap, the memory hook.

## 3 · Visual correctness protocol (every widget, old and new)
A widget is finished only when all of this is true and tested:
1. **The picture tells the truth.** Every drawn length, angle, position, bar height, colour intensity and label equals the quantity it claims to show (within rounding). Test it: expose `window.U1N.<widgetId>.state()` (or equivalent) returning the numbers the picture was drawn from, and assert them in `verify-u1N.js` against an independent computation (inline JS re-implementation or values from `verify-math1N.py`). For SVG widgets also compare element geometry (e.g. bar height ∝ value, arrow tip at the vector's coordinates).
2. **Every claim in the "Try:" line is true.** For each number or behaviour the Try line promises, the verify file performs the action and checks the result.
3. **Every control does something** (state hash changes) and **reset** returns to the initial state. No control can drive the widget into NaN, Infinity, blank, or an off-canvas state (drag to extremes, slider min/max, rapid clicks).
4. **No clutter.** No overlapping text anywhere (SVG: bounding-box test; canvas/WebGL: labels placed with collision avoidance or leader lines; hide/fade low-importance labels). Axis ticks never collide. Legends match colours. Units and axis names present.
5. **Readable at a glance**: a first-time viewer understands what they are looking at in 5 seconds (title, one-line caption, legend, a highlighted "look here").
6. **Themes, motion, mobile**: correct in dark and light (re-render on theme toggle), reduced-motion shows the final state, 390 px layout usable (controls wrap, no horizontal overflow, text ≥ 11 px effective), 1440/1568×757/1920 fine.
7. **Performance**: no frame > 50 ms in steady animation on the sandbox; heavy training loops chunked with `requestAnimationFrame`/time slicing; pause when off-screen.
8. **Colour language** of the unit is respected (see the unit files).
Screenshot every widget in its initial state and in each Try-line state at 1440 and 390 (dark) plus light for the 3-D ones, and **look at them** (Read the PNGs). Fix anything a careful teacher would frown at.

## 4 · Process for every builder
1. **Read**: this file, your unit file (`dev/tpl/u1N-R22.md`), `dev/tpl/ROUND15-BRIEF.md`, the current unit (`dev/src/unit-1N.html` + `dev/tpl/u1N-*` + `dev/assemble-u1N.js` + verify files), Unit 15 as the technical template, Unit 3 for voice.
2. **Audit** (write `dev/audits/u1N-r22-audit.md` before changing anything): for each existing section — keep / deepen / rewrite; for each existing widget — correctness issues found by actually testing it, clutter, bugs; coverage gaps against your unit file.
3. **Plan** (`dev/audits/u1N-r22-plan.md`): final section list with ids, what each contains, widget list (kept / rebuilt / new), check list, derivations, practice list.
4. **Build section by section**, running the build after each section (`node assemble-u1N.js && node build.js unit-1N.html`), and checking it in the browser.
5. **Verify** (§3 plus the unit file's list), then **re-read the whole unit start to finish as a student** and fix whatever made you stop.
6. **Report** (≤ 450 words): sections (one line each), widgets (new / rebuilt / kept, which 3-D), counts (widgets · in 3-D · checks · derivations · problems), section-id mapping old → new (other units link to some ids), numbers you disagreed with, what the wiring pass needs (verify-ux / verify-practice counts, hub card text), anything unfinished.

## 5 · Rules that apply to everyone
- Units 16, 17, 18 ship together and stay live throughout; keep `UNITS` arrays ending at 18, previous/next cards as they are now (16 ← 15, 16 → 17 → 18 → "Unit 19 · The Maths Inside an LLM — upcoming").
- Only touch the files your unit file says you own. Never edit other units, `index.html`, `gen-site.js`, `build.js`, `tpl/cinema.*`, `tpl/site-x.*`, `verify-ux.js`, `verify-practice.js`. Running `gen-site.js`, `build.js` and the verify suites is fine (run suites one at a time; parallel runs cause timing flakes). No git commit/push. Leave the `/home/claude/mfml-site/site` symlink in place.
- Brand: never write MFML, ZC416, BITS, WILP, "exam", "exam paper", "question bank", "past paper" on any page. The assemble scripts throw on leaks — keep those checks.
- Practice arena: 16 problems per unit (Unit 13/15 format: what it tests, how to attack, steps, answer line), each with a definite computable answer, varied shapes (compute, reverse-engineer a parameter, diagnose a recorded run, general formula then apply). Every number in `verify-math1N.py`.
- Section ids: you may renumber sections (the units are new), but list every old id → new id in your report so the lead can fix links from other units and the "threads" layer.
- Chromium: `/opt/pw-browsers/chromium`; `PW_CHROMIUM=/opt/pw-browsers/chromium` for verify suites; WebGL screenshots with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.
