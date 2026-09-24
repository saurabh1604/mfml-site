# Round 15 — Units 1 & 2 catch-up (plain English + wow)

Site: linearalgebra.info, "The Math Behind the Machine", by Prof. Saurabh. Units 3–11 got a "plain English + wow" pass in round 14. Units 1 and 2 did not, and now look older than the rest. Your job: bring ONE unit up to the Unit 3 bar. **Unit 3 (`dev/src/unit-03.html`, built `dev/site/unit-03.html`) is the reference — read it fully before you start.**

You own ONE file: `dev/src/unit-0N.html` (plus new `dev/shots-u15-0N.js` and your unit's verify file). Do NOT edit `tpl/`, `build.js`, `index.html`, other units, or `verify-ux.js` (report needed changes instead). Brand rule: never write MFML, ZC416, BITS or WILP anywhere in the page.

## The owner's voice rules (non-negotiable)
Saurabh's words: "make explanations easy, simple English, layman terms… relatable… wow." And: "Don't justify the maths of slides — invent your intuitive way of explaining with intuition, analogies and visual intuitions… restrict proofs… outstanding visuals, not normal… the visual depiction + realization of maths have to come through."
- Short sentences. Everyday words BEFORE the term ("the directions you can't reach — mathematicians call this…"). No literary flourishes, no winking asides, no dense paragraphs. Read-aloud friendly: a teacher should be able to read it to a class without stumbling.
- Every section follows this rhythm (see Unit 3):
  1. `<div class="callout scenario reveal"><span class="tag">Imagine this</span>…</div>` (Unit 3 uses `callout scenario` for Imagine-this, `callout remember` for The realization, also `aha`/`watch`) — an everyday picture (Indian-life examples welcome: chai stall, cricket, auto-rickshaw fares, a kirana shop, train timetables, Diwali shopping), ≤ 90 words.
  2. A tiny clean example with small whole numbers, THEN the symbols.
  3. The widget (with a "Try:" line).
  4. `<div class="callout remember reveal"><span class="tag">The realization</span>…</div>` — the formula as the sentence the reader would now write themselves.
  5. The inline check(s) (keep existing ones; rewrite wording plainly; keep ids and correct answers).
  6. Proofs/derivations ONLY inside the existing collapsed `details.algebra` drawers (keep them; simplify wording where heavy).
  7. `<p class="onesent reveal"><b>In one sentence:</b> …</p>` as the last element of the section.
  Copy the exact markup/classes from Unit 3.
- The unit opener (§1) ends with a short numbered roadmap list like Unit 3's.
- Keep the maths correct. Every number you write must be checked (run it in node/python). Report anything wrong you find in the existing page.

## Visual bar
The owner finds plain diagrams "not that great" — he wants "out of the world" depictions. Units 3–11 have 3D rebuilds via `Cinema.stage3d` (docs: `dev/audits/CINEMA.md`, runtime `dev/tpl/cinema.js`). Rebuild the weakest 2–4 widgets as gorgeous, orbitable 3D stages (or lavish 2D where the idea is 2D), and add new widgets where a section has no picture. Choreography (play buttons that run a 2–4 s story), glow, HUD chips, "Try:" lines. Light theme must still work. Reduced motion honoured.

## Hard constraints
- Keep every section id, widget id that already exists (you may rebuild its insides), control ids used by verify files, check ids + correct answers, the practice arena, `UNITS` array, topbar/TOC/drawer/resume machinery, `#score-total`, localStorage keys (`mfml-uN-*`).
- Update the unit's hero chips (widgets · in 3D, checks, derivations, problems) to the true counts.
- No math inside `<h2>`. KaTeX via `\( \)` / `\[ \]` in source; no HTML inside `\[…\]`; long display equations → `aligned`; after `\\` inside aligned put a space.
- Mobile: no horizontal overflow at 360/390/768/1024/1440/1680; `.katex-display` scrollWidth ≤ clientWidth at 390 AND 1300.

## Verify before finishing (mandatory)
1. `cd dev && node build.js unit-0N.html` → build ok.
2. Symlink once: `ln -sfn /home/claude/mfml-site/dev/site /home/claude/mfml-site/site` (remove it at the end: `rm /home/claude/mfml-site/site`). Run `PW_CHROMIUM=/opt/pw-browsers/chromium node verify.js` (Unit 1) or `node verify-u2.js` (Unit 2) and `node verify-practice.js`; update your unit's verify file only if you intentionally changed a widget's internals, keeping it a real test.
3. WebGL screenshots (launch args `['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']`, executablePath `/opt/pw-browsers/chromium`) of every section at 1440 and 390, plus light theme for the hero and two stages. LOOK at them (crop tall images into ≤1500px chunks). Iterate until it looks stunning.
4. Zero console/page errors; every control fires.

## Report (≤ 350 words)
Section-by-section one-liners, widgets rebuilt/added (which are 3D), final counts (widgets · in 3D · checks · derivations · problems), errors found in the old page, and any verify-ux expectation that must change (e.g. check counts).
