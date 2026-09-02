# Unit 7 audit — Backpropagation & Automatic Differentiation

Strongest unit; the `.derive` boxes are the model. Defects are mostly layout polish and mobile scale.

## 1. Visual/layout defects
- **Summary table & Unit-8 teaser flush-left at page edge** (`d-12-s11.png`): `table.plain` in #s11 and the trailing `<h3>/<p>` (src lines ~1011–1012) sit outside `.prose`. Same for the cookbook table in #s7 (`d-08-s7.png`). Give `table.plain{max-width:var(--prose);margin-inline:auto}` (+ mobile scroll wrapper) and delete the duplicate teaser (the real `.next-card` exists at the end of #spractice).
- **Clipped display equation** in the neuron proof step 4 (`d-06-s5.png`, line ~638): the `\xrightarrow{\text{widget's numbers}}` line overflows; the result `−0.4230` is cut off. Break after the arrow / own `\[ \]`.
- **Orphaned `∎` and stray colons** in layer proof step 5, cookbook steps 1–2 & 4, sigmoid proof step 1. Attach `∎` with `white-space:nowrap`; keep the colon inside the inline math.
- **Edge labels collide with arrows** in `#w-paths` (`d-03-s3.png`): "∂f/∂v = u = 2" and "∂f/∂u = v = 0" struck through by their own edges; "∂v/∂x = 1" sits on the y→u crossing. Offset labels perpendicular to the edge as `#w-graph` does.
- **Half-empty widget canvases**: `#w-layer` at stage 1 and `#w-cost` at K=4 use ~35% of a 330px-tall SVG. Shrink viewBox height per stage or grey out the pending stages.
- **Mobile** (`m-02-s2.png`, `m-07-s6.png`): graph-machine and layer SVGs shrink to ~9px labels. Add `min-width` + horizontal scroll on those two SVGs; break the long display equations with `\\` under 640px.
- Gradient-checker y-axis title overlaps the `10²` tick (`d-11-s10.png`).

## 2. Widgets
- **#w-graph (#s2)** — add a "step once" button (the tween runs 7 nodes in 2.4s; learners can't pause at the fork at c).
- **#w-paths (#s3)** — label collisions above.
- **#w-neuron (#s5)** — loss meter nearly invisible at step 0; label it "press step". Verdict should mention η.
- **#w-layer (#s6)** — one slider on δ⁽ᵃ⁾₁ would make the outer product visibly react.
- **#w-cost (#s8)** — blocks read `∂f/∂f` at 8.8px with no layer indices; label blocks `∂f₄/∂f₃` etc.
- **#w-check (#s10)** — verdict for −7<log h≤−2.2 hardcodes "error near 10⁻¹⁰" while the default h=10⁻³ shows 2.6e-5. Compute the phrase from `E`.
- No wiring bugs.

## 3. Missing visual intuitions
- **#s4 "line plus dying leftover"**: SVG of g near x₀ with the tangent, r(h) drawn as the gap, r(h)/h shrinking as h halves.
- **#s4 bridge**: 3-column node diagram (j → k → i) with one highlighted path per term of the Σₖ.
- **#s6 Aᵀ**: rows of A as "neuron i reads inputs", columns as "input j feeds neurons".
- **#s10 vanishing gradients**: strip of 10 sigmoid layers with blame shrinking by ≤¼ each.
- **#s10 forward vs reverse mode**: one-input-many-outputs vs many-inputs-one-output.

## 4. Readability & flow
- Hero lede is 120 words; cut the last sentence (the proof list) into a chip.
- #s6 opening runs 5 sentences of algebra before "read them as people" — move that paragraph before the formulas.
- #spractice says "Eight problems" then lists 11. Fix.
- Too dense derive boxes: Rule 2 proof (#s4, step 3 folds three arguments into one `dwhy` — split), and the V-shape proof step 4 (split "set E′=0" and "read off h*").

## 5. Conceptual gaps & rigor
- All numbers verified ✓.
- **V-shape floor**: text says "bottoms out near 10⁻⁵" / h*≈5×10⁻⁶, but for this f at x=1 the true minimum is at h≈3×10⁻⁷ (err 4e-12). Say "10⁻⁵ for a tame f; for the monster, nearer 10⁻⁷ because f‴ is huge".
- Rule 2 proof, step 3: "‖Δu‖ ≈ const·h" needs "const = ‖du/dx‖, and if that is 0 the term is already handled".
- Missing derive: (a) sigmoid-layer Jacobian is *diagonal* (aᵢ depends only on Zᵢ → off-diagonals 0 → diag(a⊙(1−a))). (b) the stacked formula ∂L/∂θᵢ = ∂L/∂f_K ⋯ ∂fᵢ₊₁/∂θᵢ (#s8) derived from the recipe of #s4. (c) Linearization as "first two Taylor terms" (#s9) — one-line link.

## 6. Top 8 changes
1. #s11/#s7 tables + Unit-8 teaser.
2. Fix the clipped `\xrightarrow` equation in #s5 derive step 4.
3. `#w-check` verdict from `E`; correct the h* text.
4. `#w-paths`: offset edge labels.
5. Mobile: min-width + overflow scroll on `#gr-svg`, `#ly-svg`; line-break the long display equations.
6. Fix "Eight problems" → eleven; keep `∎` on the sentence line.
7. Add the diagonal-Jacobian derive box in #s6 (+ b, c).
8. Add a static "line plus leftover" SVG at the top of #sproof and a j→k→i path diagram at the bridge.
NOTE: verify-u7.js asserts 10 derive boxes and score-total 16 — update those expectations if you add boxes/checks.
