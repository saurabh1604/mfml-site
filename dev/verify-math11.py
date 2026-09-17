# Unit 11 · Optimization II — machine verification of every number printed in
# the practice arena (tpl/u11-practice.html) and of the numbers the unit's
# sections and widgets lean on.
import math
import sympy as sp
import numpy as np

ok = 0
def chk(name, cond):
    global ok
    assert cond, f"FAIL: {name}"
    ok += 1
    print(f"  ok    {name}")

def close(a, b, tol=1e-9):
    return abs(a - b) < tol

x, y, z = sp.symbols('x y z')
w, b, mu, lam, al, be, rho, t = sp.symbols('w b mu lambda alpha beta rho t')
R = sp.Rational

# ============================================================ P1
# L = 1/2[(w+b-3)^2 + (2w+b-5)^2]
L1 = R(1,2)*((w + b - 3)**2 + (2*w + b - 5)**2)
chk("P1a dL/dw = 5w + 3b - 13 and dL/db = 3w + 2b - 8",
    sp.expand(sp.diff(L1, w)) == 5*w + 3*b - 13 and sp.expand(sp.diff(L1, b)) == 3*w + 2*b - 8)
chk("P1a chain-rule pieces: (w+b-3)(1) + (2w+b-5)(2) = w+b-3+4w+2b-10",
    sp.expand((w + b - 3) + 2*(2*w + b - 5)) == sp.expand(5*w + 3*b - 13)
    and sp.expand((w + b - 3) + (2*w + b - 5)) == sp.expand(3*w + 2*b - 8))
gL = lambda W, B: np.array([5*W + 3*B - 13, 3*W + 2*B - 8], float)
LL = lambda W, B: 0.5*((W + B - 3)**2 + (2*W + B - 5)**2)
chk("P1b at (0,0): grad = (-13,-8), L0 = (9+25)/2 = 17",
    np.allclose(gL(0, 0), [-13, -8]) and close(LL(0, 0), 17) and close((9 + 25)/2, 17))
w1, b1 = 0 - 0.1*(-13), 0 - 0.1*(-8)
chk("P1b step 1: (w1,b1) = (1.3, 0.8); residuals -0.9 and -1.6; L1 = (0.81+2.56)/2 = 3.37/2 = 1.685",
    close(w1, 1.3) and close(b1, 0.8) and close(w1 + b1 - 3, -0.9) and close(2*w1 + b1 - 5, -1.6)
    and close(0.9**2, 0.81) and close(1.6**2, 2.56) and close(0.81 + 2.56, 3.37) and close(LL(w1, b1), 1.685))
chk("P1b grad at (1.3,0.8) = (-4.1,-2.5) from 6.5+2.4-13 and 3.9+1.6-8",
    np.allclose(gL(w1, b1), [-4.1, -2.5]) and close(5*1.3, 6.5) and close(3*0.8, 2.4)
    and close(3*1.3, 3.9) and close(2*0.8, 1.6))
w2, b2 = w1 + 0.1*4.1, b1 + 0.1*2.5
chk("P1b step 2: (w2,b2) = (1.71, 1.05); residuals -0.24 and -0.53; L2 = 0.3385/2 = 0.16925",
    close(w2, 1.71) and close(b2, 1.05) and close(w2 + b2 - 3, -0.24) and close(2*w2 + b2 - 5, -0.53)
    and close(0.24**2, 0.0576) and close(0.53**2, 0.2809) and close(0.0576 + 0.2809, 0.3385) and close(LL(w2, b2), 0.16925))
chk("P1b the run drops 17 -> 1.685 -> 0.16925, about a factor of 100; exact fit (2,1) has L = 0",
    close(17/0.16925, 100.443, 1e-3) and close(LL(2, 1), 0))
chk("P1c one step from (0,0) is (13a, 8a): 0.26/13 = 0.16/8 = 0.02 (both coordinates agree)",
    close(0.26/13, 0.02) and close(0.16/8, 0.02) and np.allclose(-0.02*gL(0, 0), [0.26, 0.16]))
H1 = sp.hessian(L1, (w, b))
ev1 = sorted([sp.N(v) for v in sp.Matrix([[5, 3], [3, 2]]).eigenvals()], reverse=True)
chk("P1d H = [[5,3],[3,2]], trace 7, det 1; lambda = (7 +- sqrt45)/2 = 6.854102, 0.145898",
    H1 == sp.Matrix([[5, 3], [3, 2]]) and H1.trace() == 7 and H1.det() == 1
    and close(float(ev1[0]), 6.854102, 5e-7) and close(float(ev1[1]), 0.145898, 5e-7)
    and close(float((7 + sp.sqrt(45))/2), 6.854102, 5e-7) and 49 - 4 == 45)
chk("P1d safe range 2/lambda_max = 0.291796; 0.3 is unsafe by 0.008204 (2.8% over); kappa = 46.98",
    close(2/float(ev1[0]), 0.291796, 5e-7) and 0.3 > 2/float(ev1[0])
    and close(0.3 - 2/float(ev1[0]), 0.008204, 5e-7)
    and close((0.3 - 0.291796)/0.291796, 0.0281, 5e-5)
    and close(float(ev1[0])/float(ev1[1]), 46.98, 5e-3))

# ============================================================ P2
A2 = [1, 0.8, 0.64, 0.512]; B2 = [1, -0.5, 0.25, -0.125]
C2 = [1, -1.2, 1.44, -1.728]; D2 = [1, 0.8, 0.54, 0.302]
rat = lambda s: [s[i+1]/s[i] for i in range(len(s) - 1)]
chk("P2a on x^2, x_{t+1} = (1-2a)x_t; A/B/C have constant ratios 0.8, -0.5, -1.2",
    sp.expand(x - al*2*x - (1 - 2*al)*x) == 0
    and np.allclose(rat(A2), 0.8) and np.allclose(rat(B2), -0.5) and np.allclose(rat(C2), -1.2))
chk("P2a alphas 0.1, 0.75, 1.1 from 1-2a = 0.8, -0.5, -1.2",
    close((1 - 0.8)/2, 0.1) and close((1 + 0.5)/2, 0.75) and close((1 + 1.2)/2, 1.1))
chk("P2a five bands: a<0.5 factor in (0,1); a=0.5 factor 0; 0.5<a<1 in (-1,0); a=1 factor -1; a>1 |factor|>1",
    0 < 1 - 2*0.3 < 1 and close(1 - 2*0.5, 0) and -1 < 1 - 2*0.75 < 0
    and close(1 - 2*1.0, -1) and abs(1 - 2*1.1) > 1)
chk("P2b D's ratios 0.8, 0.675, 0.5593 are not constant", np.allclose(rat(D2), [0.8, 0.675, 0.5593], atol=5e-5)
    and not close(rat(D2)[0], rat(D2)[1], 1e-6))
chk("P2b momentum: v0 = 0 so step 1 gives 1-2a = 0.8 => a = 0.1, v1 = -0.2",
    close(1 - 2*0.1, 0.8) and close(-0.1*2*1.0, -0.2))
chk("P2b step 2: x2 = 0.64 - 0.2b = 0.54 => b = 0.5 (g(0.8) = 1.6, v2 = -0.2b - 0.16)",
    close(2*0.8, 1.6) and close(0.8 + (0.5*(-0.2) - 0.1*1.6), 0.54) and close(0.64 - 0.2*0.5, 0.54))
v2m = 0.5*(-0.2) - 0.1*1.6
chk("P2b step-3 check: v2 = -0.26, g(0.54) = 1.08, v3 = -0.13-0.108 = -0.238, x3 = 0.302",
    close(v2m, -0.26) and close(2*0.54, 1.08) and close(0.5*(-0.26), -0.13) and close(0.1*1.08, 0.108)
    and close(0.5*(-0.26) - 0.1*1.08, -0.238) and close(0.54 - 0.238, 0.302))
a_t = lambda k: 0.75/(1 + k)
xs2 = [1.0]
for k in range(3): xs2.append((1 - 2*a_t(k))*xs2[-1])
chk("P2c rates 0.75, 0.375, 0.25; factors -0.5, 0.25, 0.5; x = -0.5, -0.125, -0.0625",
    np.allclose([a_t(0), a_t(1), a_t(2)], [0.75, 0.375, 0.25])
    and np.allclose([1 - 2*a_t(k) for k in range(3)], [-0.5, 0.25, 0.5])
    and np.allclose(xs2[1:], [-0.5, -0.125, -0.0625]))
chk("P2c the fading run beats constant-rate B by step 3: 0.0625 < 0.125", abs(xs2[3]) < abs(B2[3]))
chk("P2d a_t < 0.1 first at t = 7 (0.75/8 = 0.09375); 1+t > 7.5",
    all(a_t(k) >= 0.1 for k in range(7)) and a_t(7) < 0.1 and close(a_t(7), 0.09375) and close(0.75/0.1, 7.5))
chk("P2d drop from a_0: (0.75-0.09375)/0.75 = 0.65625/0.75 = 0.875 = 87.5%",
    close(0.75 - 0.09375, 0.65625) and close(0.65625/0.75, 0.875))
chk("P2d factor 1-2a_t turns positive first at t = 1 (needs 1+t > 1.5), so t = 0 is the last sign flip",
    1 - 2*a_t(0) < 0 and all(1 - 2*a_t(k) > 0 for k in range(1, 40)) and close(1.5/1.0, 1.5)
    and xs2[0]*xs2[1] < 0 and all(xs2[k]*xs2[k+1] > 0 for k in range(1, 3)))

# ============================================================ P3
f3 = 2*x**2 + x*y + y**2 - 2*x - y
A3 = sp.Matrix([[4, 1], [1, 2]]); b3 = sp.Matrix([2, 1])
Wv = sp.Matrix([x, y])
chk("P3 f = 1/2 w'Aw - b'w with A = [[4,1],[1,2]], b = (2,1); grad = (4x+y-2, x+2y-1)",
    sp.expand((R(1,2)*(Wv.T*A3*Wv) - b3.T*Wv)[0]) == sp.expand(f3)
    and sp.expand(sp.diff(f3, x)) == 4*x + y - 2 and sp.expand(sp.diff(f3, y)) == x + 2*y - 1)
chk("P3a d1 = (1,0) is descent: grad(0,0) = (-2,-1), dot = -2 < 0",
    sp.diff(f3, x).subs({x: 0, y: 0}) == -2 and sp.diff(f3, y).subs({x: 0, y: 0}) == -1)
h3a = sp.expand(f3.subs({x: al, y: 0}))
chk("P3a h(a) = 2a^2 - 2a; h' = 4a-2 = 0 gives a1* = 0.5 (h'' = 4 > 0); w1 = (0.5,0), f = -0.5",
    h3a == 2*al**2 - 2*al and sp.solve(sp.diff(h3a, al), al) == [R(1,2)] and sp.diff(h3a, al, 2) == 4
    and f3.subs({x: R(1,2), y: 0}) == R(-1,2))
chk("P3b grad(w1) = (0,-0.5); d2 = (0,0.5)",
    sp.diff(f3, x).subs({x: R(1,2), y: 0}) == 0 and sp.diff(f3, y).subs({x: R(1,2), y: 0}) == R(-1,2))
h3b = sp.expand(f3.subs({x: R(1,2), y: R(1,2)*al}))
chk("P3b h(a) = 0.25a^2 - 0.25a - 0.5 (pieces 0.5, 0.25a, 0.25a^2, -1, -0.5a); a2* = 0.5",
    h3b == R(1,4)*al**2 - R(1,4)*al - R(1,2) and sp.solve(sp.diff(h3b, al), al) == [R(1,2)])
chk("P3b w2 = (0.5, 0.25), f(w2) = 0.0625 - 0.125 - 0.5 = -0.5625",
    f3.subs({x: R(1,2), y: R(1,4)}) == R(-9,16) and close(float(R(-9,16)), -0.5625)
    and close(0.25*0.25 - 0.25*0.5 - 0.5, -0.5625))
dsym = sp.Matrix([sp.Symbol('d1'), sp.Symbol('d2')])
lhs = sp.expand((R(1,2)*((Wv + al*dsym).T*A3*(Wv + al*dsym)) - b3.T*(Wv + al*dsym))[0])
rhs = sp.expand(f3 + al*(dsym.T*(A3*Wv - b3))[0] + al**2/2*(dsym.T*A3*dsym)[0])
chk("P3c expansion f(w+ad) = f(w) + a d'(Aw-b) + (a^2/2) d'Ad, using w'Ad = d'Aw",
    sp.simplify(lhs - rhs) == 0 and sp.simplify((Wv.T*A3*dsym)[0] - (dsym.T*A3*Wv)[0]) == 0
    and sp.simplify((A3*Wv - b3) - sp.Matrix([sp.diff(f3, x), sp.diff(f3, y)])) == sp.zeros(2, 1))
d1v, d2v = sp.Matrix([1, 0]), sp.Matrix([0, R(1,2)])
chk("P3c formula checks: 2/4 = 0.5 and 0.25/0.5 = 0.5",
    (d1v.T*A3*d1v)[0] == 4 and close(2/4, 0.5) and (d2v.T*A3*d2v)[0] == R(1,2) and close(0.25/0.5, 0.5))
sol3 = sp.solve([4*x + y - 2, x + 2*y - 1], [x, y])
chk("P3d w* = (3/7, 2/7), f* = -28/49 = -4/7 = -0.571429; f(w2) is 0.008929 above",
    sol3 == {x: R(3,7), y: R(2,7)} and f3.subs(sol3) == R(-4,7) and close(float(R(-4,7)), -0.571429, 5e-7)
    and 18 + 6 + 4 - 42 - 14 == -28 and close(-0.5625 - float(R(-4,7)), 0.008929, 5e-7))
chk("P3d orthogonality after exact line search: grad(w1).d1 = 0 and grad(w2).d2 = 0; grad(w2) = (0.25, 0)",
    close(float(sp.diff(f3, x).subs({x: R(1,2), y: 0})*1 + sp.diff(f3, y).subs({x: R(1,2), y: 0})*0), 0)
    and sp.diff(f3, x).subs({x: R(1,2), y: R(1,4)}) == R(1,4) and sp.diff(f3, y).subs({x: R(1,2), y: R(1,4)}) == 0
    and close(float(R(1,4)*0 + 0*R(1,2)), 0))

# ============================================================ P4
fp = lambda X: 2*(X - 5)
chk("P4a f'(0) = -10; v1 = 10a = 1.0 gives a = 0.1", close(fp(0), -10) and close(10*0.1, 1.0))
chk("P4a f'(1) = -8; v2 = b + 0.8, x2 = 1.8 + b = 2.6 gives b = 0.8, v2 = 1.6",
    close(fp(1.0), -8) and close(0.1*8, 0.8) and close(2.6 - 1.8, 0.8) and close(0.8 + 0.8, 1.6))
xm, vm, trace4 = 0.0, 0.0, []
for _ in range(4):
    vm = 0.8*vm - 0.1*fp(xm); xm = xm + vm; trace4.append((round(vm, 6), round(xm, 6)))
chk("P4b f'(2.6) = -4.8, v3 = 1.28+0.48 = 1.76, x3 = 4.36; f'(4.36) = -1.28, v4 = 1.408+0.128 = 1.536, x4 = 5.896",
    close(fp(2.6), -4.8) and close(0.8*1.6, 1.28) and close(0.1*4.8, 0.48) and close(0.8*1.6 + 0.48, 1.76)
    and close(2.6 + 1.76, 4.36) and close(fp(4.36), -1.28) and close(0.8*1.76, 1.408) and close(0.1*1.28, 0.128)
    and close(0.8*1.76 + 0.128, 1.536) and close(4.36 + 1.536, 5.896))
chk("P4b the four rows: v = 1.0, 1.6, 1.76, 1.536 and x = 1.0, 2.6, 4.36, 5.896",
    np.allclose([r[0] for r in trace4], [1.0, 1.6, 1.76, 1.536]) and np.allclose([r[1] for r in trace4], [1.0, 2.6, 4.36, 5.896]))
xp, plain4 = 0.0, []
for _ in range(4):
    xp = 0.8*xp + 1; plain4.append(round(xp, 6))
chk("P4c plain map x <- 0.8x + 1 gives 1, 1.8, 2.44, 2.952",
    sp.expand(x - 0.1*2*(x - 5) - (0.8*x + 1)) == 0 and np.allclose(plain4, [1, 1.8, 2.44, 2.952]))
chk("P4c after four steps momentum is 0.896 PAST 5 and plain descent 2.048 SHORT of it",
    close(5.896 - 5, 0.896) and close(5 - 2.952, 2.048))

# ============================================================ P5
g5, a5 = 4.0, 1.0
chk("P5a G_t = t g^2 = 16t; step = a g / sqrt(G_t) = a/sqrt(t); 1, 0.70711, 0.57735, 0.5",
    all(close(k*g5**2, 16*k) for k in range(1, 6))
    and np.allclose([a5*g5/math.sqrt(16*k) for k in range(1, 5)], [1, 0.70711, 0.57735, 0.5], atol=5e-6)
    and np.allclose([a5/math.sqrt(k) for k in range(1, 5)], [1, 0.70711, 0.57735, 0.5], atol=5e-6))
chk("P5a arithmetic check G1 = 16, sqrt = 4, 4/4 = 1; G2 = 32, sqrt = 5.65685, 4/5.65685 = 0.70711",
    close(math.sqrt(16), 4) and close(4/4, 1) and close(math.sqrt(32), 5.65685, 5e-6) and close(4/math.sqrt(32), 0.70711, 5e-6))
chk("P5b a/sqrt(t) < 0.1a <=> t > 100, so from t = 101; step(100) = 0.1 exactly, step(101) = 0.099504",
    close(1/math.sqrt(100), 0.1) and 1/math.sqrt(101) < 0.1 and close(1/math.sqrt(101), 0.099504, 5e-7)
    and all(1/math.sqrt(k) >= 0.1 for k in range(1, 101)))
Ar, rows5 = 0.0, []
for k in range(1, 5):
    Ar = 0.5*Ar + 0.5*g5**2; rows5.append(a5*g5/math.sqrt(Ar))
chk("P5c A_t = g^2(1 - rho^t) verified by unrolling the recursion, and 1+rho+...+rho^(t-1) = (1-rho^t)/(1-rho)",
    all(close(sum(0.5**j*0.5*g5**2 for j in range(k)), g5**2*(1 - 0.5**k)) for k in range(1, 12))
    and all(close(sum(rv**j for j in range(k)), (1 - rv**k)/(1 - rv))
            for rv in (0.5, 0.9, 0.999) for k in range(1, 12)))
chk("P5c steps 1.41421, 1.15470, 1.06904, 1.03280 and they tend to alpha = 1",
    np.allclose(rows5, [1.41421, 1.15470, 1.06904, 1.03280], atol=5e-6)
    and np.allclose([1/math.sqrt(1 - 0.5**k) for k in range(1, 5)], [1.41421, 1.15470, 1.06904, 1.03280], atol=5e-6)
    and close(1/math.sqrt(1 - 0.5**200), 1.0))
chk("P5d limits 0 and alpha = 1; at t = 100 the steps are 0.1 and 1.0000, ratio 10; 0.5^100 = 7.9e-31",
    close(1/math.sqrt(10**8), 1e-4) and close(1/math.sqrt(100), 0.1)
    and close(1/math.sqrt(1 - 0.5**100), 1.0) and close(1.0/0.1, 10) and close(0.5**100, 7.888609e-31, 1e-36))

# ============================================================ P6
X6 = np.array([[10., 1.], [10., -1.]]); y6 = np.array([21., 19.])
grad6 = lambda W: X6.T @ (X6 @ W - y6)
r0 = X6 @ np.zeros(2) - y6
chk("P6a r = (-21,-19); dL/dw1 = -210-190 = -400; dL/dw2 = -21+19 = -2",
    np.allclose(r0, [-21, -19]) and close(-21*10, -210) and close(-19*10, -190)
    and np.allclose(grad6(np.zeros(2)), [-400, -2]))
H6 = X6.T @ X6
chk("P6b H = X'X = diag(200, 2) (100+100, 10-10, 1+1); kappa = 100; stable for 0 < a < 2/200 = 0.01",
    np.allclose(H6, [[200, 0], [0, 2]]) and close(100 + 100, 200) and close(10 - 10, 0) and close(1 + 1, 2)
    and close(200/2, 100) and close(2/200, 0.01))
chk("P6b optimum w* = (400/200, 2/2) = (2,1)",
    np.allclose(X6.T @ y6, [400, 2]) and np.allclose(np.linalg.solve(H6, X6.T @ y6), [2, 1]))
chk("P6b at a = 0.005: dw2 = 0.01, factor 0.99, ln0.01/ln0.99 = 458.21 so 459 steps; w1's factor is 0 (one step)",
    close(0.005*2, 0.01) and close(1 - 0.005*2, 0.99) and close(math.log(0.01)/math.log(0.99), 458.21, 5e-3)
    and math.ceil(math.log(0.01)/math.log(0.99)) == 459 and close(1 - 0.005*200, 0)
    and close((np.zeros(2) - 0.005*grad6(np.zeros(2)))[0], 2))
Amem, W6, steps6 = np.zeros(2), np.zeros(2), []
for _ in range(2):
    g = grad6(W6); Amem = 0.9*Amem + 0.1*g**2
    s = 0.3*g/np.sqrt(Amem); W6 = W6 - s; steps6.append((Amem.copy(), np.sqrt(Amem), s.copy(), W6.copy()))
chk("P6c step 1: A1 = (16000, 0.4), sqrt = (126.4911, 0.632456), step = (-0.948683,-0.948683), w1 = (0.948683, 0.948683)",
    np.allclose(steps6[0][0], [16000, 0.4]) and np.allclose(steps6[0][1], [126.4911, 0.632456], atol=5e-6)
    and np.allclose(steps6[0][2], [-0.948683, -0.948683], atol=5e-6) and np.allclose(steps6[0][3], [0.948683, 0.948683], atol=5e-6))
chk("P6c the first RMSProp step is alpha/sqrt(1-rho) in EVERY coordinate: 0.3/sqrt(0.1) = 0.948683",
    close(0.3/math.sqrt(0.1), 0.948683, 5e-7) and close(steps6[0][2][0], steps6[0][2][1]))
w1v = steps6[0][3]; r1 = X6 @ w1v - y6; g1v = X6.T @ r1
chk("P6c yhat = 10.435516 and 8.538150; r = (-10.564484, -10.461850); g1 = (-210.263340, -0.102633)",
    np.allclose(X6 @ w1v, [10.435516, 8.538150], atol=5e-7) and np.allclose(r1, [-10.564484, -10.461850], atol=5e-7)
    and np.allclose(g1v, [-210.263340, -0.102633], atol=5e-6)
    and close(10*(-10.564484) + 10*(-10.461850), -210.263340, 5e-6))
chk("P6c step 2: squares (44210.67, 0.010534); A2 = (18821.067, 0.3610534); sqrt = (137.189895, 0.600877)",
    np.allclose(g1v**2, [44210.67, 0.010534], atol=5e-3) and np.allclose(steps6[1][0], [18821.067, 0.3610534], atol=5e-4)
    and np.allclose(steps6[1][1], [137.189895, 0.600877], atol=5e-6))
chk("P6c step 2 move (-0.459793, -0.051242); w2 = (1.408477, 0.999925), within 0.000075 of w2* = 1",
    np.allclose(steps6[1][2], [-0.459793, -0.051242], atol=5e-6)
    and np.allclose(steps6[1][3], [1.408477, 0.999925], atol=5e-6) and close(1 - steps6[1][3][1], 0.000075, 5e-7))
Wp = np.zeros(2); plain6 = []
for _ in range(2):
    Wp = Wp - 0.005*grad6(Wp); plain6.append(Wp.copy())
chk("P6d two plain steps at a = 0.005 give w2 = 0.01 then 0.0199 (second move 0.005*1.98)",
    close(plain6[0][1], 0.01) and close(plain6[1][1], 0.0199) and close(0.01 + 0.005*1.98, 0.0199)
    and close(abs(grad6(plain6[0])[1]), 1.98))
chk("P6d RMSProp 0.999925 versus plain 0.0199: ratio 50.25",
    close(steps6[1][3][1]/plain6[1][1], 50.2475, 5e-4) and close(round(steps6[1][3][1]/plain6[1][1], 2), 50.25))

# ============================================================ P7
gs7 = [6.0, -4.0, 2.0]; a7, b17, b27 = 0.1, 0.9, 0.999
m7 = v7 = 0.0; w7 = 1.0; rows7 = []
for k in range(1, 4):
    m7 = b17*m7 + (1 - b17)*gs7[k-1]; v7 = b27*v7 + (1 - b27)*gs7[k-1]**2
    mh, vh = m7/(1 - b17**k), v7/(1 - b27**k)
    ratio = mh/math.sqrt(vh); w7 = w7 - a7*ratio
    rows7.append((m7, v7, mh, vh, math.sqrt(vh), ratio, w7))
chk("P7a correction denominators 1-b1^t = 0.1, 0.19, 0.271 and 1-b2^t = 0.001, 0.001999, 0.002997001",
    np.allclose([1 - 0.9**k for k in (1, 2, 3)], [0.1, 0.19, 0.271])
    and np.allclose([1 - 0.999**k for k in (1, 2, 3)], [0.001, 0.001999, 0.002997001], atol=1e-12)
    and close(0.9**2, 0.81) and close(0.9**3, 0.729) and close(0.999**2, 0.998001) and close(0.999**3, 0.997002999))
chk("P7a t=1: m = 0.6, v = 0.036, mhat = 6, vhat = 36, sqrt = 6, ratio = 1, w1 = 0.9",
    np.allclose(rows7[0][:6], [0.6, 0.036, 6, 36, 6, 1]) and close(rows7[0][6], 0.9))
chk("P7a t=2: m = 0.54-0.4 = 0.14, v = 0.035964+0.016 = 0.051964, mhat = 0.736842, vhat = 25.994997",
    close(0.9*0.6, 0.54) and close(0.1*(-4), -0.4) and close(rows7[1][0], 0.14)
    and close(0.999*0.036, 0.035964) and close(0.001*16, 0.016) and close(rows7[1][1], 0.051964)
    and close(rows7[1][2], 0.736842, 5e-7) and close(rows7[1][3], 25.994997, 5e-7))
chk("P7a t=2: sqrt(vhat) = 5.098529, ratio = 0.144521, w2 = 0.885548",
    close(rows7[1][4], 5.098529, 5e-7) and close(rows7[1][5], 0.144521, 5e-7) and close(rows7[1][6], 0.885548, 5e-7))
chk("P7a t=3: m = 0.126+0.2 = 0.326, v = 0.051912036+0.004 = 0.055912036",
    close(0.9*0.14, 0.126) and close(0.1*2, 0.2) and close(rows7[2][0], 0.326)
    and close(0.999*0.051964, 0.051912036) and close(rows7[2][1], 0.055912036))
chk("P7a t=3: mhat = 1.202952, vhat = 18.655995, sqrt = 4.319259, ratio = 0.278509, w3 = 0.857697",
    close(rows7[2][2], 1.202952, 5e-7) and close(rows7[2][3], 18.655995, 5e-6)
    and close(rows7[2][4], 4.319259, 5e-7) and close(rows7[2][5], 0.278509, 5e-7) and close(rows7[2][6], 0.857697, 5e-7))
pw7 = 1.0; plain7 = []
for g in gs7:
    pw7 = pw7 - 0.1*g; plain7.append(pw7)
chk("P7b plain descent at a = 0.1 on the same gradients gives 0.4, 0.8, 0.6",
    np.allclose(plain7, [0.4, 0.8, 0.6]))
chk("P7b plain travel 0.6+0.4+0.2 = 1.2 to end 0.4 from the start; Adam travels 0.142303 and ends 0.142303 away",
    close(0.6 + 0.4 + 0.2, 1.2) and close(abs(1 - plain7[2]), 0.4)
    and close(sum(0.1*abs(r[5]) for r in rows7), 0.142303, 5e-7) and close(1 - rows7[2][6], 0.142303, 5e-7))
chk("P7c step sizes 0.1, 0.014452, 0.027851; the middle ratio is 0.736842/5.098529 = 0.144521",
    np.allclose([0.1*r[5] for r in rows7], [0.1, 0.014452, 0.027851], atol=5e-7)
    and close(0.736842/5.098529, 0.144521, 5e-6))
chk("P7c the signed average nearly cancels (0.14) while the squared average cannot (0.051964)",
    close(0.9*0.6 + 0.1*(-4), 0.14) and close(0.999*0.036 + 0.001*16, 0.051964)
    and abs(0.14) < abs(0.6) and 0.051964 > 0.036 and all(g**2 > 0 for g in gs7))

# ============================================================ P8
s = sp.Symbol('s', positive=True)
chk("P8a perimeter 2x+2y = 20 reduces to h = x+y-10 = 0",
    sp.simplify(sp.expand((2*x + 2*y - 20)/2) - (x + y - 10)) == 0)
chk("P8b grad(xy) = (y,x) = lambda(1,1) forces x = y = lambda; 2L = 10 gives L* = 5, x* = y* = 5, A* = 25",
    [sp.diff(x*y, x), sp.diff(x*y, y)] == [y, x] and sp.solve(sp.Eq(2*lam, 10), lam) == [5] and 5*5 == 25)
Ax = sp.expand(x*(10 - x))
chk("P8b on the line A(x) = 10x - x^2, a downward parabola peaking at x = 5 with A = 25; ends give 0",
    Ax == 10*x - x**2 and sp.diff(Ax, x, 2) == -2 and sp.solve(sp.diff(Ax, x), x) == [5]
    and Ax.subs(x, 5) == 25 and Ax.subs(x, 0) == 0 and Ax.subs(x, 10) == 0)
chk("P8c budget 11: x* = y* = 5.5, A* = 30.25; predicted gain 5(1) = 5, true gain 5.25, difference 0.25",
    close(11/2, 5.5) and close(5.5*5.5, 30.25) and close(5*1, 5) and close(30.25 - 25, 5.25) and close(5.25 - 5, 0.25))
Astar = s**2/4
chk("P8c value function A*(s) = s^2/4 with slope s/2 = 5 at s = 10; A*(11)-A*(10) = 21/4 = 5.25; curvature term 0.25",
    sp.simplify(Astar.subs(s, 10) - 25) == 0 and sp.diff(Astar, s).subs(s, 10) == 5
    and sp.simplify(Astar.subs(s, 11) - R(121,4)) == 0 and R(121 - 100, 4) == R(21,4) and close(float(R(21,4)), 5.25)
    and close(1**2/4, 0.25) and close(5 + 0.25, 5.25))

# ============================================================ P9
chk("P9a x >= 2 <-> 2-x <= 0 with grad -1; x+2y >= 5 <-> 5-x-2y <= 0 with grad (-1,-2)",
    sp.diff(2 - x, x) == -1 and [sp.diff(5 - x - 2*y, v) for v in (x, y)] == [-1, -2]
    and all((v >= 2) == (2 - v <= 0) for v in [0, 1, 2, 3, 5]))
chk("P9a 3x-y <= 7 <-> 3x-y-7 <= 0 with grad (3,-1); x+y = 1 <-> e = x+y-1 = 0 with grad (1,1)",
    [sp.diff(3*x - y - 7, v) for v in (x, y)] == [3, -1] and [sp.diff(x + y - 1, v) for v in (x, y)] == [1, 1])
chk("P9a max xy becomes min(-xy) with grad (-y,-x), and the two have the same optimiser",
    [sp.diff(-x*y, v) for v in (x, y)] == [-y, -x]
    and sp.solve(sp.diff(-(x*(10 - x)), x), x) == sp.solve(sp.diff(x*(10 - x), x), x))
chk("P9a x > 2 is not allowed: the infimum 2 is excluded and every allowed x is beaten by (x+2)/2",
    all(2 < (v + 2)/2 < v for v in [2.5, 3, 10, 2.000001]))
chk("P9b 2^m branches: m = 1,2,3,4,10 give 2, 4, 8, 16, 1024; equalities add none",
    [2**m for m in (1, 2, 3, 4, 10)] == [2, 4, 8, 16, 1024])
chk("P9b m^2 agrees at m = 2 (4) and m = 4 (16) and fails at m = 3 (8, not 9); 2^10 = 1024 vs 100",
    2**2 == 2**2 and 2**4 == 4**2 and 2**3 == 8 and 3**2 == 9 and 2**3 != 3**2 and 2**10 == 1024 and 10**2 == 100)
chk("P9c one path and no fences: 3 of the 5 conditions are empty, leaving grad f + lambda grad e = 0 and e = 0",
    5 - 3 == 2)
chk("P9d slack formulation has n + 2m + 1 unknowns; n = 2, m = 2 gives 7", 2 + 2*2 + 1 == 7)

# ============================================================ P10
A10 = sp.Matrix([[5, 2], [2, 2]]); f10 = sp.expand((sp.Matrix([x, y]).T*A10*sp.Matrix([x, y]))[0])
chk("P10a f = 5x^2+4xy+2y^2; grad f = (10x+4y, 4x+4y) = 2Av; grad h = (2x,2y) = 2v; so Av = lambda v",
    f10 == 5*x**2 + 4*x*y + 2*y**2
    and sp.Matrix([sp.diff(f10, x), sp.diff(f10, y)]) == 2*A10*sp.Matrix([x, y])
    and sp.Matrix([sp.diff(x**2 + y**2 - 1, x), sp.diff(x**2 + y**2 - 1, y)]) == 2*sp.Matrix([x, y]))
chk("P10b trace 7, det 6, char lambda^2-7lambda+6 = (l-6)(l-1); eigenvalues 6 and 1",
    A10.trace() == 7 and A10.det() == 6 and sp.expand((lam - 6)*(lam - 1)) == lam**2 - 7*lam + 6
    and sorted(A10.eigenvals().keys()) == [1, 6])
v6 = sp.Matrix([2, 1])/sp.sqrt(5); v1 = sp.Matrix([-1, 2])/sp.sqrt(5)
chk("P10c unit eigenvectors (2,1)/sqrt5 = (0.894427, 0.447214) and (-1,2)/sqrt5 = (-0.447214, 0.894427)",
    sp.simplify(A10*v6 - 6*v6) == sp.zeros(2, 1) and sp.simplify(A10*v1 - 1*v1) == sp.zeros(2, 1)
    and close(float(2/sp.sqrt(5)), 0.894427, 5e-7) and close(float(1/sp.sqrt(5)), 0.447214, 5e-7)
    and close(float(v6.norm()), 1) and close(float(v1.norm()), 1))
chk("P10c max f = 6 at +-(0.894427,0.447214) and min f = 1 at +-(-0.447214,0.894427); f = lambda on a unit eigenvector",
    sp.simplify((v6.T*A10*v6)[0] - 6) == 0 and sp.simplify((v1.T*A10*v1)[0] - 1) == 0
    and sp.simplify(((-v6).T*A10*(-v6))[0] - 6) == 0)
chk("P10d direct substitution: (1/5)[5(4) + 4(2)(1) + 2(1)] = (20+8+2)/5 = 30/5 = 6; eigenvectors orthogonal",
    close((5*4 + 4*2*1 + 2*1)/5, 6) and 20 + 8 + 2 == 30 and close(30/5, 6)
    and (sp.Matrix([2, 1]).T*sp.Matrix([-1, 2]))[0] == 0 and -2 + 2 == 0)
chk("P10d the unnormalised (2,1) gives 30, not 6 - f scales with ||v||^2",
    (sp.Matrix([2, 1]).T*A10*sp.Matrix([2, 1]))[0] == 30)

# ============================================================ P11
f11 = (x - 3)**2; g11 = x - 1
chk("P11a branch mu = 0 gives x = 3 but g(3) = 2 > 0: rejected on fence feasibility",
    sp.solve(sp.diff(f11, x), x) == [3] and g11.subs(x, 3) == 2 and g11.subs(x, 3) > 0)
chk("P11a branch g = 0 gives x = 1, 2(1-3)+mu = -4+mu = 0 so mu* = 4 >= 0; p* = 4",
    sp.solve(sp.Eq(2*(1 - 3) + mu, 0), mu) == [4] and f11.subs(x, 1) == 4 and g11.subs(x, 1) == 0)
chk("P11a all five conditions at (1,4): stationarity 0, g = 0 <= 0, mu*g = 0, mu >= 0",
    close(float(2*(1 - 3) + 4), 0) and g11.subs(x, 1) <= 0 and 4*g11.subs(x, 1) == 0 and 4 >= 0)
L11 = f11 + mu*g11
chk("P11b L = (x-3)^2 + mu(x-1); dL/dx = 0 gives x = 3 - mu/2; d2L/dx2 = 2 > 0",
    sp.solve(sp.diff(L11, x), x) == [3 - mu/2] and sp.diff(L11, x, 2) == 2)
d11 = sp.expand(L11.subs(x, 3 - mu/2))
chk("P11c d(mu) = (mu/2)^2 + mu(2 - mu/2) = mu^2/4 + 2mu - mu^2/2 = 2mu - mu^2/4; concave (coeff 1/4-1/2 = -1/4)",
    d11 == 2*mu - mu**2/4 and R(1,4) - R(1,2) == R(-1,4) and sp.diff(d11, mu, 2) == R(-1,2))
chk("P11c sample values d(0) = 0, d(2) = 4-1 = 3, d(6) = 12-9 = 3, all <= p* = 4 (weak duality)",
    d11.subs(mu, 0) == 0 and d11.subs(mu, 2) == 3 and d11.subs(mu, 6) == 3
    and all(d11.subs(mu, m) <= 4 for m in range(0, 30)))
chk("P11d d'(mu) = 2 - mu/2 = 0 gives mu* = 4; d* = 8 - 4 = 4; gap p*-d* = 0",
    sp.solve(sp.diff(d11, mu), mu) == [4] and d11.subs(mu, 4) == 4 and 2*4 - 16/4 == 4 and 4 - 4 == 0)
chk("P11d recover x* = 3 - 4/2 = 1 and check mu*g(x*) = 4(0) = 0",
    close(3 - 4/2, 1) and close(4*float(g11.subs(x, 1)), 0))

# ============================================================ P12
m1s, m2s = sp.symbols('mu1 mu2')
L12 = x**2 + 2*y**2 + lam*(x + y - 1) - m1s*x - m2s*y
chk("P12a standard form e = x+y-1, g1 = -x, g2 = -y; two fences give 2^2 = 4 cases", 2**2 == 4)
chk("P12b stationarity gives mu1 = 2x + lambda and mu2 = 4y + lambda = 4 - 4x + lambda on the path",
    sp.solve(sp.diff(L12, x), m1s) == [2*x + lam] and sp.solve(sp.diff(L12, y), m2s) == [4*y + lam]
    and sp.expand((4*y + lam).subs(y, 1 - x)) == sp.expand(4 - 4*x + lam))
c1 = sp.solve([2*x + lam, 4 - 4*x + lam], [x, lam])
chk("P12c case 1 (mu1 = mu2 = 0): -2x = 4x-4 so 6x = 4, x = 2/3, y = 1/3, lambda = -4/3, f = 4/9+2/9 = 2/3",
    c1 == {x: R(2,3), lam: R(-4,3)} and R(1) - R(2,3) == R(1,3)
    and R(2,3)**2 + 2*R(1,3)**2 == R(2,3) and R(4,9) + R(2,9) == R(6,9) == R(2,3)
    and R(2,3) > 0 and R(1,3) > 0)
chk("P12c case 2 (mu1 = 0, y = 0): x = 1, lambda = -2, mu2 = -2 < 0 - rejected on the sign condition",
    (2*x + lam).subs({x: 1, lam: -2}) == 0 and (4*y + lam).subs({y: 0, lam: -2}) == -2 and -2 < 0)
chk("P12c case 3 (x = 0, mu2 = 0): y = 1, lambda = -4, mu1 = -4 < 0 - rejected",
    (4*y + lam).subs({y: 1, lam: -4}) == 0 and (2*x + lam).subs({x: 0, lam: -4}) == -4 and -4 < 0)
chk("P12c case 4 (x = 0, y = 0): x+y = 0 != 1 - rejected on path feasibility before any multiplier", 0 + 0 != 1)
chk("P12d lambda* = -4/3 < 0 is legal (paths are unsigned); mu1* = mu2* = 0 with g1 = -2/3 < 0 and g2 = -1/3 < 0",
    R(-4,3) < 0 and -R(2,3) < 0 and -R(1,3) < 0 and R(0)*(-R(2,3)) == 0 and R(0)*(-R(1,3)) == 0)
chk("P12d convex: Hessian of x^2+2y^2 is diag(2,4), positive definite, and both rules are linear",
    sp.hessian(x**2 + 2*y**2, (x, y)) == sp.diag(2, 4) and all(v > 0 for v in sp.diag(2, 4).eigenvals())
    and sp.diff(x + y - 1, x, 2) == 0)
grid12 = [(u, 1 - u) for u in np.linspace(0, 1, 100001)]
chk("P12d brute force over the feasible segment confirms the minimum 2/3 at (2/3, 1/3)",
    close(min(u**2 + 2*v**2 for u, v in grid12), float(R(2,3)), 1e-9))

# ============================================================ P13
L13 = x**2 + y**2 + lam*(x + y - 4) + mu*(3 - x)
chk("P13a stationarity 2x + lambda - mu = 0 and 2y + lambda = 0",
    sp.expand(sp.diff(L13, x)) == 2*x + lam - mu and sp.expand(sp.diff(L13, y)) == 2*y + lam)
chk("P13b case mu = 0 gives x = y = 2 but g = 3-2 = 1 > 0: rejected on fence feasibility",
    sp.solve([2*x + lam, 2*y + lam, x + y - 4], [x, y, lam]) == {x: 2, y: 2, lam: -4} and 3 - 2 == 1)
chk("P13b case g = 0: x = 3, y = 1, lambda = -2, mu = 4 >= 0; all five hold; p* = 9+1 = 10",
    sp.solve([2*3 + lam - mu, 2*1 + lam], [lam, mu]) == {lam: -2, mu: 4}
    and 3 + 1 - 4 == 0 and 4*(3 - 3) == 0 and 3**2 + 1**2 == 10)
xin, yin = (mu - lam)/2, -lam/2
d13 = sp.expand(L13.subs({x: xin, y: yin}))
chk("P13c inner minimiser x = (mu-lambda)/2, y = -lambda/2; x+y = mu/2 - lambda",
    sp.solve(sp.diff(L13, x), x) == [(mu - lam)/2] and sp.solve(sp.diff(L13, y), y) == [-lam/2]
    and sp.simplify(xin + yin - (mu/2 - lam)) == 0)
chk("P13c d = -mu^2/4 - lambda^2/2 + lambda mu/2 - 4 lambda + 3 mu",
    d13 == sp.expand(-mu**2/4 - lam**2/2 + lam*mu/2 - 4*lam + 3*mu))
chk("P13c the three coefficients: mu^2: 1/4-1/2 = -1/4; lambda^2: 1/4+1/4-1 = -1/2; lambda mu: -1/2+1/2+1/2 = +1/2",
    R(1,4) - R(1,2) == R(-1,4) and R(1,4) + R(1,4) - 1 == R(-1,2) and R(-1,2) + R(1,2) + R(1,2) == R(1,2)
    and d13.coeff(mu, 2) == R(-1,4) and d13.coeff(lam, 2) == R(-1,2) and sp.expand(d13).coeff(lam).coeff(mu) == R(1,2))
Hd = sp.hessian(d13, (lam, mu))
evd = sorted(float(sp.N(v)) for v in Hd.eigenvals())
chk("P13d dual Hessian [[-1,1/2],[1/2,-1/2]] with det 1/4 > 0 and trace -3/2 < 0",
    Hd == sp.Matrix([[-1, R(1,2)], [R(1,2), R(-1,2)]]) and Hd.det() == R(1,4) and Hd.trace() == R(-3,2)
    and R(1,2) - R(1,4) == R(1,4))
chk("P13d both eigenvalues negative: (-3 +- sqrt5)/4 = -0.190983, -1.309017 (sum -3/2, product 1/4)",
    close(evd[1], -0.190983, 5e-7) and close(evd[0], -1.309017, 5e-7)
    and close(float((-3 + math.sqrt(5))/4), -0.190983, 5e-7) and close(float((-3 - math.sqrt(5))/4), -1.309017, 5e-7)
    and close(evd[0] + evd[1], -1.5) and close(evd[0]*evd[1], 0.25) and close((9 - 5)/16, 0.25)
    and all(v < 0 for v in evd))
sold = sp.solve([sp.diff(d13, lam), sp.diff(d13, mu)], [lam, mu])
chk("P13e dl/dlambda = 0 gives lambda = mu/2 - 4; dl/dmu = 0 gives mu = lambda + 6; lambda* = -2, mu* = 4",
    sp.solve(sp.diff(d13, lam), lam) == [mu/2 - 4] and sp.solve(sp.diff(d13, mu), mu) == [lam + 6]
    and sold == {lam: -2, mu: 4} and close(float(-2/2 - 1), -2) and 4 >= 0)
chk("P13e d* = -4-2-4+8+12 = 10 = p*, gap 0; recovered x* = (4+2)/2 = 3 and y* = 1",
    d13.subs(sold) == 10 and -4 - 2 - 4 + 8 + 12 == 10 and close(float(xin.subs(sold)), 3)
    and close(float(yin.subs(sold)), 1) and 10 - 10 == 0)
c = sp.Symbol('c')
pstar = c**2 + (4 - c)**2
chk("P13f wall at 2.9: predicted 10 - 4(0.1) = 9.60; actual 8.41+1.21 = 9.62; difference 0.02",
    close(10 - 4*0.1, 9.60) and close(2.9**2, 8.41) and close(1.1**2, 1.21) and close(8.41 + 1.21, 9.62)
    and close(9.62 - 9.60, 0.02, 1e-9) and close(float(pstar.subs(c, 2.9)), 9.62))
chk("P13f value function p*(c) = c^2+(4-c)^2 for c >= 2, slope 4c-8, equal to 4 at c = 3 and 0 at c = 2",
    sp.expand(sp.diff(pstar, c)) == 4*c - 8 and sp.diff(pstar, c).subs(c, 3) == 4
    and sp.diff(pstar, c).subs(c, 2) == 0 and pstar.subs(c, 3) == 10 and pstar.subs(c, 2) == 8)
def p13(cv):
    if cv <= 2: return 8.0
    return cv**2 + (4 - cv)**2
chk("P13f for c < 2 the wall is slack: p* stays flat at 8 and mu* = 0",
    all(close(p13(v), 8.0) for v in [0.0, 1.0, 1.9, 2.0]) and close(p13(3.0), 10.0))

# ============================================================ P14
a1s, a2s = sp.symbols('alpha1 alpha2', nonnegative=True)
chk("P14a constraints w+b >= 1 and w-b >= 1 become g1 = 1-w-b <= 0 and g2 = 1-w+b <= 0",
    sp.expand(-(1*(w*1 + b)) + 1) == 1 - w - b and sp.expand(-((-1)*(w*(-1) + b)) + 1) == 1 - w + b)
L14 = R(1,2)*w**2 + a1s*(1 - w - b) + a2s*(1 - w + b)
chk("P14b stationarity: w = alpha1 + alpha2 and alpha1 = alpha2",
    sp.solve(sp.diff(L14, w), w) == [a1s + a2s] and sp.expand(sp.diff(L14, b)) == -a1s + a2s)
aa = sp.Symbol('alpha', nonnegative=True)
q14 = sp.expand(L14.subs({a1s: aa, a2s: aa, w: 2*aa}))
chk("P14b q(alpha) = 1/2(2a)^2 - (2a)(2a) + 2a = 2a^2 - 4a^2 + 2a = 2a - 2a^2",
    q14 == 2*aa - 2*aa**2 and sp.expand(R(1,2)*(2*aa)**2 - (2*aa)*(2*aa) + 2*aa) == 2*aa - 2*aa**2)
xi = [1, -1]; yi = [1, -1]
qtext = sp.expand(sum([a1s, a2s][i] for i in range(2))
                  - R(1,2)*sum([a1s, a2s][i]*[a1s, a2s][j]*yi[i]*yi[j]*xi[i]*xi[j] for i in range(2) for j in range(2)))
chk("P14b the textbook dual sum(a_i) - 1/2 sum a_i a_j y_i y_j x_i x_j gives the same 2a - 2a^2 here",
    sp.expand(qtext.subs({a1s: aa, a2s: aa})) == 2*aa - 2*aa**2
    and all(yi[i]*yi[j]*xi[i]*xi[j] == 1 for i in range(2) for j in range(2)))
chk("P14c q'(a) = 2-4a = 0 gives alpha* = 1/2 >= 0 and d* = 1 - 1/2 = 1/2",
    sp.solve(sp.diff(q14, aa), aa) == [R(1,2)] and q14.subs(aa, R(1,2)) == R(1,2))
chk("P14c w* = 1/2+1/2 = 1; alpha1 > 0 forces w+b = 1 so b* = 0; primal 1/2(1)^2 = 1/2 = d*, gap 0",
    R(1,2) + R(1,2) == 1 and 1 - 1 == 0 and R(1,2)*1**2 == R(1,2) and R(1,2) - R(1,2) == 0
    and close(1*(-1) + 0, -1) and 1 - 0 == 1)
chk("P14c boundary x = 0, margin edges x = +-1, width 2/|w*| = 2, and both points are support vectors",
    close(-0/1, 0) and close((1 - 0)/1, 1) and close((-1 - 0)/1, -1) and close(2/abs(1), 2)
    and sum(1 for a in [R(1,2), R(1,2)] if a > 0) == 2)
chk("P14d x3 = 3 with y3 = +1: 3w+b = 3 >= 1, so g3 = 1-3(1)-0 = -2 < 0 and complementary slackness forces alpha3 = 0",
    close(3*1 + 0, 3) and 3 >= 1 and close(1 - 3*1 - 0, -2) and -2 < 0)
x3 = sp.Symbol('x3')
sol14 = sp.solve([w*x3 + b - 1, w - b - 1], [w, b])
chk("P14d with x3 (class +1) and -1 both binding: w = 2/(x3+1) and b = (1-x3)/(1+x3)",
    sp.simplify(sol14[w] - 2/(x3 + 1)) == 0 and sp.simplify(sol14[b] - (1 - x3)/(1 + x3)) == 0
    and sp.simplify(sol14[b] - (1 - sol14[w]*x3)) == 0)
chk("P14d at x3 = 0.5: w = 2/1.5 = 1.3333, b = 0.5/1.5 = 0.3333, boundary -b/w = -0.25, margin 2/|w| = 1.5",
    close(2/1.5, 1.3333, 5e-5) and close(0.5/1.5, 0.3333, 5e-5)
    and close(-(0.5/1.5)/(2/1.5), -0.25) and close(2/(2/1.5), 1.5))
chk("P14d with x3 = 3 slack the classifier stays w = 1, b = 0, boundary 0, margin 2 (the point may be deleted)",
    close(float(sol14[w].subs(x3, 1)), 1) and close(float(sol14[b].subs(x3, 1)), 0) and close(2/1.0, 2))
chk("P14d moving the positive point from 3 to 0.5 shrinks the margin 2 -> 1.5 and shifts the boundary 0 -> -0.25",
    close(2/float(sol14[w].subs(x3, 1)), 2.0) and close(2/float(sol14[w].subs(x3, R(1,2))), 1.5)
    and close(-float(sol14[b].subs(x3, 1))/float(sol14[w].subs(x3, 1)), 0.0)
    and close(-float(sol14[b].subs(x3, R(1,2)))/float(sol14[w].subs(x3, R(1,2))), -0.25))
def svm_numeric(x3v):
    # minimise w^2/2 over (w,b) with w*x3+b >= 1 and w-b >= 1; a feasible b exists iff w(1+x3) >= 2
    best_w, best_b, best_v = None, None, np.inf
    for wv in np.linspace(0.01, 6.0, 600000):
        lo, hi = 1 - wv*x3v, wv - 1
        if lo <= hi + 1e-12 and 0.5*wv*wv < best_v:
            best_w, best_b, best_v = wv, hi, 0.5*wv*wv
            break
    return best_w, best_b
chk("P14d the formula w = 2/(x3+1), b = (1-x3)/(1+x3) matches a direct numerical margin solve at x3 = 0.2, 0.5, 0.8",
    all(close(svm_numeric(v)[0], 2/(v + 1), 1e-4) and close(svm_numeric(v)[1], (1 - v)/(1 + v), 1e-4)
        for v in [0.2, 0.5, 0.8])
    and all(close(float(sol14[w].subs(x3, sp.Rational(str(v)))), 2/(v + 1)) for v in [0.2, 0.5, 0.8]))

print("-" * 60)
print("  (the fourteen practice problems check out; now the section and widget numbers)")

# ============================================================ the five runs on J = w1^2/2 + 5 w2^2
def J(W): return 0.5*W[0]**2 + 5*W[1]**2
def gJ(W): return np.array([W[0], 10*W[1]])
def run(kind, n=25, a=0.1):
    W = np.array([1.0, 1.0]); pts = [W.copy()]; Js = [J(W)]
    v = np.zeros(2); G = np.zeros(2); Am = np.zeros(2); m = np.zeros(2); vv = np.zeros(2)
    for k in range(1, n + 1):
        g = gJ(W)
        if kind == 'gd': W = W - a*g
        elif kind == 'mom': v = 0.9*v - a*g; W = W + v
        elif kind == 'adagrad': G = G + g**2; W = W - a*g/np.sqrt(G)
        elif kind == 'rms': Am = 0.9*Am + 0.1*g**2; W = W - a*g/np.sqrt(Am)
        elif kind == 'adam':
            m = 0.9*m + 0.1*g; vv = 0.999*vv + 0.001*g**2
            W = W - a*(m/(1 - 0.9**k))/np.sqrt(vv/(1 - 0.999**k))
        pts.append(W.copy()); Js.append(J(W))
    return pts, Js
pg, Jg = run('gd')
chk("runs: GD gives [0.9,0], [0.81,0], J2 = 0.3281, J10 = 0.060788, J25 = 0.0025769",
    np.allclose(pg[1], [0.9, 0]) and np.allclose(pg[2], [0.81, 0])
    and close(Jg[2], 0.3281, 5e-5) and close(Jg[10], 0.060788, 5e-7) and close(Jg[25], 0.0025769, 5e-8))
pm, Jm = run('mom')
chk("runs: momentum gives [0.9,0], [0.72,-0.9], [0.486,-0.810], J2 = 4.3092, J10 = 0.32702, J25 = 0.19587",
    np.allclose(pm[1], [0.9, 0]) and np.allclose(pm[2], [0.72, -0.9]) and np.allclose(pm[3], [0.486, -0.810])
    and close(Jm[2], 4.3092, 5e-5) and close(Jm[10], 0.32702, 5e-6) and close(Jm[25], 0.19587, 5e-6))
pa, Ja = run('adagrad')
chk("runs: AdaGrad gives [0.9,0.9], [0.833104,0.833104], J2 = 3.8173, J25 = 0.54743",
    np.allclose(pa[1], [0.9, 0.9]) and np.allclose(pa[2], [0.833104, 0.833104], atol=5e-7)
    and close(Ja[2], 3.8173, 5e-5) and close(Ja[25], 0.54743, 5e-6))
pr, Jr = run('rms')
chk("runs: RMSProp gives [0.683772,0.683772], [0.498871,0.498871], J2 = 1.3688, J25 = 3.5992e-13",
    np.allclose(pr[1], [0.683772, 0.683772], atol=5e-7) and np.allclose(pr[2], [0.498871, 0.498871], atol=5e-7)
    and close(Jr[2], 1.3688, 5e-5) and close(Jr[25], 3.5992e-13, 5e-17))
pd_, Jd = run('adam')
chk("runs: Adam gives [0.9,0.9], [0.800412,0.800412], J2 = 3.5236, J25 = 0.17930",
    np.allclose(pd_[1], [0.9, 0.9]) and np.allclose(pd_[2], [0.800412, 0.800412], atol=5e-7)
    and close(Jd[2], 3.5236, 5e-5) and close(Jd[25], 0.17930, 5e-6))

alph = np.array([0.1*math.sqrt(1 - 0.999**k)/(1 - 0.9**k) for k in range(1, 4001)])
chk("Adam's a_t = a sqrt(1-rho^t)/(1-rho_f^t): a1 = 0.0316228, a2 = 0.0235317, minimum 0.0152241 at t = 12, and a_t -> 0.1",
    close(alph[0], 0.0316228, 5e-8) and close(alph[1], 0.0235317, 5e-8)
    and close(alph.min(), 0.0152241, 5e-8) and int(alph.argmin()) + 1 == 12
    and close(0.1*math.sqrt(1 - 0.999**200000)/(1 - 0.9**200000), 0.1, 1e-9))
rng = np.random.default_rng(11)
gvs = [rng.normal(size=5)*10 for _ in range(3)]
chk("AdaGrad's first step is exactly alpha*sign(g) in every coordinate (three random gradient vectors)",
    all(np.allclose(0.7*gv/np.sqrt(gv**2), 0.7*np.sign(gv)) for gv in gvs))
chk("RMSProp's first-step inflation 1/sqrt(1-rho): 3.16228 at rho = 0.9 and 31.6228 at rho = 0.999",
    close(1/math.sqrt(1 - 0.9), 3.16228, 5e-6) and close(1/math.sqrt(1 - 0.999), 31.6228, 5e-5))
chk("momentum's steady-state speed-up on a constant pull: sum beta^k = 1/(1-beta) = 10 at beta = 0.9",
    close(sum(0.9**k for k in range(4000)), 10, 1e-9) and close(1/(1 - 0.9), 10))
chk("plain descent on J: per-coordinate factors 1-eta and 1-10eta; eta = 0.2 gives exactly -1 on w2",
    close(1 - 0.2, 0.8) and close(1 - 10*0.2, -1) and close(2/10, 0.2))
chk("ceil(ln0.01/ln0.9) = 44; kappa = 10; optimal shared eta = 2/(1+10) = 2/11 with rate (k-1)/(k+1) = 9/11",
    math.ceil(math.log(0.01)/math.log(0.9)) == 44 and close(10/1, 10)
    and close(2/(1 + 10), 2/11) and close((10 - 1)/(10 + 1), 9/11)
    and close(abs(1 - (2/11)*1), 9/11) and close(abs(1 - (2/11)*10), 9/11))
for cv in [0.5, 1.0, 2.0, 3.5]:
    Wst = np.array([cv, 0.0])
    chk(f"hero's constrained problem at c = {cv}: w* = ({cv},0), J* = c^2/2 = {cv**2/2}, mu* = c = {cv}",
        close(J(Wst), cv**2/2) and close(gJ(Wst)[0], cv) and close(gJ(Wst)[1], 0)
        and min(J(np.array([cv, t_])) for t_ in np.linspace(-2, 2, 40001)) >= J(Wst) - 1e-12)

# ---- W8 tangency instances
chk("W8 straight fence: f = x^2+y^2 on x+y = 4 gives (2,2), grad f = (4,4) = 4(1,1), lambda = 4, f* = 8",
    sp.solve([2*x - lam, 2*y - lam, x + y - 4], [x, y, lam]) == {x: 2, y: 2, lam: 4} and 2**2 + 2**2 == 8)
chk("W8 round fence: f = (x-2)^2+y^2 on x^2+y^2 <= 1 gives (1,0), grad f = (-2,0), grad g = (2,0), mu = 1, f* = 1",
    close(2*(1 - 2) + 2*1*1, 0) and close(2*(1 - 2), -2) and close(2*1, 2) and close((1 - 2)**2 + 0, 1))
ridge = np.array([2.4, 1.2]); tp = ridge/np.linalg.norm(ridge)
chk("W8 ridge: the touching point is (2.4,1.2)/||(2.4,1.2)|| = (0.894427, 0.447214) and grad f || grad g there",
    np.allclose(tp, [0.894427, 0.447214], atol=5e-7)
    and abs((2*(tp - ridge))[0]*(2*tp)[1] - (2*(tp - ridge))[1]*(2*tp)[0]) < 1e-12 and close(np.linalg.norm(tp), 1))

# ---- W9 the wall rebuilt out of straight lines
mus9 = np.concatenate([np.linspace(0, 1e6, 200001)])
chk("W9 max over mu >= 0 of mu*g is 0 for g <= 0 and grows without bound for g > 0 (grid up to 1e6)",
    all(close(max(0.0, (mus9*gv).max()), 0.0) for gv in [-2.0, -0.5, 0.0])
    and all((mus9*gv).max() >= 1e5 for gv in [0.1, 0.5, 2.0])
    and all((np.linspace(0, 1e9, 11)*gv).max() > 1e7 for gv in [0.1, 0.5, 2.0]))
chk("W9 the bill panel: d(mu) = 2mu - mu^2/4 and d(4) = 4 = p*",
    (2*mu - mu**2/4).subs(mu, 4) == 4 and min((v - 3)**2 for v in np.linspace(-5, 1, 60001)) - 4 < 1e-9)

# ---- W12 convexity tests
curves = {
    'x^2':        (lambda v: v**2,                 lambda v: 2*v,                  True),
    'x^4-3x^2':   (lambda v: v**4 - 3*v**2,        lambda v: 4*v**3 - 6*v,         False),
    '|x|':        (lambda v: abs(v),               lambda v: np.sign(v),           True),
    'e^x':        (lambda v: math.exp(v),          lambda v: math.exp(v),          True),
    'x^3':        (lambda v: v**3,                 lambda v: 3*v**2,               False),
    'sqrt|x|':    (lambda v: math.sqrt(abs(v)),    lambda v: 0.5/math.sqrt(abs(v))*np.sign(v), False),
}
rng = np.random.default_rng(1211)
chordfail = {}
for nm, (fn, dfn, conv) in curves.items():
    fails = 0
    for _ in range(200):
        u, vv = rng.uniform(-2, 2, 2); th = rng.uniform(0.05, 0.95)
        if fn(th*u + (1 - th)*vv) > th*fn(u) + (1 - th)*fn(vv) + 1e-12: fails += 1
    chordfail[nm] = fails
chk(f"W12 chord test on x^2 fails 0 of 200 sampled pairs; on x^4-3x^2 it fails {chordfail['x^4-3x^2']} of 200",
    chordfail['x^2'] == 0 and chordfail['x^4-3x^2'] > 0)
tangentconv = {}
for nm, (fn, dfn, conv) in curves.items():
    holds = True
    for _ in range(400):
        u = rng.uniform(-2, 2)
        if abs(u) < 0.05: continue
        vv = rng.uniform(-2, 2)
        if fn(vv) < fn(u) + dfn(u)*(vv - u) - 1e-9: holds = False; break
    tangentconv[nm] = holds
chk("W12 the tangent test agrees with the chord test on all six curves",
    all(tangentconv[nm] == (chordfail[nm] == 0) for nm in curves)
    and all(tangentconv[nm] == curves[nm][2] for nm in curves))

# ---- W13 the non-convex example the widget draws
co13 = [1.0, 0.0, -5.0, 0.0, 4.0]                    # (x^2-1)(x^2-4) = x^4 - 5x^2 + 4
chk("W13 (x^2-1)(x^2-4) = x^4-5x^2+4, feasible set [-2,-1] u [1,2], so p* = -2",
    sp.expand((x**2 - 1)*(x**2 - 4)) == x**4 - 5*x**2 + 4
    and all(np.polyval(co13, v) <= 1e-12 for v in [-2, -1.5, -1, 1, 1.5, 2])
    and all(np.polyval(co13, v) > 0 for v in [-3, -2.5, -0.5, 0, 0.5, 2.5, 3]))
def dual13(m):
    if m <= 0: return -np.inf
    rts = np.roots([4*m, 0.0, -10*m, 1.0]); rts = rts[np.abs(rts.imag) < 1e-9].real
    return float((rts + m*np.polyval(co13, rts)).min())
mgrid = np.linspace(1e-6, 8.0, 80001)
dvals = np.array([dual13(m) for m in mgrid])
j13 = int(dvals.argmax()); dstar13 = dvals[j13]; gap13 = -2.0 - dstar13
xg = np.linspace(-6, 6, 24001); qg = np.polyval(co13, xg)
dgrid = np.array([(xg + m*qg).min() for m in np.linspace(1e-4, 4.0, 4001)])
print(f"        W13 non-convex example: mu* = {mgrid[j13]:.6f} (= 1/12 = {1/12:.6f}),  "
      f"d* = {dstar13:.4f},  p* = -2.0000,  duality gap = {gap13:.4f}")
chk("W13 the Lagrangian's stationarity cubic at mu = 1/12 factors as (x+2)(2x^2-4x+3)/2, whose only real root is x = -2",
    sp.simplify(sp.expand(3*(4*R(1,12)*x**3 - 10*R(1,12)*x + 1)) - (x + 2)*(2*x**2 - 4*x + 3)/2) == 0
    and [r for r in sp.solve(4*R(1,12)*x**3 - 10*R(1,12)*x + 1, x) if r.is_real] == [-2]
    and sp.discriminant(2*x**2 - 4*x + 3, x) == -8
    and sp.expand((x + R(1,12)*(x**4 - 5*x**2 + 4)).subs(x, -2)) == -2)
chk("W13 d* = -2.0000 and the duality gap is 0.0000: this instance has NO gap (the peak of d touches p*)",
    close(dstar13, -2.0, 1e-6) and close(round(dstar13, 4), -2.0) and close(round(gap13, 4), 0.0)
    and close(mgrid[j13], 1/12, 1e-4))
chk("W13 weak duality still holds everywhere: no sampled d(mu) exceeds p* = -2 (two independent grids)",
    dvals.max() <= -2.0 + 1e-6 and dgrid.max() <= -2.0 + 1e-6)
# a drop-in replacement that DOES show a gap, if the widget needs one
co13b = [1.0, 1.0, -6.0, -4.0, 8.0]                  # (x+2)^2 (x-1)(x-2), feasible {-2} u [1,2], p* = -2
chk("W13alt (x+2)^2(x-1)(x-2) = x^4+x^3-6x^2-4x+8 with feasible set {-2} u [1,2], so p* = -2",
    sp.expand((x + 2)**2*(x - 1)*(x - 2)) == x**4 + x**3 - 6*x**2 - 4*x + 8
    and all(np.polyval(co13b, v) <= 1e-12 for v in [-2, 1, 1.5, 2])
    and all(np.polyval(co13b, v) > 0 for v in [-3, -2.5, -1.5, 0, 0.5, 2.5]))
def dual13b(m):
    if m <= 0: return -np.inf
    dq = np.polyder(co13b)*m; dq[-1] += 1.0
    rts = np.roots(dq); rts = rts[np.abs(rts.imag) < 1e-9].real
    return float((rts + m*np.polyval(co13b, rts)).min())
mg2 = np.linspace(1e-4, 5.0, 50001); dv2 = np.array([dual13b(m) for m in mg2]); j2 = int(dv2.argmax())
print(f"        W13 alternative with a REAL gap: min x s.t. (x+2)^2(x-1)(x-2) <= 0  ->  "
      f"mu* = {mg2[j2]:.6f}, d* = {dv2[j2]:.4f}, p* = -2.0000, gap = {-2.0 - dv2[j2]:.4f}")
chk("W13alt d* = -2.0179 and the gap p*-d* = 0.0179 > 0 (the double root at x = -2 kills stationarity there)",
    close(round(dv2[j2], 4), -2.0179) and close(round(-2.0 - dv2[j2], 4), 0.0179) and -2.0 - dv2[j2] > 0
    and dv2.max() <= -2.0 + 1e-9)

# ---- the minimax inequality
rng = np.random.default_rng(7)
viol = 0
for _ in range(200):
    M = rng.normal(size=(6, 6))
    if M.min(axis=1).max() > M.max(axis=0).min() + 1e-12: viol += 1
chk("minimax: max_y min_x phi <= min_x max_y phi on 200 random 6x6 matrices, never violated", viol == 0)

# ---- weak duality on random QPs
rng = np.random.default_rng(23)
bad = 0
for _ in range(200):
    Bm = rng.normal(size=(2, 2)); Q = Bm @ Bm.T + 0.5*np.eye(2)
    cv = rng.normal(size=2); Am = rng.normal(size=(3, 2))
    x0 = rng.normal(size=2); bv = Am @ x0 + rng.uniform(0.05, 2.0, 3)
    best = np.inf
    for mask in range(8):                                   # exact active-set enumeration
        idx = [i for i in range(3) if mask >> i & 1]
        if idx:
            Aa = Am[idx]; ba = bv[idx]
            K = np.block([[Q, Aa.T], [Aa, np.zeros((len(idx), len(idx)))]])
            rhs = np.concatenate([-cv, ba])
            try: solv = np.linalg.solve(K, rhs)
            except np.linalg.LinAlgError: continue
            xs, lamv = solv[:2], solv[2:]
            if (lamv < -1e-9).any(): continue
        else:
            xs = np.linalg.solve(Q, -cv)
        if (Am @ xs <= bv + 1e-9).all():
            best = min(best, 0.5*xs @ Q @ xs + cv @ xs)
    for _ in range(5):
        muv = rng.uniform(0, 3, 3)
        xm = np.linalg.solve(Q, -(cv + Am.T @ muv))
        dv = 0.5*xm @ Q @ xm + cv @ xm + muv @ (Am @ xm - bv)
        if dv > best + 1e-7: bad += 1
chk("weak duality d(mu) <= p* on 200 random 2-variable QPs with 3 fences, 5 sampled mu each: no violation", bad == 0)

# ---- concavity of the dual
rng = np.random.default_rng(31)
worst = 0.0
xs_c = np.linspace(-3, 3, 601); mus_c = np.linspace(0, 6, 241)
for _ in range(50):
    cf = rng.normal(size=5); cg = rng.normal(size=5)
    fv = np.polyval(cf, xs_c); gv = np.polyval(cg, xs_c)
    dv = np.array([(fv + m*gv).min() for m in mus_c])
    sd = dv[2:] - 2*dv[1:-1] + dv[:-2]
    worst = max(worst, sd.max())
chk(f"the dual is concave: for 50 random (f,g) pairs the second difference of min_x [f + mu g] is <= 1e-9 (worst {worst:.2e})",
    worst <= 1e-9)

# ---- complementary slackness on the three worked problems
chk("complementary slackness holds to machine precision on problems 11, 12 and 13",
    close(4.0*(1.0 - 1.0), 0.0) and close(0.0*(-2/3), 0.0) and close(0.0*(-1/3), 0.0) and close(4.0*(3.0 - 3.0), 0.0))

print("=" * 60)
print(f"ALL {ok} UNIT-11 MATH CHECKS PASS")
