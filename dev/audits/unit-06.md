# Unit 6 audit — Differentiation

## 1. Visual/layout defects
- **Tables escape the prose column** — `table.plain` in #s7 (d-07-s7.png) and #s13 (d-13-s13.png) sit flush-left at x=0, outside the 44rem column. On mobile (m-07-s7.png) the last column is clipped and cells break one-word-per-line. Fix: `max-width:var(--prose);margin-inline:auto` + mobile scroll wrapper. Also check for the stray-`</div>` next-unit teaser pattern seen in the other units.
- **#w-sh stagebar labels** "input"/"output" render in body-size serif — `.w-sub` is only styled under `.widget-head`.
- **#w-tay** error wash floods the entire plot (polynomial clamped to the Y-range → solid orange background); "anchor x₀=0" label collides with the curve; legend floats far above the axes.
- **#w-ch** SVG mostly empty; the three Δ bars are clamped to 70px so Δx, Δu, Δh look the same width — contradicts "amplification".
- **#w-bp** on mobile: 600-unit viewBox at ~330px makes every node label ~5px. Verdict "W = [matrix] and y = …" wraps "W =" onto two lines.
- **#w-zoom** inset "you are here" map overlaps the curve's peak. **#w-sec** secant runs off the top of the frame at default h (clip to plot).
- **#w-dd** yellow "your step u" arrow on the pale blue wash is low-contrast; gauge title collides with the "∇f" peak marker.
- **#w-ps** 3D surface has no axes, tick labels, or x/y/z markers; pale tiles make the saddle hard to read.
- #s9 heading wraps to three lines.

## 2. Widgets
- **w-val (#s1)** default w=1.9 pins the hiker to the right edge; add "▶ take 10 steps".
- **w-zoom (#s2)** fix inset overlap.
- **w-sec (#s2)** add a live difference-quotient equation `(f(x+h)−f(x))/h = …` with numbers.
- **w-ch (#s3)** bar clamp bug hides the point. Show Δu/Δx and Δh/Δu as gear ratios or proportional (log) bars; animate a nudge travelling through.
- **w-tay (#s4)** fix wash; highlight the term being added (coefficient k) and show the error curve |f−Tₙ|.
- **w-ps (#s5)** verdict logic is WRONG: `fx·fy<0 → "signature of a saddle"` — opposite slope signs say nothing about saddles (curvature does). Fix. Add axes; show the slice as a 2D side panel with its slope.
- **w-dd (#s6)** fine. **w-gc (#s6)** fine; preset "show contour ⟂ arrow" overlay.
- **w-sh (#s7)** the derivative object is only a text box; draw its actual m×n grid.
- **w-jm (#s8)** default tab "linear map" is already linear → verdict ✓ before zooming; default to "squaring". #s9 prose says "slide y through more than 2π" but `#jm-y` range is ±1.2: false promise — widen to ±3.5 or add a "y += 2π" button. Add a det-J area readout.
- **w-bp (#s10)** forward values visible at stage "start" (spoils stepping); Jacobians diag(1−a²), W never appear numerically. Fix mobile scale.
- **w-gd (#s11)** add presets η=0.05, 0.5, 0.95, 1.05 and a loss-vs-step sparkline.
- **w-kink (#s12)** for |x| and ReLU the secants coincide with the function, so "squeeze h" changes nothing and ✗ is already lit at h=1.2. Add a smooth near-kink tab (softplus / √(x²+ε)) so squeezing visibly matters; make secants distinguishable.

## 3. Missing visual intuitions
- **#s9 has no picture**: det J as area scaling (unit square → parallelogram, sign flip = mirror) and the spiral-staircase wrap of T(x,y+2π).
- **#s3** gear-train static SVG (3× then 5× = 15×) and vanishing gradient as shrinking gears.
- **#s10** shape-chain diagram (m×p)(p×n) with the row "shrinking" through layers vs the matrix blow-up.
- **#s7** rows=outputs/columns=inputs grid with one highlighted cell ∂fᵢ/∂xⱼ.
- **#s12** row vs column convention side-by-side; the ReLU subgradient fan at 0.
- **#s4** per-term contribution bars.

## 4. Readability & flow
- #s9 and #s12 openings don't say why; #s12 is four unrelated topics plus a Taylor erratum callout that belongs in #s4 (duplicates the `.opnote` there).
- Literary tics: "Cauchy–Schwarz wearing a hat", "a place careful people still trip", "spiral staircase…" (needs the picture instead).
- #s10 paragraph 3 (row-vs-matrix efficiency) is dense; split with a 2-line "so what: cost ≈ 2 forward passes".
- #s2 says the derivative "points in steepest ascent" before gradients exist — flag as forward reference.

## 5. Conceptual gaps & rigor
No `.derive` boxes. Candidates:
- **Product rule**: f(x+h)g(x+h)−f(x)g(x), add/subtract f(x+h)g(x), split, limits.
- **Chain rule (1-D)**: Δu = f′Δx + small; Δh = g′Δu + small; divide, let Δx→0 (Unit 7 has the rigorous version — this one can be the intuitive 4-step version and link forward).
- **Why k! in Taylor**: differentiate (x−x₀)ᵏ k times.
- **Gradient = steepest ascent**: directional rate = ∇f·u; Cauchy–Schwarz ⇒ max at u ∥ ∇f. **Gradient ⟂ contours**: f constant along the curve ⇒ ∇f·(tangent)=0.
- **Vector chain rule = J_G J_F**: entry (i,j) = Σ_k.
- **σ′=σ(1−σ)**, **∇(xᵀAx)=xᵀ(A+Aᵀ)** (P8 step 3 already — promote), **det J = area factor**.
- Numbers check out. Imprecisions: w-ps saddle verdict; "Hessian, Unit 8" (c7) and "Newton in Unit 8" (#s4) — Unit 8 is Taylor per the course map, optimisation is Units 9–11 (say "a later unit").

## 6. Top 8 changes
1. #s7/#s13 `table.plain` inside prose width + mobile scroll wrapper.
2. #w-jm: default tab → squaring; widen `#jm-y`; det-J area readout.
3. #w-kink: smooth near-kink tab; distinguishable secants.
4. #w-ch: remove the 70px clamp; proportional bars with gear ratios.
5. Add `.derive` boxes for chain rule, gradient=steepest ascent, gradient ⟂ contours, J_G J_F entry, k!, product rule.
6. #w-bp: hide forward values until their stage; show the two Jacobian matrices; mobile-scale.
7. #w-ps: fix the saddle verdict; add axes + 2D slice side panel.
8. #s9: static SVG (area factor + 2π wrap); move the Taylor erratum callout from #s12 into #s4.
