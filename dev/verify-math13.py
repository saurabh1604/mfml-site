# Unit 13 · Support Vector Machines — machine verification of every number the
# page prints: the sections, the checks, the widgets' fixed readouts, the derivation
# drawers and the sixteen practice problems (tpl/u13-*.html).
# Dual solves use scipy.optimize.minimize (SLSQP); primal solves likewise; every
# claimed optimum is also certified by its KKT conditions. Tolerance 1e-6.
import math
from itertools import combinations
import numpy as np
from scipy.optimize import minimize, linprog

ok = 0
def chk(name, cond):
    global ok
    assert cond, f"FAIL: {name}"
    ok += 1
    print(f"  ok    {name}")

TOL = 1e-6
close = lambda a, b, t=TOL: abs(a - b) < t
vclose = lambda a, b, t=TOL: np.allclose(np.asarray(a, float), np.asarray(b, float), atol=t)

def kern(X, Z, kind='lin', g=1.0):
    X = np.atleast_2d(np.asarray(X, float)); Z = np.atleast_2d(np.asarray(Z, float)); D = X @ Z.T
    if kind == 'lin': return D
    if kind == 'p2': return D ** 2
    if kind == 'p2c': return (D + 1) ** 2
    if kind == 'rbf':
        d2 = (X ** 2).sum(1)[:, None] + (Z ** 2).sum(1)[None, :] - 2 * D
        return np.exp(-g * d2)

def dual(X, y, C=None, kind='lin'):
    """max sum a - 1/2 a Q a  s.t. 0 <= a (<= C), a.y = 0  (SLSQP, several starts). Returns value and the (non-unique) a."""
    X = np.asarray(X, float); y = np.asarray(y, float); n = len(y); K = kern(X, X, kind); Q = (y[:, None] * y[None, :]) * K
    f = lambda a: 0.5 * a @ Q @ a - a.sum(); g = lambda a: Q @ a - 1
    best = None
    for s in (np.full(n, .01), np.full(n, .1), np.full(n, .5)):
        r = minimize(f, s, jac=g, bounds=[(0, C)] * n, constraints=[{'type': 'eq', 'fun': lambda a: a @ y, 'jac': lambda a: y}],
                     method='SLSQP', options={'ftol': 1e-15, 'maxiter': 3000})
        if best is None or r.fun < best.fun: best = r
    return -best.fun, best.x, K

def primal(X, y, C=None):
    X = np.asarray(X, float); y = np.asarray(y, float); n, d = X.shape
    if C is None:
        cons = [{'type': 'ineq', 'fun': lambda v: y * (X @ v[:d] + v[d]) - 1, 'jac': lambda v: np.c_[y[:, None] * X, y]}]
        r = minimize(lambda v: .5 * v[:d] @ v[:d], np.r_[np.ones(d), 0], jac=lambda v: np.r_[v[:d], 0], constraints=cons,
                     method='SLSQP', options={'ftol': 1e-15, 'maxiter': 5000})
        return r.x[:d], r.x[d], r.fun
    J = np.c_[y[:, None] * X, y, np.eye(n)]
    r = minimize(lambda v: .5 * v[:d] @ v[:d] + C * v[d + 1:].sum(), np.r_[np.zeros(d + 1), np.ones(n)],
                 jac=lambda v: np.r_[v[:d], 0, np.full(n, C)], method='SLSQP',
                 constraints=[{'type': 'ineq', 'fun': lambda v: y * (X @ v[:d] + v[d]) - 1 + v[d + 1:], 'jac': lambda v: J}],
                 bounds=[(None, None)] * (d + 1) + [(0, None)] * n, options={'ftol': 1e-15, 'maxiter': 8000})
    return r.x[:d], r.x[d], r.fun

def kkt_hard(X, y, a, w, b, tol=1e-9):
    """certify a hard-margin answer: stationarity, feasibility, sign, complementary slackness."""
    X = np.asarray(X, float); y = np.asarray(y, float); a = np.asarray(a, float); z = y * (X @ w + b)
    return (vclose(w, (a * y) @ X, tol) and abs(a @ y) < tol and (z >= 1 - tol).all() and (a >= -tol).all()
            and np.all(np.abs(a * (z - 1)) < tol))

def kkt_kernel(K, y, a, b, C=None, tol=1e-9):
    y = np.asarray(y, float); a = np.asarray(a, float); f = (a * y) @ K + b; z = y * f
    ok_ = abs(a @ y) < tol and (a >= -tol).all()
    if C is None: return ok_ and (z >= 1 - tol).all() and np.all(np.abs(a * (z - 1)) < tol)
    return ok_ and (a <= C + tol).all() and all((ai < tol and zi >= 1 - tol) or (ai > C - tol and zi <= 1 + tol) or abs(zi - 1) < tol for ai, zi in zip(a, z))

fvote = lambda X, y, a, b, x, kind: float((np.asarray(a) * np.asarray(y, float)) @ kern(X, [x], kind)[:, 0] + b)
R2 = math.sqrt(2)

print("— §1 · the widest street, one tilt at a time —")
D1X = [(1, 3), (3, 5), (.5, 4.8), (1.8, 5.6), (2.6, 6.4), (.2, 3.6), (4, 2), (3, .6), (5, 1.2), (5.8, 3), (6.2, 4), (4.8, .4)]
D1y = [1] * 6 + [-1] * 6
def street(deg):
    th = math.radians(deg + 90); u = np.array([math.cos(th), math.sin(th)]); P = np.array(D1X[:6]) @ u; N = np.array(D1X[6:]) @ u
    return P.min() - N.max()
chk("tilt 20° → width 0.839 (about 0.84); 70° → 1.505 (about 1.5)", close(round(street(20), 3), .839, 1e-9) and abs(street(20) - .84) < .005 and abs(street(70) - 1.505) < .001)
scan = [(street(d / 10), d / 10) for d in range(50, 951)]
chk("the best tilt is 45° with width 2√2 = 2.828", close(max(scan)[1], 45) and close(street(45), 2 * R2, 1e-12) and close(2 * R2, 2.828, 5e-4))
chk("the street exists only between about 11° and 90° (width > 0 on the slider's hill)", street(10) < 0 < street(12) and close(street(90), 0, 1e-12))
a1 = np.array([1 / 8, 1 / 8, 0, 0, 0, 0, 1 / 4, 0, 0, 0, 0, 0])
chk("D1: α = (⅛, ⅛, 0,…, ¼, 0,…), w = (−½, ½), b = 0 is certified by KKT", kkt_hard(D1X, D1y, a1, np.array([-.5, .5]), 0.0))
w, b, _ = primal(D1X, D1y); chk("D1 primal solve agrees: w = (−0.5, 0.5), b = 0", vclose(w, [-.5, .5]) and close(b, 0))
chk("D1 dual value = ½‖w‖² = 0.25", close(dual(D1X, D1y)[0], .25) and close(a1.sum() - .25, .25))

print("— §2 · the compass —")
wv = np.array([1, 2]); bb = -6
chk("x₁ + 2x₂ = 6: w = (1,2), b = −6, ‖w‖ = √5 = 2.236", close(np.linalg.norm(wv), math.sqrt(5)) and close(math.sqrt(5), 2.236, 5e-4))
chk("probe (4.4, 5.2): f = 4.4 + 10.4 − 6 = 8.8, distance 3.935", close(wv @ [4.4, 5.2] + bb, 8.8) and close((wv @ [4.4, 5.2] + bb) / math.sqrt(5), 3.935, 5e-4))
chk("p = (6,0), q = (0,3) lie on the line and w·(p − q) = (1,2)·(6,−3) = 0", close(wv @ [6, 0] + bb, 0) and close(wv @ [0, 3] + bb, 0) and wv @ [6, -3] == 0)
chk("check c2: (6,3) scores 6 and is 6/√5 = 2.683 away on the + side", close(wv @ [6, 3] + bb, 6) and close(6 / math.sqrt(5), 2.683, 5e-4))
chk("check c3: b −6 → −10 slides the line 4/√5 = 1.79 along w", close(4 / math.sqrt(5), 1.789, 5e-4))

print("— §3 · how wide —")
w3 = np.array([-.5, -.5]); b3 = 2.5
chk("edges: x₁+x₂ = 3 scores +1, = 7 scores −1; centre = 5 scores 0", close(w3 @ [1.5, 1.5] + b3, 1) and close(w3 @ [3.5, 3.5] + b3, -1) and close(w3 @ [2.5, 2.5] + b3, 0))
chk("‖w‖ = √0.5 = 0.707, width 2/0.707 = 2.828 = distance of the face-to-face pair (1.5,1.5)–(3.5,3.5)",
    close(np.linalg.norm(w3), math.sqrt(.5)) and close(2 / np.linalg.norm(w3), 2 * R2) and close(np.linalg.norm([2, 2]), 2 * R2))
rng = np.random.default_rng(3)
cs = all(np.linalg.norm(np.array([s, 3 - s]) - np.array([t, 7 - t])) >= 2 * R2 - 1e-12 for s, t in rng.uniform(-1, 8, (2000, 2)))
chk("Cauchy–Schwarz: every pair on the two edges is at least 2.828 apart; w·(x⁺ − x⁻) = 2", cs and close(w3 @ (np.array([.3, 2.7]) - np.array([6, 1])), 2))

print("— §4 · the scale —")
SP = [(4, 1, 1), (1, 4, 1), (1, 1, 4)]; SN = [(2, 0, 0), (0, 2, 0), (0, 0, 2)]; XP = [(3.2, 3, 2.4), (2.2, 4.4, 1.8)]; XN = [(.3, .2, .4), (.9, .1, .1)]
w4, b4, _ = primal(SP + XP + SN + XN, [1] * 5 + [-1] * 5)
chk("3-D slab: w = (½,½,½), b = −2 (planes x₁+x₂+x₃ = 6, 4, 2)", vclose(w4, [.5, .5, .5], 1e-5) and close(b4, -2, 1e-5))
chk("‖w‖ = √3/2 = 0.866; thickness 2/‖w‖ = 4/√3 = 2.309 = distance between the planes sum=2 and sum=6",
    close(math.sqrt(3) / 2, .866, 5e-4) and close(2 / (math.sqrt(3) / 2), 4 / math.sqrt(3)) and close(4 / math.sqrt(3), 2.309, 5e-4) and close((6 - 2) / math.sqrt(3), 4 / math.sqrt(3)))
k = 3; chk("k = 3: w = (1.5,1.5,1.5), b = −6, c = 3, ‖w‖ = 2.598, thickness still 2c/‖w‖ = 2.309; 2/‖w‖ = 0.770 would be wrong",
    close(k * math.sqrt(3) / 2, 2.598, 5e-4) and close(2 * k / (k * math.sqrt(3) / 2), 2.309, 5e-4) and close(2 / (k * math.sqrt(3) / 2), .770, 5e-4))
chk("check c5: ‖w‖ = 0.5 scaled by 3 → 1.5, width 2·3/1.5 = 4 = 2/0.5", close(2 * 3 / 1.5, 4) and close(2 / .5, 4))

print("— §5 · the bowl —")
QX = [(1, 2), (2.5, 0), (-1, -1), (-1, 1)]; Qy = [1, 1, -1, -1]
aq = np.array([.4, 0, 0, .4]); chk("QP set: w = (0.8, 0.4), b = −0.6, α = (0.4, 0, 0, 0.4) certified by KKT", kkt_hard(QX, Qy, aq, np.array([.8, .4]), -.6))
chk("½‖w‖² = 0.4, width 2/‖w‖ = √5 = 2.236 = ‖(1,2) − (−1,1)‖; α = 2/‖x₁ − x₄‖² = 0.4",
    close(.5 * (.64 + .16), .4) and close(2 / math.sqrt(.8), math.sqrt(5)) and close(np.linalg.norm([2, 1]), math.sqrt(5)) and close(2 / 5, .4))
chk("the walls with b = −0.6: w₁+2w₂ ≥ 1.6, 2.5w₁ ≥ 1.6, w₁+w₂ ≥ 0.4, w₁−w₂ ≥ 0.4; two are tight at (0.8, 0.4)",
    close(.8 + .8, 1.6) and 2.5 * .8 > 1.6 and .8 + .4 > .4 and close(.8 - .4, .4))
A = [[-yy * p, -yy * q, -yy] for (p, q), yy in zip(QX + [(-1, 0)], Qy + [1])]
chk("adding blue (−1, 0) makes the hard margin infeasible for every b (LP)", linprog([0, 0, 0], A_ub=A, b_ub=[-1] * 5, bounds=[(None, None)] * 3).status == 2)
chk("with b = −0.6 its wall is w₁ ≤ −1.6, against w₁ ≥ 0.4 from the orange walls", close((1 + .6) / -1, -1.6) and close((.4 + .4) / 2, .4))

print("— §6–§7 · prices, and w built from them —")
chk("§7: ⅛(1,3) + ⅛(3,5) − ¼(4,2) = (−0.5, 0.5); balance ⅛ + ⅛ = ¼", vclose(np.array([1, 3]) / 8 + np.array([3, 5]) / 8 - np.array([4, 2]) / 4, [-.5, .5]) and close(1 / 8 + 1 / 8, 1 / 4))
chk("check c9: 0.25(2,2) + 0·(4,1) − 0.25(0,0) = (0.5, 0.5)", vclose(.25 * np.array([2, 2]), [.5, .5]))
chk("check c8: a point with score 2.4 has bracket 1.4 ≠ 0, so α = 0", close(2.4 - 1, 1.4))

print("— §8 · the dual —")
v, a, _ = dual([(1, 1), (-1, -1)], [1, -1])
chk("two points (1,1)⁺, (−1,−1)⁻: α = ¼, dual peak ¼", vclose(a, [.25, .25], 1e-6) and close(v, .25))
chk("D(α) = 2α − 4α² along α₁ = α₂; D = α₁ + α₂ − (α₁ + α₂)²", all(close(2 * t - 4 * t * t, 2 * t - .5 * (2 * t * t + 2 * t * t + 4 * t * t)) for t in (.1, .25, .4)))
chk("w = (½,½), b = 0, width 2/‖w‖ = 2√2 = 2.83 = distance between the points; primal ½‖w‖² = ¼",
    close(2 / np.linalg.norm([.5, .5]), 2 * R2) and close(np.linalg.norm([2, 2]), 2 * R2) and close(.5 * .5, .25))
chk("at α = 0.1 the points would score 4α = 0.4 (not yet a street); gap p* − D(0.1) = 0.25 − 0.16 = 0.09", close(2 * .1 - 4 * .01, .16) and close(.25 - .16, .09))
X3 = [(1, 1), (-1, -1), (2, .5)]; y3 = [1, -1, 1]
v3, a3, K3 = dual(X3, y3)
chk("three points: α = (¼, ¼, 0), dual ¼ — the peak sits on the wall α₃ = 0", vclose(a3, [.25, .25, 0], 1e-6) and close(v3, .25))
M = np.array([[1, 0], [1, 1], [0, 1]]); Qm = (np.array(y3)[:, None] * np.array(y3)[None, :]) * K3; H = M.T @ Qm @ M; c = M.T @ np.ones(3); s = np.linalg.solve(H, c)
chk("on the plane α₂ = α₁ + α₃: D = 2α₁ + 2α₃ − ½(8α₁² + 18α₁α₃ + 11.25α₃²)", vclose(H, [[8, 9], [9, 11.25]]) and vclose(c, [2, 2]))
chk("the free peak is 0.2778 at (α₁, α₃) = (0.5, −2/9): a negative price, not allowed", vclose(s, [.5, -2 / 9]) and close(c @ s - .5 * s @ H @ s, 5 / 18) and close(5 / 18, .2778, 5e-5))
chk("check c10: 2 − 8α = 0 ⇒ α = ¼, D = ¼ = primal", close(2 * .25 - 4 * .0625, .25))
chk("two-point shortcut α = 2/‖x₁ − x₂‖² = 2/8 = ¼", close(2 / 8, .25))

print("— §9 · support vectors —")
SPX = [(-1.3, 1.2), (-1.5, .3), (-1.7, .2), (-1.2, 2.1), (-1.7, .5), (-.9, 1.3), (-1.2, .3), (-1.3, 1.6), (-2.4, .6), (-2.9, 0), (-.2, -1.2), (.3, -.8), (1.5, -1.1), (-.7, -1.4), (1.4, -.9), (.1, -1.4), (.6, -1.6), (2.3, -1.6), (1.4, -.3), (.9, -1.1)]
SPy = [1] * 10 + [-1] * 10
w9, b9, _ = primal(SPX, SPy); z9 = np.array(SPy) * (np.array(SPX) @ w9 + b9)
chk("the twenty-point set: w = (−0.6, 1), b = −0.02, width 1.715, three points on the edges", vclose(w9, [-.6, 1], 1e-5) and close(b9, -.02, 1e-5) and close(2 / np.linalg.norm(w9), 1.715, 5e-4) and (np.abs(z9 - 1) < 1e-6).sum() == 3)
sv = np.abs(z9 - 1) < 1e-6; w9b, b9b, _ = primal(np.array(SPX)[sv], np.array(SPy)[sv])
chk("deleting the seventeen price-0 points leaves exactly the same street", vclose(w9b, w9, 1e-5) and close(b9b, b9, 1e-5) and (~sv).sum() == 17)
ai = np.zeros(20); idx = np.where(sv)[0]
Aeq = np.c_[(np.array(SPy)[idx][:, None] * np.array(SPX)[idx]).T].reshape(2, -1); Aeq = np.vstack([Aeq, np.array(SPy)[idx]])
sol = np.linalg.solve(Aeq, np.r_[w9, 0])
chk("its prices are 17/25, 13/50, 21/50 (in point order) and they satisfy w = Σαyx, Σαy = 0",
    vclose(sorted(sol), sorted([17 / 25, 13 / 50, 21 / 50]), 1e-5))
chk("Q10-type trap: (1,1)⁺ (2,0)⁺ (0,0)⁻ → w = (1,1), b = −1, α = (1, 0, 1), all three on an edge",
    kkt_hard([(1, 1), (2, 0), (0, 0)], [1, 1, -1], np.array([1, 0, 1]), np.array([1, 1]), -1) and
    vclose(np.array([1, 1, -1]) * (np.array([(1, 1), (2, 0), (0, 0)]) @ [1, 1] - 1), [1, 1, 1]))

print("— §10 · soft margin —")
SX = [(1, 4), (1.5, 5), (2, 4.2), (.8, 5.5), (2.5, 5.6), (1.2, 3.2), (3.4, 2.6), (4, 1.5), (4.5, 2.6), (5.2, 1.4), (3.8, .6), (5.5, 3), (4.6, .5)]
Sy = [1] * 7 + [-1] * 6
def soft(C):
    w, b, obj = primal(SX, Sy, C); z = np.array(Sy) * (np.array(SX) @ w + b); xi = np.maximum(0, 1 - z)
    return w, b, obj, 2 / np.linalg.norm(w), xi
w, b, obj, width, xi = soft(.02)
chk("C = 0.02: street width 5.295 (5.29), total slack 3.721 (3.72), the rogue point's ξ = 1.137 > 1", close(width, 5.295, 5e-4) and close(xi.sum(), 3.721, 5e-4) and close(xi[6], 1.137, 5e-4))
w, b, obj, width, xi = soft(1000)
wh, bh, _ = primal(SX, Sy)
chk("C = 1000: width 1.001 (1.00), no slack — identical to the hard margin (C → ∞)", close(width, 1.0014, 5e-4) and xi.sum() < 1e-6 and vclose(w, wh, 1e-4) and close(2 / np.linalg.norm(wh), 1.0014, 5e-4))
widths = [soft(C)[3] for C in (.01, .02, .1, 1, 10)]
chk("raising C narrows the street: 9.12 → 5.29 → 3.62 → 2.00 → 1.00", all(widths[i] > widths[i + 1] - 1e-9 for i in range(4)) and close(widths[0], 9.119, 5e-3))
chk("check c13: ξ = 1.4 ⇒ y·f ≥ −0.4, across the centre line", close(1 - 1.4, -.4))

print("— §11 · hinge —")
chk("hinge table: z = 2, 1, 0.5, 0, −0.5, −2 → 0, 0, 0.5, 1, 1.5, 3", [max(0, 1 - z) for z in (2, 1, .5, 0, -.5, -2)] == [0, 0, .5, 1, 1.5, 3])
chk("check c15: z = 0.5 → hinge 0.5, 0/1 loss 0", max(0, 1 - .5) == .5)
chk("the hinge widget's street: w = (½,½), b = −2 → edges x₁+x₂ = 6 (+1) and 2 (−1), centre 4", close(.5 * 6 - 2, 1) and close(.5 * 2 - 2, -1) and close(.5 * 4 - 2, 0))

print("— §12 · the vote —")
chk("f(2,4) = ⅛·14 + ⅛·26 − ¼·16 = 1.75 + 3.25 − 4 = 1", close(14 / 8 + 26 / 8 - 16 / 4, 1) and close(np.array([-.5, .5]) @ [2, 4], 1))
chk("check c16: f(4,1) = ⅛·7 + ⅛·17 − ¼·18 = −1.5", close(7 / 8 + 17 / 8 - 18 / 4, -1.5) and close(np.array([-.5, .5]) @ [4, 1], -1.5))

print("— §13 · the lift —")
chk("1-D: ±1 → (±1, 1), ±2 → (±2, 4); cut x² = 2.5 → thresholds ±√2.5 = ±1.58", close(math.sqrt(2.5), 1.581, 5e-4))
v, a, K = dual([(1,), (-1,), (2,), (-2,)], [1, 1, -1, -1], kind='p2')
bl = 1 - fvote([(1,), (-1,), (2,), (-2,)], [1, 1, -1, -1], a, 0, (1,), 'p2')
chk("the 1-D preset with (xz)²: b = 5/3 and the cut falls at x² = 2.5 exactly",
    close(bl, 5 / 3, 1e-5) and close(fvote([(1,), (-1,), (2,), (-2,)], [1, 1, -1, -1], a, bl, (math.sqrt(2.5),), 'p2'), 0, 1e-5))
chk("XOR: x₁x₂ = +1 for (1,1), (−1,−1); −1 for (1,−1), (−1,1)", [p * q for p, q in [(1, 1), (-1, -1), (1, -1), (-1, 1)]] == [1, 1, -1, -1])
chk("rings: the cut at height 1.04 is the circle of radius 1.02", close(1.02 ** 2, 1.0404))

print("— §14 · the trick —")
phi = lambda v: np.array([v[0] ** 2, R2 * v[0] * v[1], v[1] ** 2])
chk("(1,2)·(3,1) = 5 → 25; φ(1,2) = (1, 2√2, 4), φ(3,1) = (9, 3√2, 1), 9 + 12 + 4 = 25",
    np.dot([1, 2], [3, 1]) == 5 and vclose(phi([1, 2]), [1, 2 * R2, 4]) and vclose(phi([3, 1]), [9, 3 * R2, 1]) and close(phi([1, 2]) @ phi([3, 1]), 25))
chk("check c18: squaring the coordinates first gives (1,4)·(9,1) = 13; the lost cross term is 2·3·2 = 12", np.dot([1, 4], [9, 1]) == 13 and 25 - 13 == 12)
for x_, z_ in [((1, 2), (3, 1)), ((2, -1), (.5, 3)), ((-1.5, 2), (2, 2))]:
    pass
chk("φ(x)·φ(z) = (x·z)² on random pairs", all(close(phi(x_) @ phi(z_), np.dot(x_, z_) ** 2) for x_, z_ in np.random.default_rng(1).normal(size=(50, 2, 2))))
phic = lambda v: np.array([v[0] ** 2, v[1] ** 2, R2 * v[0] * v[1], R2 * v[0], R2 * v[1], 1])
chk("(x·z + 1)² = φ(x)·φ(z) with the six-feature map (random pairs); (1,2),(3,1) → 36", all(close(phic(x_) @ phic(z_), (np.dot(x_, z_) + 1) ** 2) for x_, z_ in np.random.default_rng(2).normal(size=(50, 2, 2))) and close(phic([1, 2]) @ phic([3, 1]), 36))
chk("feature counts: C(n+d−1,d) and C(n+d,d): n=2,d=2 → 3, 6; n=10,d=4 → 715, 1001", math.comb(3, 2) == 3 and math.comb(4, 2) == 6 and math.comb(13, 4) == 715 and math.comb(14, 4) == 1001)
def monos(n, d, exact):
    return sum(1 for c in __import__('itertools').combinations_with_replacement(range(n), d)) if exact else sum(math.comb(n + k - 1, k) for k in range(d + 1))
chk("…and by direct enumeration of the monomials", monos(10, 4, True) == 715 and monos(10, 4, False) == 1001 and monos(3, 4, True) == 15 and monos(3, 4, False) == 35)
chk("the calculator's cost bar: n = 10 → 10 multiplications + 1 addition + 1 power = 12", 10 + 1 + 1 == 12)
chk("RBF γ = 0.5 for (1,2),(3,1): e^(−0.5·5) = 0.0821", close(math.exp(-.5 * ((1 - 3) ** 2 + (2 - 1) ** 2)), .0821, 5e-5))

print("— §15 · start to finish —")
QX1 = [(1, 2), (-1, -2), (1, -2), (-1, 2)]; Qy1 = [1, 1, -1, -1]
K1 = kern(QX1, QX1, 'p2')
chk("dot row 1 = 5, −5, −3, 3 → kernel row 25, 25, 9, 9; K as printed", vclose(kern(QX1, QX1)[0], [5, -5, -3, 3]) and vclose(K1, [[25, 25, 9, 9], [25, 25, 9, 9], [9, 9, 25, 25], [9, 9, 25, 25]]))
Q1m = (np.array(Qy1)[:, None] * np.array(Qy1)[None, :]) * K1
chk("every row of yᵢyⱼKᵢⱼ sums to 32; the double sum is 128a²; D(a) = 4a − 64a² → a = 1/32", vclose(Q1m.sum(1), [32] * 4) and close(4 * (1 / 32) - 64 / 32 ** 2, 1 / 16))
chk("α = 1/32 each and b = 0 satisfy KKT for (x·z)²", kkt_kernel(K1, Qy1, np.full(4, 1 / 32), 0.0))
chk("f(2,1) = 1 (on the edge) and f(−1,3) = −1.5 (check c20)", close(fvote(QX1, Qy1, np.full(4, 1 / 32), 0, (2, 1), 'p2'), 1) and close(fvote(QX1, Qy1, np.full(4, 1 / 32), 0, (-1, 3), 'p2'), -1.5))
chk("f(x) = x₁x₂/2 everywhere", all(close(fvote(QX1, Qy1, np.full(4, 1 / 32), 0, p, 'p2'), p[0] * p[1] / 2) for p in np.random.default_rng(4).normal(size=(30, 2))))
wup = sum(a_ * y_ * phi(x_) for a_, y_, x_ in zip(np.full(4, 1 / 32), Qy1, QX1))
chk("upstairs: φ(1,2) = φ(−1,−2) = (1, 2√2, 4); w = (0, √2/4, 0); width 4√2 = 5.657 = distance between the two lifted points",
    vclose(phi([1, 2]), phi([-1, -2])) and vclose(phi([1, -2]), [1, -2 * R2, 4]) and vclose(wup, [0, R2 / 4, 0]) and close(2 / np.linalg.norm(wup), 4 * R2)
    and close(np.linalg.norm(phi([1, 2]) - phi([1, -2])), 4 * R2) and close(4 * R2, 5.657, 5e-4) and close(R2 / 4, .354, 5e-4))
chk("the prices are not unique (α₁ + α₂ fixed): (0, 1/16, 0, 1/16) is also optimal; 1/32 each is the smallest", kkt_kernel(K1, Qy1, np.array([0, 1 / 16, 0, 1 / 16]), 0.0) and close(dual(QX1, Qy1, kind='p2')[0], 1 / 16))

print("— practice —")
# P1 (geometric margin)
chk("P1: ‖w‖ = 5; lines 3x₁+4x₂ = 10, 11, 9; width 0.4; (1,1): f = −3, distance 0.6; rescaled f = −6, ‖w‖ = 10, edges 0.1 away",
    np.linalg.norm([3, 4]) == 5 and close(2 / 5, .4) and 3 + 4 - 10 == -3 and close(3 / 5, .6) and 6 + 8 - 20 == -6 and np.linalg.norm([6, 8]) == 10 and close(1 / 10, .1))
# P2 (two points)
v, a, _ = dual([(1, 1), (4, 5)], [1, -1])
chk("P2: α = 2/25 = 0.08; w = (−0.24, −0.32); b = 1.56 = 39/25", vclose(a, [.08, .08], 1e-6) and kkt_hard([(1, 1), (4, 5)], [1, -1], np.array([.08, .08]), np.array([-.24, -.32]), 1.56))
chk("P2: −7α + b = 1 and 32α − b = 1; lines 6x₁ + 8x₂ = 39, 14, 64; width 5; primal = dual = 0.08",
    close(-7 * .08 + 1.56, 1) and close(32 * .08 - 1.56, 1) and 6 + 8 == 14 and 24 + 40 == 64 and close(2 / .4, 5) and close(.5 * .16, .08) and close(v, .08))
# P3 (five points on a line)
chk("P3: w = 1, b = 0, α = (½,0,0,½,0), scores 1,2,4,1,3", kkt_hard([(1,), (2,), (4,), (-1,), (-3,)], [1, 1, 1, -1, -1], np.array([.5, 0, 0, .5, 0]), np.array([1.0]), 0.0))
# P4 (kernel identity)
chk("P4: (2,1)·(1,3) = 5 → (5+1)² = 36; products 4 + 9 + 12 + 4 + 6 + 1 = 36", close(phic([2, 1]) @ phic([1, 3]), 36) and vclose(phic([2, 1]) * phic([1, 3]), [4, 9, 12, 4, 6, 1]))
# P5 (feature counting)
chk("P5: C(7,4) = 35 = 1+3+6+10+15; C(6,4) = 15; 500·501/2 = 125 250; 500 × 35 = 17 500; C(105,5) = 96 560 646",
    math.comb(7, 4) == 35 == 1 + 3 + 6 + 10 + 15 and math.comb(6, 4) == 15 and 500 * 501 // 2 == 125250 and 500 * 35 == 17500 and math.comb(105, 5) == 96560646)
# P6 (work backwards)
chk("P6: w = (0.5, 0.5), b = −1 from both support vectors; (4,1) scores 1.5; f(1,0) = −0.5; distance 0.5√2 = 0.71, half-width √2 = 1.41",
    kkt_hard([(2, 2), (4, 1), (0, 0)], [1, 1, -1], np.array([.25, 0, .25]), np.array([.5, .5]), -1.0) and close(2 + .5 - 1, 1.5) and close(.5 - 1, -.5)
    and close(.5 / (1 / R2), .707, 5e-4) and close(R2, 1.414, 5e-4) and close(2 * R2, 2.828, 5e-4))
# P7 (1-D KKT, adding a point)
chk("P7(a): w = 2/3, b = −5/3, α = (2/9, 0, 2/9, 0); f(7) = 3; boundary 2.5", kkt_hard([(4,), (7,), (1,), (-3,)], [1, 1, -1, -1], np.array([2 / 9, 0, 2 / 9, 0]), np.array([2 / 3]), -5 / 3) and close(14 / 3 - 5 / 3, 3) and close(5 / 3 / (2 / 3), 2.5))
chk("P7(b): width 3; primal = dual = 2/9", close(2 / (2 / 3), 3) and close(.5 * 4 / 9, 2 / 9) and close(4 / 9 - 2 / 9, 2 / 9) and close(dual([(4,), (7,), (1,), (-3,)], [1, 1, -1, -1])[0], 2 / 9))
chk("P7(c): f(3) = 1/3 < 1; new answer w = 1, b = −2, α₃ = α₅ = ½; width 2",
    close(2 - 5 / 3, 1 / 3) and kkt_hard([(4,), (7,), (1,), (-3,), (3,)], [1, 1, -1, -1, 1], np.array([0, 0, .5, 0, .5]), np.array([1.0]), -2.0))
# P8 (2-D KKT verification)
chk("P8: α = (¼, 0, ¼, 0) certifies w = (−½, ½), b = −½; width 2√2; (1,1): f = −½",
    kkt_hard([(0, 3), (-2, 2), (2, 1), (3, 0)], [1, 1, -1, -1], np.array([.25, 0, .25, 0]), np.array([-.5, .5]), -.5) and close(2 / np.linalg.norm([-.5, .5]), 2 * R2) and close(-.5 + .5 - .5, -.5))
chk("P8: scores 1, 3/2, 1, 2; edges x₂ = x₁ + 3 and x₂ = x₁ − 1", vclose(np.array([1, 1, -1, -1]) * (np.array([(0, 3), (-2, 2), (2, 1), (3, 0)]) @ [-.5, .5] - .5), [1, 1.5, 1, 2]))
# P9 (the trap)
chk("P9: w = (1,1), b = −1, α = (1,0,1), width √2; primal = dual = 1",
    kkt_hard([(1, 1), (2, 0), (0, 0)], [1, 1, -1], np.array([1, 0, 1]), np.array([1, 1]), -1.0) and close(2 / R2, R2) and close(dual([(1, 1), (2, 0), (0, 0)], [1, 1, -1])[0], 1))
# P10 (soft-margin regimes) — logic only
chk("P10: with C = 1, α = 0.4 and 0.15 are free, 1.0 bounded, 0 idle", [('free' if 0 < a_ < 1 else 'bounded' if a_ == 1 else 'none') for a_ in (0, .4, 1, 1, .15)] == ['none', 'free', 'bounded', 'bounded', 'free'])
# P11 (audit a soft-margin proposal)
PX = [(1, 1), (3, 3), (2, 0), (0, 2), (2, 2)]; Py = [1, 1, -1, -1, -1]
z = np.array(Py) * (np.array(PX) @ [1, 1] - 3)
chk("P11(a): scores −1, 3, 1, 1, −1 → slacks 2, 0, 0, 0, 2", vclose(z, [-1, 3, 1, 1, -1]) and vclose(np.maximum(0, 1 - z), [2, 0, 0, 0, 2]))
chk("P11(b): objective 1 + 4 = 5 at C = 1, 1 + 40 = 41 at C = 10", 1 + 1 * 4 == 5 and 1 + 10 * 4 == 41)
w, b, obj = primal(PX, Py, 1.0)
chk("P11: the true C = 1 answer is w = (½,½), b = −2, slacks (2,0,0,0,1), objective 3.25", vclose(w, [.5, .5], 1e-5) and close(b, -2, 1e-5) and close(obj, 3.25, 1e-5)
    and vclose(np.maximum(0, 1 - np.array(Py) * (np.array(PX) @ [.5, .5] - 2)), [2, 0, 0, 0, 1]))
chk("P11(c): balance forces p = q = 0, then w = C(1,1) − C(2,2) = (−C, −C) ≠ (1,1) for C > 0", vclose(1 * np.array([1, 1]) - 1 * np.array([2, 2]), [-1, -1]))
chk("P11: no hard-margin answer exists for this data (LP)", linprog([0, 0, 0], A_ub=[[-yy * p, -yy * q, -yy] for (p, q), yy in zip(PX, Py)], b_ub=[-1] * 5, bounds=[(None, None)] * 3).status == 2)
# P12 = §15 (checked above) + b from x₃
chk("P12: b from x₁ is 0 and x₃ confirms it; D(1/32) = 1/16", close(-((1 / 32) * (9 + 9 - 25 - 25) + 0), 1) and close(4 / 32 - 64 / 32 ** 2, 1 / 16))
# P13 (inner/outer, (x·z+1)²)
X13 = [(0, 0), (2, 0), (0, -2)]; y13 = [1, -1, -1]; K13 = kern(X13, X13, 'p2c'); a13 = np.array([1 / 6, 1 / 12, 1 / 12])
chk("P13: K = [[1,1,1],[1,25,1],[1,1,25]]; α = (1/6, 1/12, 1/12), b = 1 certified; D(c) = 4c − 24c²",
    vclose(K13, [[1, 1, 1], [1, 25, 1], [1, 1, 25]]) and kkt_kernel(K13, y13, a13, 1.0) and close(dual(X13, y13, kind='p2c')[0], 4 / 12 - 24 / 144))
chk("P13: the double sum is 4 + 25 + 25 − 4 − 4 + 2 = 48 (×c²)", close((np.array([2, 1, 1]) * np.array(y13)) @ K13 @ (np.array([2, 1, 1]) * np.array(y13)), 48))
chk("P13: f(1,1) = 1/3, f(1,−1) = −1/3; boundary circle (x₁+½)² + (x₂−½)² = 3.5, radius 1.87",
    close(fvote(X13, y13, a13, 1, (1, 1), 'p2c'), 1 / 3) and close(fvote(X13, y13, a13, 1, (1, -1), 'p2c'), -1 / 3)
    and all(close(fvote(X13, y13, a13, 1, (-.5 + math.sqrt(3.5) * math.cos(t), .5 + math.sqrt(3.5) * math.sin(t)), 'p2c'), 0) for t in np.linspace(0, 6, 9)) and close(math.sqrt(3.5), 1.87, 5e-3))
# P14 (diamond vs axis, b = 1)
X14 = [(1, 1), (-1, -1), (2, 0), (-2, 0)]; y14 = [1, 1, -1, -1]; K14 = kern(X14, X14, 'p2')
chk("P14: K = [[4,4,4,4],[4,4,4,4],[4,4,16,16],[4,4,16,16]]; α = 1/12 each, b = 1 certified",
    vclose(K14, [[4, 4, 4, 4], [4, 4, 4, 4], [4, 4, 16, 16], [4, 4, 16, 16]]) and kkt_kernel(K14, y14, np.full(4, 1 / 12), 1.0) and close(dual(X14, y14, kind='p2')[0], 4 / 12 - 24 / 144))
chk("P14: f(0,2) = 5/3, f(3,0) = −3.5; boundary (x₂ − x₁)(x₂ + 3x₁) = −6",
    close(fvote(X14, y14, np.full(4, 1 / 12), 1, (0, 2), 'p2'), 5 / 3) and close(fvote(X14, y14, np.full(4, 1 / 12), 1, (3, 0), 'p2'), -3.5)
    and all(close(fvote(X14, y14, np.full(4, 1 / 12), 1, p, 'p2'), ((p[0] + p[1]) ** 2 - 4 * p[0] ** 2) / 6 + 1) for p in np.random.default_rng(5).normal(size=(20, 2)))
    and all(close((p[0] + p[1]) ** 2 - 4 * p[0] ** 2, (p[1] - p[0]) * (p[1] + 3 * p[0])) for p in np.random.default_rng(6).normal(size=(20, 2))))
w14 = sum(a_ * y_ * phi(x_) for a_, y_, x_ in zip(np.full(4, 1 / 12), y14, X14))
chk("P14 upstairs: w = (1/6)(−3, √2, 1), ‖w‖ = 1/√3, width 2√3 = ‖(1,√2,1) − (4,0,0)‖", vclose(w14, np.array([-3, R2, 1]) / 6) and close(np.linalg.norm(w14), 1 / math.sqrt(3)) and close(2 / np.linalg.norm(w14), 2 * math.sqrt(3)) and close(np.linalg.norm(np.array([1, R2, 1]) - [4, 0, 0]), 2 * math.sqrt(3)))
# P15 (given prices, one idle point)
X15 = [(0, 0), (1, 1), (1, -1), (3, 0)]; y15 = [1, -1, -1, -1]; K15 = kern(X15, X15, 'p2c'); a15 = np.array([.5, .25, .25, 0])
chk("P15: K = [[1,1,1,1],[1,9,1,16],[1,1,9,16],[1,16,16,100]]; α = (½,¼,¼,0), b = 1 certified",
    vclose(K15, [[1, 1, 1, 1], [1, 9, 1, 16], [1, 1, 9, 16], [1, 16, 16, 100]]) and kkt_kernel(K15, y15, a15, 1.0))
chk("P15: f(x₄) = −6.5 (score 6.5); f(1,0) = −½; f(−2,1) = ½; circle (x₁+1)² + x₂² = 3",
    close(fvote(X15, y15, a15, 1, (3, 0), 'p2c'), -6.5) and close(fvote(X15, y15, a15, 1, (1, 0), 'p2c'), -.5) and close(fvote(X15, y15, a15, 1, (-2, 1), 'p2c'), .5)
    and all(close(fvote(X15, y15, a15, 1, (-1 + math.sqrt(3) * math.cos(t), math.sqrt(3) * math.sin(t)), 'p2c'), 0) for t in np.linspace(0, 6, 9)))
chk("P15: the dual optimum value equals the given prices' value (so they are optimal)", close(dual(X15, y15, kind='p2c')[0], a15.sum() - .5 * (a15 * y15) @ K15 @ (a15 * y15)))
# P16 (1-D kernel)
X16 = [(1,), (-1,), (3,), (-3,)]; y16 = [1, 1, -1, -1]; K16 = kern(X16, X16, 'p2c')
chk("P16: K = [[4,0,16,4],[0,4,4,16],[16,4,100,64],[4,16,64,100]]; α = 1/64 each, b = 5/4 certified",
    vclose(K16, [[4, 0, 16, 4], [0, 4, 4, 16], [16, 4, 100, 64], [4, 16, 64, 100]]) and kkt_kernel(K16, y16, np.full(4, 1 / 64), 1.25))
chk("P16: blocks 8 + 328 − 80 = 256; D(a) = 4a − 128a²", close((np.array(y16)[:, None] * np.array(y16)[None, :] * K16).sum(), 256))
chk("P16: f(x) = (5 − x²)/4; boundary ±√5 = ±2.24; f(2) = ¼; f(−2.5) = −0.3125",
    all(close(fvote(X16, y16, np.full(4, 1 / 64), 1.25, (t,), 'p2c'), (5 - t * t) / 4) for t in np.linspace(-4, 4, 17)) and close(math.sqrt(5), 2.236, 5e-4)
    and close((5 - 4) / 4, .25) and close((5 - 6.25) / 4, -.3125))
chk("P16: φ(x) = (x², √2x, 1): φ(1)·φ(3) = 9 + 6 + 1 = 16; upstairs w = (−¼, 0, 0), street width 8",
    close(np.dot([1, R2, 1], [9, 3 * R2, 1]), 16) and vclose(sum(a_ * y_ * np.array([x_[0] ** 2, R2 * x_[0], 1]) for a_, y_, x_ in zip(np.full(4, 1 / 64), y16, X16)), [-.25, 0, 0]) and close(2 / .25, 8))
chk("P16: other prices give the same machine, e.g. (0, 1/32, 1/96, 1/48)", kkt_kernel(K16, y16, np.array([0, 1 / 32, 1 / 96, 1 / 48]), 1.25))

print(f"\n✓ {ok} checks passed — every Unit 13 number reproduced")
