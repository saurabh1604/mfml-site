# Unit 2 audit — Vector Spaces (`src/unit-02.html`)

## 1. Visual / layout defects
- **#s13 broken markup → full-width flush-left text** (`d-13-s13.png`). The "Unit 3 · Analytic Geometry" `<h3>`+`<p>` (lines 792–793) sit outside `.prose` and are followed by a stray `</div>` (794). They render 1176px wide at the page's left edge. Also duplicates the `.next-card` at the end of the practice arena — delete it.
- **TOC rail collides with widgets at 1420–1440px** (`d-02`, `d-04`, `d-06`…). `.toc` is `right:.9rem;width:11rem` while `.widget` is 66rem centred in a 76rem main; at 1420px they overlap by ~8px and at 1440px they touch. Rail clipped in every desktop shot and "← Unit 1" wraps to two lines in `.toc-nav`. Raise the rail breakpoint to ~1520px.
- **2-D plots waste width and go microscopic on mobile.** `plane()` forces a square range inside non-square viewBoxes (560×420, 420×330), so the plot occupies the middle third. On 390px (`m-04-s4.png`, `m-09-s9.png`, `m-10-s10.png`) the subspace tester is ~130px wide and the mirror's dish-space arrows are a few pixels with unreadable tick labels. Use aspect-matched ranges, or raise the SVG to full-width on mobile with `min-height`.
- **#w-rec dish panel**: range ±6.5 but vectors reach ≈2.5 → arrows crowd the origin, `x₂` label overlaps `b₂`, `b₁/b₂` in `--ink-muted` are barely visible (`d-09`). Auto-fit the range to the vectors.
- **#w-basis**: the basis grid (drawn to ±9) and the standard grid both use grey tones (`d-10`); can't tell which is which. Tint the basis grid with `--s1`/`--s2` washes and clip to the viewBox.
- **#w-sub controls**: label "sample point u" wraps in the 6.2rem grid column (`d-04`).
- Mobile inline math: "Formally, span(…)" orphans "ℝ}" on its own line (`m-06`), and `λ₄ = −7λ₁ − 15λ₂ − 18λ₃` runs to the viewport edge (`m-09`).

## 2. Widgets
- **#w-group (#s2)** — six preset sets × four axiom cards; clock animation only for Clock₁₂. Essentially a table: nothing to *do* for 5 of 6 presets. Add a tiny "try to undo" interaction per set (e.g. slider on ℕ₀ that goes negative and turns red), and show the clock for every finite/modular preset.
- **#w-sub (#s4)** — good concept, works (u×0 correctly escapes x=1). Missing: animate the arrow growing from u to 2u; no "what to try" prompt; v is fixed and unlabeled as a set member; verdict for the square only says "keep pushing" rather than hinting "scale bigger".
- **#w-span (#s6)** — the best widget on the page. Improvements: numeric readout of the trip point `λ₁v₁+λ₂v₂+λ₃v₃ = (x,y,z)`; v₁ arrow is the same blue as the plane fill; "3 coplanar" preset should visibly show v₃ lying flat in the plane with a "v₃ = a·v₁+b·v₂" readout.
- **#w-ind (#s8)** — correct (presets verified: p3 → (−7,−15,−18); p4 pivots 1,2,4; p5 → v₂=2v₁, v₄=v₁+2v₃). But it jumps straight to RREF: no step-through of row ops, so "elimination hunts redundancy" is a black box. Pivot-column highlight on the inputs is nearly invisible (`d-08`). Right half of the widget is empty — room for a step log.
- **#w-rec (#s9)** — mirror idea is excellent; layout kills it (see §1). Draw the B-grid (sheared graph paper) in dish space so the "mirror" is visible as a shear; scale both panels alike; the 3rd-dish button's `aria-pressed` is never initialised.
- **#w-basis (#s10)** — works; sliders labelled "v₁/v₂" are the *standard* coordinates of v, easily confused with basis coordinates — label "v (standard x, y)". Add a live equation `v = c₁b₁ + c₂b₂` drawn along the dashed legs, and a "Rotated" preset readout showing coordinates changing while v doesn't move.

## 3. Missing visual intuitions
- **#s3 vector-space axioms** — no picture. A small SVG: two arrows u, v, their sum, then λ(u+v) vs λu+λv drawn as two routes to the same point.
- **#s5 null space / affine shift** — whole section is text. A 2-D SVG: N(A) as a line through 0, the solution set of Ax=b as the same line shifted by x_p, with an arrow x_p. This is the payoff promised from Unit 1.
- **#s7 independence** — (1,2),(2,4) on one line vs (1,0),(1,1) opening a parallelogram; show the "route to 0" as arrows that return home.
- **#s9 pigeonhole (m > k ⇒ dependent)** — 3 recipe cards trying to fit 2 pantry slots.
- **#s11 components ≠ dimension** — a line in ℝ² with ambient axes, and a "curled surface in a big box" sketch for the manifold hypothesis.
- **#s12 "original columns, not RREF columns"** — side-by-side A and rref(A) with the kept columns highlighted in *A* and crossed out in rref.

## 4. Readability & flow
- **#s3** opening paragraph packs V1–V4 into one run-on sentence with inline KaTeX; break into a 4-row list with a plain-word gloss each.
- **#s5** first paragraph is one 8-line block covering S1–S3, column space, and the affine remark; split, and put S1–S3 in a `.derive` box.
- **#s10** "Four portraits" paragraph: four definitions + the uniqueness proof in one paragraph. Split; the uniqueness argument becomes a `.derive`.
- Tone is occasionally over-literary ("the business model of abstraction", "Unit 1 sends its regards", "Both officially citizens now", "finished honestly"); trim.
- The companion-PDF erratum in #s12 "The result" callout is correct (verified: 3x₁−2x₂ gives −7 ≠ −6) but belongs in a `<details>`, not the headline result box.
- #s8 and #s12 largely repeat each other ("original columns" X-ray metaphor appears twice).

## 5. Conceptual gaps & rigor
Numbers checked: all presets, P2 (−15/7, 3/7, 10/7, 13/7), P4, P5, ℝ⁴ example, practice problems — correct. Candidate `.derive` boxes:
1. **span is a subspace (#s6)** — 0 via all-zero λ; sum of two combinations regroups into one; λ×combination rescales weights.
2. **Column space is a subspace (#s5)** — stated "by an equally quick argument", never shown: A0=0; Ax+Ay=A(x+y); λAx=A(λx). Also null space is a subspace (S1–S3).
3. **Basis ⇒ unique coordinates (#s10)** — two recipes, subtract, independence forces all differences 0.
4. **All bases have the same size (#s11)** — write basis B (size m) as recipes over basis C (size k); m>k ⇒ recipes dependent ⇒ B dependent, contradiction; symmetrical.
5. **Recipes theorem (#s9)** — present but only ⇒; state and prove ⇐.
6. **Non-pivot RREF column = recipe (#s8)** — asserted "literally spell out"; needs the 3-step reason (row ops preserve column relations because they are left-multiplication by invertible E).

Imprecisions: #s2 identity/inverse stated one-sided (x⊗e=x) — fine for groups but say so; #s4 "the only subspaces of ℝⁿ are flat things through the origin" stated as rule of thumb without noting it's a theorem. Missing ML links: null space ↔ non-identifiable weights / weight symmetry; dimension ↔ rank of embedding matrices; affine ≠ linear for bias terms.

## 6. Top 8 changes
1. **#s13** remove the stray "Unit 3" h3/p and `</div>` (lines 792–794).
2. **`plane()` usage**: fit range to viewBox aspect and auto-scale to data; fixes #w-sub, #w-rec, #w-basis on both desktop and mobile. (Note: `plane()` lives in the page's inline copy of js-shared — you may add a local helper in this unit rather than editing tpl.)
3. **#s5** add an SVG "null-space line + shifted solution line" figure and a `.derive` for N(A) and C(A).
4. **#s6/#s10/#s11** add `.derive` boxes: span is a subspace; unique coordinates; basis size invariance.
5. **#w-ind** add a "step through elimination" stepper; make pivot highlight in the editor obvious.
6. **#w-rec** draw the sheared B-grid in dish space, equal scales, thicker b₁/b₂.
7. **TOC rail**: breakpoint 1520px; stop "← Unit 1" wrapping.
8. **#s3** break the axioms into a list with a small distributivity SVG; **#s7** add the two-example picture.
