# Round 22 handoff — Units 16–18 rework (linearalgebra.info, repo saurabh1604/mfml-site)

Written 2026-09-26 by the chat that ran round 22, which was stopped at the owner's request before review, wiring or publishing. **Nothing from round 22 is live.** The live site is still Round 21 (origin/main `361a03a`).

## 0 · What is in this folder
- `mfml-site-r22-handoff.tar.gz` — one file, about 16 MB, so it was not split. Unpack with `tar -xzf mfml-site-r22-handoff.tar.gz`. It unpacks to `mfml-site-r22/`, containing:
  - all of `dev/` — src, tpl, audits, content, fragments, and every assemble/verify/shots/train script, plus `w2v-harness.html` and `play-harness.html`;
  - every root-level file of the repo: index, ideas, unit-01…18, 404, sitemap, robots, CNAME, social-card.png, .gitignore;
  - a copy of this HANDOFF.md.
  - Left out: `dev/node_modules`, `.git`, `dev/site` (build output), the 1 655 screenshot PNGs in `dev/shots/`, and the unchanged `vendor/` and `preview/` folders (take those from the repo).
- The **root pages are the live Round 21 versions, unchanged**. The reworked Units 16–18 exist only as sources: `dev/src/unit-16/17/18.html` and `dev/tpl/u16-*`, `u17-*`, `u18-*`. Rebuild them with the commands in §8.
- **Git:** the working copy was committed locally as `ae28823` ("Round 22 (in progress)…") on top of `origin/main` `361a03a`. It was **not pushed**, because this session had no push access (git proxy 403).
  - To continue: clone the repo, then unpack the archive over it (`cp -a mfml-site-r22/. <repo>/`).
  - `git status` should then show only the round-22 changes, all under `dev/`: 87 files, +18 243 / −5 359 lines.

## 1 · Why this round exists
The owner reviewed the live Units 16–18 and said:
- they were "not as per how they should have been";
- "you missed continuous bag of words and skipgram technique";
- "the explanations are not great";
- people must understand the topics "so well that they never forget";
- "check all visuals for correctness and make sure everything works fine".

He chose a **complete standard syllabus** (not his NLP course decks) and to **publish directly** once everything checks out. Later he asked for a time estimate, then stopped this chat and handed the work to another.

The specs this round was built from are all in `dev/`:
- `dev/tpl/R22-REWORK.md` — the common brief: diagnosis, the 12-rule teaching standard with a full exemplar section, the visual-correctness protocol and the process.
- `dev/tpl/u16-R22.md`, `u17-R22.md`, `u18-R22.md` — the unit plans. Every worked number in them was pre-verified with numpy.
- `dev/tpl/R22-REVIEW.md` — the independent-review brief. It was **never used**.
- `dev/audits/R22-all-spec.md` — the specs bundled into one file. The same bundle is in the claude.ai project as `claude/r22-rework-spec.md`.

## 2 · Status per unit
All counts and suite results below are the builders' reports. The only thing re-run by the lead at handoff was the `verify-math` scripts, which all pass.

**Unit 16 · Words as Vectors** — built by two agents: *16-main* (everything else) and *16-w2v* (the four word2vec widgets, in `tpl/u16-w2v.{html,css,js}`).
- **Counts:** 17 sections plus practice (§18) · 23 widgets (5 in 3-D: onehot, svd-words, w2v, analogy, polysemy) · 43 checks · 30 derivations in 15 drawers · 16 problems.
- **Added:**
  - chain rule and Markov assumption with `<s>`/`</s>`;
  - smoothing: add-one, add-k, interpolation, backoff (w-smooth);
  - TF-IDF and PMI/PPMI (w-pmi);
  - SVD "friends of friends" / LSA (w-friends);
  - word2vec idea, network figure and sliding window (w-window);
  - CBOW worked by hand (w-cbow) and skip-gram worked by hand (w-skipgram);
  - the CBOW vs skip-gram lab (w-lab);
  - the three ways to make it cheap: negative sampling, a hierarchical-softmax tree, subsampling (w-cost tabs);
  - SGNS ≈ shifted PMI and GloVe ratios (w-ratio, rebuilt w-w2v);
  - fastText and BPE (w-pieces).
- **Rebuilt:** w-bigram, w-cooc (now has a document tab), w-cost, w-w2v.
- **Kept and decluttered:** onehot, perplexity, svd-words, sgstep, lookup, nlm, cosine, para, analogy, polysemy. All 3-D labels are now laid out to avoid collisions and are at least 11 px.
- **Suites:**
  - `verify-math16.py`: ✓ 147, re-run 2026-09-26.
  - `verify-u16.js`: 236 pass, 4 clean runs in a row, about 7 minutes.
  - `verify-u16-w2v.js`: 214/214 in both harness and page mode, about 10 minutes in page mode. **But** `page --quick` timed out in 16-main's run (see §7).

**Unit 17 · Machines with Memory** — builder *17*.
- **Counts:** 14 sections plus practice (§15) · 17 widgets (4 in 3-D: unroll, clip, lstm, seq2seq, plus the hero) · 37 checks · 23 derivations in 12 drawers · 16 problems.
- **New:**
  - s5, a language model that talks: teacher forcing, temperature, exposure bias, with the w-talk widget. w-talk is a character RNN with hidden size 48, trained offline by `dev/train-u17-talk.py` into `dev/tpl/u17-talk-model.js`; the training is reproducible.
  - s11, two-way and stacked readers (w-bidir).
  - BLEU (w-bleu).
  - Full worked steps for the LSTM (c = 1.2616, h = 0.6225) and the GRU (h = 0.6969).
  - Truncated BPTT.
  - Orthogonal initialisation.
- **Rebuilt / fixed:**
  - w-eigen-memory is rebuilt in 2-D with real bars.
  - Fixed: order, power, shapes, bptt, notebook (new "from scores" tab), lstm, gru, seq2seq, unroll, clip.
  - The hero belt fits between the intro text and the contents list at widths 1280–1920.
- **Suites:** `verify-u17.js` 167/167 · `verify-math17.py` ✓ 138, re-run 2026-09-26.

**Unit 18 · Attention and Transformers** — builder *18*.
- **Counts:** 14 sections plus practice (§15) · 18 widgets (4 in 3-D: qkv, attnmap, rope, block) · 31 checks · 18 derivations in 10 drawers · 16 problems.
- **New:**
  - s1, "The bottleneck, and the fix: look back": seq2seq attention with the English → Hindi alignment map, and dot, general and additive scoring (w-align).
  - s5, one word with many meanings, the bank example (w-context).
  - s11, BERT vs GPT vs encoder–decoder, with masked-LM counts and training signals (w-families).
  - Weight tying.
  - A comparison of learned, sinusoidal and rotary positions (a compare tab in w-clocks).
  - An "every guess at once" tab in w-mask.
  - w-subspace rebuilt in 2-D.
- **Suites:** `verify-u18.js` 185 pass on a clean full run · `verify-math18.py` ✓ 170, re-run 2026-09-26. After that full run only the hero's reading-time chip changed (to ≈150 min); a sweep afterwards found no overlaps and no errors.
- **Hero:** keeps clear of the text at 1280, 1440, 1568×757 and 1920.

**Reviewer findings so far: none.**
- The independent review round (three fresh reviewers following `dev/tpl/R22-REVIEW.md`) was cancelled by the owner before any reviewer started. No review notes exist.
- The only outside reading: the lead read U16 §8–§11 in full at handoff. It meets the standard: an opening question, an anchor picture, the mechanism in numbered moves, the formula read aloud, a "why it works" paragraph, a trap, a variants table and a closing one-sentence hook.
- The lead's pre-rework sweep of the **old** pages found overlapping labels in U17 w-power, w-lstm and w-gru, and in U18 w-attnmap and w-cost. The builders report these fixed; that has **not** been independently re-checked.

## 3 · Old → new section ids (other pages link to some of these)
- **U16:**
  - s1→s1; s2→s2 (smoothing split out into new s3); s3→s4; s4→s5; s5→s7 (PPMI moved into new s6).
  - s6→s8–s11 (the negative-sampling round is now in s12; w-w2v is in s13).
  - s7→s12; s8→s14; s9→s15; s10→s16; s11→s15; s12→s17; spractice→spractice (§13→§18).
  - New sections: s3, s6, s8, s9, s10, s11, s13.
- **U17:**
  - s1–s4 unchanged.
  - New: s5 (a language model that talks) and s11 (two-way and stacked).
  - s5→s6, s6→s7, s7→s8, s8→s9, s9→s10, s10→s12, s11→s13, s12→s14; spractice (§13→§15).
- **U18:**
  - s1–s4 keep their ids (s1 rewritten).
  - New: s5 (one word, many meanings) and s11 (three families).
  - s5→s6, s6→s7, s7→s8, s8→s9, s9→s10, s10→s12, s11→s13, s12→s14; spractice (§13→§15).
- **Links between 16, 17 and 18 already use the new ids:** U17→`unit-16.html#s14`; U18→`unit-16.html#s16` and U17 #s3/#s5/#s7/#s9/#s11/#s12; U17→`unit-18.html#s1`. Units 1–15 have no anchors into 16–18.
- **Still to fix (wiring):** the `gen-site.js` THREADS stops. Change [16,'s5']→'s7' (SVD squeeze), [16,'s11']→'s15' (three rulers), [17,'s5']→'s6' (backprop through time), [17,'s6']→'s7' (memory that fades). [18,'s3'] is unchanged. Then run `node gen-site.js` to regenerate `src/ideas.html`, which still lists the old titles and anchors.

## 4 · Proposed hub-card wording (builders' proposals — not yet applied)
- **16:** "Teaching a machine what words mean: guess the next word by counting (n-grams, smoothing, perplexity); know a word by its company (co-occurrence, TF-IDF, PMI, SVD); word2vec's two games — CBOW and skip-gram — made cheap with negative sampling; GloVe; subword pieces; and king − man + woman ≈ queen." Footer: **23 widgets · 43 checks · 16 problems**.
- **17:** "Reading one word at a time. A recurrent cell keeps a running note with the same weights at every word, and a tiny model trained for this page learns to talk. Blame flows back through time, multiplied by one matrix again and again, so eigenvalues decide whether memory fades or explodes. Then clipping, the LSTM's express lane, the GRU's blend dial, two-way readers, and translation through one summary, graded by BLEU." Footer: **17 widgets · 37 checks · 16 problems**.
- **18:** "Look back instead of remembering: the alignment map, queries, keys and values by hand, why √d, one word with many meanings, an attention lab, many heads, positions three ways, the block, the mask that trains every next word at once, BERT vs GPT vs encoder–decoder, the n² price — and a tiny transformer end to end." Footer: **18 widgets · 31 checks · 16 problems**.

## 5 · The word2vec lab (w-lab): behaviours verified by 16-w2v (seeds 1–20, default settings)
- **Settings:** 102 sentences, 8 numbers per word, negative sampling; the maps are a PCA shadow, and the page says so. Defaults: window C = 2, k = 5, η = 0.1.
- **Cost:** CBOW makes 23 280 guesses and skip-gram 68 640 — **2.95×**. It is about 3×, not 2C = 4×, because the sentences are short. Window 1 gives 1.65×, window 4 gives 4.49×.
- **Topic score** (mean within-topic cosine − mean between-topic cosine): skip-gram beats CBOW at passes 5, 10, 20 and 40 in **20/20 seeds**. At pass 10 skip-gram scores 0.38–0.49 and CBOW 0.05–0.13; the final means are 0.475 vs 0.318.
- **Rare words:**
  - *kadak* "fits drinks" 0.50–0.66 in skip-gram vs 0.23–0.40 in CBOW;
  - *googly* "fits cricket" 0.38–0.57 vs 0.18–0.30;
  - skip-gram wins in **20/20** seeds for both words.
- **Frequent word chai:** close. Skip-gram is ahead by 0.048 on average, but only in 13/20 seeds, so make no claim.
- **Subsampling:** CBOW gains most (reported as "0.46 vs 0.51").
- **k = 1 reverses the result**, so the page must make no claim about k = 1.
- **Toy machines, over repeated rounds:** CBOW's loss → 0; skip-gram's → 2 ln 2 ≈ 1.386, with each slot → 0.5.
- **Blame split:** the lab's CBOW gives each committee member 1/n of the blame (the gradient of an average, as §9 teaches). The original word2vec C code gives each member the full blame. The page doesn't mention this yet; a drawer note would be the place.
- **Where the claims appear:** the s11 Try line uses the verified claims — groups forming within about 10 passes, about 3× less work for CBOW, kadak far higher in skip-gram, chai close. The s11 prose itself makes no numeric lab claims.

## 6 · Wiring still to do (nothing below has been done)
- **`dev/verify-ux.js`:**
  - EXPECT_CHECKS: 16:43, 17:37, 18:31.
  - EXPECT_PROBS: 16:16, 17:16, 18:16.
  - Update the totals line and bar %.
  - It supports `ONLY=16,17,18`.
- **`dev/verify-practice.js`:** `['16',16,18]`, `['17',16,15]`, `['18',16,15]`. The format is `[unit, problems, practice-section number]`.
- **Hub `dev/src/index.html`:**
  - card text and footers for 16–18 (§4);
  - `FALLBACK` and route-map `U` check counts: 43, 37, 31;
  - site totals. Round 21 was 223 widgets · 307 checks · 222 problems · 247 derivations. Expected now: **238 · 358 · 228 · 272** — recount to confirm.
- **`dev/gen-site.js`:** the THREADS remap in §3, then `node gen-site.js`.
- **Then:**
  - full build with `node build.js`;
  - run the suites **one at a time**;
  - copy `dev/site/*.html` (index, ideas, unit-01…18) and `sitemap.xml` to the repo root;
  - brand grep: no MFML, ZC416, BITS, WILP or "exam" in any new text;
  - publish.

## 7 · Known issues and open points
1. **Slow rendering in the sandbox.** WebGL runs in software (SwiftShader) there, so 3-D stages take 0.2–2 s per frame. The suites wait on state rather than fixed times, and they are slow: about 7 minutes for U16 and about 10 minutes for w2v page mode. `verify-u16-w2v.js page --quick` timed out while waiting for the lab to pause when scrolled off-screen; it needs a state-based or longer wait. This is 16-w2v's file.
2. **Older verify flakes (not round-22 files):** a full `verify-ux.js` run stops in Unit 11's reading-position test before it reaches Unit 18. The long-known flakes are verify-u9 (sgd run, click timeout) and verify-u10 (canyon run, units std run).
3. **Stage height after resize.** The shared 3-D runtime (`tpl/cinema.js`) keeps a stage at the height it had when first built, so after a resize a desktop-sized stage can stay on a phone. U18's stages now rebuild when a resize crosses 640 or 560 px. Other units probably have the same issue.
4. **Rendering artefacts.** Faint tiling appears on some glowing SVG drawings in SwiftShader screenshots only; a render without GPU emulation shows none.
5. **Frame times.** U18 w-align takes 0.5–2 s per animation frame in the sandbox, but the page's own work is at most 27 ms per frame. U17 2-D widgets run at a median of about 17 ms; one w-talk step takes 2–11 ms. Worth one look on a real phone.
6. **Numbers the builders corrected against the lead's spec** (the builders were right):
   - U17, T = 2 → the second probability is **0.263**, not 0.264;
   - U18 additive-attention weight **0.490**, not 0.491;
   - U18 A₃₃ = **0.503**;
   - old U18 P1 blend **1.614**;
   - U17's old practice problem 16 treated "every morning we drink chai" as a different meaning from the reference. It is the same meaning, so the problem was rewritten.
7. **The word "exam"** already appears in the lesson text of Units 1, 2, 3 and 10, from before this round. Those pages are untouched.
8. **Hardcoded paths.** Several scripts use `/home/claude/mfml-site`: some suites read `file:///home/claude/mfml-site/dev/site/…`, and w2v harness mode serves `/home/claude/mfml-site` on port 8791. Put the repo there or edit the paths.

## 8 · Exact build and test commands
```bash
# 0 · setup (node_modules is not in the archive)
cd <repo>/dev && npm install                      # katex, playwright, three, fonts
ln -sfn <repo>/dev/site <repo>/site               # several suites expect <repo>/site
# Chromium for Playwright: /opt/pw-browsers/chromium  (suites read PW_CHROMIUM)

# 1 · assemble + build the three units (from <repo>/dev)
node assemble-u16.js && node assemble-u17.js && node assemble-u18.js
node gen-site.js                                  # search index, threads, src/ideas.html
node build.js unit-16.html unit-17.html unit-18.html   # or: node build.js   (every page, incl. index/ideas)

# 2 · numeric checks (seconds)
python3 verify-math16.py && python3 verify-math17.py && python3 verify-math18.py

# 3 · widget suites — WebGL, slow in software rendering; run ONE AT A TIME
PW_CHROMIUM=/opt/pw-browsers/chromium node verify-u16.js            # ~7 min
PW_CHROMIUM=/opt/pw-browsers/chromium node verify-u16-w2v.js page   # ~10 min; no arg = harness mode; --quick is flaky (§7.1)
PW_CHROMIUM=/opt/pw-browsers/chromium node verify-u17.js
PW_CHROMIUM=/opt/pw-browsers/chromium node verify-u18.js
PW_CHROMIUM=/opt/pw-browsers/chromium node verify-practice.js       # after adding the §6 entries
PW_CHROMIUM=/opt/pw-browsers/chromium ONLY=16,17,18 node verify-ux.js   # after the §6 expectations

# 4 · screenshots (WebGL flags built in; output under dev/shots/)
node shots-u16.js 1440 dark all        # or a list: hero,s9,w-cbow  ("hero@7.5" = 7.5 s into the loop)
node shots-u16-w2v.js page 1440 dark   # every Try-line state of the four word2vec widgets
node shots-u17.js 1440 dark all        # and: node shots-u17.js 1440 dark try all   (every widget's Try-line states)
node shots-u18.js 1440 dark all

# 5 · Unit 17 talk model — regenerates tpl/u17-talk-model.js exactly (fixed seeds)
python3 train-u17-talk.py
```

**Publishing** (`claude/publishing-status.md` in the claude.ai project has the full lessons).
- A session with the repo attached as a source can `git push`.
- Otherwise use the Chrome upload route:
  1. copy the files to outputs, then `device_commit_files` them to `~/Downloads/MFML/upload/rNN/`;
  2. `device_stage_files` them;
  3. `file_upload` the staged `/mnt/user-data/uploads/...` paths to github.com/…/upload/main/<dir>.
- Upload limits:
  - each `file_upload` call must be under 10 MB, **per batch too**;
  - wait about 8 s between uploads, or the second batch is silently dropped;
  - keep each web commit ≤ about 13 MB (the web commit fails at about 46 MB).
- Clicking and checking:
  - after `scroll_to`, click the commit-summary box by coordinate, type the summary, and zoom to confirm it;
  - click "Commit changes" by its ref;
  - never click near "choose your files" (it opens a native picker; Escape closes it);
  - confirm the commit on /commits/main.
