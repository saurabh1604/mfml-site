# Unit 8 · Taylor & MacLaurin series and the Hessian — machine verification
# of every number printed in the practice arena (tpl/u8-practice.html) and
# of the numbers the unit's sections and widgets lean on.
import math
import sympy as sp
import numpy as np

ok = 0
def chk(name, cond):
    global ok
    assert cond, f"FAIL: {name}"
    ok += 1
    print(f"  ok    {name}")

def bisect(g, lo, hi, it=200):
    """root of g on [lo,hi] assuming a sign change (plain bisection; no scipy)."""
    glo = g(lo)
    assert glo * g(hi) < 0, "bisect: no sign change"
    for _ in range(it):
        mid = 0.5 * (lo + hi); gm = g(mid)
        if glo * gm <= 0: hi = mid
        else: lo, glo = mid, gm
    return 0.5 * (lo + hi)

def sign_changes(g, lo, hi, n=4001):
    ts = np.linspace(lo, hi, n); v = np.array([g(t) for t in ts])
    idx = np.where(np.sign(v[:-1]) != np.sign(v[1:]))[0]
    return [bisect(g, ts[i], ts[i + 1]) for i in idx]

x, y = sp.symbols('x y')
h, k = sp.symbols('h k')

# --- P1: ln x about a = 1 ---
f1 = sp.log(x)
d1 = [sp.diff(f1, x, j).subs(x, 1) for j in range(5)]
chk("P1 derivatives of ln x at 1 = 0, 1, -1, 2, -6", d1 == [0, 1, -1, 2, -6])
P4 = sum(d1[j] / sp.factorial(j) * (x - 1)**j for j in range(5))
want = (x-1) - sp.Rational(1,2)*(x-1)**2 + sp.Rational(1,3)*(x-1)**3 - sp.Rational(1,4)*(x-1)**4
chk("P1 P4(x) = (x-1) - (x-1)^2/2 + (x-1)^3/3 - (x-1)^4/4", sp.expand(P4 - want) == 0)
u = sp.Symbol('u')
chk("P1 shortcut: ln(1+u) series to degree 4 equals P4 with u = x-1",
    sp.expand(sp.series(sp.log(1+u), u, 0, 5).removeO().subs(u, x-1) - P4) == 0)
p411 = float(P4.subs(x, sp.Rational(11, 10)))
chk("P1 P4(1.1) = 0.095308 vs ln 1.1 = 0.095310, error 1.8e-6 ~ u^5/5 = 2.0e-6",
    abs(p411 - 0.095308) < 5e-7 and abs(math.log(1.1) - 0.095310) < 5e-7
    and abs(abs(p411 - math.log(1.1)) - 1.8e-6) < 1e-7 and abs(0.1**5/5 - 2.0e-6) < 1e-12)
chk("P1 pieces 0.1 - 0.005 + 0.000333 - 0.000025",
    abs(0.1 - 0.005 + 0.1**3/3 - 0.1**4/4 - p411) < 1e-12 and abs(0.1**3/3 - 0.000333) < 5e-7)

# --- P2: sqrt x about a = 4 ---
f2 = sp.sqrt(x)
chk("P2 f(4)=2, f'(4)=1/4, f''(4)=-1/32, f'''(4)=3/256",
    [sp.diff(f2, x, j).subs(x, 4) for j in range(4)] ==
    [2, sp.Rational(1,4), sp.Rational(-1,32), sp.Rational(3,256)])
chk("P2 f''(4)/2! = -1/64", sp.diff(f2, x, 2).subs(x, 4) / 2 == sp.Rational(-1, 64))
P1s = 2 + (x-4)/4; P2s = P1s - (x-4)**2/64
t42 = math.sqrt(4.2)
p1v = float(P1s.subs(x, 4.2)); p2v = float(P2s.subs(x, 4.2))
chk("P2 P1(4.2) = 2.05, P2(4.2) = 2.049375, sqrt(4.2) = 2.0493902",
    abs(p1v - 2.05) < 1e-12 and abs(p2v - 2.049375) < 1e-12 and abs(t42 - 2.0493902) < 5e-8)
chk("P2 0.04/64 = 0.000625", abs(0.2**2/64 - 0.000625) < 1e-15)
e1 = p1v - t42; e2 = p2v - t42
chk("P2 errors +6.1e-4 and -1.5e-5 (about 40x)",
    abs(e1 - 6.1e-4) < 5e-6 and abs(e2 + 1.5e-5) < 5e-7 and 38 < e1/abs(e2) < 42)
chk("P2 remainder estimate (1/2)(1/32)(0.04) = 6.25e-4 ~ actual 6.1e-4",
    abs(0.5/32*0.04 - 6.25e-4) < 1e-15 and abs(6.25e-4 - e1) < 2e-5)
third = float(sp.diff(f2, x, 3).subs(x, 4)) / 6 * 0.2**3
chk("P2 third-order term (3/256)/6 * 0.008 = 0.008/512 = 1.56e-5 ~ |P2 error|",
    abs(third - 0.008/512) < 1e-15 and abs(third - 1.56e-5) < 5e-8 and abs(third - abs(e2)) < 1e-6)
chk("P2 binomial shortcut 2 sqrt(1+h/4) = 2 + h/4 - h^2/64 + ...",
    sp.expand(sp.series(2*sp.sqrt(1 + h/4), h, 0, 3).removeO() - (2 + h/4 - h**2/64)) == 0)

# --- P3: e^x sin y about (0,0) ---
f3 = sp.exp(x) * sp.sin(y)
at0 = {x: 0, y: 0}
chk("P3 grad(0,0) = (0,1), H(0,0) = [[0,1],[1,0]]",
    [sp.diff(f3, x).subs(at0), sp.diff(f3, y).subs(at0)] == [0, 1]
    and sp.hessian(f3, (x, y)).subs(at0) == sp.Matrix([[0, 1], [1, 0]]))
chk("P3 partials fx=e^x sin y, fy=e^x cos y, fxx=e^x sin y, fxy=e^x cos y, fyy=-e^x sin y",
    sp.simplify(sp.diff(f3, x) - sp.exp(x)*sp.sin(y)) == 0 and sp.simplify(sp.diff(f3, y) - sp.exp(x)*sp.cos(y)) == 0
    and sp.simplify(sp.diff(f3, x, 2) - sp.exp(x)*sp.sin(y)) == 0 and sp.simplify(sp.diff(f3, x, y) - sp.exp(x)*sp.cos(y)) == 0
    and sp.simplify(sp.diff(f3, y, 2) + sp.exp(x)*sp.sin(y)) == 0)
Q3 = y + x*y
chk("P3 Q = y + xy is the degree-2 truncation of the product of series",
    sp.expand(sp.series(sp.series(f3, x, 0, 3).removeO(), y, 0, 3).removeO()).as_poly(x, y).as_expr()
    .as_poly(x, y).total_degree() >= 2 and
    sp.expand(sum(term for term in sp.Poly(sp.expand(sp.series(sp.series(f3, x, 0, 4).removeO(), y, 0, 4).removeO()), x, y).as_expr().as_ordered_terms()
                  if sp.Poly(term, x, y).total_degree() <= 2) - Q3) == 0)
fv = math.exp(0.1) * math.sin(0.2)
chk("P3 e^0.1 = 1.105171, sin 0.2 = 0.198669, f(0.1,0.2) = 0.2195636",
    abs(math.exp(0.1) - 1.105171) < 5e-7 and abs(math.sin(0.2) - 0.198669) < 5e-7 and abs(fv - 0.2195636) < 5e-8)
chk("P3 Q(0.1,0.2) = 0.22, error +4.4e-4", abs(0.22 - fv - 4.4e-4) < 5e-6)
cub = 0.1**2*0.2/2 - 0.2**3/6; quart = 0.1**3*0.2/6 - 0.1*0.2**3/6
chk("P3 cubic terms x^2y/2 - y^3/6 = 0.001 - 0.001333 = -3.3e-4, quartic -1.0e-4, sum ~ -4.4e-4",
    abs(cub + 3.3e-4) < 5e-6 and abs(quart + 1.0e-4) < 1e-12 and abs((cub + quart) - (fv - 0.22)) < 5e-6)
ser4 = sp.Poly(sp.expand(sp.series(sp.series(f3, x, 0, 5).removeO(), y, 0, 5).removeO()), x, y)
deg3 = sum(t for t in ser4.as_expr().as_ordered_terms() if sp.Poly(t, x, y).total_degree() == 3)
deg4 = sum(t for t in ser4.as_expr().as_ordered_terms() if sp.Poly(t, x, y).total_degree() == 4)
chk("P3 degree-3 part is x^2y/2 - y^3/6 and degree-4 part is x^3y/6 - xy^3/6",
    sp.expand(deg3 - (x**2*y/2 - y**3/6)) == 0 and sp.expand(deg4 - (x**3*y/6 - x*y**3/6)) == 0)
fv2 = math.exp(0.2) * math.sin(0.4)
chk("P3/§ e^x sin y at (0.2,0.4): f = 0.475637, Q = 0.48, gap -4.4e-3, ratio of gaps ~ 10",
    abs(fv2 - 0.475637) < 5e-7 and abs(0.4 + 0.08 - 0.48) < 1e-15
    and abs((fv2 - 0.48) + 4.4e-3) < 5e-5 and 9.9 < (0.48 - fv2)/(0.22 - fv) < 10.1)
chk("P3 H = [[0,1],[1,0]] has eigenvalues +1, -1 (trace 0, det -1)",
    sorted(sp.Matrix([[0,1],[1,0]]).eigenvals()) == [-1, 1])

# --- P4: Bound the lie ---
chk("P4a cos MacLaurin coefficients 1, 0, -1/2, 0, 1/24",
    [sp.diff(sp.cos(x), x, j).subs(x, 0)/sp.factorial(j) for j in range(5)] ==
    [1, 0, sp.Rational(-1,2), 0, sp.Rational(1,24)])
bound = 0.5**4/24
chk("P4a bound 0.5^4/24 = 0.0625/24 = 0.0026042", abs(0.5**4 - 0.0625) < 1e-15 and abs(bound - 0.0026042) < 5e-8)
err_cos = math.cos(0.5) - 0.875
chk("P4a cos 0.5 = 0.8775826, 1 - 0.125 = 0.875, error 0.0025826 inside the bound, ratio 0.99",
    abs(math.cos(0.5) - 0.8775826) < 5e-8 and abs(err_cos - 0.0025826) < 5e-8
    and 0 < err_cos < bound and abs(err_cos/bound - 0.99) < 5e-3)
chk("P4a lazy n=3 bound 0.5^3/6 = 0.0208, eight times looser",
    abs(0.5**3/6 - 0.0208) < 5e-5 and 7.5 < (0.5**3/6)/bound < 8.5)
chk("P4b 3/9! = 8.27e-6 (too big), 3/10! = 8.27e-7 < 1e-6, and e/n! < 3/n!",
    abs(3/math.factorial(9) - 8.27e-6) < 5e-9 and 3/math.factorial(9) > 1e-6
    and abs(3/math.factorial(10) - 8.27e-7) < 5e-10 and 3/math.factorial(10) < 1e-6
    and math.e/math.factorial(9) < 3/math.factorial(9) and math.factorial(9) == 362880)
s9 = sum(1/math.factorial(j) for j in range(10)); s8 = sum(1/math.factorial(j) for j in range(9))
chk("P4b sum_{k<=9} 1/k! = 2.7182815 vs e = 2.7182818, error 3.0e-7",
    abs(s9 - 2.7182815) < 5e-8 and abs(math.e - 2.7182818) < 5e-8 and abs((math.e - s9) - 3.0e-7) < 5e-9)
chk("P4b nine terms fail: sum_{k<=8} = 2.7182788, error 3.1e-6 > 1e-6",
    abs(s8 - 2.7182788) < 5e-8 and abs((math.e - s8) - 3.1e-6) < 5e-8 and math.e - s8 > 1e-6)

# --- P5: Find the secret c (f = x^3 on [0,2], a = 0) ---
c = sp.Symbol('c', positive=True)
f5 = x**3
chk("P5a MVT: 8 = 6c^2 => c = 2/sqrt3 = 1.1547 in (0,2); chord slope 4 = f'(c)",
    sp.solve(sp.Eq(f5.subs(x, 2) - f5.subs(x, 0), sp.diff(f5, x).subs(x, c)*2), c) == [2/sp.sqrt(3)]
    and abs(2/math.sqrt(3) - 1.1547) < 5e-5 and 0 < 2/math.sqrt(3) < 2
    and abs(3*(2/math.sqrt(3))**2 - 4) < 1e-12)
chk("P5b n=2: P1 = 0 and 8 = (6c/2)*4 = 12c => c = 2/3 in (0,2)",
    f5.subs(x, 0) == 0 and sp.diff(f5, x).subs(x, 0) == 0
    and sp.solve(sp.Eq(8, sp.diff(f5, x, 2).subs(x, c)/2*4), c) == [sp.Rational(2, 3)])
chk("P5c n=3: f''' = 6, R3 = x^3 = f for every c; f'''' = 0",
    sp.diff(f5, x, 3) == 6 and sp.expand(6/sp.factorial(3)*x**3 - f5) == 0 and sp.diff(f5, x, 4) == 0)
xs = sp.Symbol('xs', positive=True)
chk("P5 general: c = x/sqrt3 (n=1) and c = x/3 (n=2); at x=1: 0.5774, 0.3333",
    sp.solve(sp.Eq(xs**3, 3*c**2*xs), c) == [xs/sp.sqrt(3)] and sp.solve(sp.Eq(xs**3, 3*c*xs**2), c) == [xs/3]
    and abs(1/math.sqrt(3) - 0.5774) < 5e-5 and abs(1/3 - 0.3333) < 5e-5 and abs(2/3 - 0.6667) < 5e-5)

# --- P6 (B1): f = x^3 - 3xy + 3y^2 ---
f6 = x**3 - 3*x*y + 3*y**2
cps6 = sp.solve([sp.diff(f6, x), sp.diff(f6, y)], [x, y], dict=True)
chk("P6a critical points (0,0) and (1/2,1/4)",
    sorted((d[x], d[y]) for d in cps6) == [(0, 0), (sp.Rational(1,2), sp.Rational(1,4))])
H6 = sp.hessian(f6, (x, y))
chk("P6b H = [[6x,-3],[-3,6]], D = 36x - 9", H6 == sp.Matrix([[6*x, -3], [-3, 6]]) and sp.expand(H6.det()) == 36*x - 9)
chk("P6b D(0,0) = -9 saddle; D(1/2,1/4) = 9, fxx = 3 minimum",
    H6.det().subs(x, 0) == -9 and H6.det().subs(x, sp.Rational(1,2)) == 9 and H6[0,0].subs(x, sp.Rational(1,2)) == 3)
chk("P6c f(1/2,1/4) = 1/8 - 3/8 + 3/16 = -1/16 = -0.0625",
    f6.subs({x: sp.Rational(1,2), y: sp.Rational(1,4)}) == sp.Rational(-1, 16)
    and sp.Rational(1,8) - sp.Rational(3,8) + sp.Rational(3,16) == sp.Rational(-1,16))
Hm = sp.Matrix([[3, -3], [-3, 6]])
lam6 = sorted(float(v) for v in Hm.eigenvals())
chk("P6 eigenvalues at the min: trace 9, det 9, (9±sqrt45)/2 = 7.854, 1.146, sqrt45 = 6.708",
    Hm.trace() == 9 and Hm.det() == 9 and abs(lam6[1] - (9 + math.sqrt(45))/2) < 1e-12
    and abs(lam6[1] - 7.854) < 5e-4 and abs(lam6[0] - 1.146) < 5e-4 and abs(math.sqrt(45) - 6.708) < 5e-4)
H0 = sp.Matrix([[0, -3], [-3, 6]])
lam0 = sorted(float(v) for v in H0.eigenvals())
chk("P6 eigenvalues at the origin: 3±sqrt18 = 7.243, -1.243 (det -9)",
    H0.det() == -9 and abs(lam0[1] - 7.243) < 5e-4 and abs(lam0[0] + 1.243) < 5e-4
    and abs(lam0[1] - (3 + math.sqrt(18))) < 1e-12)

# --- P7 (B2): f = 2x^2 + 2xy + 3y^2 - 4x - 2y ---
f7 = 2*x**2 + 2*x*y + 3*y**2 - 4*x - 2*y
chk("P7a critical point (1,0)", sp.solve([sp.diff(f7, x), sp.diff(f7, y)], [x, y]) == {x: 1, y: 0})
H7 = sp.hessian(f7, (x, y))
chk("P7b H = [[4,2],[2,6]], minors 4 and 20", H7 == sp.Matrix([[4, 2], [2, 6]]) and H7[0,0] == 4 and H7.det() == 20)
lam7 = sorted(float(v) for v in H7.eigenvals())
chk("P7b eigenvalues 5±sqrt5 = 7.236, 2.764 (trace 10, det 20)",
    H7.trace() == 10 and abs(lam7[1] - (5 + math.sqrt(5))) < 1e-12 and abs(lam7[0] - (5 - math.sqrt(5))) < 1e-12
    and abs(lam7[1] - 7.236) < 5e-4 and abs(lam7[0] - 2.764) < 5e-4)
chk("P7c f(1,0) = -2", f7.subs({x: 1, y: 0}) == -2)
uu, vv = sp.symbols('uu vv')
shifted = sp.expand(f7.subs({x: 1 + uu, y: vv}))
chk("P7 completing the square: f = -2 + 2u^2 + 2uv + 3v^2 = -2 + 2(u+v/2)^2 + (5/2)v^2",
    shifted == -2 + 2*uu**2 + 2*uu*vv + 3*vv**2
    and sp.expand(-2 + 2*(uu + vv/2)**2 + sp.Rational(5,2)*vv**2 - shifted) == 0)
chk("P7 condition number 7.236/2.764 = 2.618 = (3+sqrt5)/2, sqrt = 1.62",
    abs(lam7[1]/lam7[0] - 2.618) < 5e-4 and abs(lam7[1]/lam7[0] - (3 + math.sqrt(5))/2) < 1e-12
    and abs(math.sqrt(lam7[1]/lam7[0]) - 1.62) < 5e-3)

# --- P8 (B3): x^4 ± y^4 ---
g8 = x**4 + y**4; h8 = x**4 - y**4
chk("P8a gradients and Hessians vanish at the origin for both",
    [sp.diff(g8, x), sp.diff(g8, y)] == [4*x**3, 4*y**3] and [sp.diff(h8, x), sp.diff(h8, y)] == [4*x**3, -4*y**3]
    and sp.hessian(g8, (x, y)) == sp.diag(12*x**2, 12*y**2) and sp.hessian(h8, (x, y)) == sp.diag(12*x**2, -12*y**2)
    and sp.hessian(g8, (x, y)).subs(at0) == sp.zeros(2) and sp.hessian(h8, (x, y)).subs(at0) == sp.zeros(2))
th, tt = sp.symbols('theta t')
gs = sp.expand(g8.subs({x: tt*sp.cos(th), y: tt*sp.sin(th)}))
hs = sp.expand(h8.subs({x: tt*sp.cos(th), y: tt*sp.sin(th)}))
chk("P8 ray slice: g = t^4(cos^4+sin^4) = t^4(1 - sin^2(2θ)/2) >= t^4/2, h = t^4 cos 2θ",
    sp.simplify(gs - tt**4*(1 - sp.sin(2*th)**2/2)) == 0 and sp.simplify(hs - tt**4*sp.cos(2*th)) == 0
    and min(1 - math.sin(2*a)**2/2 for a in np.linspace(0, math.pi, 3601)) >= 0.5 - 1e-12)
chk("P8 h(t,0) = t^4, h(0,t) = -t^4; sign of cos 2θ flips at 45°",
    h8.subs({x: tt, y: 0}) == tt**4 and h8.subs({x: 0, y: tt}) == -tt**4
    and math.cos(2*math.radians(30)) > 0 and math.cos(2*math.radians(60)) < 0)

# --- P9 (companion 1): f = xy - x^2 - y^2 - 2x - 2y + 4 ---
f9 = x*y - x**2 - y**2 - 2*x - 2*y + 4
chk("P9 critical point (-2,-2)", sp.solve([sp.diff(f9, x), sp.diff(f9, y)], [x, y]) == {x: -2, y: -2})
H9 = sp.hessian(f9, (x, y))
chk("P9 fxx = -2, fyy = -2, fxy = 1, D = 3 > 0, fxx < 0 => maximum, f = 8",
    H9 == sp.Matrix([[-2, 1], [1, -2]]) and H9.det() == 3 and f9.subs({x: -2, y: -2}) == 8)
chk("P9 eigenvalues -1, -3 (trace -4, det 3)", sorted(H9.eigenvals()) == [-3, -1] and H9.trace() == -4)

# --- P10 (companion 2): f = x^3 + y^3 - 3xy + 1 ---
f10 = x**3 + y**3 - 3*x*y + 1
sol10 = [(d[x], d[y]) for d in sp.solve([sp.diff(f10, x), sp.diff(f10, y)], [x, y], dict=True)]
real10 = sorted(s for s in sol10 if all(v.is_real for v in s))
chk("P10 real critical points (0,0) and (1,1) (x^4 = x has two real roots)",
    real10 == [(0, 0), (1, 1)] and len(sol10) == 4
    and sp.solveset(x**4 - x, x, domain=sp.S.Reals) == sp.FiniteSet(0, 1))
H10 = sp.hessian(f10, (x, y))
chk("P10 fxx = 6x, fyy = 6y, fxy = -3", H10 == sp.Matrix([[6*x, -3], [-3, 6*y]]))
chk("P10 (0,0): D = -9 saddle, f = 1; (1,1): D = 27, fxx = 6 minimum, f = 0",
    H10.det().subs(at0) == -9 and f10.subs(at0) == 1
    and H10.det().subs({x: 1, y: 1}) == 27 and H10[0,0].subs({x: 1}) == 6 and f10.subs({x: 1, y: 1}) == 0)
chk("P10 eigenvalues: 9, 3 at (1,1); ±3 at (0,0)",
    sorted(H10.subs({x: 1, y: 1}).eigenvals()) == [3, 9] and sorted(H10.subs(at0).eigenvals()) == [-3, 3])
chk("P10 not global: f(-2,0) = -7", f10.subs({x: -2, y: 0}) == -7)

# --- P11 (companion 3): absolute extrema on x^2 <= y <= 1 ---
f11 = x**2 + y**2 - x - y
half = sp.Rational(1, 2)
chk("P11 interior CP (1/2,1/2) inside D, f = -1/2, H = 2I",
    sp.solve([sp.diff(f11, x), sp.diff(f11, y)], [x, y]) == {x: half, y: half}
    and half**2 <= half <= 1 and f11.subs({x: half, y: half}) == -half and sp.hessian(f11, (x, y)) == 2*sp.eye(2))
g11 = sp.expand(f11.subs(y, x**2))
chk("P11 parabola: g = x^4 - x, g' = 4x^3 - 1", g11 == x**4 - x and sp.diff(g11, x) == 4*x**3 - 1)
xstar = 0.25**(1/3)
chk("P11 parabola CP x = (1/4)^(1/3) = 0.62996, y = 0.39685, f = -3x/4 = -0.47247",
    abs(xstar - 0.62996) < 5e-6 and abs(xstar**2 - 0.39685) < 5e-6
    and abs(xstar**4 - xstar - (-0.75*xstar)) < 1e-12 and abs(xstar**4 - xstar + 0.47247) < 5e-6)
chk("P11 corners f(-1,1) = 2, f(1,1) = 0", f11.subs({x: -1, y: 1}) == 2 and f11.subs({x: 1, y: 1}) == 0)
h11 = sp.expand(f11.subs(y, 1))
chk("P11 lid: h = x^2 - x, min at x = 1/2, f(1/2,1) = -1/4",
    h11 == x**2 - x and sp.solve(sp.diff(h11, x), x) == [half] and f11.subs({x: half, y: 1}) == -sp.Rational(1, 4))
cands = [-0.5, xstar**4 - xstar, 2, 0, -0.25]
chk("P11 absolute max 2, absolute min -1/2", max(cands) == 2 and min(cands) == -0.5)
chk("P11 geometry: f = (x-1/2)^2 + (y-1/2)^2 - 1/2; corner distance^2 2.5 -> 2; grad f(-1,1) = (-3,1)",
    sp.expand((x - half)**2 + (y - half)**2 - half - f11) == 0 and abs(1.5**2 + 0.5**2 - 2.5) < 1e-15
    and [sp.diff(f11, x).subs({x: -1, y: 1}), sp.diff(f11, y).subs({x: -1, y: 1})] == [-3, 1])
# brute-force the region to be sure nothing was missed
XX, YY = np.meshgrid(np.linspace(-1, 1, 801), np.linspace(0, 1, 401))
mask = XX**2 <= YY; FF = XX**2 + YY**2 - XX - YY
chk("P11 grid search over D agrees: max 2, min -1/2",
    abs(FF[mask].max() - 2) < 1e-9 and abs(FF[mask].min() + 0.5) < 1e-5)

# --- P12: the judge's identity ---
a, b, cc = sp.symbols('a b c')
Qf = h**2*a + 2*h*k*b + k**2*cc
Dd = a*cc - b**2
chk("P12a identity: fxx*Q = (h fxx + k fxy)^2 + D k^2", sp.expand((h*a + k*b)**2 + Dd*k**2 - a*Qf) == 0)
chk("P12b Q(1,0) = fxx and Q(-fxy,fxx) = fxx*D, so fxx*Q(-fxy,fxx) = fxx^2 D",
    Qf.subs({h: 1, k: 0}) == a and sp.expand(Qf.subs({h: -b, k: a}) - a*Dd) == 0
    and sp.expand(a*Qf.subs({h: -b, k: a}) - a**2*Dd) == 0)
chk("P12b fxx = 0 case: Q(1,t) = t(2 fxy + t fyy)",
    sp.expand(Qf.subs({a: 0, h: 1, k: tt}) - tt*(2*b + tt*cc)) == 0)
# numeric spot checks of the three verdicts
rng = np.random.default_rng(8)
def verdict_ok(A, B, C):
    Dn = A*C - B*B
    dirs = rng.normal(size=(400, 2))
    Qs = np.array([A*hh*hh + 2*B*hh*kk + C*kk*kk for hh, kk in dirs])
    if Dn > 0 and A > 0: return np.all(Qs > 0)
    if Dn > 0 and A < 0: return np.all(Qs < 0)
    if Dn < 0: return Qs.min() < 0 < Qs.max()
    return True
chk("P12b verdicts hold numerically (bowl, dome, saddle, saddle with fxx = 0)",
    verdict_ok(3, -3, 6) and verdict_ok(-2, 1, -2) and verdict_ok(6, 5, 1) and verdict_ok(0, 1, 0)
    and verdict_ok(0, 1, 2))
lam = sp.Symbol('lam')
Hs = sp.Matrix([[a, b], [b, cc]])
charpoly = sp.expand((Hs - lam*sp.eye(2)).det())
chk("P12c char poly lam^2 - (a+c) lam + (ac - b^2): sum a+c, product D, real roots",
    sp.expand(charpoly - (lam**2 - (a + cc)*lam + (a*cc - b**2))) == 0
    and sp.expand(((a + cc)**2 - 4*(a*cc - b**2)) - ((a - cc)**2 + 4*b**2)) == 0)
chk("P12d H = [[3,-3],[-3,6]]: trace 9, det 9, lam = (9±sqrt45)/2 = 7.854, 1.146, sum 9, product 9",
    Hm.trace() == 9 and Hm.det() == 9 and abs(lam6[0] + lam6[1] - 9) < 1e-12 and abs(lam6[0]*lam6[1] - 9) < 1e-12
    and abs(lam6[1] - 7.854) < 5e-4 and abs(lam6[0] - 1.146) < 5e-4 and lam6[0] > 0)
chk("P12d identity at that H: 3Q = (3h - 3k)^2 + 9k^2",
    sp.expand((3*h - 3*k)**2 + 9*k**2 - 3*Qf.subs({a: 3, b: -3, cc: 6})) == 0)

# --- numbers used elsewhere in the unit ---
chk("e^x partial sums at 1: k<=3 -> 2.6667, k<=5 -> 2.71667, e = 2.7182818",
    abs(sum(1/math.factorial(j) for j in range(4)) - 2.6667) < 5e-5
    and abs(sum(1/math.factorial(j) for j in range(6)) - 2.71667) < 5e-6 and abs(math.e - 2.7182818) < 5e-8)
chk("cos x ~ 1 - x^2/2 at x = 1: 0.5 vs cos 1 = 0.5403, error 0.0403 <= 1/24 = 0.0417",
    abs(math.cos(1) - 0.5403) < 5e-5 and abs(math.cos(1) - 0.5 - 0.0403) < 5e-5
    and math.cos(1) - 0.5 <= 1/24 and abs(1/24 - 0.0417) < 5e-5)

# hero surface partials
fh = sp.sin(1.15*x)*sp.cos(0.85*y) + 0.18*x
hero_pairs = [
    (sp.diff(fh, x),    1.15*sp.cos(1.15*x)*sp.cos(0.85*y) + 0.18),
    (sp.diff(fh, y),   -0.85*sp.sin(1.15*x)*sp.sin(0.85*y)),
    (sp.diff(fh, x, 2), -1.3225*sp.sin(1.15*x)*sp.cos(0.85*y)),
    (sp.diff(fh, x, y), -0.9775*sp.cos(1.15*x)*sp.sin(0.85*y)),
    (sp.diff(fh, y, 2), -0.7225*sp.sin(1.15*x)*sp.cos(0.85*y)),
]
hero_fns = [(sp.lambdify((x, y), d, 'numpy'), sp.lambdify((x, y), w, 'numpy')) for d, w in hero_pairs]
GX, GY = np.meshgrid(np.linspace(-3, 3, 61), np.linspace(-3, 3, 61))
chk("hero surface: fx, fy, fxx, fxy, fyy match the analytic formulas (sympy vs stated, on a grid)",
    all(np.max(np.abs(dd(GX, GY) - ww(GX, GY))) < 1e-12 for dd, ww in hero_fns)
    and abs(1.15**2 - 1.3225) < 1e-12 and abs(1.15*0.85 - 0.9775) < 1e-12 and abs(0.85**2 - 0.7225) < 1e-12)

# flat-spot curve: MVT and Rolle
fl = lambda t: 0.55*math.sin(1.6*t) + 0.22*t*t - 0.15*t
dfl = lambda t: 0.88*math.cos(1.6*t) + 0.44*t - 0.15
A, B = -1.6, 1.8
slope = (fl(B) - fl(A))/(B - A)
cs = sign_changes(lambda t: dfl(t) - slope, A, B)
chk(f"flat-spot MVT: a=-1.6, b=1.8, chord slope {slope:.4f}; c in (a,b) with f'(c)=slope: "
    + ", ".join(f"{v:.4f}" for v in cs),
    len(cs) >= 1 and all(A < v < B and abs(dfl(v) - slope) < 1e-9 for v in cs))
bR = sign_changes(lambda t: fl(t) - fl(A), A + 0.3, 2.8)[0]
cR = sign_changes(dfl, A, bR)
chk(f"flat-spot Rolle: a=-1.6, first b>=a+0.3 with f(b)=f(a): b={bR:.4f} (f={fl(bR):.4f}); "
    + "c with f'(c)=0: " + ", ".join(f"{v:.4f}" for v in cR),
    abs(fl(bR) - fl(A)) < 1e-9 and bR >= A + 0.3 and len(cR) >= 1
    and all(A < v < bR and abs(dfl(v)) < 1e-9 for v in cR))

# Rolle ladder: f = e^x, a = 0, b = 2, n = 3
a3 = (math.e**2 - 5)/8
chk("ladder: a0=1, a1=1, a2=1/2, a3=(e^2-1-2-2)/8=(e^2-5)/8=0.29863",
    abs((math.e**2 - 1 - 2 - 2)/8 - a3) < 1e-15 and abs(a3 - 0.29863) < 5e-6)
Fp = lambda t: math.exp(t) - (1 + t + 3*a3*t*t)
Fpp = lambda t: math.exp(t) - (1 + 6*a3*t)
Fppp = lambda t: math.exp(t) - 6*a3
F0 = lambda t: math.exp(t) - (1 + t + t*t/2 + a3*t**3)
chk("ladder: F(0) = F(2) = 0 and F'(0) = F''(0) = 0", abs(F0(0)) < 1e-15 and abs(F0(2)) < 1e-12
    and abs(Fp(0)) < 1e-15 and abs(Fpp(0)) < 1e-15)
c1 = bisect(Fp, 1e-6, 2 - 1e-9); c2 = bisect(Fpp, 1e-6, c1 - 1e-9); c3 = bisect(Fppp, 1e-9, c2)
chk(f"ladder: c1={c1:.4f}, c2={c2:.4f}, c3={c3:.4f}, nested 0<c3<c2<c1<2",
    0 < c3 < c2 < c1 < 2 and abs(Fp(c1)) < 1e-9 and abs(Fpp(c2)) < 1e-9 and abs(Fppp(c3)) < 1e-9)
chk("ladder: F'''(c3)=0 <=> e^c3 = 6a3 = 1.79179 => c3 = ln(6a3) = 0.5832",
    abs(6*a3 - 1.79179) < 5e-6 and abs(c3 - math.log(6*a3)) < 1e-9 and abs(c3 - 0.5832) < 5e-5)

# remainder detective: sqrt x, a = 4, n = 2, x = 4.2
R = math.sqrt(4.2) - 2.05
cdet = (0.005/abs(R))**(2/3)
chk(f"detective: R = sqrt(4.2) - P1(4.2) = {R:.3e} (-6.10e-4); c = {cdet:.4f} in (4, 4.2)",
    abs(R + 6.10e-4) < 5e-7 and 4 < cdet < 4.2
    and abs(-0.25*cdet**-1.5/2*0.04 - R) < 1e-12)

print("=" * 60)
print(f"ALL {ok} UNIT-8 MATH CHECKS PASS ✓")
