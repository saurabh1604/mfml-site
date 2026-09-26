# Round 22 · Independent review brief (reviewers only — do not edit any file)

You are a fresh pair of eyes on one reworked unit of linearalgebra.info ("The Math Behind the Machine", by Prof. Saurabh). The builder who reworked it is still available and will fix whatever you find; the lead will forward your report. **Do not edit any file in the repo.** Write only your report file `dev/audits/u1N-r22-review.md` and screenshots under `dev/shots/review-u1N/`.

Read first: `dev/tpl/R22-REWORK.md` (the owner's complaint, the teaching standard with its 12 rules and exemplar, the visual-correctness protocol) and your unit's plan `dev/tpl/u1N-R22.md`. The built page is `dev/site/unit-1N.html` (open it as `file:///home/claude/mfml-site/site/unit-1N.html` in Playwright, Chromium at `/opt/pw-browsers/chromium`, WebGL args `['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']`; the software renderer is slow — 1–3 frames per second on 3-D stages — so wait for state rather than fixed times). The sources are `dev/src/unit-1N.html` and `dev/tpl/u1N-*`.

The owner's bar: people should understand the topics "so well that they never forget", with great conceptual and visual intuition, in simple words; every visual must be correct; everything must work.

## What to do
1. **Read the whole unit start to finish as a bright student who has never met the topic** (the extracted text is fine for a first pass, then the rendered page). After each section, write down honestly: could you now (a) explain it in three sentences, (b) draw its key picture, (c) predict what a knob does, (d) redo the worked example? Where the answer is no, say exactly which sentence or step lost you and propose a concrete fix (rewrite the sentence, add the missing step, add a picture).
2. **Check the teaching standard** section by section: real opening question; one anchor picture that carries the mechanism; mechanism before formula and the formula read aloud; a "why it works" paragraph; variants compared; a named trap; flow (no fact-lists, no clever asides, no jargon before the everyday word); checks that test understanding with plausible wrong options; links back/forward; a vivid one-sentence hook. Flag anything dense, choppy, hand-wavy, or wrong.
3. **Check the content like a subject expert.** Every statement about the ML must be correct and standard (formulas, names, dates, attributions, percentages, what each method does and doesn't do). Recompute at least the key worked examples yourself (python/numpy) and compare with the page and with the widgets. Check prose ↔ widget ↔ drawer ↔ practice consistency (same numbers, same notation).
4. **Test every widget by hand, one by one** (use the Try line as your script, then try to break it: extremes, rapid clicks, reset, theme toggle, 390 px). For each: does the picture tell the truth (lengths, angles, bars, labels match the numbers — measure from the DOM/SVG or the widget's `state()` hook where present)? Is it readable in 5 seconds? Any overlap, clipping, tiny text, wrong colour/legend, NaN, stuck state, console error? Does every Try-line claim come true? Screenshot each widget in its key states at 1440 and 390 and look at them.
5. **Check the whole page**: hero (clear of the text at 1280/1440/1568×757/1920 and at 390), TOC, checks answer and score correctly, drawers open and KaTeX renders, practice arena works, no horizontal overflow 360–1680, light theme.

## Report format (`dev/audits/u1N-r22-review.md`, and also as your final message, ≤ 900 words in the message; the file may be longer)
- **Verdict** in two lines: would the owner be proud of this unit? What are the three biggest problems?
- **Must fix** (errors, broken things, misleading visuals, confusing explanations): numbered, each with location (section id / widget id / line), what's wrong, evidence, and the concrete fix.
- **Should fix** (clarity, flow, clutter, weak checks): same format.
- **Nice to have**: short list.
- **What is excellent** (so the builder keeps it): short list.
Be specific and actionable. Don't pad; don't praise without reason; don't report things that are fine.
