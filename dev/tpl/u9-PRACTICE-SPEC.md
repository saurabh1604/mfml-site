# Unit 9 · Gradient Descent — practice arena spec

You are writing TWO files:
1. `/home/claude/mfml-site/dev/tpl/u9-practice.html` — the practice-arena section body (twelve `.prob` cards, nothing else: no `<section>` wrapper, no heading, no intro prose, no next-card).
2. `/home/claude/mfml-site/dev/verify-math9.py` — a sympy/numpy script in the exact style of `verify-math8.py` (read it) that machine-checks EVERY number printed in your twelve solutions plus the "also verify" list below, printing `ok` lines and ending with a count. It must run clean with `cd /home/claude/mfml-site/dev && python3 verify-math9.py`.

## Read first (house style — copy it exactly)
- `tpl/u8-practice.html` (all twelve cards): markup, `.pstep`, `.pans`, `.callout remember` inside the solution, the `<b>(a)</b>` part labels, display maths broken with `aligned`/`\\` so nothing overflows a 44rem column, `\(…\)`/`\[…\]` raw KaTeX (KaTeX 0.18.4: no `\xrightarrow`, no wide `\text`, keep `∎`/✓ outside math or use `\blacksquare`), tables of iterations written as `<table class="plain">` inside the step (see Unit 8's cards for `.plain` tables — one computation per line, a row per iteration: k · point · gradient · new point · f).
- The source: `content/practice9.txt` — the twelve problems, fully worked. Your job is to re-set them in the house format, keep every number, make every algebraic step visible (one computation per line), and write the "what this tests / plan" line and the "remember" takeaway for each. Fix the source's own slips silently (there are none known, but verify everything). Present it as a plain topic-wise practice set: never mention where the problems come from, never mention exams, question papers, marks, or "papers ask"; the difficulty tag replaces the marks.
- Refer to the unit's ideas by role, not by section number: "the update rule", "the step-size speed limit 2/λ_max", "the line-search formula", "the perpendicularity property", "the finite-difference audit", "the bracketing trace".

## Card format
```
  <!-- ===== Problem N ===== -->
  <div class="prob reveal">
    <div class="prob-head"><span class="ptag">Problem N</span><span class="pdiff easy|medium|hard">easy|medium|hard</span></div>
    <p class="pq">… the question, parts as <b>(a)</b> <b>(b)</b> …</p>
    <p class="ptest"><b>What this tests.</b> one sentence. <b>Plan.</b> one or two sentences on the order of moves, what to compute first, the check at the end.</p>
    <details class="sol"><summary>Show the full solution</summary>
      <div class="pstep"><b>(a) Step 1 — name of the move.</b> … every algebraic step; one computation per line inside \[\begin{aligned}…\end{aligned}\] when there are several …</div>
      …
      <p class="pans">answers at a glance: (a) … (b) … (c) …</p>
      <div class="callout remember reveal"><span class="tag">Remember</span><p>the one idea to keep, and where this type usually goes wrong.</p></div>
    </details>
  </div>
```
Difficulty mapping from the source: Easy → `easy`, Moderate → `medium`, Difficult → `hard`.

## The twelve problems (source order; key numbers to reproduce exactly)
1. (easy) f = 2x³−9x²+12x+5: f′ = 6(x−1)(x−2); x=1 max f=10 (f″=−6), x=2 min f=9 (f″=+6); no global min (cubic unbounded below).
2. (easy) GD on x²+2y², γ=0.1, from (4,2): updates x←0.8x, y←0.6y; (3.2,1.2) f=13.12; (2.56,0.72) f=7.5904; 24 ≥ 13.12 ≥ 7.5904.
3. (easy) α₀=0.8, k=0.05: t=10 → 0.4852 (exp), 0.5333 (inv); t=20 → 0.2943, 0.4; step decay ÷3 every 5 epochs, epoch 12 → 0.8/9 ≈ 0.0889; inverse decay hits α₀/2 at t = 1/k = 20.
4. (easy) f = x²+y²−2x−4y+5 = (x−1)²+(y−2)²: min (1,2), f*=0; from (0,0) with γ=0.25: (0.5,1) f=1.25; (0.75,1.5) f=0.3125; f: 5 → 1.25 → 0.3125 (factor 4 per step).
5. (medium) f = x³−3x+y²−2y: CPs (1,1) and (−1,1); H = diag(6x, 2); (1,1) min f=−3; (−1,1) saddle f=1; GD targets (1,1); no global min.
6. (medium) f = ½xᵀAx − bᵀx, A=[[4,1],[1,3]], b=(1,2): ∇f = Ax − b; x* = (1/11, 7/11) ≈ (0.091, 0.636); f* = −½bᵀx* = −15/22 ≈ −0.682; from 0 with γ=0.1: x₁=(0.1,0.2), f=−0.4; derive γ* = gᵀg/gᵀAg (h′(γ) = −gᵀg + γ gᵀAg); at 0: g=(−1,−2), gᵀg=5, Ag=(−6,−7), gᵀAg=20, γ*=0.25, x₁=(0.25,0.5), f=−0.625; table fixed −0.400 / line search −0.625 / optimum −0.682.
7. (medium) f = 3x²+y² from (1,3): h(γ) = 3(1−6γ)²x² + (1−2γ)²y²; h′ = −36x²(1−6γ) − 4y²(1−2γ) = 0 ⇒ γ* = (9x²+y²)/(54x²+2y²); at (1,3): 18/72 = 1/4; new point (−1/2, 3/2); f: 12 → 3.
8. (medium) J = w₁³ + w₁w₂² at (2,1), Δ=0.1: analytic (13,4); forward 13.61 (err 0.61), 4.20 (err 0.20); central for w₁: (11.361−8.759)/0.2 = 13.01 (err 0.01); O(Δ) vs O(Δ²).
9. (medium) J = x²+4y² at (2,1): ∇J=(4,8); h(γ) = (2−4γ)² + 4(1−8γ)²; h′ = 544γ − 80 ⇒ γ* = 5/34 ≈ 0.147; w₁ = (24/17, −3/17) ≈ (1.412, −0.176); J: 8 → 36/17 ≈ 2.118; the y-coordinate overshoots past 0 — why steepest descent zig-zags.
10. (hard) f = x²+xy+y²: min (0,0), H=[[2,1],[1,2]] eigenvalues 3,1; from (2,0) with γ=0.2: ∇=(4,2), f=4 → (1.2,−0.4), f=1.12; ∇=(2.0,0.4) → (0.8,−0.48), f=0.4864; coupling: at (2,0) ∂f/∂y = 2 ≠ 0 although y=0.
11. (hard) fit ŷ=ax+b to x=(0,1,2,3), y=(1,3,5,7): sums Σx=6, Σy=16, Σx²=14, Σxy=34; a*=2, b*=1, L*=0; from (0,0) with γ=0.05: ∇L=(−68,−32), L₀=84 → (3.4,1.6), L₁=38.96; ∇L=(46.4,21.6) → (1.08,0.52), L₂≈18.07; H = 2[[14,6],[6,4]] = [[28,12],[12,8]], eigenvalues ≈ 33.6 and 2.4 (compute exactly: 18 ± √(100+144) = 18 ± √244 ≈ 33.62, 2.38); γ_max = 2/λ_max ≈ 0.0595; 1 − γλ_max ≈ −0.68 ⇒ alternating sides, still shrinking.
12. (hard) binary-search line search on h(α)=α²−5α+8 over [0,4]: [0,4] → [2,4] → [2,3] → [2,2.5]; width 4/2ᵏ; k=9 for ≤ 0.01 (4/512 ≈ 0.0078).

## Also verify in verify-math9.py (numbers the sections and widgets lean on)
- Lecture quartic l(x) = x⁴+7x³+5x²−17x+3: l′ = 4x³+21x²+10x−17, l″ = 12x²+42x+10; roots of l′ ≈ −4.4803, −1.4321, 0.6624 with l″ signs (+, −, +) and values l ≈ −47.075, 21.247, −3.840.
- Lecture quadratic A=[[2,1],[1,20]], b=(−5,−3): x* = (97/39, 1/39) ≈ (2.4872, 0.0256), f* = −6.2564; eigenvalues 11 ± √82 ≈ 20.0554, 1.9446; 2/λ_max ≈ 0.09972; 30 GD steps from (−3,−1): γ=0.05 → f ≈ −6.1946 (converging), γ=0.09 → f ≈ −6.2561, γ=0.1 → diverging (|x| growing), γ=0.11 → |x| > 100.
- x²+3y² from (2,2) with exact line search: γ₁ = 5/28, x₁ = (9/7, −1/7), f₁ = 12/7; γ₂ = 5/12, x₂ = (3/14, 3/14), f₂ = 9/49; successive directions perpendicular (dot product 0).
- The fitting data (1,3.1),(2,4.9),(3,7.3),(4,9.1): a* = 2.04, b* = 1, L* = 0.072; Hessian [[60,20],[20,8]], eigenvalues 34 ± √1076 ≈ 66.80, 1.20; 2/λ_max ≈ 0.02994.
- Steepest-ascent fact: for any unit u, ∇f·u ≤ |∇f| with equality iff u = ∇f/|∇f| (check on a random vector numerically).
- 1-D quadratic f = ½λx²: x_{k+1} = (1−γλ)x_k; γλ = 1 lands at 0 in one step; γλ = 2 bounces ±x₀; steps to shrink 100× at γλ=0.1: ⌈ln100/|ln 0.9|⌉ = 44.
- Descent lemma: for f with L-Lipschitz gradient, f(x−γ∇f) ≤ f(x) − γ(1−Lγ/2)|∇f|²; check numerically on f=½xᵀAx+bᵀx (L = λ_max) at x=(−3,−1) for γ ∈ {0.02,0.05,0.09}.
- Finite-difference orders: for J at (2,1), forward error ≈ Δ·(∂²J/∂w₁²)/2 = Δ·6 (=0.6 at Δ=0.1 — compare 0.61) and central error ≈ Δ²·(∂³J/∂w₁³)/6 = Δ²·1 (=0.01 at Δ=0.1).
- Golden section: (√5−1)/2 = 0.61803; iterations for width ≤ 0.01 from [0,4]: binary 9, golden ⌈ln(0.0025)/ln(0.618)⌉ = 13.
- Minibatch unbiasedness: with N=40 deterministic data (x_i = −2+4(i−1)/39, y_i = 1.5x_i+0.5+n_i, LCG seed 7 as in the widget spec — reproduce the LCG in Python: s=(s*1664525+1013904223) % 2**32, n=(s/2**32−0.5)*1.4, drawing one s per point in order), the average over ALL size-4 subsets is expensive — instead check that the mean of the per-point gradients equals the full gradient at (0,0) and that the variance of a size-m mean is Var₁/m for m ∈ {1,4,8} by exact computation over the 40 points (sampling with replacement).

## Deliver
Write both files. Run `python3 verify-math9.py` until every check passes. Then report (≤250 words): the twelve problems with difficulty tags, each "remember" takeaway in one line, and the list of asserted numbers.
