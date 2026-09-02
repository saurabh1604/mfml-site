# Unit 5 audit — Matrix Decompositions & SVD

## 1. Visual/layout defects
- **Real CSS bug — `\sqrt` broken inside every widget.** `.widget svg{display:block;width:100%;height:auto}` (line 106) also hits KaTeX's radical `<svg>`. In `d-04-s4.png` the note reads "q₁ = ½(1,1)" instead of 1/√2; in `d-09-s9.png` "length √3" renders as "length  3". Affects notes in #w-proj, #w-tall, #w-svd. Fix: add `.widget .katex svg{display:inline;width:auto;height:auto}`.
- **Stray `</div>` in #s12** (line 979): the "Unit 6 · Differentiation" h3 + paragraph fall outside `.prose`, render full-bleed at x=0 (`d-12-s12.png`). Duplicate of `.next-card` — delete.
- **#w-amp profile clipped** (`d-11-s11.png`): plane y-range is `0.72·r` but the profile reaches σ₁ → lobes and the `Ax` label are cut off. Size r from σ₁ directly.
- **#w-svd ellipse clipped** at ±6.7 vs y-range ±6.5 for `[[3,0],[4,5]]` (`d-07-s7.png`); the stage-3 ghost also spills past the grid.
- **Dashed eigen/singular lines drawn to ±4…±6 far outside the gridded plane** in #w-proj, #w-diag, #w-hunt, #w-amp — clip to the plane rectangle.
- **SVD factory SVG (#s8)**: "spectral" label sits on top of its arrow; "(take the smaller Gram)" overflows the AᵀA box (`d-08-s8.png`).
- **#w-taste** white digits on 40%-blue cells are low contrast (`d-10-s10.png`); on mobile the heatmap text is ~5px (`m-10-s10.png`).
- **#w-tall 3-D pane**: labels are 10px grey and u₃ is foreshortened to a stub at the default yaw/pitch — the one thing the widget exists to show is invisible. No x/y/z axis labels.
- **#w-moves** default target so elongated the F is a thumbnail in a mostly-empty box; on mobile the flag is ~40px tall (`m-01-s1.png`).
- Slider labels wrap ("dial d₁ (x-axis)", "keep k layers") — widen `.ctl` first column to ~7.5rem.
- #w-hunt strip chart has no x-axis labels (0°–180°) and a 95° y-scale so the curve is a flat wiggle.

## 2. Widgets
- **#w-moves (#s1)** — flag carried through Vᵀ·Σ·U. Fit view to the *current* frame, not the union; add arrows showing the two frames.
- **#w-dials (#s2)** — fine. Add "try: set d₂ to 0" as a preset button.
- **#w-proj (#s4)** — layer view of 2·q₁q₁ᵀ+q₂q₂ᵀ. Single-layer views show a filled ellipse that is really a line; add one draggable x with its two shadows and their weighted sum.
- **#w-diag (#s5)** — PDP⁻¹ pipeline. Stage 2 draws the coordinate vector P⁻¹x as a spatial arrow in the same plane — misleading. Better: show x's components along the dashed p₁,p₂ lines (parallelogram), scale each by λ, re-add.
- **#w-hunt (#s6)** — best widget in the unit. Fix axis labels; snap the auto-sweep to pause at each zero.
- **#w-svd (#s7)** — opens at stage 4 so the v₁,v₂ labels are hidden by default; open at stage 0 or keep faint v labels at the end. First tab needs a word ("the lecture's").
- **#w-tall (#s9)** — wrong default camera and label sizes. Add a "look along the plane" preset so u₃ visibly stands up.
- **#w-rank (#s10)** — excellent. Add a third panel "this layer only" (σ_k u_k v_kᵀ).
- **#w-taste (#s10)** — add a "hide 5 cells → predict them" mode; fix contrast.
- **#w-amp (#s11)** — fix clipping; "σ₁ here" label collides with the Ax arrow.

## 3. Missing visual intuitions
- **#s3 diagonalizable** has no picture: static SVG of AP = PD as "columns of P get scaled".
- **#s8 Σ padding**: shape diagram — tall A → Σ with zero *rows*, wide A → zero *columns* — with U, V sized boxes.
- **#s8 why AᵀA gives V**: unit circle → ellipse → ellipse mapped back by Aᵀ, showing the axes return to the v's.
- **#s10 Eckart–Young error = σ_{k+1}**: label "error" on the first grey bar of the rk-bars chart.
- **#s11 condition number**: overlay a noisy b to show error amplification.

## 4. Readability & flow
- The 3×3 spectral example (#s4 details) and the wide-example walk-through (#s8, line ~746) are single 8-line paragraphs stuffed with inline 3×3 matrices — break into numbered steps.
- #s12 summary is one 12-line paragraph despite the title "five lines" — make it five bullets.
- Slight over-writing: "the SVD shrugs", "fled to ℂ", "friendliest matrix alive". Trim.
- The lecture's own eigendecomposition example `[[2.5,−1],[−1,2.5]]` (λ=3.5, 1.5) never appears; add one line.

## 5. Conceptual gaps & rigor
Numbers verified — all correct. `.derive` candidates:
1. **AP = PD ⇒ Apᵢ = λᵢpᵢ** (#s3).
2. **A^k = PD^kP⁻¹** (#s5).
3. **QΛQᵀ = Σ λᵢqᵢqᵢᵀ** (#s4).
4. **AᵀA = VΣᵀΣVᵀ, so σᵢ² = λᵢ(AᵀA) ≥ 0** (#s8).
5. **uᵢ = Avᵢ/σᵢ are orthonormal** (#s8).
6. **‖A‖₂ = σ₁** (#s11).
7. **Eckart–Young error = σ_{k+1}** (#s10): A − Â(k) = Σ_{i>k}σᵢuᵢvᵢᵀ has top singular value σ_{k+1}.
Minor imprecision: #s7 says σ = λ "only for symmetric PD" — correct is positive *semi*definite.

## 6. Top 8 changes
1. Fix `.widget svg` rule so KaTeX radicals render.
2. Remove stray `</div>` in #s12.
3. Fix #w-amp / #w-svd plane ranges; clip dashed guide lines to the plot.
4. Add `.derive` boxes for rules 1–7.
5. #w-tall: change default camera and enlarge labels; add axis labels.
6. Rework #w-diag stage 2 to show components along p₁,p₂.
7. Break the #s8 walk-through and #s12 summary into steps/bullets; add the Σ-padding shape diagram.
8. #w-taste: fix cell contrast and give the heatmap a mobile layout.
