# Unit 11 · Optimization II — Five Ways Down One Valley: practice arena spec

You are writing TWO files:
1. `/home/claude/mfml-site/dev/tpl/u11-practice.html` — the practice-arena section body (fourteen `.prob` cards, nothing else: no `<section>` wrapper, no heading, no intro prose, no next-card).
2. `/home/claude/mfml-site/dev/verify-math11.py` — a sympy/numpy script in the exact style of `verify-math10.py` (read it) that machine-checks EVERY number printed in your fourteen solutions plus the "also verify" list below, printing `ok` lines and ending with a count. It must run clean with `cd /home/claude/mfml-site/dev && python3 verify-math11.py` (sympy and numpy are installed).

## Read first (house style — copy it exactly)
- `tpl/u10-practice.html` (all twelve cards): markup, `.pstep`, `.pans`, `.callout remember` inside the solution, the `<b>(a)</b>` part labels, display maths broken with `aligned`/`\\` so nothing overflows a 44rem column (probe: no single display line wider than ~450 px at 390 px viewport — break long lines; **note that `\\(` inside an `aligned` is parsed as an inline-math opener, so always put a space after `\\`**), `\(…\)`/`\[…\]` raw KaTeX (KaTeX 0.18.4: no `\xrightarrow`, no wide `\text`, keep `∎`/✓ outside math or use `\blacksquare`), tables of iterations written as `<table class="plain">` inside the step (one computation per line, a row per iteration).
- Sources: `content/practice11-opt.txt` (seven fully worked optimizer problems), `content/practice11-kkt.txt` (fifteen fully worked constrained-optimization problems), `content/companion11a.txt` (the five methods worked by hand) and `content/companion11b.txt` (the constrained-optimization reader). Your job is to re-set the chosen ones in the house format, keep every number, make every algebraic step visible (one computation per line), and write the "what this tests / plan" line and the "remember" takeaway for each.
- **Present it as a plain topic-wise practice set**: never mention where the problems come from, never mention exams, question papers, marks, quizzes, rubrics or "what the papers ask"; the difficulty tag replaces the marks. Never write MFML/ZC416/BITS/WILP.
- Every part must have a definite computable answer (numbers, vectors, matrices, ranges, counts, formulas) — **no "explain" or "discuss" parts**. Where a source part says "comment" or "in two sentences", turn it into something computable: "state which coordinate sets the limit and give it", "give the two limiting step sizes", "name the surviving case and the condition each rejected case breaks", "give α₃ and the number of support vectors".
- Refer to the unit's ideas by role, not by section number: "the loaded trolley", "the permanent record", "form not career average", "the two notebooks and the probation rate", "the fair-start rate", "the wall", "the fine rate", "the room left", "the branching interrogation", "the price of a wall", "who moves first".
- Solutions come immediately after their question inside `<details class="sol">`; each has a `.ptest` line before it (what this tests + the plan of attack), step-by-step working, an answers-at-a-glance line, and a "Remember" callout naming the classic slip.

## Card format
```
  <!-- ===== Problem N ===== -->
  <div class="prob reveal">
    <div class="prob-head"><span class="ptag">Problem N</span><span class="pdiff easy|medium|hard">easy|medium|hard</span></div>
    <p class="pq">… the question, parts as <b>(a)</b> <b>(b)</b> …</p>
    <p class="ptest"><b>What this tests.</b> one sentence. <b>Plan.</b> one or two sentences on the order of moves, what to compute first, the check at the end.</p>
    <details class="sol"><summary>Show the full solution</summary>
      <div class="pstep"><b>(a) Step 1 — name of the move.</b> … every algebraic step …</div>
      …
      <p class="pans">answers at a glance: (a) … (b) … (c) …</p>
      <div class="callout remember reveal"><span class="tag">Remember</span><p>the one idea to keep, and where this type usually goes wrong.</p></div>
    </details>
  </div>
```

## The update rules to state once, at the top of Problem 1 (and reuse)
All from the current point \(\mathbf w_t\) with \(\mathbf g_t=\nabla f(\mathbf w_t)\); squares, roots and divisions of vectors are **element by element**; \(\epsilon\approx10^{-8}\) only prevents division by zero and is dropped in hand calculations.

| method | rule |
|---|---|
| Gradient descent | \(\mathbf w_{t+1}=\mathbf w_t-\alpha\mathbf g_t\) |
| Momentum | \(\mathbf v_{t+1}=\beta\mathbf v_t-\alpha\mathbf g_t,\quad \mathbf w_{t+1}=\mathbf w_t+\mathbf v_{t+1},\quad \mathbf v_0=\mathbf 0\) |
| AdaGrad | \(G_{t+1}=G_t+\mathbf g_t^2,\quad \mathbf w_{t+1}=\mathbf w_t-\dfrac{\alpha}{\sqrt{G_{t+1}}}\mathbf g_t,\quad G_0=0\) |
| RMSProp | \(A_{t+1}=\rho A_t+(1-\rho)\mathbf g_t^2,\quad \mathbf w_{t+1}=\mathbf w_t-\dfrac{\alpha}{\sqrt{A_{t+1}}}\mathbf g_t,\quad A_0=0\) |
| Adam | \(m_t=\beta_1m_{t-1}+(1-\beta_1)g_{t-1},\ \ v_t=\beta_2v_{t-1}+(1-\beta_2)g_{t-1}^2,\ \ \hat m_t=\frac{m_t}{1-\beta_1^{\,t}},\ \ \hat v_t=\frac{v_t}{1-\beta_2^{\,t}},\ \ w_t=w_{t-1}-\frac{\alpha}{\sqrt{\hat v_t}}\hat m_t\) |

And for the constrained half: standard form \(\min f\) s.t. \(e(\mathbf x)=0,\ g_i(\mathbf x)\le0\); \(L=f+\lambda e+\sum_i\mu_ig_i\) with \(\lambda\) free and \(\mu_i\ge0\); the five conditions (stationarity · path feasibility · fence feasibility · complementary slackness \(\mu_ig_i=0\) · \(\mu_i\ge0\)); dual \(d(\lambda,\mu)=\min_{\mathbf x}L\), weak duality \(d^\*\le p^\*\).

---------------------------------------------------------------------------
## The fourteen problems (every number below is already verified — reproduce it exactly)

### 1 · (easy) Gradient descent on a two-parameter line fit, and recovering a step size
Fit \(\hat y=wx+b\) to \((1,3)\) and \((2,5)\) by \(L(w,b)=\tfrac12[(w+b-3)^2+(2w+b-5)^2]\).
(a) \(\partial L/\partial w=5w+3b-13\), \(\partial L/\partial b=3w+2b-8\); write the two update lines.
(b) From \((0,0)\) with \(\alpha=0.1\): \(\nabla L=(-13,-8)\), \(L_0=17\); \((w_1,b_1)=(1.3,\,0.8)\), \(L_1=1.685\); \(\nabla L=(-4.1,-2.5)\); \((w_2,b_2)=(1.71,\,1.05)\), \(L_2=0.16925\).
(c) A run from \((0,0)\) landed at \((0.26,0.16)\) after one step — the step is \(\alpha\nabla L\), so \(\alpha=0.26/13=0.16/8=\mathbf{0.02}\) (both coordinates agree).
(d) \(H=\begin{bmatrix}5&3\\3&2\end{bmatrix}\), \(\operatorname{tr}=7\), \(\det=1\), \(\lambda=\frac{7\pm\sqrt{45}}{2}=6.854102,\ 0.145898\); the safe range is \(\alpha<2/\lambda_{\max}=\mathbf{0.291796}\), so \(\alpha=0.3\) is **not** safe — but only just.

### 2 · (easy) Reading four recorded runs on \(f(x)=x^2\)
All start at \(x_0=1\). A: 1, 0.8, 0.64, 0.512. B: 1, −0.5, 0.25, −0.125. C: 1, −1.2, 1.44, −1.728. D: 1, 0.8, 0.54, 0.302.
(a) On \(x^2\), \(x_{t+1}=(1-2\alpha)x_t\), so a constant ratio means plain descent. A: ratio 0.8 → \(\alpha=0.1\), monotone. B: ratio −0.5 → \(\alpha=\mathbf{0.75}\), oscillating but shrinking. C: ratio −1.2 → \(\alpha=\mathbf{1.1}\), diverging. General rule: \(0<\alpha<0.5\) monotone, \(\alpha=0.5\) one step, \(0.5<\alpha<1\) oscillating convergence, \(\alpha=1\) permanent oscillation, \(\alpha>1\) divergence.
(b) D's ratios are 0.8, 0.675, 0.559 — not constant. With momentum, step 1 has \(v_0=0\), so \(1-2\alpha=0.8\Rightarrow\alpha=0.1\); step 2 gives \(x_2=0.64-0.2\beta=0.54\Rightarrow\beta=\mathbf{0.5}\); check step 3: \(v_3=0.5(-0.26)-0.1(1.08)=-0.238\), \(x_3=0.302\) ✓.
(c) Run B with \(\alpha_t=0.75/(1+t)\): \(\alpha_0=0.75,\ \alpha_1=0.375,\ \alpha_2=0.25\); \(x_1=-0.5,\ x_2=-0.125,\ x_3=-0.0625\).
(d) \(\alpha_t<0.1\) from \(t=\mathbf 7\) (\(\alpha_7=0.09375\)); the decrease from \(t=0\) is \(\mathbf{87.5\%}\); the factor \(1-2\alpha_t\) enters \((-1,0)\) then \((0,1)\), so the sign flipping stops after \(t=2\).

### 3 · (medium) Exact line search on a quadratic, and the closed-form step
\(f(x,y)=2x^2+xy+y^2-2x-y=\tfrac12\mathbf w^{\!\top}A\mathbf w-\mathbf b^{\!\top}\mathbf w\) with \(A=\begin{bmatrix}4&1\\1&2\end{bmatrix}\), \(\mathbf b=(2,1)\); \(\mathbf w_0=(0,0)\); \(\nabla f=(4x+y-2,\ x+2y-1)\).
(a) \(\mathbf d_1=(1,0)\): \(\nabla f^{\!\top}\mathbf d_1=-2<0\) (descent); \(h(\alpha)=2\alpha^2-2\alpha\); \(\alpha_1^\*=\mathbf{0.5}\); \(\mathbf w_1=(0.5,0)\), \(f=-0.5\).
(b) \(\nabla f(\mathbf w_1)=(0,-0.5)\), \(\mathbf d_2=(0,0.5)\); \(h(\alpha)=0.25\alpha^2-0.25\alpha-0.5\); \(\alpha_2^\*=\mathbf{0.5}\); \(\mathbf w_2=(0.5,\,0.25)\), \(f=-0.5625\).
(c) Derive \(\alpha^\*=-\dfrac{\nabla f(\mathbf w)^{\!\top}\mathbf d}{\mathbf d^{\!\top}A\mathbf d}\) (expand \(f(\mathbf w+\alpha\mathbf d)\) using \(\mathbf w^{\!\top}A\mathbf d=\mathbf d^{\!\top}A\mathbf w\)) and check: (a) \(2/4=0.5\), (b) \(0.25/0.5=0.5\).
(d) \(\nabla f=0\Rightarrow \mathbf w^\*=(3/7,\,2/7)\), \(f^\*=-4/7\approx-0.571429\); \(f(\mathbf w_2)=-0.5625\), still \(0.008929\) above.
Also state the free check: after an exact line search the new gradient is orthogonal to \(\mathbf d\) — verify \(\nabla f(\mathbf w_1)^{\!\top}\mathbf d_1=0\) and \(\nabla f(\mathbf w_2)^{\!\top}\mathbf d_2=0\).

### 4 · (medium) Reading a momentum log backwards
\(f(x)=(x-5)^2\), momentum with \(v_0=0\), \(x_0=0\); the log shows \(x_1=1.0\), \(x_2=2.6\).
(a) Step 1 has no \(\beta\): \(v_1=-\alpha f'(0)=10\alpha\), so \(\alpha=\mathbf{0.1}\). Step 2: \(v_2=\beta(1.0)+0.8\), \(x_2=1.8+\beta=2.6\Rightarrow\beta=\mathbf{0.8}\).
(b) \(f'(2.6)=-4.8\), \(v_3=0.8(1.6)+0.48=\mathbf{1.76}\), \(x_3=\mathbf{4.36}\); \(f'(4.36)=-1.28\), \(v_4=0.8(1.76)+0.128=\mathbf{1.536}\), \(x_4=\mathbf{5.896}\).
(c) Plain descent with the same \(\alpha\): \(x\leftarrow0.8x+1\) → 1, 1.8, 2.44, **2.952**. After four steps momentum is \(0.896\) **past** the target and plain descent is \(2.048\) **short** of it; give both distances.

### 5 · (medium) A long constant slope: AdaGrad versus RMSProp
\(\mathrm dL/\mathrm dw=4\) for many iterations, \(\alpha=1\), \(\epsilon\) ignored.
(a) \(G_t=t g^2=16t\), step \(=\alpha g/\sqrt{G_t}=\alpha/\sqrt t\): 1, 0.70711, 0.57735, 0.5.
(b) \(\alpha/\sqrt t<0.1\alpha\Leftrightarrow t>100\), so from \(t=\mathbf{101}\).
(c) \(\rho=0.5\): \(A_t=g^2(1-\rho^t)\) (prove by unrolling the geometric series); step \(=\alpha/\sqrt{1-\rho^t}\): 1.41421, 1.15470, 1.06904, 1.03280 → tends to \(\alpha=\mathbf 1\).
(d) Computable version: give the two limits (\(\alpha/\sqrt t\to0\) versus \(\to\alpha\)) and the step each takes at \(t=100\) (0.1 versus 1.0000).

### 6 · (hard) RMSProp in vector form on badly scaled features
\(\hat y=w_1x_1+w_2x_2\); rows \((10,1)\to21\) and \((10,-1)\to19\); \(L=\tfrac12\sum(\hat y_i-y_i)^2\).
(a) \(\partial L/\partial w_j=\sum_i r_ix_{ij}\) with \(r_i=\hat y_i-y_i\); at \(\mathbf w_0=(0,0)\), \(r=(-21,-19)\), \(\nabla L=(\mathbf{-400},\,\mathbf{-2})\).
(b) \(H=X^{\!\top}X=\operatorname{diag}(200,2)\); stable for \(0<\alpha<2/200=\mathbf{0.01}\). At \(\alpha=0.005\): \(w_2\) moves \(0.01\) and its factor is \(1-0.005(2)=0.99\), so \(\approx\mathbf{460}\) steps to close 99 % of the gap; \(w_1\)'s factor is \(1-0.005(200)=\mathbf 0\) — it lands exactly on its optimum in one step. (Optimum \(\mathbf w^\*=(2,1)\).)
(c) RMSProp, \(\rho=0.9\), \(\alpha=0.3\): \(A_1=(16000,\,0.4)\), \(\sqrt{A_1}=(126.4911,\,0.632456)\), step \(=(-0.948683,\,-0.948683)\), \(\mathbf w_1=(\mathbf{0.948683},\,\mathbf{0.948683})\). Then \(r=(-10.56454,\,-10.46193)\), \(\mathbf g_1=(-210.2646,\,-0.102607)\), \(A_2=(18821.09,\,0.3610535)\), \(\sqrt{A_2}=(137.1900,\,0.6008773)\), step \(=(-0.4597945,\,-0.05123)\), \(\mathbf w_2=(\mathbf{1.408478},\,\mathbf{0.999916})\).
(d) Computable: give \(w_2\) after two RMSProp steps versus after two plain steps at \(\alpha=0.005\) (0.999916 versus 0.019900) and the ratio.

### 7 · (hard) Adam by hand on three logged gradients
\(g_0=6,\ g_1=-4,\ g_2=2\); \(\alpha=0.1\), \(\beta_1=0.9\), \(\beta_2=0.999\), \(m_0=v_0=0\), \(w_0=1\).
(a) Table for \(t=1,2,3\) — correction denominators first: \(1-\beta_1^t=0.1,\,0.19,\,0.271\); \(1-\beta_2^t=0.001,\,0.001999,\,0.002997001\).
 \(t=1\): \(m=0.6,\ v=0.036,\ \hat m=6,\ \hat v=36,\ \sqrt{\hat v}=6,\ \text{ratio}=1,\ w_1=\mathbf{0.9}\).
 \(t=2\): \(m=0.14,\ v=0.051964,\ \hat m=0.736842,\ \hat v=25.99500,\ \sqrt{\hat v}=5.098529,\ \text{ratio}=0.1445213,\ w_2=\mathbf{0.8855479}\).
 \(t=3\): \(m=0.326,\ v=0.05591404,\ \hat m=1.202952,\ \hat v=18.65668,\ \sqrt{\hat v}=4.319338,\ \text{ratio}=0.2785025,\ w_3=\mathbf{0.8576976}\).
(b) Plain descent at \(\alpha=0.1\) on the same gradients: \(0.4,\ 0.8,\ 0.6\).
(c) Computable: the three Adam step sizes are \(0.1,\ 0.01445,\ 0.02785\); state the ratio \(\hat m_2/\sqrt{\hat v_2}\) and why it is small — the numerator averages **signed** gradients (\(6\) then \(-4\) nearly cancel) while the denominator averages **squares** (which cannot cancel).

### 8 · (easy) Framing a word problem, and the price of the constraint
20 m of fencing, largest rectangular plot.
(a) Variables \(x,y>0\); \(\max xy\) s.t. \(h=x+y-10=0\).
(b) \(\nabla f=(y,x)=\lambda(1,1)\Rightarrow x=y=\lambda\); \(2\lambda=10\Rightarrow\lambda^\*=\mathbf 5\), \(x^\*=y^\*=5\), \(A^\*=\mathbf{25}\) m². (Confirm it is a maximum: on the line \(A(x)=10x-x^2\), a downward parabola.)
(c) The multiplier is the price of one more unit of the budget: with 22 m the constraint becomes \(x+y=11\), giving \(x=y=5.5\) and \(A=\mathbf{30.25}\). The predicted gain is \(\lambda\Delta=5(1)=5\); the true gain is \(5.25\). State both and the difference \(0.25\) (the multiplier is the *derivative* at the old budget, so it is exact only for a small change — here \(\mathrm dA^\*/\mathrm ds=s/2\) at \(s=10\) is 5, and the extra \(0.25\) is the curvature).

### 9 · (easy) Standard form, and how many cases you must test
(a) Convert to standard form, keeping the sign explicit: \(x\ge2\Rightarrow g=2-x\le0\) with \(\nabla g=(-1)\); \(x+2y\ge5\Rightarrow g=5-x-2y\le0\), \(\nabla g=(-1,-2)\); \(3x-y\le7\Rightarrow g=3x-y-7\le0\); \(x+y=1\Rightarrow e=x+y-1=0\); \(\max xy\Rightarrow\min(-xy)\); \(x>2\Rightarrow\) **not allowed** (state why: the infimum 2 is excluded, every allowed value is beaten by one closer to 2, so no minimiser exists).
(b) Complementary slackness gives two branches per **inequality**; equalities add none. So \(m=1,2,3,4,10\) give \(2,4,8,16,\mathbf{1024}\) branches. Show that \(m^2\) agrees at \(m=2\) and \(m=4\) and disagrees at \(m=3\) (\(\mathbf 8\), not 9).
(c) For a problem with one equality and **no** inequality, list which of the five conditions are empty (fence feasibility, complementary slackness, \(\mu\ge0\)) and write what survives: \(\nabla f+\lambda\nabla e=0\) and \(e=0\).
(d) Count the unknowns in the slack formulation with \(n\) variables and \(m\) fences: \(n+2m+1\) (variables, one \(\lambda\), \(m\) multipliers, \(m\) slacks). For \(n=2,m=2\): **7**.

### 10 · (medium) A quadratic form on the unit circle — where eigenvalues come from
Maximise and minimise \(f(\mathbf v)=\mathbf v^{\!\top}A\mathbf v\) with \(A=\begin{bmatrix}5&2\\2&2\end{bmatrix}\) subject to \(\mathbf v^{\!\top}\mathbf v=1\).
(a) \(\nabla f=2A\mathbf v\), \(\nabla h=2\mathbf v\); \(\nabla f=\lambda\nabla h\) gives \(A\mathbf v=\lambda\mathbf v\) — the condition **is** the eigenvalue equation.
(b) \(\lambda^2-7\lambda+6=0\Rightarrow\lambda=\mathbf 6,\ \mathbf 1\).
(c) At a unit eigenvector, \(f=\mathbf v^{\!\top}A\mathbf v=\lambda\). So \(\max f=\mathbf 6\) at \(\mathbf v=\pm(2,1)/\sqrt5=\pm(0.894427,\,0.447214)\), \(\min f=\mathbf 1\) at \(\mathbf v=\pm(-1,2)/\sqrt5=\pm(-0.447214,\,0.894427)\).
(d) Check: \(f\big((2,1)/\sqrt5\big)=\frac{1}{5}\big[5(4)+2(2)(2)(1)+2(1)\big]=\frac{30}{5}=6\) ✓, and the two eigenvectors are orthogonal.

### 11 · (medium) One fence, both cases — then the same problem from the other side
Minimise \(f(x)=(x-3)^2\) subject to \(x\le1\); standard form \(g=x-1\le0\).
(a) Case \(\mu=0\): stationarity \(2(x-3)=0\Rightarrow x=3\), but \(g=2>0\) — **rejected on feasibility**. Case \(g=0\): \(x=1\), \(2(1-3)+\mu=0\Rightarrow\mu^\*=\mathbf 4\ge0\) ✓. Check all five: \(g=0\le0\) ✓, \(\mu g=0\) ✓. \(p^\*=\mathbf 4\).
(b) \(L(x,\mu)=(x-3)^2+\mu(x-1)\); \(\partial L/\partial x=0\Rightarrow x=3-\mu/2\) (and \(\partial^2L/\partial x^2=2>0\), a minimum).
(c) Substitute: \(d(\mu)=\big(-\tfrac\mu2\big)^2+\mu\big(2-\tfrac\mu2\big)=\mathbf{2\mu-\dfrac{\mu^2}{4}}\) — an upside-down parabola, so concave.
(d) \(d'(\mu)=2-\mu/2=0\Rightarrow\mu^\*=\mathbf 4\ (\ge0\) ✓\()\), \(d^\*=8-4=\mathbf 4\). Gap \(p^\*-d^\*=\mathbf 0\): strong duality. Recover \(x^\*=3-4/2=\mathbf 1\) ✓ and check \(\mu^\*g(x^\*)=4(0)=0\).

### 12 · (medium) One path, two fences — the full four-case enumeration
Minimise \(x^2+2y^2\) subject to \(x+y=1\), \(x\ge0\), \(y\ge0\).
(a) Standard form: \(e=x+y-1\), \(g_1=-x\), \(g_2=-y\), \(m=2\Rightarrow4\) cases. \(L=x^2+2y^2+\lambda(x+y-1)-\mu_1x-\mu_2y\).
(b) Stationarity: \(\mu_1=2x+\lambda\) (E1), \(\mu_2=4y+\lambda\) (E2); the path gives \(y=1-x\), so \(\mu_2=4-4x+\lambda\) (E4).
(c) The four cases: **1** \((\mu_1=0,\mu_2=0)\) → \(-2x=4x-4\Rightarrow x=\tfrac23,\ y=\tfrac13,\ \lambda=-\tfrac43\), all conditions hold, \(f=\tfrac49+\tfrac29=\mathbf{\tfrac23}\) — **survives**. **2** \((\mu_1=0,y=0)\) → \(x=1,\ \lambda=-2,\ \mu_2=-2<0\) — rejected (dual feasibility). **3** \((x=0,\mu_2=0)\) → \(y=1,\ \lambda=-4,\ \mu_1=-4<0\) — rejected. **4** \((x=0,y=0)\) → \(x+y=0\ne1\) — rejected on the path.
(d) Two computable readings: \(\lambda^\*=-4/3<0\) is legal (only fence multipliers are sign-restricted), and \(\mu_1^\*=\mu_2^\*=0\) says both fences are slack — verify directly that \(x^\*>0\) and \(y^\*>0\). Also state the problem is convex (bowl objective, linear rules), so the surviving point is the global minimum.

### 13 · (hard) Primal and dual, end to end, and the price of the wall
Minimise \(f(x,y)=x^2+y^2\) subject to \(x+y=4\) and \(x\ge3\).
(a) Standard form \(e=x+y-4\), \(g=3-x\); \(L=x^2+y^2+\lambda(x+y-4)+\mu(3-x)\); stationarity \(2x+\lambda-\mu=0\), \(2y+\lambda=0\).
(b) Case \(\mu=0\) → \(x=y=2\), but \(g=1>0\): **rejected**. Case \(g=0\) → \(x=3,\ y=1,\ \lambda=-2,\ \mu=\mathbf 4\ge0\); all five hold; \(p^\*=\mathbf{10}\).
(c) Build the dual: minimising over \(x,y\) gives \(x=\frac{\mu-\lambda}2\), \(y=-\frac\lambda2\); substituting and collecting,
\[d(\lambda,\mu)=-\frac{\mu^2}{4}-\frac{\lambda^2}{2}+\frac{\lambda\mu}{2}-4\lambda+3\mu.\]
Show the \(\mu^2,\lambda^2,\lambda\mu\) coefficients coming out as \(\tfrac14-\tfrac12=-\tfrac14\), \(\tfrac14+\tfrac14-1=-\tfrac12\), \(-\tfrac12+\tfrac12+\tfrac12=+\tfrac12\).
(d) Concavity: \(H_d=\begin{bmatrix}-1&\tfrac12\\ \tfrac12&-\tfrac12\end{bmatrix}\), \(\det=\tfrac14>0\), \(\operatorname{tr}=-\tfrac32<0\) → both eigenvalues negative (\(\lambda=\frac{-3\pm\sqrt2}{4}=-0.396447,\ -1.103553\)), so \(d\) is concave with one peak.
(e) \(\partial d/\partial\lambda=0\Rightarrow\lambda=\frac\mu2-4\); \(\partial d/\partial\mu=0\Rightarrow\mu=\lambda+6\); solving, \(\lambda^\*=\mathbf{-2},\ \mu^\*=\mathbf 4\ (\ge0\) ✓\()\), \(d^\*=-4-2-4+8+12=\mathbf{10}=p^\*\): zero gap. Recover \(x^\*=\frac{4+2}2=3\), \(y^\*=1\) ✓.
(f) The price: move the wall to \(x\ge2.9\). Predicted \(p^\*\approx10-\mu^\*(0.1)=\mathbf{9.60}\); actual \((2.9)^2+(1.1)^2=\mathbf{9.62}\). Also give the exact value function \(p^\*(c)=c^2+(4-c)^2\) for \(c\ge2\) and its slope \(4c-8\), which is \(4\) at \(c=3\) and \(0\) at \(c=2\) — where the wall stops biting.

### 14 · (hard) Two points, one line — a hard-margin classifier from the dual
Data \(x_1=+1\) with \(y_1=+1\), \(x_2=-1\) with \(y_2=-1\); minimise \(\tfrac12w^2\) subject to \(y_i(wx_i+b)\ge1\).
(a) Constraints in standard form: \(g_1=1-w-b\le0\), \(g_2=1-w+b\le0\); \(L=\tfrac12w^2+\alpha_1(1-w-b)+\alpha_2(1-w+b)\), \(\alpha_i\ge0\).
(b) Stationarity: \(\partial L/\partial w=w-\alpha_1-\alpha_2=0\Rightarrow w=\alpha_1+\alpha_2\); \(\partial L/\partial b=-\alpha_1+\alpha_2=0\Rightarrow\alpha_1=\alpha_2=\alpha\). Substituting, \(q(\alpha)=\tfrac12(2\alpha)^2-(2\alpha)(2\alpha)+2\alpha=\mathbf{2\alpha-2\alpha^2}\).
(c) \(q'(\alpha)=2-4\alpha=0\Rightarrow\alpha^\*=\mathbf{\tfrac12}\ge0\), \(d^\*=\mathbf{\tfrac12}\). Recover \(w^\*=\alpha_1+\alpha_2=\mathbf 1\); \(\alpha_1>0\) forces \(g_1=0\), i.e. \(w+b=1\), so \(b^\*=\mathbf 0\). Primal value \(\tfrac12(1)^2=\tfrac12=d^\*\): zero gap. Boundary \(x=\mathbf 0\), margin edges \(x=\pm1\), width \(2/|w^\*|=\mathbf 2\); both points have \(\alpha_i>0\), so **both are support vectors**.
(d) Add a third point \(x_3=3\) with \(y_3=+1\). Its constraint is \(3w+b\ge1\), which at \((w,b)=(1,0)\) reads \(3\ge1\) — slack, so \(g_3<0\) forces \(\alpha_3=\mathbf 0\); the classifier does not move and the point may be deleted. Then show the general rule: with points at \(x_3\) (class +1, \(x_3<1\)) and \(-1\) (class −1) binding, \(w=\dfrac{2}{x_3+1}\) and \(b=1-wx_3=\dfrac{1-x_3}{1+x_3}\); at \(x_3=0.5\) that is \(w=\mathbf{1.3333}\), \(b=\mathbf{0.3333}\), boundary \(x=-b/w=\mathbf{-0.25}\), margin \(\mathbf{1.5}\).

---------------------------------------------------------------------------
## Also verify in verify-math11.py (numbers the sections and widgets lean on)
- The five 25-step runs on \(J=\tfrac12w_1^2+5w_2^2\) from \([1,1]\) with \(\alpha=0.1\) (momentum \(\beta=0.9\); RMSProp \(\rho=0.9\); Adam \(\rho_f=0.9,\rho=0.999,\ t\) from 1): reproduce the table
  GD \([0.9,0]\), \([0.81,0]\), \(J_2=0.3281\), \(J_{10}=0.060788\), \(J_{25}=0.0025769\);
  Momentum \([0.9,0]\), \([0.72,-0.9]\), \([0.486,-0.810]\), \(J_2=4.3092\), \(J_{10}=0.32702\), \(J_{25}=0.19587\);
  AdaGrad \([0.9,0.9]\), \([0.833104,0.833104]\), \(J_2=3.8173\), \(J_{25}=0.54743\);
  RMSProp \([0.683772,0.683772]\), \([0.498871,0.498871]\), \(J_2=1.3688\), \(J_{25}=3.5992\times10^{-13}\);
  Adam \([0.9,0.9]\), \([0.800412,0.800412]\), \(J_2=3.5236\), \(J_{25}=0.17930\).
- Adam's \(\alpha_t=\alpha\sqrt{1-\rho^t}/(1-\rho_f^t)\): \(\alpha_1=0.0316228\), \(\alpha_2=0.0235317\), the minimum \(0.0152241\) at \(t=12\), and \(\alpha_t\to0.1\).
- AdaGrad's first step is exactly \(\alpha\) in every coordinate: \(\alpha g/\sqrt{g^2}=\alpha\,\mathrm{sign}(g)\) — check on three random gradient vectors.
- RMSProp's first-step inflation \(1/\sqrt{1-\rho}\): \(3.16228\) at \(\rho=0.9\), \(31.6228\) at \(\rho=0.999\).
- Momentum's steady-state speed-up on a constant pull: \(\sum_k\beta^k=1/(1-\beta)=10\) at \(\beta=0.9\).
- Plain descent on \(J\): per-coordinate factors \(1-\eta\) and \(1-10\eta\); \(\eta=0.2\) gives exactly \(-1\) on \(w_2\); \(\lceil\ln0.01/\ln0.9\rceil=44\); \(\kappa=10\); the optimal shared \(\eta=2/(\lambda_{\min}+\lambda_{\max})=2/11\) with rate \((\kappa-1)/(\kappa+1)=9/11\).
- The hero's constrained problem: \(\min\frac12w_1^2+5w_2^2\) s.t. \(w_1\ge c\) gives \(\mathbf w^\*=(c,0)\), \(J^\*=c^2/2\), \(\mu^\*=c\) for \(c>0\); at \(c=1\): \((1,0)\), \(0.5\), \(1\).
- W8's three tangency instances: \((2,2)\) with \(\lambda=4\), \(f=8\); \((1,0)\) with \(\mu=1\), \(f=1\); the ridge touching point \((2.4,1.2)/\|(2.4,1.2)\|=(0.894427,0.447214)\) and that \(\nabla f\parallel\nabla g\) there to \(10^{-12}\).
- W9: \(\max_{\mu\ge0}\mu g\) equals \(0\) for \(g\le0\) and \(+\infty\) for \(g>0\) (check numerically on a grid of \(\mu\) up to \(10^6\)); \(d(\mu)=2\mu-\mu^2/4\) and \(d(4)=4=p^\*\).
- W12: the chord test on \(x^2\) fails 0 times out of 200 sampled pairs and on \(x^4-3x^2\) fails a positive number of times (print it); the tangent test agrees with the chord test on all six curves.
- W13's non-convex gap: \(\min x\) s.t. \((x^2-1)(x^2-4)\le0\) has \(p^\*=-2\); compute \(d(\mu)=\min_x\,[x+\mu(x^4-5x^2+4)]\) on a fine grid and report \(d^\*=\max_{\mu\ge0}d(\mu)\) and the gap \(p^\*-d^\*>0\). **Print the value to 4 decimals** — the widget must use the same number.
- The minimax inequality \(\max_y\min_x\phi\le\min_x\max_y\phi\) on a random \(6\times6\) matrix, 200 trials, never violated.
- Weak duality on 200 random instances of \(\min \frac12\mathbf x^{\!\top}Q\mathbf x+\mathbf c^{\!\top}\mathbf x\) s.t. \(A\mathbf x\le\mathbf b\) (\(Q\succ0\), \(2\times2\)): \(d(\mu)\le p^\*\) for every sampled \(\mu\ge0\).
- Concavity of the dual: for 50 random \((f,g)\) pairs on a grid of \(x\), the pointwise minimum over \(x\) of the affine family \(\mu\mapsto f(x)+\mu g(x)\) is concave in \(\mu\) (check the second difference \(\le10^{-9}\)).
- Complementary slackness on problems 11, 12, 13: \(\mu_ig_i=0\) to machine precision.
- Problem 13's dual Hessian eigenvalues \(-0.396447,\ -1.103553\) and the value function slope \(4c-8\).
- Problem 14: \(q(\alpha)=2\alpha-2\alpha^2\) agrees with \(\sum_i\alpha_i-\frac12\sum_{i,j}\alpha_i\alpha_jy_iy_jx_ix_j\) for this data; \(\alpha_3=0\) at \(x_3=3\); \(w=2/(x_3+1)\) checked against a numerical QP solve for \(x_3\in\{0.2,0.5,0.8\}\).

## Deliver
Write both files. Run `python3 verify-math11.py` until every check passes. Then report (≤300 words): the fourteen problems with difficulty tags, each "remember" takeaway in one line, the list of asserted numbers, and — quoted exactly — **the value of \(d^\*\) and the duality gap you computed for the non-convex example**, because the widget author needs the same number.
