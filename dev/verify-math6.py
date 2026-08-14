"""Machine-check every claim in the Unit 6 practice set (Saurabh's 8) + the 2 new ones,
plus the worked examples taken from Lecture 6 slides and Companion 6."""
import sympy as sp

x, y, z, t, h, s = sp.symbols('x y z t h s', real=True)
x1, x2 = sp.symbols('x1 x2', real=True)
fails = []

def chk(label, got, want):
    """True equality test that handles scalars, matrices and lists."""
    try:
        if isinstance(got, (list, tuple)) or isinstance(want, (list, tuple)):
            got_l, want_l = list(got), list(want)
            ok = len(got_l) == len(want_l) and all(
                sp.simplify(sp.sympify(a) - sp.sympify(b)) == 0 for a, b in zip(got_l, want_l))
            got_s, want_s = got_l, want_l
        elif isinstance(got, sp.MatrixBase) or isinstance(want, sp.MatrixBase):
            got_s, want_s = sp.Matrix(got), sp.Matrix(want)
            ok = got_s.shape == want_s.shape and sp.simplify(got_s - want_s) == sp.zeros(*want_s.shape)
        else:
            got_s, want_s = sp.simplify(got), sp.simplify(want)
            ok = sp.simplify(got_s - want_s) == 0
    except Exception as e:                      # noqa: BLE001
        ok, got_s, want_s = False, f"<error {e}>", want
    print(("  ok  " if ok else "  FAIL") + "  " + label + ("" if ok else f"\n         got  {got_s}\n         want {want_s}"))
    if not ok: fails.append(label)

print("=" * 70, "\nSOURCE PRACTICE SET (Saurabh) — 8 problems\n" + "=" * 70)

# ---- P1: f = x^2 y + 3x y^2 - y^3
f = x**2*y + 3*x*y**2 - y**3
chk("P1a df/dx", sp.diff(f, x), 2*x*y + 3*y**2)
chk("P1a df/dy", sp.diff(f, y), x**2 + 6*x*y - 3*y**2)
chk("P1b grad at (2,-1) [0]", sp.diff(f, x).subs({x: 2, y: -1}), -1)
chk("P1b grad at (2,-1) [1]", sp.diff(f, y).subs({x: 2, y: -1}), -11)
chk("P1c limit definition", sp.limit((f.subs({x: 2+h, y: -1}) - f.subs({x: 2, y: -1}))/h, h, 0), -1)
chk("P1c f(2+h,-1) expansion", sp.expand(f.subs({x: 2+h, y: -1})), 3 - h - h**2)

# ---- P2: f = x^2 y / (x + 2y)
f = x**2*y/(x + 2*y)
chk("P2a df/dx", sp.diff(f, x), x*y*(x + 4*y)/(x + 2*y)**2)
chk("P2b df/dy", sp.diff(f, y), x**3/(x + 2*y)**2)
chk("P2c grad(1,1)[0]", sp.diff(f, x).subs({x: 1, y: 1}), sp.Rational(5, 9))
chk("P2c grad(1,1)[1]", sp.diff(f, y).subs({x: 1, y: 1}), sp.Rational(1, 9))
chk("P2 alt limit df/dy(1,1)", sp.limit((f.subs({x: 1, y: 1+h}) - f.subs({x: 1, y: 1}))/h, h, 0), sp.Rational(1, 9))

# ---- P3: f = x^2 e^y + y cos z
f = x**2*sp.exp(y) + y*sp.cos(z)
chk("P3a df/dx", sp.diff(f, x), 2*x*sp.exp(y))
chk("P3a df/dy", sp.diff(f, y), x**2*sp.exp(y) + sp.cos(z))
chk("P3a df/dz", sp.diff(f, z), -y*sp.sin(z))
for i, (v, want) in enumerate(zip((x, y, z), (2, 2, 0))):
    chk(f"P3b grad(1,0,0)[{i}]", sp.diff(f, v).subs({x: 1, y: 0, z: 0}), want)

# ---- P4: ln(x^2+y^2+z^2) and the norm
u = x**2 + y**2 + z**2
f = sp.log(u)
g = sp.sqrt(u)
for i, v in enumerate((x, y, z)):
    chk(f"P4a dlog/d{v}", sp.diff(f, v), 2*v/u)
pt = {x: 1, y: 2, z: 2}
chk("P4a grad log at (1,2,2)[0]", sp.diff(f, x).subs(pt), sp.Rational(2, 9))
chk("P4a grad log at (1,2,2)[1]", sp.diff(f, y).subs(pt), sp.Rational(4, 9))
chk("P4b grad norm at (1,2,2)[0]", sp.diff(g, x).subs(pt), sp.Rational(1, 3))
chk("P4b grad norm at (1,2,2)[1]", sp.diff(g, y).subs(pt), sp.Rational(2, 3))
chk("P4c |grad norm| = 1", sp.simplify(sum(sp.diff(g, v)**2 for v in (x, y, z))), 1)

# ---- P5: f = (2x^2 - y)^3
f = (2*x**2 - y)**3
chk("P5a df/dx", sp.diff(f, x), 12*x*(2*x**2 - y)**2)
chk("P5a df/dy", sp.diff(f, y), -3*(2*x**2 - y)**2)
chk("P5b grad(1,1)[0]", sp.diff(f, x).subs({x: 1, y: 1}), 12)
chk("P5b grad(1,1)[1]", sp.diff(f, y).subs({x: 1, y: 1}), -3)

# ---- P6: Jacobian of R^2 -> R^3
F = sp.Matrix([x**2 - y**2, x*sp.exp(y), sp.log(1 + x**2 + y**2)])
J = F.jacobian([x, y])
chk("P6a J shape rows", J.rows, 3); chk("P6a J shape cols", J.cols, 2)
Jwant = sp.Matrix([[2*x, -2*y], [sp.exp(y), x*sp.exp(y)],
                   [2*x/(1 + x**2 + y**2), 2*y/(1 + x**2 + y**2)]])
chk("P6a Jacobian symbolic", J, Jwant)
chk("P6b J(1,0)", J.subs({x: 1, y: 0}), sp.Matrix([[2, 0], [1, 1], [1, 0]]))

# ---- P7: exponential map
T = sp.Matrix([sp.exp(x)*sp.cos(y), sp.exp(x)*sp.sin(y)])
JT = T.jacobian([x, y])
chk("P7a JT", JT, sp.Matrix([[sp.exp(x)*sp.cos(y), -sp.exp(x)*sp.sin(y)],
                             [sp.exp(x)*sp.sin(y),  sp.exp(x)*sp.cos(y)]]))
chk("P7b det JT", sp.simplify(JT.det()), sp.exp(2*x))
chk("P7c periodicity T(x,y)=T(x,y+2pi)", sp.simplify(T - T.subs(y, y + 2*sp.pi)), sp.zeros(2, 1))

# ---- P8: quadratic form with NON-symmetric A
A = sp.Matrix([[1, 2], [0, 3]]); b = sp.Matrix([1, 1]); X = sp.Matrix([x1, x2])
fq = (X.T*A*X - b.T*X)[0]
chk("P8a expanded f", sp.expand(fq), x1**2 + 2*x1*x2 + 3*x2**2 - x1 - x2)
grad = sp.Matrix([[sp.diff(fq, x1), sp.diff(fq, x2)]])
chk("P8b grad via identity", grad, (X.T*(A + A.T) - b.T))
chk("P8b grad components", grad, sp.Matrix([[2*x1 + 2*x2 - 1, 2*x1 + 6*x2 - 1]]))
chk("P8c grad(1,1)", grad.subs({x1: 1, x2: 1}), sp.Matrix([[3, 7]]))
# and confirm the trap: 2A would give the WRONG answer
wrong = (X.T*(2*A) - b.T).subs({x1: 1, x2: 1})
print(f"  note  the 2A trap would give {wrong.tolist()} instead of [[3, 7]] — genuinely different ✓"
      if wrong != sp.Matrix([[3, 7]]) else "  FAIL trap not distinguishable")

print("=" * 70, "\nNEW PROBLEMS 9 & 10 (mine)\n" + "=" * 70)

# ---- P9: Taylor / Maclaurin, incl. the sigmoid
sig = 1/(1 + sp.exp(-z))
T3 = sp.series(sig, z, 0, 4).removeO()
chk("P9 sigmoid T3", sp.expand(T3), sp.Rational(1, 2) + z/4 - z**3/48)
chk("P9 sigma(0)", sig.subs(z, 0), sp.Rational(1, 2))
chk("P9 sigma'(0)", sp.diff(sig, z).subs(z, 0), sp.Rational(1, 4))
chk("P9 sigma''(0)", sp.diff(sig, z, 2).subs(z, 0), 0)
chk("P9 sigma'''(0)", sp.diff(sig, z, 3).subs(z, 0), sp.Rational(-1, 8))
# the x^4 at x0=1 exactness claim from the lecture
f4 = x**4
T6 = sum(sp.diff(f4, x, k).subs(x, 1)/sp.factorial(k)*(x - 1)**k for k in range(7))
chk("P9 x^4 T6 at x0=1 is exact", sp.expand(T6), x**4)
chk("P9 x^4 coefficients", [sp.diff(f4, x, k).subs(x, 1) for k in range(7)], [1, 4, 12, 24, 24, 0, 0])
# ln(1+x) Maclaurin to degree 4 (part a of my problem)
chk("P9a ln(1+x) T4", sp.series(sp.log(1 + x), x, 0, 5).removeO(),
    x - x**2/2 + x**3/3 - x**4/4)

approx = (x - x**2/2 + x**3/3 - x**4/4).subs(x, sp.Rational(1, 2))
print("  info  ln(1.5) ~ T4(0.5) =", approx, "=", float(approx), " true:", float(sp.log(sp.Rational(3,2))))

# ---- P10: chain rule as matrix multiplication (one linear layer + squared loss)
w11, w12, w21, w22 = sp.symbols('w11 w12 w21 w22', real=True)
W = sp.Matrix([[2, -1], [1, 3]])
yv = sp.Matrix([1, 2])
X2 = sp.Matrix([x1, x2])
Z = W*X2
L = (sp.Rational(1, 2)*((Z - yv).T*(Z - yv)))[0]
gradL_x = sp.Matrix([[sp.diff(L, x1), sp.diff(L, x2)]])
chk("P10 dL/dx = (z-y)^T W", gradL_x, ((Z - yv).T*W))
pt = {x1: 1, x2: 1}
chk("P10 z at (1,1)", Z.subs(pt), sp.Matrix([1, 4]))
chk("P10 (z-y) at (1,1)", (Z - yv).subs(pt), sp.Matrix([0, 2]))
chk("P10 dL/dx at (1,1)", gradL_x.subs(pt), sp.Matrix([[2, 6]]))
chk("P10 L at (1,1)", L.subs(pt), 2)
# part (b): polynomial composition, Jacobian product vs direct
G = sp.Matrix([x1**2*x2, x1 + x2**2])
u1, u2 = sp.symbols('u1 u2', real=True)
Fo = u1*u2
JG = G.jacobian([x1, x2])
JF = sp.Matrix([[sp.diff(Fo, u1), sp.diff(Fo, u2)]]).subs({u1: G[0], u2: G[1]})
chain = sp.simplify(JF*JG)
direct = sp.Matrix([[sp.diff(Fo.subs({u1: G[0], u2: G[1]}), v) for v in (x1, x2)]])
chk("P10b chain product == direct", chain, sp.simplify(direct))
chk("P10b value at (1,2)", sp.simplify(chain.subs({x1: 1, x2: 2})),
    sp.simplify(direct.subs({x1: 1, x2: 2})))
print("  info  P10b at (1,2):", sp.simplify(chain.subs({x1: 1, x2: 2})).tolist())

print("=" * 70, "\nLECTURE 6 SLIDE EXAMPLES\n" + "=" * 70)
chk("Slide: d/dx x^n", sp.diff(x**sp.Symbol('n', positive=True, integer=True), x),
    sp.Symbol('n', positive=True, integer=True)*x**(sp.Symbol('n', positive=True, integer=True) - 1))
chk("Slide: chain (2x+1)^4", sp.diff((2*x + 1)**4, x), 8*(2*x + 1)**3)
chk("Slide: sin+cos Maclaurin", sp.series(sp.sin(x) + sp.cos(x), x, 0, 6).removeO(),
    1 + x - x**2/2 - x**3/6 + x**4/24 + x**5/120)
f = (x + 2*y**3)**2
chk("Slide ex1 df/dx", sp.diff(f, x), 2*(x + 2*y**3))
chk("Slide ex1 df/dy", sp.diff(f, y), 12*y**2*(x + 2*y**3))
f = x1**2*x2 + x1*x2**3
chk("Slide ex2 df/dx1", sp.diff(f, x1), 2*x1*x2 + x2**3)
chk("Slide ex2 df/dx2", sp.diff(f, x2), x1**2 + 3*x1*x2**2)
fp = (sp.sin(t)**2 + 2*sp.cos(t))
chk("Slide path chain df/dt", sp.simplify(sp.diff(fp, t)), sp.simplify(2*sp.sin(t)*(sp.cos(t) - 1)))
# vector-valued composite h(t)=exp(x1 x2^2), x=(t cos t, t sin t)
X1e, X2e = t*sp.cos(t), t*sp.sin(t)
hh = sp.exp(X1e*X2e**2)
want = sp.exp(X1e*X2e**2)*(X2e**2*(sp.cos(t) - t*sp.sin(t)) + 2*X1e*X2e*(sp.sin(t) + t*sp.cos(t)))
chk("Slide vector composite dh/dt", sp.simplify(sp.diff(hh, t) - want), 0)

print("=" * 70, "\nCOMPANION 6 WORKED CALCULATIONS\n" + "=" * 70)
chk("Comp: d/dx(4x^3-5x+7)", sp.diff(4*x**3 - 5*x + 7, x), 12*x**2 - 5)
chk("Comp: d/dx(e^2x sin x)", sp.simplify(sp.diff(sp.exp(2*x)*sp.sin(x), x)),
    sp.simplify(sp.exp(2*x)*(2*sp.sin(x) + sp.cos(x))))
w1, w2 = sp.symbols('w1 w2', real=True)
Lc = (3*w1 - 4)**2 + 5*w2**2
chk("Comp: grad L w1", sp.diff(Lc, w1), 18*w1 - 24)
chk("Comp: grad L w2", sp.diff(Lc, w2), 10*w2)
p, yy = sp.symbols('p y_true', real=True)
Lce = -(yy*sp.log(p) + (1 - yy)*sp.log(1 - p))
chk("Comp: cross-entropy dL/dp", sp.simplify(sp.diff(Lce, p)), sp.simplify((p - yy)/(p*(1 - p))))
X22 = sp.Matrix(2, 2, sp.symbols('X11 X12 X21 X22', real=True))
det = X22.det()
adj = sp.Matrix([[sp.diff(det, X22[0, 0]), sp.diff(det, X22[0, 1])],
                 [sp.diff(det, X22[1, 0]), sp.diff(det, X22[1, 1])]])
chk("Comp: d det/dX = adjugate-form", adj,
    sp.Matrix([[X22[1, 1], -X22[1, 0]], [-X22[0, 1], X22[0, 0]]]))
Fj = sp.Matrix([x1**2*x2, 5*x1 + sp.sin(x2)])
chk("Comp: Jacobian ex1", Fj.jacobian([x1, x2]),
    sp.Matrix([[2*x1*x2, x1**2], [5, sp.cos(x2)]]))
Fj2 = sp.Matrix([x1**2 + x2, x1*x2, 3*x2**3])
chk("Comp practice2: 3x2 Jacobian", Fj2.jacobian([x1, x2]),
    sp.Matrix([[2*x1, 1], [x2, x1], [0, 9*x2**2]]))
a, ytr = sp.symbols('a y_t', real=True)
# sigmoid neuron gradient
wv1, wv2, xv1, xv2, bb = sp.symbols('w1 w2 x1v x2v b', real=True)
zz = wv1*xv1 + wv2*xv2 + bb
aa = 1/(1 + sp.exp(-zz))
Ln = (aa - ytr)**2
chk("Comp practice1: dL/dw1", sp.simplify(sp.diff(Ln, wv1)),
    sp.simplify(2*(aa - ytr)*aa*(1 - aa)*xv1))

print("\n" + "=" * 70)
print(f"{len(fails)} FAILURE(S)" if fails else "ALL MATH CHECKS PASS ✓")
for f_ in fails: print("  -", f_)
