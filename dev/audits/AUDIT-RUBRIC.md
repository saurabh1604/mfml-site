# Audit rubric — "The Math Behind the Machine" (linearalgebra.info)

You are auditing ONE unit page of an interactive math-for-ML course. Sources:
- Canonical source: /root/mfml-site/dev/src/unit-0N.html  (raw KaTeX \( \) / \[ \]; widgets inline JS)
- Built page: /root/mfml-site/dev/site/unit-0N.html (do not edit)
- Screenshots of every section: /root/mfml-site/dev/shots/unit-0N/  (d-* = 1440px desktop, m-* = 390px mobile). LOOK at them with the Read tool — at least every desktop section shot and a sample of mobile ones.
- Lecture/companion/practice transcripts (what the unit must faithfully cover): /root/mfml-site/dev/content/
- House design notes: /root/mfml-site/dev/tpl/ (js-shared.js runtime helpers), and unit-07 src for the `.derive` proof-box component.

Audience: working professionals in a distance ML masters; they want intuition FIRST, then every algebraic step shown simply, exam-relevant worked problems. The author's stated goals: "polish visual representations, website design, interactive elements, visual intuitions, readability, conceptual understanding, make things easier to grasp, awesome representations". Also: proofs/derivations step by step in plain words (the `.derive` component from unit 7) are wanted for every rule the unit states.

Produce a CONCRETE, PRIORITISED audit (markdown), max ~900 words, with these headings:
1. Visual/layout defects (anything that looks broken, cramped, overflowing, low-contrast, inconsistent, ugly in the shots — cite screenshot file names; check mobile).
2. Widgets: for each widget (id + section), one line: what it shows, does it actually teach the concept, what would make it land better (e.g. missing labels, no "what to try" prompt, no live equation readout, nothing animates, no preset buttons, colours unclear). Flag any widget bug you can see in the source (e.g. event wiring to missing ids).
3. Missing visual intuitions: concepts in this unit that are explained only in words/algebra but deserve a picture, animation, or a static SVG diagram (name the concept, the section, and describe the picture).
4. Readability & flow: paragraphs too long/dense, jargon before intuition, sections whose opening doesn't say WHY, places where a one-sentence "so what" summary / analogy / callout is missing; any prose that's over-written or literary instead of plain.
5. Conceptual gaps & rigor: rules stated but not derived (candidates for `.derive` boxes — list the exact rule and what a 3–6 step plain-word derivation would be), anything mathematically imprecise or wrong (check numbers against content/ transcripts and by computing), missing "why does ML care" links.
6. Top 8 changes, ranked by (learner impact ÷ effort). Be specific: section id, element, what to change.

Rules: Do NOT edit any file. Be specific and honest — "fine" is an acceptable verdict for a section. Do not pad. Cite section ids (e.g. #s4) and widget ids.
