# Unit 9 · Gradient descent — machine verification of every number printed in
# the practice arena (tpl/u9-practice.html) and of the numbers the unit's
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

x, y = sp.symbols('x y')
g = sp.Symbol('gamma')
R = sp.Rational

# --- P1: f = 2x^3 - 9x^2 + 12x + 5 ---
f1 = 2*x**3 - 9*x**2 + 12*x + 5
chk("P1a f' = 6x^2 - 18x + 12 = 6(x-1)(x-2); stationary points 1, 2",
    sp.expand(sp.diff(f1, x) - (6*x**2 - 18*x + 12)) == 0
    and sp.expand(sp.diff(f1, x) - 6*(x-1)*(x-2)) == 0
    and sorted(sp.solve(sp.diff(f1, x), x)) == [1, 2])
chk("P1b f'' = 12x - 18; f''(1) = -6 (max), f''(2) = +6 (min)",
    sp.expand(sp.diff(f1, x, 2) - (12*x - 18)) == 0
    and sp.diff(f1, x, 2).subs(x, 1) == -6 and sp.diff(f1, x, 2).subs(x, 2) == 6)
chk("P1b f(1) = 2 - 9 + 12 + 5 = 10, f(2) = 16 - 36 + 24 + 5 = 9",
    f1.subs(x, 1) == 10 and f1.subs(x, 2) == 9 and 2 - 9 + 12 + 5 == 10 and 16 - 36 + 24 + 5 == 9)
chk("P1c no global minimum: f(-10) = -3015 < 9 and f -> -inf as x -> -inf",
    f1.subs(x, -10) == -3015 and sp.limit(f1, x, -sp.oo) == -sp.oo)

# --- P2: GD on x^2 + 2y^2, gamma = 0.1, from (4,2) ---
f2 = x**2 + 2*y**2
chk("P2a grad = (2x, 4y); updates x <- 0.8x, y <- 0.6y",
    [sp.diff(f2, x), sp.diff(f2, y)] == [2*x, 4*y]
    and sp.expand(x - R(1,10)*2*x - R(4,5)*x) == 0 and sp.expand(y - R(1,10)*4*y - R(3,5)*y) == 0)
p = np.array([4.0, 2.0]); traj = [p.copy()]
for _ in range(2):
    grad = np.array([2*p[0], 4*p[1]]); p = p - 0.1*grad; traj.append(p.copy())
F2 = lambda q: q[0]**2 + 2*q[1]**2
chk("P2b table: (4,2) grad (8,8) f=24; (3.2,1.2) grad (6.4,4.8) f=13.12; (2.56,0.72) f=7.5904",
    close(F2(traj[0]), 24) and np.allclose(traj[1], [3.2, 1.2]) and close(F2(traj[1]), 13.12)
    and np.allclose(traj[2], [2.56, 0.72]) and close(F2(traj[2]), 7.5904)
    and np.allclose([2*4, 4*2], [8, 8]) and np.allclose([2*3.2, 4*1.2], [6.4, 4.8]))
chk("P2b pieces: 16 + 8 = 24; 10.24 + 2.88 = 13.12; 6.5536 + 1.0368 = 7.5904",
    close(3.2**2, 10.24) and close(2*1.2**2, 2.88) and close(2.56**2, 6.5536) and close(2*0.72**2, 1.0368)
    and close(6.5536 + 1.0368, 7.5904))
chk("P2c monotone: 24 > 13.12 > 7.5904; y-factor 0.6 < x-factor 0.8", 24 > 13.12 > 7.5904 and 0.6 < 0.8)

# --- P3: learning-rate decay, alpha0 = 0.8, k = 0.05 ---
a0, kd = 0.8, 0.05
chk("P3a exponential: t=10 -> 0.8e^-0.5 = 0.4852, t=20 -> 0.8e^-1 = 0.2943",
    close(a0*math.exp(-kd*10), 0.4852, 5e-5) and close(a0*math.exp(-kd*20), 0.2943, 5e-5))
chk("P3a inverse: t=10 -> 0.8/1.5 = 0.5333, t=20 -> 0.8/2 = 0.4",
    close(a0/(1 + kd*10), 0.5333, 5e-5) and close(1 + kd*10, 1.5) and close(a0/(1 + kd*20), 0.4))
chk("P3a exponential decays faster at both t", a0*math.exp(-0.5) < a0/1.5 and a0*math.exp(-1) < 0.4)
chk("P3b step decay /3 every 5 epochs: epoch 12 is in block floor(12/5) = 2 -> 0.8/9 = 0.0889",
    12 // 5 == 2 and close(a0/3**2, 0.8/9) and close(0.8/9, 0.0889, 5e-5))
t = sp.Symbol('t')
chk("P3c inverse decay hits alpha0/2 when 1 + kt = 2 => t = 1/k = 20",
    sp.solve(sp.Eq(sp.Rational(4,5)/(1 + sp.Rational(1,20)*t), sp.Rational(2,5)), t) == [20] and close(1/kd, 20))
chk("P3c bonus: at t = 1/k exponential decay is alpha0/e = 0.2943", close(a0/math.e, a0*math.exp(-1)) and close(a0/math.e, 0.2943, 5e-5))

# --- P4: shifted bowl (x-1)^2 + (y-2)^2 ---
f4 = x**2 + y**2 - 2*x - 4*y + 5
chk("P4a f = (x-1)^2 + (y-2)^2; grad = (2x-2, 2y-4); minimiser (1,2), f* = 0",
    sp.expand((x-1)**2 + (y-2)**2 - f4) == 0 and [sp.diff(f4, x), sp.diff(f4, y)] == [2*x - 2, 2*y - 4]
    and sp.solve([sp.diff(f4, x), sp.diff(f4, y)], [x, y]) == {x: 1, y: 2} and f4.subs({x: 1, y: 2}) == 0)
F4 = lambda q: (q[0]-1)**2 + (q[1]-2)**2
p = np.array([0.0, 0.0]); g4 = lambda q: np.array([2*q[0]-2, 2*q[1]-4])
chk("P4b f(0,0) = 5, grad (-2,-4); step -> (0.5,1), f = 0.25 + 1 = 1.25",
    close(F4(p), 5) and np.allclose(g4(p), [-2, -4]) and np.allclose(p - 0.25*g4(p), [0.5, 1])
    and close(F4(p - 0.25*g4(p)), 1.25) and close((-0.5)**2 + (-1)**2, 1.25))
p = p - 0.25*g4(p)
chk("P4b grad at (0.5,1) = (-1,-2); step -> (0.75,1.5), f = 0.0625 + 0.25 = 0.3125",
    np.allclose(g4(p), [-1, -2]) and np.allclose(p - 0.25*g4(p), [0.75, 1.5])
    and close(F4(p - 0.25*g4(p)), 0.3125) and close((-0.25)**2 + (-0.5)**2, 0.3125))
chk("P4b f shrinks by factor 4 each step: 5 -> 1.25 -> 0.3125; distance halves (factor 1 - 2*0.25 = 0.5)",
    close(5/1.25, 4) and close(1.25/0.3125, 4) and close(1 - 2*0.25, 0.5))
chk("P4 extra: 0.3125/4 = 0.078, /4 = 0.0195, /4 = 0.0049; f <= 0.01 first after 5 steps",
    close(0.3125/4, 0.078, 5e-4) and close(0.3125/16, 0.0195, 5e-5) and close(0.3125/64, 0.0049, 5e-5)
    and min(k for k in range(20) if 5/4**k <= 0.01) == 5)
chk("P1c f(-10) pieces: -2000 - 900 - 120 + 5 = -3015", -2000 - 900 - 120 + 5 == -3015)

# --- P5: x^3 - 3x + y^2 - 2y ---
f5 = x**3 - 3*x + y**2 - 2*y
cps5 = sorted((d[x], d[y]) for d in sp.solve([sp.diff(f5, x), sp.diff(f5, y)], [x, y], dict=True))
chk("P5a grad = (3x^2 - 3, 2y - 2); critical points (1,1) and (-1,1)",
    [sp.diff(f5, x), sp.diff(f5, y)] == [3*x**2 - 3, 2*y - 2] and cps5 == [(-1, 1), (1, 1)])
H5 = sp.hessian(f5, (x, y))
chk("P5b H = diag(6x, 2); at (1,1) eigenvalues 6, 2 (min); at (-1,1) eigenvalues -6, 2 (saddle)",
    H5 == sp.diag(6*x, 2) and sorted(H5.subs(x, 1).eigenvals()) == [2, 6]
    and sorted(H5.subs(x, -1).eigenvals()) == [-6, 2])
chk("P5c f(1,1) = 1 - 3 + 1 - 2 = -3; f(-1,1) = -1 + 3 + 1 - 2 = 1",
    f5.subs({x: 1, y: 1}) == -3 and f5.subs({x: -1, y: 1}) == 1 and 1 - 3 + 1 - 2 == -3 and -1 + 3 + 1 - 2 == 1)
q5 = np.array([0.5, 0.0])
for _ in range(300): q5 = q5 - 0.1*np.array([3*q5[0]**2 - 3, 2*q5[1] - 2])
chk("P5c no global min: f(-10,1) = -971; GD from (0.5,0) with gamma 0.1 reaches (1,1)",
    f5.subs({x: -10, y: 1}) == -971 and np.allclose(q5, [1, 1], atol=1e-6))
chk("P5c a nudge in x escapes the saddle: f(-1.1,1) < 1 and f(-0.9,1) < 1 (both sides go downhill)",
    f5.subs({x: R(-11,10), y: 1}) < 1 and f5.subs({x: R(-9,10), y: 1}) < 1)

# --- P6: quadratic form, A = [[4,1],[1,3]], b = (1,2) ---
A6 = sp.Matrix([[4, 1], [1, 3]]); b6 = sp.Matrix([1, 2])
X = sp.Matrix([x, y])
f6 = (R(1,2)*(X.T*A6*X) - b6.T*X)[0]
grad6 = sp.Matrix([sp.diff(f6, x), sp.diff(f6, y)])
chk("P6a grad f = Ax - b = (4x + y - 1, x + 3y - 2)", sp.simplify(grad6 - (A6*X - b6)) == sp.zeros(2, 1))
xs6 = A6.solve(b6)
chk("P6a x* = (1/11, 7/11) ~ (0.091, 0.636); y = 1 - 4x, -11x = -1",
    xs6 == sp.Matrix([R(1,11), R(7,11)]) and close(1/11, 0.091, 5e-4) and close(7/11, 0.636, 5e-4)
    and sp.solve(sp.Eq(x + 3*(1 - 4*x), 2), x) == [R(1,11)] and 1 - R(4,11) == R(7,11))
chk("P6a A positive definite: 4 > 0, det = 11 > 0", A6[0,0] == 4 and A6.det() == 11)
chk("P6a f* = -(1/2) b^T x* = -(1/2)(1/11 + 14/11) = -15/22 ~ -0.682",
    f6.subs({x: R(1,11), y: R(7,11)}) == R(-15,22) and -R(1,2)*(R(1,11) + R(14,11)) == R(-15,22)
    and close(-15/22, -0.682, 5e-4))
x1f = -0.1*np.array([-1.0, -2.0]); An = np.array([[4, 1], [1, 3.]]); bn = np.array([1, 2.])
F6 = lambda q: 0.5*q@An@q - bn@q
chk("P6b g0 = -b = (-1,-2); x1 = (0.1,0.2); Ax1 = (0.6,0.7); x^T A x = 0.2; b^T x = 0.5; f = -0.4",
    np.allclose(An@np.zeros(2) - bn, [-1, -2]) and np.allclose(x1f, [0.1, 0.2]) and np.allclose(An@x1f, [0.6, 0.7])
    and close(x1f@An@x1f, 0.2) and close(bn@x1f, 0.5) and close(F6(x1f), -0.4))
gx, gy = sp.symbols('g_x g_y'); G = sp.Matrix([gx, gy])
hline = f6.subs({x: x - g*gx, y: y - g*gy}, simultaneous=True)
hprime = sp.diff(hline, g)
gsub = {gx: (A6*X - b6)[0], gy: (A6*X - b6)[1]}
chk("P6c h'(gamma) = -g^T g + gamma g^T A g when g = Ax - b",
    sp.simplify(hprime.subs(gsub) - (-(G.T*G)[0] + g*(G.T*A6*G)[0]).subs(gsub)) == 0)
chk("P6c h'' = g^T A g > 0 for positive-definite A (checked at x = 0)",
    sp.simplify(sp.diff(hline, g, 2).subs(gsub) - (G.T*A6*G)[0].subs(gsub)) == 0)
g0 = np.array([-1.0, -2.0])
gs = g0@g0/(g0@An@g0)
chk("P6c at 0: g^T g = 5, A g = (-6,-7), g^T A g = 6 + 14 = 20, gamma* = 0.25",
    close(g0@g0, 5) and np.allclose(An@g0, [-6, -7]) and close(g0@An@g0, 20) and close(gs, 0.25))
xls = -gs*g0
chk("P6c x1 = (0.25,0.5); Ax = (1.5,1.75); x^T A x = 0.375 + 0.875 = 1.25; b^T x = 1.25; f = -0.625",
    np.allclose(xls, [0.25, 0.5]) and np.allclose(An@xls, [1.5, 1.75]) and close(xls@An@xls, 1.25)
    and close(bn@xls, 1.25) and close(F6(xls), -0.625))
chk("P6c table: -0.400 (fixed) > -0.625 (line search) > -0.682 (optimum)", -0.4 > -0.625 > -15/22)
chk("P6c exact line search is optimal along the ray (brute-force scan)",
    min(F6(-gg*g0) for gg in np.linspace(0, 1, 100001)) >= F6(xls) - 1e-12)

# --- P7: f = 3x^2 + y^2 from (1,3), exact line search ---
f7 = 3*x**2 + y**2
chk("P7a grad = (6x, 2y); trial point ((1-6g)x, (1-2g)y)",
    [sp.diff(f7, x), sp.diff(f7, y)] == [6*x, 2*y]
    and sp.expand(x - g*6*x - (1 - 6*g)*x) == 0 and sp.expand(y - g*2*y - (1 - 2*g)*y) == 0)
h7 = 3*(1 - 6*g)**2*x**2 + (1 - 2*g)**2*y**2
chk("P7a h(g) = 3(1-6g)^2 x^2 + (1-2g)^2 y^2", sp.expand(f7.subs({x: x - 6*g*x, y: y - 2*g*y}, simultaneous=True) - h7) == 0)
chk("P7a h' = -36x^2(1-6g) - 4y^2(1-2g); h'' = 216x^2 + 8y^2 > 0",
    sp.expand(sp.diff(h7, g) - (-36*x**2*(1 - 6*g) - 4*y**2*(1 - 2*g))) == 0
    and sp.expand(sp.diff(h7, g, 2) - (216*x**2 + 8*y**2)) == 0)
gstar7 = sp.solve(sp.diff(h7, g), g)[0]
chk("P7a gamma* = (36x^2 + 4y^2)/(216x^2 + 8y^2) = (9x^2 + y^2)/(54x^2 + 2y^2)",
    sp.simplify(gstar7 - (36*x**2 + 4*y**2)/(216*x**2 + 8*y**2)) == 0
    and sp.simplify(gstar7 - (9*x**2 + y**2)/(54*x**2 + 2*y**2)) == 0)
chk("P7b at (1,3): gamma* = 18/72 = 1/4",
    gstar7.subs({x: 1, y: 3}) == R(1,4) and 9 + 9 == 18 and 54 + 18 == 72)
chk("P7b new point (1 - 6/4, 3 - 6/4) = (-1/2, 3/2); f: 12 -> 3/4 + 9/4 = 3",
    (1 - 6*R(1,4)*1, 3 - 2*R(1,4)*3) == (R(-1,2), R(3,2)) and f7.subs({x: 1, y: 3}) == 12
    and f7.subs({x: R(-1,2), y: R(3,2)}) == 3 and 3*R(1,4) + R(9,4) == 3)
chk("P7b removed 75% of the objective", close(1 - 3/12, 0.75))

# --- P8: finite-difference audit of J = w1^3 + w1 w2^2 at (2,1), delta 0.1 ---
w1, w2 = sp.symbols('w1 w2')
J8 = w1**3 + w1*w2**2
chk("P8a dJ/dw1 = 3w1^2 + w2^2 = 13, dJ/dw2 = 2 w1 w2 = 4 at (2,1)",
    sp.diff(J8, w1) == 3*w1**2 + w2**2 and sp.diff(J8, w2) == 2*w1*w2
    and sp.diff(J8, w1).subs({w1: 2, w2: 1}) == 13 and sp.diff(J8, w2).subs({w1: 2, w2: 1}) == 4)
Jn = lambda a, b: a**3 + a*b**2
chk("P8b J(2,1) = 10, J(2.1,1) = 9.261 + 2.1 = 11.361, J(2,1.1) = 8 + 2.42 = 10.42",
    close(Jn(2, 1), 10) and close(2.1**3, 9.261) and close(Jn(2.1, 1), 11.361) and close(2*1.21, 2.42) and close(Jn(2, 1.1), 10.42))
fw1 = (Jn(2.1, 1) - Jn(2, 1))/0.1; fw2 = (Jn(2, 1.1) - Jn(2, 1))/0.1
chk("P8b forward: 13.61 (error 0.61) and 4.20 (error 0.20)",
    close(fw1, 13.61) and close(fw1 - 13, 0.61) and close(fw2, 4.2) and close(fw2 - 4, 0.2))
cw1 = (Jn(2.1, 1) - Jn(1.9, 1))/0.2
chk("P8c J(1.9,1) = 6.859 + 1.9 = 8.759; central (11.361 - 8.759)/0.2 = 13.01, error 0.01",
    close(1.9**3, 6.859) and close(Jn(1.9, 1), 8.759) and close(cw1, 13.01) and close(cw1 - 13, 0.01))
chk("P8c forward error ~ delta * J_w1w1 / 2 = 0.1 * 12/2 = 0.6; central ~ delta^2 * J_w1w1w1 / 6 = 0.01 * 6/6 = 0.01",
    sp.diff(J8, w1, 2).subs({w1: 2, w2: 1}) == 12 and close(0.1*12/2, 0.6) and sp.diff(J8, w1, 3) == 6
    and close(0.01*6/6, 0.01) and close(fw1 - 13, 0.61) and close(cw1 - 13, 0.01))
chk("P8c shrink delta tenfold: forward error 0.0601 (÷10), central error 0.0001 (÷100)",
    close((Jn(2.01, 1) - 10)/0.01 - 13, 0.0601, 1e-6) and close((Jn(2.01, 1) - Jn(1.99, 1))/0.02 - 13, 0.0001, 1e-6))
chk("P8c forward w2 error exactly delta * J_w2w2/2 = 0.1*4/2 = 0.2 (J is quadratic in w2)",
    sp.diff(J8, w2, 2).subs({w1: 2}) == 4 and close(fw2 - 4, 0.2))

# --- P9: J = x^2 + 4y^2 at (2,1), exact line search ---
J9 = x**2 + 4*y**2
chk("P9a grad = (2x, 8y) = (4,8) at (2,1); descent direction -(4,8)",
    [sp.diff(J9, x), sp.diff(J9, y)] == [2*x, 8*y] and [sp.diff(J9, x).subs(x, 2), sp.diff(J9, y).subs(y, 1)] == [4, 8])
h9 = (2 - 4*g)**2 + 4*(1 - 8*g)**2
chk("P9a h(g) = (2-4g)^2 + 4(1-8g)^2", sp.expand(J9.subs({x: 2 - 4*g, y: 1 - 8*g}) - h9) == 0)
chk("P9a h' = -8(2-4g) - 64(1-8g) = 544g - 80; h'' = 544",
    sp.expand(sp.diff(h9, g) - (-8*(2 - 4*g) - 64*(1 - 8*g))) == 0 and sp.expand(sp.diff(h9, g)) == 544*g - 80
    and sp.diff(h9, g, 2) == 544)
chk("P9a gamma* = 80/544 = 5/34 ~ 0.147", sp.solve(sp.diff(h9, g), g) == [R(5,34)] and R(80,544) == R(5,34) and close(5/34, 0.147, 5e-4))
w1p = (2 - 4*R(5,34), 1 - 8*R(5,34))
chk("P9b w1 = (48/34, -6/34) = (24/17, -3/17) ~ (1.412, -0.176)",
    w1p == (R(48,34), R(-6,34)) and w1p == (R(24,17), R(-3,17)) and close(24/17, 1.412, 5e-4) and close(-3/17, -0.176, 5e-4))
chk("P9b J: 8 -> (576 + 36)/289 = 612/289 = 36/17 ~ 2.118; ~74% removed",
    J9.subs({x: 2, y: 1}) == 8 and J9.subs({x: R(24,17), y: R(-3,17)}) == R(36,17) and R(576,289) + R(36,289) == R(612,289)
    and R(612,289) == R(36,17) and close(36/17, 2.118, 5e-4) and close(1 - (36/17)/8, 0.735, 5e-3))
chk("P9b y overshoots past 0 (to -3/17 < 0) while x stays positive", w1p[1] < 0 < w1p[0])
chk("P9 perpendicularity: next gradient (48/17, -24/17) is perpendicular to (4,8)",
    sp.Matrix([2*R(24,17), 8*R(-3,17)]).dot(sp.Matrix([4, 8])) == 0)

# --- P10: coupled quadratic x^2 + xy + y^2 ---
f10 = x**2 + x*y + y**2
H10 = sp.hessian(f10, (x, y))
chk("P10a grad = (2x + y, x + 2y); only critical point (0,0), f = 0",
    [sp.diff(f10, x), sp.diff(f10, y)] == [2*x + y, x + 2*y]
    and sp.solve([sp.diff(f10, x), sp.diff(f10, y)], [x, y]) == {x: 0, y: 0} and f10.subs({x: 0, y: 0}) == 0)
chk("P10a H = [[2,1],[1,2]], eigenvalues 2 ± 1 = 3, 1 > 0: positive definite",
    H10 == sp.Matrix([[2, 1], [1, 2]]) and sorted(H10.eigenvals()) == [1, 3])
F10 = lambda q: q[0]**2 + q[0]*q[1] + q[1]**2
G10 = lambda q: np.array([2*q[0] + q[1], q[0] + 2*q[1]])
p = np.array([2.0, 0.0])
chk("P10b at (2,0): grad (4,2), f = 4; -> (1.2,-0.4); f = 1.44 - 0.48 + 0.16 = 1.12",
    np.allclose(G10(p), [4, 2]) and close(F10(p), 4) and np.allclose(p - 0.2*G10(p), [1.2, -0.4])
    and close(F10(p - 0.2*G10(p)), 1.12) and close(1.44 - 0.48 + 0.16, 1.12) and close(1.2*(-0.4), -0.48))
p = p - 0.2*G10(p)
chk("P10b at (1.2,-0.4): grad (2.0,0.4); -> (0.8,-0.48); f = 0.64 - 0.384 + 0.2304 = 0.4864",
    np.allclose(G10(p), [2.0, 0.4]) and np.allclose(p - 0.2*G10(p), [0.8, -0.48])
    and close(F10(p - 0.2*G10(p)), 0.4864) and close(0.64 - 0.384 + 0.2304, 0.4864) and close(0.8*(-0.48), -0.384))
chk("P10c coupling: at (2,0) df/dy = x + 2y = 2 != 0 although y = 0",
    sp.diff(f10, y).subs({x: 2, y: 0}) == 2)
chk("P10c eigen-frame factors 1 - 0.2*3 = 0.4 and 1 - 0.2*1 = 0.8", close(1 - 0.2*3, 0.4) and close(1 - 0.2*1, 0.8))
chk("P10 eigenvector view: along (1,1) f = (3/2)t^2, along (1,-1) f = (1/2)t^2 (curvatures 3 and 1)",
    sp.expand(f10.subs({x: t, y: t}) - 3*t**2) == 0 and sp.expand(f10.subs({x: t, y: -t}) - t**2) == 0)

# --- P11: fit y = ax + b to (0,1),(1,3),(2,5),(3,7) by GD ---
xd = np.array([0, 1, 2, 3.]); yd = np.array([1, 3, 5, 7.]); n = 4
Sx, Sy, Sxx, Sxy = xd.sum(), yd.sum(), (xd**2).sum(), (xd*yd).sum()
chk("P11a sums: Σx = 6, Σy = 16, Σx^2 = 14, Σxy = 0 + 3 + 10 + 21 = 34, n = 4",
    Sx == 6 and Sy == 16 and Sxx == 14 and Sxy == 34 and 0 + 3 + 10 + 21 == 34)
astar = (n*Sxy - Sx*Sy)/(n*Sxx - Sx**2); bstar = (Sy - astar*Sx)/n
chk("P11a a* = (136 - 96)/(56 - 36) = 40/20 = 2, b* = (16 - 12)/4 = 1",
    close(n*Sxy, 136) and close(Sx*Sy, 96) and close(n*Sxx, 56) and close(astar, 2) and close(bstar, 1))
L = lambda a, b: ((yd - (a*xd + b))**2).sum()
gradL = lambda a, b: (lambda r: np.array([-2*(xd*r).sum(), -2*r.sum()]))(yd - (a*xd + b))
chk("P11a L* = 0: y = 2x + 1 fits all four points exactly", close(L(2, 1), 0) and np.allclose(2*xd + 1, yd))
chk("P11b at (0,0): r = (1,3,5,7), Σx r = 34, Σr = 16, grad = (-68,-32), L0 = 1 + 9 + 25 + 49 = 84",
    np.allclose(yd, [1, 3, 5, 7]) and np.allclose(gradL(0, 0), [-68, -32]) and close(L(0, 0), 84) and 1 + 9 + 25 + 49 == 84)
a1, b1 = np.array([0, 0.]) - 0.05*gradL(0, 0)
r1 = yd - (a1*xd + b1)
chk("P11b (a1,b1) = (3.4,1.6); yhat = (1.6,5.0,8.4,11.8); r = (-0.6,-2.0,-3.4,-4.8); L1 = 0.36 + 4 + 11.56 + 23.04 = 38.96",
    close(a1, 3.4) and close(b1, 1.6) and np.allclose(a1*xd + b1, [1.6, 5.0, 8.4, 11.8])
    and np.allclose(r1, [-0.6, -2.0, -3.4, -4.8]) and close(L(a1, b1), 38.96) and close(0.36 + 4 + 11.56 + 23.04, 38.96))
chk("P11b Σx r = 0 - 2.0 - 6.8 - 14.4 = -23.2, Σr = -10.8, grad = (46.4, 21.6)",
    close((xd*r1).sum(), -23.2) and close(r1.sum(), -10.8) and np.allclose(gradL(a1, b1), [46.4, 21.6]))
a2, b2 = np.array([a1, b1]) - 0.05*gradL(a1, b1)
r2 = yd - (a2*xd + b2)
chk("P11b (a2,b2) = (1.08,0.52); yhat = (0.52,1.60,2.68,3.76); r = (0.48,1.40,2.32,3.24); L2 = 0.2304 + 1.96 + 5.3824 + 10.4976 = 18.0704",
    close(a2, 1.08) and close(b2, 0.52) and np.allclose(a2*xd + b2, [0.52, 1.60, 2.68, 3.76])
    and np.allclose(r2, [0.48, 1.40, 2.32, 3.24]) and close(L(a2, b2), 18.0704) and close(L(a2, b2), 18.07, 5e-3))
chk("P11b a overshoots 2 (3.4) then undershoots (1.08); L falls 84 > 38.96 > 18.07", a1 > 2 > a2 and 84 > 38.96 > 18.0704)
H11 = 2*np.array([[Sxx, Sx], [Sx, n]])
lam11 = np.sort(np.linalg.eigvalsh(H11))[::-1]
chk("P11c H = 2[[14,6],[6,4]] = [[28,12],[12,8]]; trace 36, det 80",
    np.allclose(H11, [[28, 12], [12, 8]]) and close(np.trace(H11), 36) and close(np.linalg.det(H11), 80))
chk("P11c (36 ± sqrt976)/2 = 18 ± sqrt244 (976 = 4*244)", 976 == 4*244 and close(math.sqrt(976)/2, math.sqrt(244)))
chk("P11c eigenvalues 18 ± sqrt(324 - 80) = 18 ± sqrt244 ~ 33.62, 2.38 (~33.6, 2.4); sqrt244 = 15.62",
    close(lam11[0], 18 + math.sqrt(244)) and close(lam11[1], 18 - math.sqrt(244)) and close(math.sqrt(244), 15.62, 5e-3)
    and close(lam11[0], 33.62, 5e-3) and close(lam11[1], 2.38, 5e-3))
chk("P11c gamma_max = 2/lambda_max ~ 0.0595; 0.05 is below it",
    close(2/lam11[0], 0.0595, 5e-4) and 0.05 < 2/lam11[0])
chk("P11c 1 - gamma lambda_max = 1 - 0.05*33.62 ~ -0.68: |.| < 1 (shrinks) and negative (alternates)",
    close(1 - 0.05*lam11[0], -0.68, 5e-3) and abs(1 - 0.05*lam11[0]) < 1 and 1 - 0.05*lam11[0] < 0)
# the sympy Hessian agrees with the sum formula
aa, bb = sp.symbols('a b')
Lsym = sum((int(yi) - (aa*int(xi) + bb))**2 for xi, yi in zip(xd, yd))
chk("P11c sympy Hessian of L agrees with [[28,12],[12,8]]", sp.hessian(Lsym, (aa, bb)) == sp.Matrix([[28, 12], [12, 8]]))
chk("P11c gamma = 0.02 gives 1 - 0.02*33.62 = +0.33: smooth approach", 0 < 1 - 0.02*lam11[0] < 1 and close(1 - 0.02*lam11[0], 0.33, 5e-3))
chk("P11c slow direction at gamma 0.02: 1 - 0.02*2.38 ~ 0.95", close(1 - 0.02*lam11[1], 0.95, 5e-3))
# stability of the whole run at 0.05 and blow-up just above the limit
def run11(gam, steps=200):
    q = np.array([0., 0.])
    for _ in range(steps): q = q - gam*gradL(*q)
    return q
chk("P11c 200 steps at gamma 0.05 converge to (2,1); at gamma 0.062 (above the limit) they blow up",
    np.allclose(run11(0.05), [2, 1], atol=1e-6) and np.linalg.norm(run11(0.062)) > 1e3 and 0.062 > 2/lam11[0])

# --- P12: binary-search line search on h = a^2 - 5a + 8 over [0,4] ---
al = sp.Symbol('alpha')
h12 = al**2 - 5*al + 8
chk("P12a h' = 2a - 5; h'(2) = -1, h'(3) = +1, h'(2.5) = 0; minimiser 2.5",
    sp.diff(h12, al) == 2*al - 5 and sp.diff(h12, al).subs(al, 2) == -1 and sp.diff(h12, al).subs(al, 3) == 1
    and sp.diff(h12, al).subs(al, R(5,2)) == 0 and sp.solve(sp.diff(h12, al), al) == [R(5,2)])
hn = lambda a: a*a - 5*a + 8
eps = 1e-6
chk("P12a probe: h(2+eps) < h(2); h(3+eps) > h(3); h(2.5+eps) = h(2.5) + eps^2 > h(2.5)",
    hn(2 + eps) < hn(2) and hn(3 + eps) > hn(3) and hn(2.5 + eps) > hn(2.5)
    and sp.expand(h12.subs(al, R(5,2) + t) - h12.subs(al, R(5,2)) - t**2) == 0)
lo, hi = 0.0, 4.0; trace = [(lo, hi)]
for _ in range(3):
    m = 0.5*(lo + hi)
    if hn(m + eps) < hn(m): lo = m
    else: hi = m
    trace.append((lo, hi))
chk("P12a trace [0,4] -> [2,4] -> [2,3] -> [2,2.5]; 2.5 inside every bracket",
    trace == [(0, 4), (2, 4), (2, 3), (2, 2.5)] and all(a <= 2.5 <= b for a, b in trace))
chk("P12a h values: h(2) = 2, h(3) = 2, h(2.5) = 1.75", hn(2) == 2 and hn(3) == 2 and hn(2.5) == 1.75)
chk("P12b width 4/2^k; 2^k >= 400 => k >= log2 400 = 8.64 => k = 9; 4/512 = 0.0078",
    close(math.log2(400), 8.64, 5e-3) and math.ceil(math.log2(400)) == 9
    and 4/2**8 > 0.01 and 4/2**9 <= 0.01 and close(4/512, 0.0078, 5e-5) and close(4/256, 0.0156, 5e-5))
chk("P12a h(2.5) = 6.25 - 12.5 + 8 = 1.75", close(6.25 - 12.5 + 8, 1.75))

# =============== numbers the sections and widgets lean on ===============
# lecture quartic
lq = x**4 + 7*x**3 + 5*x**2 - 17*x + 3
chk("quartic l' = 4x^3 + 21x^2 + 10x - 17, l'' = 12x^2 + 42x + 10",
    sp.expand(sp.diff(lq, x)) == 4*x**3 + 21*x**2 + 10*x - 17 and sp.expand(sp.diff(lq, x, 2)) == 12*x**2 + 42*x + 10)
roots = np.sort(np.roots([4, 21, 10, -17]).real)
lpp = lambda r: 12*r*r + 42*r + 10
lval = lambda r: r**4 + 7*r**3 + 5*r**2 - 17*r + 3
chk("quartic roots of l' ~ -4.4803, -1.4321, 0.6624; l'' signs +, -, +; l ~ -47.075, 21.247, -3.840",
    np.allclose(roots, [-4.4803, -1.4321, 0.6624], atol=5e-5)
    and lpp(roots[0]) > 0 and lpp(roots[1]) < 0 and lpp(roots[2]) > 0
    and np.allclose([lval(r) for r in roots], [-47.075, 21.247, -3.840], atol=5e-4))

# lecture quadratic f = 1/2 x^T A x + b^T x
AL = np.array([[2, 1], [1, 20.]]); bL = np.array([-5, -3.])
fL = lambda q: 0.5*q@AL@q + bL@q
xsL = np.linalg.solve(AL, -bL)
chk("lecture quadratic x* = (97/39, 1/39) ~ (2.4872, 0.0256), f* = -6.2564",
    np.allclose(xsL, [97/39, 1/39]) and np.allclose(xsL, [2.4872, 0.0256], atol=5e-5) and close(fL(xsL), -6.2564, 5e-5)
    and sp.Matrix([[2, 1], [1, 20]]).solve(sp.Matrix([5, 3])) == sp.Matrix([R(97,39), R(1,39)]))
lamL = np.sort(np.linalg.eigvalsh(AL))[::-1]
chk("lecture quadratic eigenvalues 11 ± sqrt82 ~ 20.0554, 1.9446; 2/lambda_max ~ 0.09972",
    close(lamL[0], 11 + math.sqrt(82)) and close(lamL[1], 11 - math.sqrt(82))
    and close(lamL[0], 20.0554, 5e-5) and close(lamL[1], 1.9446, 5e-5) and close(2/lamL[0], 0.09972, 5e-6))
def runL(gam, steps=30):
    q = np.array([-3., -1.]); norms = []
    for _ in range(steps):
        q = q - gam*(AL@q + bL); norms.append(np.linalg.norm(q - xsL))
    return q, norms
qa, _ = runL(0.05); qb, _ = runL(0.09); qc, nc = runL(0.1); qd, nd = runL(0.11)
chk("30 GD steps from (-3,-1): gamma 0.05 -> f ~ -6.1946; gamma 0.09 -> f ~ -6.2561",
    close(fL(qa), -6.1946, 5e-5) and close(fL(qb), -6.2561, 5e-5) and fL(qa) > fL(qb) > fL(xsL))
chk("gamma 0.1 (> 2/lambda_max) diverges: |x - x*| grows step by step at the end, f ~ 18.36 far above f*; gamma 0.11: |x - x*| > 100",
    0.1 > 2/lamL[0] and nc[-1] > nc[-2] > nc[-3] > nc[-4] and close(fL(qc), 18.36, 5e-3) and fL(qc) > fL(xsL) + 20 and nd[-1] > 100)

# x^2 + 3y^2 from (2,2) with exact line search
fq = x**2 + 3*y**2; Aq = sp.diag(2, 6)
def ls_step(pt):
    gv = sp.Matrix([sp.diff(fq, x), sp.diff(fq, y)]).subs({x: pt[0], y: pt[1]})
    gam = (gv.T*gv)[0]/(gv.T*Aq*gv)[0]
    return gam, gv, sp.Matrix(pt) - gam*gv
g1, gv1, p1 = ls_step([2, 2])
chk("x^2+3y^2 from (2,2): grad (4,12), gamma1 = 5/28, x1 = (9/7,-1/7), f1 = 12/7",
    gv1 == sp.Matrix([4, 12]) and g1 == R(5,28) and p1 == sp.Matrix([R(9,7), R(-1,7)]) and fq.subs({x: p1[0], y: p1[1]}) == R(12,7))
h1 = (2 - 4*g)**2 + 3*(2 - 12*g)**2
chk("x^2+3y^2: h(g) = (2-4g)^2 + 3(2-12g)^2, h' = 896g - 160, same gamma1",
    sp.expand(sp.diff(h1, g)) == 896*g - 160 and sp.solve(sp.diff(h1, g), g) == [R(5,28)])
g2, gv2, p2 = ls_step(p1)
chk("x^2+3y^2 step 2: grad (18/7,-6/7), gamma2 = 5/12, x2 = (3/14,3/14), f2 = 9/49",
    gv2 == sp.Matrix([R(18,7), R(-6,7)]) and g2 == R(5,12) and p2 == sp.Matrix([R(3,14), R(3,14)])
    and fq.subs({x: p2[0], y: p2[1]}) == R(9,49))
chk("perpendicularity: successive gradients (4,12)·(18/7,-6/7) = 0", gv1.dot(gv2) == 0)

# fitting data (1,3.1),(2,4.9),(3,7.3),(4,9.1)
xf = np.array([1, 2, 3, 4.]); yf = np.array([3.1, 4.9, 7.3, 9.1])
Sx, Sy, Sxx, Sxy = xf.sum(), yf.sum(), (xf**2).sum(), (xf*yf).sum()
af = (4*Sxy - Sx*Sy)/(4*Sxx - Sx**2); bf = (Sy - af*Sx)/4
Lf = ((yf - (af*xf + bf))**2).sum()
chk("fitting data: a* = 2.04, b* = 1, L* = 0.072", close(af, 2.04) and close(bf, 1) and close(Lf, 0.072))
Hf = 2*np.array([[Sxx, Sx], [Sx, 4]]); lamf = np.sort(np.linalg.eigvalsh(Hf))[::-1]
chk("fitting data Hessian [[60,20],[20,8]], eigenvalues 34 ± sqrt1076 ~ 66.80, 1.20; 2/lambda_max ~ 0.02994",
    np.allclose(Hf, [[60, 20], [20, 8]]) and close(lamf[0], 34 + math.sqrt(1076)) and close(lamf[1], 34 - math.sqrt(1076))
    and close(lamf[0], 66.80, 5e-3) and close(lamf[1], 1.20, 5e-3) and close(2/lamf[0], 0.02994, 5e-6))

# steepest ascent fact
rng = np.random.default_rng(9)
gvec = rng.normal(size=5)
dirs = rng.normal(size=(2000, 5)); dirs /= np.linalg.norm(dirs, axis=1, keepdims=True)
uhat = gvec/np.linalg.norm(gvec)
chk("steepest ascent: grad·u <= |grad| for 2000 random unit u; equality at u = grad/|grad|; -|grad| at -u",
    np.all(dirs@gvec <= np.linalg.norm(gvec) + 1e-12) and close(uhat@gvec, np.linalg.norm(gvec))
    and close(-uhat@gvec, -np.linalg.norm(gvec)) and np.max(dirs@gvec) < np.linalg.norm(gvec))

# 1-D quadratic f = 1/2 lambda x^2
lam, x0 = sp.symbols('lambda x0')
chk("1-D: x_{k+1} = (1 - gamma lambda) x_k; gamma lambda = 1 lands at 0; gamma lambda = 2 bounces to -x0",
    sp.expand(x0 - g*sp.diff(R(1,2)*lam*x**2, x).subs(x, x0) - (1 - g*lam)*x0) == 0
    and (1 - g*lam).subs(g*lam, 1) == 0 and ((1 - g*lam)*x0).subs(g*lam, 2) == -x0)
chk("1-D: steps to shrink 100x at gamma lambda = 0.1: ceil(ln100/|ln 0.9|) = 44; 0.9^43 > 0.01 >= 0.9^44",
    math.ceil(math.log(100)/abs(math.log(0.9))) == 44 and 0.9**43 > 0.01 >= 0.9**44)

# descent lemma on the lecture quadratic (L = lambda_max)
Lc = lamL[0]; xq = np.array([-3., -1.]); gq = AL@xq + bL
chk("descent lemma at (-3,-1) for gamma in {0.02, 0.05, 0.09}: f(x - g grad) <= f(x) - g(1 - Lg/2)|grad|^2",
    all(fL(xq - gm*gq) <= fL(xq) - gm*(1 - Lc*gm/2)*(gq@gq) + 1e-12 for gm in [0.02, 0.05, 0.09]))
chk("descent lemma bound is negative-slope only while gamma < 2/L", all(1 - Lc*gm/2 > 0 for gm in [0.02, 0.05, 0.09]) and 1 - Lc*0.1/2 < 0)

# finite-difference orders (P8 restated)
chk("FD orders: forward error ~ delta*6 = 0.6 vs actual 0.61; central error ~ delta^2*1 = 0.01 vs actual 0.01",
    close(0.1*6, 0.6) and close(fw1 - 13, 0.61) and abs((fw1 - 13) - 0.6) < 0.02 and close(cw1 - 13, 0.01))

# golden section
phi_r = (math.sqrt(5) - 1)/2
chk("golden ratio (sqrt5 - 1)/2 = 0.61803; width <= 0.01 from [0,4]: binary 9, golden ceil(ln 0.0025/ln 0.618) = 13",
    close(phi_r, 0.61803, 5e-6) and math.ceil(math.log(0.0025)/math.log(phi_r)) == 13
    and math.ceil(math.log2(400)) == 9 and 4*phi_r**12 > 0.01 >= 4*phi_r**13)

# minibatch unbiasedness with the widget's LCG data
N = 40; s = 7; xs_, ys_ = [], []
for i in range(1, N + 1):
    s = (s*1664525 + 1013904223) % 2**32
    noise = (s/2**32 - 0.5)*1.4
    xi = -2 + 4*(i - 1)/39
    xs_.append(xi); ys_.append(1.5*xi + 0.5 + noise)
xs_ = np.array(xs_); ys_ = np.array(ys_)
# per-point loss l_i = (y_i - (a x_i + b))^2, mean loss L = (1/N) sum l_i, at (a,b) = (0,0)
per_pt = np.stack([-2*xs_*ys_, -2*ys_], axis=1)          # grad of l_i at (0,0)
full = per_pt.mean(axis=0)
def mean_loss_grad(a, b):
    r = ys_ - (a*xs_ + b); return np.array([-2*(xs_*r).mean(), -2*r.mean()])
chk("minibatch: LCG data has 40 points on [-2,2]; mean of per-point gradients = full gradient at (0,0)",
    len(xs_) == 40 and close(xs_[0], -2) and close(xs_[-1], 2) and np.allclose(full, mean_loss_grad(0, 0)))
var1 = per_pt.var(axis=0)                                  # population variance (sampling with replacement)
def exact_var_of_mean(m):
    """enumerate every ordered m-tuple of the 40 points (with replacement) and take the variance of the mean."""
    idx = np.array(np.meshgrid(*([np.arange(N)]*m), indexing='ij')).reshape(m, -1).T
    return per_pt[idx].mean(axis=1).var(axis=0)
def sampled_var_of_mean(m, draws=400000):
    idx = rng.integers(0, N, size=(draws, m)); return per_pt[idx].mean(axis=1).var(axis=0)
chk("minibatch: variance of a size-m mean is Var1/m — exact enumeration for m = 1, 2, 4 (40^4 tuples)",
    np.all(var1 > 0) and all(np.allclose(exact_var_of_mean(m), var1/m) for m in [1, 2, 4]))
chk("minibatch: Var1/m holds for m = 8 by sampling (400k draws, within 3%)",
    np.allclose(sampled_var_of_mean(8), var1/8, rtol=0.03))

print("=" * 60)
print(f"ALL {ok} UNIT-9 MATH CHECKS PASS ✓")
