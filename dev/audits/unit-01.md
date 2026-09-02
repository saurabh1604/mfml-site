# Unit 1 audit — Systems of Linear Equations

## 1. Visual/layout defects
- **#s14 broken markup (d-14-s14.png):** `src/unit-01.html` ~L975–977 — the "Unit 2 · Vector Spaces" `<h3>` + `<p>` have no `<div class="next-card">` opener (only a stray `</div>`), so they render unstyled and full-bleed at the page's left edge. Also duplicates the proper "Next up" card at the end of #spractice — delete one.
- **#s7 h3 "Up a dimension…" outside `.prose`** (d-07-s7.png, m-07) — hugs the left page margin, misaligned with everything.
- **#w-mixer overflow** (d-03-s3, m-03): `.bar-val` "0 / 11  11 short" exceeds its 5.6rem column and is clipped at the widget edge on both desktop and mobile; "Cabinets x₃" label wraps to two lines.
- **#w-null label collisions** (d-10-s10): "λ·xₙ" arrow label sits on "x = xₚ + λ·xₙ"; "the same λ·xₙ, inside N(A)" overlaps tick labels −4/−2; output panel's "column space — every possible output" is cut off at the left SVG edge ("olumn space"); "A·(λ·xₙ)=0 — swallowed" runs over the "8" tick. On mobile (m-10) every SVG label is ~7px — unreadable.
- **#w-frag** (d-08): "true answer (1,1)" label drawn across both lines and the point.
- **#w-windows rows pane** (d-06): "2x₁+x₂=5" label sits directly on its line.
- **#w-det3** (d-07, m-07): the box occupies ~20% of a 560×430 canvas (≈60px on mobile); at Identity the dashed ghost cube is hidden under the solid cube so the caption's "dashed ghost" is invisible until you act.
- **#w-mult and #w-elim**: 66rem-wide cards holding ~350px of content — vast blank surface; elimination shows one tiny matrix per step with no before→after.
- **Mobile display math in callouts clips** (m-03 intuition, m-10 aha "= b + λ…") — scrolls, but with no affordance; break into `aligned` lines.
- **#w-zoom**: axes have no tick labels; at 1× only two gridlines — "window width 5" has nothing on-screen to read it against.

## 2. Widgets
- **#w-zoom (#s1)** — sin x vs tangent under zoom. Teaches well; add tick labels, a "try: zoom to 10×, then 100×" prompt, and show the gap ∝ w² numerically (two rows: window, gap) so the note's claim is checkable.
- **#w-mixer (#s3)** — 3 steppers, 4 resource bars. Good coupling demo; fix overflow; note says "one slider" (they're steppers). Add a hint after N tries ("try x₁=2"). Verified plan (2,3,1) satisfies all four.
- **#w-lines (#s4)** — six coefficient sliders. Works, but no live "a₁x + b₁y = c₁" readout — learners can't connect slider to equation. Print both equations above the plot and highlight which coefficient changed.
- **#w-mult (#s5)** — hover cells of C=AB (numbers verified). Static matrices; add "edit A/B" or a second shape-mismatch example; animate the row and column sliding together.
- **#w-windows (#s6)** — three tabs. Rows: fine. Cols: good slider readout. Machine: grid morphs but never shows î/ĵ or the unit square, so the link to #s7 is lost; add them and a play button.
- **#w-machine (#s7)** — best widget on the page. Add a draggable î/ĵ tip, and show the parallelogram area label inside the shape.
- **#w-det3 (#s7)** — correct (presets verified: flat rank 2, line rank 1). Enlarge scale, offset ghost cube visibility at identity, add an auto-orbit toggle.
- **#w-frag (#s8)** — ε/δ demo, math verified (x = 1−δ/ε, y = 1+δ/ε). Slider label "ε → 0" while output reads "1" confuses; label as "ε" with the output. Explain "error amplified ×√2/ε" once.
- **#w-null (#s10)** — conceptually superb, visually cluttered (see §1). Add a "what to try" line and colour legend.
- **#w-elim (#s11)** — steps verified against slides (R₄←R₄−R₂−R₃ → a+1; general solution correct). Show previous and current matrix side-by-side with the changed entries linked; parameter-a panel only appears at the last step — say so earlier.
- **#w-pl3 (#s13)** — excellent; all three systems verified. Add the pairwise intersection lines in the "one solution" tab too, and a "n − rank = free directions" readout.
- No wiring bugs: every referenced id exists.

## 3. Missing visual intuitions
- **#s2**: a vector as list ↔ arrow ↔ pixel grid ↔ embedding — one static SVG strip.
- **#s5**: composition picture (blur then darken as two boxes chained; "socks/shoes" order) — small animated diagram.
- **#s9**: no widget at all. A λ₁/λ₂ slider with live `A·x` readout staying at (42, 8) would make "invisible ingredient" tangible.
- **#s11**: static staircase diagram of REF (pivots stepping, free columns shaded) next to the formal definition.
- **#s12**: RREF stepper (extend #w-elim with a "continue to RREF" tab) and a `[A|I]→[I|A⁻¹]` stepper for Trick 2.
- **#s13**: row rank = column rank — a picture with row-space and column-space pivots highlighted in the same staircase.

## 4. Readability & flow
- #s8 "Watch out" is a 190-word wall; split into a four-item list (doesn't exist / expensive / fragile / wasteful).
- #s13 "Here's the profound part" paragraph and the following Aha are long and abstract; lead with the 3×3 B/C example's pivots.
- Prose is occasionally over-written ("hospital corners", "polite-maker", "Photoshop filter", "the drama") — fine in headings, tiring in body; trim ~15%.
- #s12 opens on metaphor before saying why RREF matters (read solution off directly); swap.
- #s10 Aha and the note under #w-null repeat the same argument; keep one.

## 5. Conceptual gaps & rigor
`.derive` candidates (none exist in this unit):
1. **Ax = x₁a₁ + x₂a₂** (#s6, "a line of algebra shows") — write the 2×2 product, group by x₁, x₂.
2. **Aî = column 1** (#s7) — multiply out; then linearity gives Ax.
3. **det 2×2 = ad − bc as area** (#s7) — shear the parallelogram to a rectangle, base×height.
4. **A⁻¹ 2×2 formula** (#s8, "everything cancels") — compute AB entry by entry, get (ad−bc)I.
5. **Row ops preserve the solution set** (#s11) — each op reversible ⇒ same set.
6. **dim N(A) = n − rank** (#s12) — one free variable ⇒ one basis vector; independence via the 1/0 slot pattern.
7. **Consistent ⇔ rank(A)=rank([A|b])** (#s13) — a pivot in the b column ⇔ row 0=c.
8. Move the existing (AB)ᵀ argument into a `.derive` box.

Precision: #s10 "Ridge = pick the shortest x" is really the minimum-norm/pseudoinverse solution; ridge only approximates it — reword. #s1 "linear problems can always be solved" → "always decided". #s14 table lists LU in "Units 2–3" (Vector Spaces / Geometry) — check against the course map (LU is really Unit 5 territory; say "later"). Numbers in #s3, #s9, #s10, #s12, #s13 and all widget presets check out.

## 6. Top 8 changes
1. Fix #s14 next-card markup (L975–977) and the #s7 `<h3>` placement.
2. Fix #w-mixer `.bar-val` overflow / label wrap (desktop + mobile).
3. De-clutter #w-null labels; scale SVG fonts for mobile.
4. Add `.derive` boxes for items 1, 3, 4, 6, 7 above.
5. Show live equations in #w-lines; add î/ĵ + unit square to the machine tab of #w-windows.
6. Add a λ₁/λ₂ widget to #s9 and an RREF/`[A|I]` continuation tab to #w-elim.
7. Enlarge #w-det3 and shrink/compact #w-mult and #w-elim cards.
8. Split the #s8 "Watch out" wall into a list; fix the ridge claim in #s10.
