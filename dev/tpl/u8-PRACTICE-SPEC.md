# Unit 8 · Taylor & MacLaurin Series (and the Hessian) — practice arena spec

You are writing TWO files:
1. `/home/claude/mfml-site/dev/tpl/u8-practice.html` — the practice-arena section body (the twelve `.prob` cards, nothing else: no `<section>` wrapper, no heading, no intro prose, no next-card — those are written elsewhere).
2. `/home/claude/mfml-site/dev/verify-math8.py` — a sympy/numpy script, in the exact style of `verify-math7.py` (read it), that machine-checks EVERY number printed in your twelve solutions (and the numbers listed under "also verify" below), printing `ok` lines and ending with a count. It must run clean with `python3 verify-math8.py`.

## Read first (house style — copy it exactly)
- `src/unit-07.html` lines 1476–1530 (three problem cards: markup, `.pstep`, `.pans`, `.callout remember` inside the solution, the `<b>(a)</b>` part labels, display maths broken with `aligned`/`\\` so nothing overflows a 44rem column, `\(…\)`/`\[…\]` raw KaTeX — KaTeX 0.18.4, no `\xrightarrow`, no `\text` wider than the column).
- The unit's source texts: `content/practice7.txt` (Parts A and B — Problems A1–A3, B1–B3 are yours verbatim in substance), `content/companion8-taylor.txt` (§4.2 Problems 1–3), `content/slides8.txt` (the lecture: Rolle → MVT → Taylor with remainder via Proposition P; two-variable Taylor along the line x=a+th, y=b+tk; the identity fxx·Q(0) = (h fxx + k fxy)² + (fxx fyy − fxy²) k²; Sylvester; eigenvalue signs).

## Card format (Prof. Saurabh's rules for student practice sets)
Each card:
```
  <!-- ===== Problem N ===== -->
  <div class="prob reveal">
    <div class="prob-head"><span class="ptag">Problem N</span><span class="pdiff easy|medium|hard">easy|medium|hard</span>[<span class="chip" style="font-size:.68rem">added — covers …</span> for the three new ones]</div>
    <p class="pq">… the question, parts as <b>(a)</b> <b>(b)</b> …</p>
    <p class="ptest"><b>What this tests.</b> one sentence. <b>Plan.</b> one or two sentences on how to attempt it in an exam (the order of moves, what to compute first, the check at the end).</p>
    <details class="sol"><summary>Show the full solution</summary>
      <div class="pstep"><b>(a) Step 1 — name of the move.</b> … every algebraic step a student could redo; one computation per line inside \[\begin{aligned}…\end{aligned}\] when there are several …</div>
      …
      <p class="pans">answers at a glance: (a) … (b) … (c) …</p>
      <div class="callout remember reveal"><span class="tag">Remember</span><p>the one idea to keep, and where marks are usually lost on this type.</p></div>
    </details>
  </div>
```
Solutions come immediately after their question (inside the card), are step by step and complete, and include the "what it tests / plan" line. Plain, warm, simple language; no winking asides. Refer to the unit's sections by role, not number ("the remainder formula", "the judge's identity", "the line trick"), because section numbers may shift.

## The twelve problems (in this order)
1. **A1 (easy)** — ln x, derivatives at 1, P₄ about a=1: `P₄(x)=(x−1)−½(x−1)²+⅓(x−1)³−¼(x−1)⁴`; include the u=x−1 shortcut (ln(1+u) series) as a "quicker route" step.
2. **A3 (easy)** — √x about 4: P₁ = 2+¼(x−4), P₂ = 2+¼(x−4)−(1/64)(x−4)²; P₁(4.2)=2.05, P₂(4.2)=2.049375, true √4.2=2.0493902 (error 5×10⁻⁴ vs 1.5×10⁻⁵); explain why the quadratic wins (curvature f″<0, tangent rides above); binomial-series shortcut.
3. **A2 (medium)** — f=eˣ sin y: ∇f(0,0)=(0,1), H(0,0)=[[0,1],[1,0]], Q(x,y)=y+xy, Q(0.1,0.2)=0.22, exact 0.219563 (error 4.4×10⁻⁴), third-order leftover; product-of-series shortcut; note H has eigenvalues ±1 (a saddle).
4. **NEW (medium) "Bound the lie"** — (a) cos x ≈ 1−x²/2 at x=0.5: keep terms to degree 3 (the x³ term is 0), so n=4 and |R₄| ≤ max|cos c|·0.5⁴/4! ≤ 0.5⁴/24 = 0.0026042; actual error: cos 0.5 = 0.8775826, 1−0.125 = 0.875, error 0.0025826 (inside the bound; the next term x⁴/24 is almost exactly the error). (b) How many terms of eˣ at x=1 for an error below 10⁻⁶: |Rₙ| ≤ e·1ⁿ/n! < 3/n!; 3/9! = 8.27×10⁻⁶ (not enough), 3/10! = 8.27×10⁻⁷ (enough) ⇒ n=10, i.e. keep the terms k=0,…,9 (ten terms); check: Σ_{k≤9} 1/k! = 2.7182815 vs e = 2.7182818 (error 3.0×10⁻⁷).
5. **NEW (easy) "Find the secret c"** — f(x)=x³ on [0,2] about a=0. (a) Mean value theorem (n=1): f(2)−f(0)=f′(c)(2−0) ⇒ 8=6c² ⇒ c=2/√3≈1.1547 ∈ (0,2). (b) Taylor with n=2: P₁(x)=f(0)+f′(0)x=0, so f(2)=R₂=f″(c)/2!·2² = 3c·4=12c ⇒ c=2/3 ∈ (0,2). (c) With n=3: f‴≡6, R₃ = 6/3!·x³ = x³ — the "remainder" is the whole function and every c works: a cubic is its own degree-3 Taylor polynomial. Make the point that c depends on n and on x.
6. **B1 (medium)** — f=x³−3xy+3y²: CPs (0,0) saddle (D=−9), (½,¼) minimum (D=9, fxx=3>0), f(½,¼)=−1/16; eigenvalue route at (½,¼): H=[[3,−3],[−3,6]], trace 9, det 9, λ=(9±√45)/2 ≈ 7.854, 1.146.
7. **B2 (medium)** — f=2x²+2xy+3y²−4x−2y: CP (1,0); H=[[4,2],[2,6]]; Sylvester 4>0, 20>0; eigenvalues 5±√5 ≈ 7.236, 2.764; global minimum −2; completing the square 2(u+v/2)²+(5/2)v²; condition number ≈ 2.618.
8. **B3 (medium)** — g=x⁴+y⁴ and h=x⁴−y⁴: both have H=0 at the origin (D=0, test silent); g ≥ 0 ⇒ minimum; h = t⁴ along x, −t⁴ along y ⇒ saddle; ray slice g=t⁴(cos⁴θ+sin⁴θ), h=t⁴cos2θ; why: quartic behaviour invisible to a second-order test.
9. **Companion 1 (easy)** — f=xy−x²−y²−2x−2y+4: CP (−2,−2); fxx=−2, fyy=−2, fxy=1, D=3>0, fxx<0 ⇒ local maximum, f(−2,−2)=8.
10. **Companion 2 (medium)** — f=x³+y³−3xy+1: CPs (0,0) saddle (D=−9), (1,1) minimum (D=27, fxx=6), f(1,1)=0, f(0,0)=1.
11. **Companion 3 (hard)** — absolute extrema of f=x²+y²−x−y on D={x²≤y≤1}: interior CP (½,½), f=−½; parabola boundary g(x)=x⁴−x, g′=4x³−1 ⇒ x=(¼)^{1/3}=0.62996, y=0.39685, f=−0.47247; corners (−1,1): f=2, (1,1): f=0; top edge h(x)=x²−x, min at x=½: f(½,1)=−¼; absolute max 2 at (−1,1), absolute min −½ at (½,½). Draw the region in words (a parabolic bowl capped by the line y=1) and explain WHY the boundary must be checked (the second-derivative test only classifies interior flat points).
12. **NEW (hard) "The judge's identity, proved and used"** — (a) prove `fxx·Q = (h fxx + k fxy)² + (fxx fyy − fxy²) k²` by expanding the right side; (b) deduce the three verdicts (D>0,fxx>0 ⇒ Q>0 for all (h,k)≠0; D>0,fxx<0 ⇒ Q<0; D<0 ⇒ choose (h,k)=(1,0) and (h,k)=(−fxy, fxx) to get opposite signs — show Q(1,0)=fxx and fxx·Q(−fxy,fxx)=D·fxx², handle the fxx=0 case by symmetry with fyy or by (h,k)=(1,t) for small t); (c) for symmetric H=[[a,b],[b,c]] show λ₁λ₂=ac−b²=D and λ₁+λ₂=a+c, hence D<0 ⇔ eigenvalues of opposite sign, and D>0 with a>0 forces c>0 and both eigenvalues positive; (d) apply (c) to H=[[3,−3],[−3,6]]: λ=(9±√45)/2≈7.854,1.146, both positive ⇒ bowl.

## Also verify in verify-math8.py (numbers used elsewhere in the unit)
- e^x MacLaurin partial sums at x=1: Σ_{k≤3}=2.6667, Σ_{k≤5}=2.71667, e=2.7182818.
- cos x: 1−x²/2 at x=0.5 (above) and at x=1: 0.5 vs cos1=0.5403 (error 0.0403 ≤ 1/24=0.0417).
- The eˣ sin y numbers at (0.2,0.4): f=0.475635, Q=0.48, gap=−4.365×10⁻³; ratio of gaps (0.2,0.4)/(0.1,0.2) ≈ 9.98.
- Unit 6's Taylor erratum cross-check is NOT needed here.
- The hero surface `f(x,y)=sin(1.15x)cos(0.85y)+0.18x`: check the analytic partials fx=1.15cos(1.15x)cos(0.85y)+0.18, fy=−0.85 sin(1.15x) sin(0.85y), fxx=−1.3225 sin(1.15x)cos(0.85y), fxy=−0.9775 cos(1.15x) sin(0.85y), fyy=−0.7225 sin(1.15x)cos(0.85y) against sympy.
- The flat-spot curve `f(x)=0.55 sin(1.6x)+0.22x²−0.15x`: for a=−1.6, b=1.8 compute the chord slope and confirm at least one c in (a,b) with f′(c) equal to it (numerically), and for the Rolle case a=−1.6 find the first b ≥ a+0.3 with f(b)=f(a) and a c with f′(c)=0 between them (print them — they go into the verify-u8 suite).
- The Rolle-ladder numbers for f=eˣ, a=0, b=2, n=3: a₀=1, a₁=1, a₂=½, a₃=(e²−1−2−2)/8=(e²−5)/8=0.29863; F=eˣ−(1+x+x²/2+a₃x³); c₁ = root of F′ in (0,2), c₂ = root of F″ in (0,c₁), c₃ = root of F‴ in (0,c₂); confirm 0<c₃<c₂<c₁<2 and F‴(c₃)=0 ⇔ e^{c₃}=6a₃ ⇒ c₃=ln(6a₃)=ln(1.79178)=0.58323 (print c₁,c₂,c₃ to 4 dp).
- Remainder-detective check: for f=√x, a=4, n=2, x=4.2: R=√4.2−P₁(4.2)=−6.10×10⁻⁴ and c solves f″(c)/2·0.04=R with f″(c)=−¼c^{−3/2} ⇒ c=(0.005/|R|)^{2/3}… (just solve numerically) and confirm 4<c<4.2.

## Deliver
Write both files. Run `python3 verify-math8.py` until every check passes. Then report (≤250 words): the twelve problems with their difficulty tags, every "remember" takeaway in one line each, and the list of asserted numbers.
