# Unit 3 audit — Analytic Geometry (`src/unit-03.html`)

## 1. Visual / layout defects
- **#s12 broken markup** (`d-13-s12.png`): the "Unit 4 · Determinants…" `<h3>` + `<p>` (src lines 790–792) sit outside any `.prose`/`.next-card` wrapper and are followed by a stray `</div>`. They render full-width, flush to the viewport's left edge, and duplicate the real `.next-card` at the end of #spractice. Delete them.
- **w-sh road label clipped** (`d-11-s10.png`, `m-11-s10.png`): "the road (direct…" runs off the SVG's right edge. "a − shadow" label collides with the "a" label at the stick tip. The "square marker" is a single short stroke, not a square.
- **w-rig parallelogram clipped** (`d-10-s9.png`): with θ=35° the rotated u+v corner exceeds the ±3.2 plane and is cut off. Ghost arrows u, v carry no labels.
- **w-dot SVG too small** (`d-03-s2d.png`, `m-03-s2d.png`): bar heights are 13 px/unit in a 560×240 box; the `(+2)(+1)` captions are 9.5 px and unreadable; on mobile the whole bar chart is ~40 px tall. Mobile also shows "Oppenheimer" overflowing its 5 rem label column and the `+2 · +1` outputs wrapping to two lines.
- **w-norm** (`d-02-s2.png`, `m-02-s2.png`): unit balls (the teaching point) are tiny in a ±4.6 plane; "ℓ₂ ball"/"ℓ₁ ball" labels overlap the shapes. Right column has ~200 px of dead space under the note.
- **#s2 display equation** on mobile: the two norms on one line overflow. Stack them under 640 px.
- **w-ang** (`d-07-s6.png`): cosine meter and its "cos ω" label overlap the −2 gridline band at the plot bottom.
- **w-gs default view** (`d-12-s11.png`, `m-12-s11.png`): x₂ projects almost on top of the z-axis, so the advertised 45° angle is invisible; no floor grid or depth cue; on mobile the figure is a thin sliver.
- Controls `.ctl` label column (6.2 rem) wraps "stick a: angle" onto two lines on desktop.
- Maintenance hazard: section ids (`#s4`…`#s12`) are off by one from displayed numbers since #s2d was inserted — leave ids alone.

## 2. Widgets
- **w-norm (#s2)** — crow vs taxi path + unit balls. Add a "show only unit balls" zoom or ±2.5 range, a preset row ((3,4), on-axis, (1,1)), and a live `√(x₁²+x₂²)` / `|x₁|+|x₂|` readout with the numbers plugged in.
- **w-dot (#s2d)** — per-movie product bars + sum meter. Give the SVG a taller viewBox, bigger fonts, and a live `x·y = (2)(1)+(1)(2)+… = 2` equation string.
- **w-eng (#s4)** — A-norm unit ball with SPD/broken detection. Best widget in the unit. Add a ghost Euclidean circle for comparison, and a `xᵀAy = 2·(1)(−1)+1·(1)(1)` expansion in the readout.
- **w-ang (#s6)** — no preset pressed on load; length sliders could print "cos unchanged" when only length moves.
- **w-hd (#s7)** — histogram of cos ω for 300 pairs. Chips compare *mean |cos|* against *1/√n* (a std), which never match (0.64 vs 0.71 at n=2); show std instead. No y-axis/count label; add a "sweep n" button.
- **w-rig (#s9)** — rotate vs shear. Fix clipping; explain the shaded parallelogram (area) or drop it; label ghosts u, v; shear tab has no explanation of what k does.
- **w-sh (#s10)** — projection split. The "residual ⊥ b ✓" chip is always ✓ by construction; show `α = ⟨a,b⟩/⟨b,b⟩ = 1.48/1` numerically; draw b as an arrow.
- **w-gs (#s11)** — 3D stepper. Needs better default yaw, "reset view", labelled floor plane, and a highlighted span plane from step 0.
- No event-wiring bugs found.

## 3. Missing visual intuitions
- **#s5 Cauchy–Schwarz** — no picture. Static SVG: u, v, the residual u−αv, showing residual length² ≥ 0 hitting 0 only when u‖v.
- **#s5 induced norm vs Manhattan** — ℓ₂ ball round (inner-product), ℓ₁ diamond has no inner product (parallelogram law fails).
- **#s8** — pure prose that sends the reader back to #s4. Inline a static before/after pair (circle with x⊥y; ellipse with 109.5°).
- **#s11 orthonormal coordinates** — v with its two shadows onto e₁, e₂.
- **#s11 elimination route** — a 2-frame diagram of v₁, v₂ → (0.3,0.1), (−0.25,0.75).

## 4. Readability & flow
- #s2 opens with three axioms in one 90-word sentence before any "why" — lead with the taxi/crow picture, then axioms as a 3-row table.
- #s3 first paragraph is a 130-word wall defining bilinearity/symmetry/PD inline; split into a labelled list.
- #s12 summary is a single dense paragraph of ①–⑤; render as a 5-line list.
- #s8 repeats the w-eng note almost verbatim; check c7 gives away its answer in the paragraph above.
- Over-written phrases: "the zero vector, ever the freeloader", "a liar that bends the ruler", "Geometry has collapsed" — trim.
- #s9 lacks a one-line "why ML cares" upfront (embedding rotations, weight-orthogonality).

## 5. Conceptual gaps & rigor
Numbers verified (−1/3, 109.5°, elimination table, GS example, all eight problems) — all correct.
- **Sylvester's criterion / how to test SPD** is used in Problems 3, 6, 7 but never taught. Needs a `.derive` box in #s4: 2×2 case — write xᵀAx = a x₁² + 2b x₁x₂ + d x₂², complete the square → a>0 and ad−b²>0.
- **Companion Example 2** (3×3 SPD via completing the square) is missing — the exam-style "prove PD" technique.
- Problem 5 relies on eigenvalue classification (Unit 4) — add a forward-reference note.
- `.derive` candidates: (i) ‖x−y‖² = ‖x‖²+‖y‖²−2⟨x,y⟩; (ii) triangle inequality from C–S; (iii) cos ω ∈ [−1,1] ⇒ unique ω; (iv) angle preservation under orthonormal A; (v) projection coefficient α; (vi) A-orthonormal coordinates λᵢ=⟨v,eᵢ⟩; (vii) Cauchy–Schwarz itself via the residual (0 ≤ ‖u−αv‖² with α=⟨u,v⟩/⟨v,v⟩).
- "Watch out" callout claim "inner product is typically large when close" is loose — the identity above makes it exact.

## 6. Top 8 changes
1. #s12: delete stray h3/p/`</div>` (lines 790–792).
2. #s4: add `.derive` box for 2×2 SPD test (Sylvester via completing the square) + companion's 3×3 example.
3. #s5: add `.derive` for ‖x−y‖² identity and Cauchy–Schwarz, plus a static C–S residual SVG.
4. w-dot: enlarge SVG/fonts, fix mobile label overflow, add equation string.
5. w-sh: fix clipped road label, real right-angle square, separate "a" / "a − shadow" labels.
6. w-hd: replace mean|cos| with std; add "sweep n" animation.
7. w-gs: better default yaw + reset button + floor grid.
8. #s2/#s3: convert axiom paragraphs to lists; stack #s2 norms equation on mobile.
