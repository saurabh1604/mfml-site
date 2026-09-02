# Unit 4 audit — Determinants, Eigenvalues & the Spectral Theorem

## 1. Visual / layout defects
- **#s12 broken markup (d-12-s12.png):** a stray `</div>` (src line 833) closes nothing, so the "Unit 5 · Matrix Decompositions & SVD" `h3` + paragraph escape the prose column and render full-width, flush-left. Also duplicates the `.next-card` at the end of #spractice — delete it.
- **w-rot shows raw LaTeX (d-09-s9.png):** widget subtitle and verdict print literal `e^{±iθ}` (lines 719, 1403). Use Unicode or KaTeX.
- **w-chol label collision (d-10-s10.png):** the "1σ & 2σ of Σ" text sits on top of the orange/green eigen-axis lines at the origin; the axis lines have no legend.
- **w-det wasted canvas (d-02, m-02):** plane is ±3.3 but the default parallelogram occupies one quadrant; on the phone the parallelogram is ~60px wide. Presets are pushed below the fold.
- **w-spec too small (d-07-s7.png):** ±4.3 plane but x is clamped to |x|≤2.2, so q₁, q₂, x and their labels are crammed into the centre 15%; labels overlap the circle.
- **w-eig (d-05, m-05):** the "x" label overlaps the probe ring; λ-labels sit on the ellipse stroke.
- **w-char (d-06):** "p(λ)" label overlaps the curve at the top-left; no vertical scale.
- **w-e3 (d-08, m-08):** dense wireframe with no depth cue; the ghost sphere is nearly invisible; on mobile "λ₂ (orange)" wraps.
- Hover-only interaction in w-cof (`mouseenter`) has no touch equivalent.

## 2. Widgets
- **w-det (#s2)** — draggable columns → parallelogram + signed area. Bug: `pointerdown` on empty canvas grabs the nearest arrowhead and the next `pointermove` teleports it. Missing: a "shear a₂ along a₁, area stays" preset, rotation preset (det=1), and readout of `ad−bc` with the live numbers substituted.
- **w-cof (#s3)** — six expansions of [[3,1,0],[−2,−4,3],[5,4,−2]]; det −1 verified. Terms never show the 2×2 minor itself; render `M₁₁ = |−4 3; 4 −2| = 8−12 = −4` in the card. Add a checkerboard-sign overlay on the matrix, and a tap toggle for mobile.
- **w-eig (#s5)** — probe x vs Ax, alignment %. Dashed eigen-lines + λ labels are drawn from the start, so there is nothing to *hunt*. Hide them until resonance is found (or add a "reveal" button). Add a prompt "try the rotation tab — nothing aligns".
- **w-char (#s6)** — editable A → parabola + roots, tr/det chips. Missing: a "parallelogram of A−λI" thumbnail that flattens as a λ-slider sweeps. Note text cites "Section 6.1", which doesn't exist.
- **w-spec (#s7)** — four-stage QΛQᵀ. Stages jump; add a Play button that animates rotation→stretch→rotation, and enlarge the plane to ±2.6.
- **w-e3 (#s8)** — sphere→ellipsoid with λ sliders. Never shows the actual symmetric matrix A=QΛQᵀ it's rendering — show the 3×3 entries changing as λ slides. No check in §8.
- **w-rot (#s9)** — conjugate pair on the unit circle. Put a rotating arrow beside the complex plane so θ is seen in both.
- **w-chol (#s10)** — z vs Lz cloud. Best widget in the unit. Show L's numbers as a matrix and the ℓ₁₁, ℓ₂₁, ℓ₂₂ recipe evaluating live.

## 3. Missing visual intuitions
- **#s3 row operations:** static SVG of the parallelogram under "swap" (mirror, sign flips) and "add c·row" (shear, area unchanged).
- **#s3 cofactor signs:** the (−1)^{i+j} checkerboard as a coloured grid.
- **#s6 the dial:** animate det(A−λI) as λ sweeps, showing A−λI's parallelogram collapse at λ=7, −4.
- **#s6 eigenspace:** picture of the collapsed matrix's rows becoming parallel + the nullspace line.
- **#s7 quadratic form:** ellipse xᵀAx=1 with semi-axes 1/√λ.
- **#s9 / Problem 2:** spiral picture for λ=1±2i — rotate then scale by √5.
- **#s11 multiplicity:** shear picture (all of ℝ² tilting except the x-axis) vs Problem 1's plane x+y+z=0 with its normal (1,1,1).
- **#s11 AᵀA:** tiny 100×8 → 8×8 shape diagram.

## 4. Readability & flow
- #s2 second paragraph is ~180 words mixing computation, three readings, and the rank link — split into "compute one" / "three readings" as a 3-row mini-table.
- #s11 is two wall-of-text paragraphs with no callout, no picture, no "so what" line — the weakest section visually.
- #s6 "Free sanity check" callout comes *after* the widget that references it ("Section 6.1").
- "navy oval / navy curves" (#s5, #s10) — the colour is mid-blue; say "blue".
- Metaphor density is high (pizza dough, wine glass, wood grain, merry-go-round, picture frame, pulse); tighten.
- #s8 needs a one-line "why ML cares" (covariance ellipsoids / Mahalanobis).

## 5. Conceptual gaps & rigor
Numbers all check (det −1; λ=7,−4; Q Λ Qᵀ; Cholesky √2; Problems 1–5).
- #s7 calls Qᵀ "a pure rotation" — an orthonormal Q may be a reflection (det −1); say "rotation or reflection (lengths untouched)".
- #s11 "a chain collapsing would force two λ's to coincide" is not an argument — replace with the real one or cut.
- Lecture's [[0,1],[0,0]] "does every matrix have n eigenvectors?" example is absent — mention it.
- `.derive` candidates:
  1. **Triangular ⇒ det = ∏aᵢᵢ** — expand along first column repeatedly.
  2. **tr(AB)=tr(BA)** — ΣᵢΣₖ aᵢₖbₖᵢ, swap sums.
  3. **Σλ=tr, Πλ=det** — p(λ)=∏(λᵢ−λ), read off coefficients; then λ=0.
  4. **2×2 characteristic polynomial = λ²−trλ+det** — 3-step expansion.
  5. **Cholesky 2×2 entries** — multiply LLᵀ symbolically, match entries.
  6. **Cov(Lz)=Σ** — E[Lz zᵀLᵀ]=L·I·Lᵀ.
  7. **Distinct eigenvalues ⇒ independent eigenvectors** — apply (A−λ₂I) to a supposed dependence.
  8. **Symmetric ⇒ eigenvectors of distinct λ are orthogonal** — λ₁⟨x,y⟩ = ⟨Ax,y⟩ = ⟨x,Ay⟩ = λ₂⟨x,y⟩.
  9. Promote the two `<details>` proofs in #s7 to `.derive` format.

## 6. Top 8 changes
1. **#s12** delete stray `</div>` + duplicate Unit 5 teaser (line 831–833).
2. **w-rot** replace literal `e^{±iθ}` in subtitle/verdict.
3. **w-eig** hide eigen-lines until found; add "try rotation" prompt.
4. **#s6** move "Free sanity check" callout above w-char; fix "Section 6.1".
5. Add `.derive` boxes (§4, §6, §7, §10).
6. **w-cof** show the 2×2 minor inside each term card + checkerboard sign overlay; tap support.
7. **w-chol** move "1σ & 2σ" label off-origin; add legend for eigen-axes and the live L matrix.
8. **w-spec / w-det** tighten plane ranges and add a Play tween to w-spec; fix w-det pointerdown bug.
