# Unit 10 · Optimization I — machine verification of every number printed in
# the practice arena (tpl/u10-practice.html) and of the numbers the unit's
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
w = sp.Symbol('w')
R = sp.Rational

# --- P1: column {30,50,70,90,110} ---
col = np.array([30, 50, 70, 90, 110.])
mm = (col - col.min())/(col.max() - col.min())
chk("P1a min 30, max 110, range 80; min-max = 0, 0.25, 0.5, 0.75, 1",
    col.min() == 30 and col.max() == 110 and col.max() - col.min() == 80 and np.allclose(mm, [0, 0.25, 0.5, 0.75, 1]))
mu, dev = col.mean(), col - col.mean()
chk("P1b mu = 350/5 = 70; deviations (-40,-20,0,20,40)", close(col.sum(), 350) and close(mu, 70) and np.allclose(dev, [-40, -20, 0, 20, 40]))
chk("P1b sigma^2 = (1600+400+0+400+1600)/5 = 4000/5 = 800; sigma = 28.28",
    np.allclose(dev**2, [1600, 400, 0, 400, 1600]) and close((dev**2).sum(), 4000) and close(col.var(), 800)
    and close(math.sqrt(800), 28.28, 5e-3))
z = dev/col.std()
chk("P1b z = (-1.414, -0.707, 0, 0.707, 1.414); sum z = 0; sum z^2 = 5",
    np.allclose(z, [-1.414, -0.707, 0, 0.707, 1.414], atol=5e-4) and close(z.sum(), 0) and close((z**2).sum(), 5))
chk("P1b z^2 pieces 2 + 0.5 + 0 + 0.5 + 2 = 5", np.allclose(z**2, [2, 0.5, 0, 0.5, 2]))
chk("P1c x = 130: min-max (130-30)/80 = 100/80 = 1.25 (outside [0,1]); z = 60/28.28 = 2.12",
    close((130 - 30)/80, 1.25) and 1.25 > 1 and close((130 - 70)/math.sqrt(800), 2.12, 5e-3) and close(130 - 70, 60))

# --- P2: partials -640 and -1.6, gamma = 1e-3 ---
g1, g2, gam = -640.0, -1.6, 1e-3
d1, d2 = -gam*g1, -gam*g2
chk("P2a dw1 = 0.64, dw2 = 0.0016, ratio 400", close(d1, 0.64) and close(d2, 0.0016) and close(d1/d2, 400))
chk("P2b 1/0.0016 = 625 steps; w1 moves 625*0.64 = 400 units", close(1/d2, 625) and close(625*d1, 400))
gam2 = 0.01/640
chk("P2c gamma = 0.01/640 = 1.5625e-5; dw2 = 2.5e-5; 1/2.5e-5 = 40000 steps",
    close(gam2, 1.5625e-5) and close(gam2*1.6, 2.5e-5) and close(1/(gam2*1.6), 40000) and close(gam2*640, 0.01))
chk("P2c the slow knob is 64x slower than before: 40000/625 = 64", close(40000/625, 64))

# --- P3: three receipts, J(w) = 14w^2 - 66w + 78 ---
J3 = (w - 2)**2 + (2*w - 5)**2 + (3*w - 7)**2
chk("P3a expand: (w-2)^2 = w^2-4w+4; (2w-5)^2 = 4w^2-20w+25; (3w-7)^2 = 9w^2-42w+49",
    sp.expand((w - 2)**2) == w**2 - 4*w + 4 and sp.expand((2*w - 5)**2) == 4*w**2 - 20*w + 25
    and sp.expand((3*w - 7)**2) == 9*w**2 - 42*w + 49)
chk("P3a J = 14w^2 - 66w + 78 (1+4+9, 4+20+42, 4+25+49)",
    sp.expand(J3) == 14*w**2 - 66*w + 78 and 1 + 4 + 9 == 14 and 4 + 20 + 42 == 66 and 4 + 25 + 49 == 78)
chk("P3b dJ/dw = 28w - 66; w* = 66/28 = 33/14 ~ 2.357; J'' = 28 > 0",
    sp.diff(J3, w).expand() == 28*w - 66 and sp.solve(sp.diff(J3, w), w) == [R(33,14)] and R(66,28) == R(33,14)
    and close(33/14, 2.357, 5e-4) and sp.diff(J3, w, 2) == 28)
chk("P3b J* = 1089/14 - 2178/14 + 1092/14 = 3/14 ~ 0.214",
    J3.subs(w, R(33,14)) == R(3,14) and 14*R(33,14)**2 == R(1089,14) and 66*R(33,14) == R(2178,14) and 78 == R(1092,14)
    and 1089 - 2178 + 1092 == 3 and close(3/14, 0.214, 5e-4))
ws, ss, Js = [], [], []
wv = 0.0
for k in range(6):
    ws.append(wv); ss.append(28*wv - 66); Js.append(14*wv*wv - 66*wv + 78); wv = wv - 0.02*(28*wv - 66)
chk("P3c w = 0, 1.320, 1.901, 2.156, 2.269, 2.318",
    np.allclose(ws, [0, 1.320, 1.901, 2.156, 2.269, 2.318], atol=5e-4))
chk("P3c slope = -66, -29.04, -12.78, -5.62, -2.47, -1.09",
    np.allclose(ss, [-66, -29.04, -12.78, -5.62, -2.47, -1.09], atol=5e-3))
chk("P3c J = 78, 15.27, 3.13, 0.78, 0.32, 0.24 (the source's 15.19 / 2.99 were slips)",
    np.allclose(Js, [78, 15.27, 3.13, 0.78, 0.32, 0.24], atol=5e-3) and not close(Js[1], 15.19, 5e-3) and not close(Js[2], 2.99, 5e-3))
chk("P3c table (4 dp): w = 1.3200, 1.9008, 2.1564, 2.2688, 2.3183; increments 1.3200, 0.5808, 0.2556, 0.1124, 0.0495",
    np.allclose(ws[1:], [1.3200, 1.9008, 2.1564, 2.2688, 2.3183], atol=5e-5)
    and np.allclose(np.diff(ws), [1.3200, 0.5808, 0.2556, 0.1124, 0.0495], atol=5e-5)
    and close(0.02*66, 1.32) and close(0.02*29.04, 0.5808) and close(0.02*12.78, 0.2556) and close(0.02*5.62, 0.1124))
chk("P3c slope pieces 28w = 36.96, 53.22, 60.38, 63.53, 64.91",
    close(28*1.3200, 36.96) and close(28*1.9008, 53.22, 5e-3) and close(28*2.1564, 60.38, 5e-3) and close(28*2.2688, 63.53, 5e-3) and close(28*2.3183, 64.91, 5e-3))
chk("P3c J(1.3200) = 14(1.7424) - 87.12 + 78 = 24.39 - 87.12 + 78 = 15.27; J(1.9008) = 14(3.6130) - 125.45 + 78 = 3.13",
    close(1.32**2, 1.7424) and close(14*1.7424, 24.39, 5e-3) and close(66*1.320, 87.12) and close(24.39 - 87.12 + 78, 15.27, 1e-6)
    and close(1.9008**2, 3.6130, 5e-5) and close(14*3.6130, 50.58, 5e-3) and close(66*1.9008, 125.45, 5e-3) and close(50.58 - 125.45 + 78, 3.13, 1e-6))
chk("P3d factor 1 - 28*0.02 = 0.44; gap check 2.357 - 1.320 = 1.037 = 0.44*2.357; limit eta < 2/28 = 1/14 ~ 0.0714",
    close(1 - 28*0.02, 0.44) and close(33/14 - ws[1], 0.44*33/14) and close(2.357 - 1.320, 1.037) and close(0.44*2.357, 1.037, 5e-4)
    and R(2,28) == R(1,14) and close(1/14, 0.0714, 5e-5))
def run3(eta, steps=400):
    q = 0.0
    for _ in range(steps): q = q - eta*(28*q - 66)
    return q
chk("P3d eta = 1/28 finishes in one step; eta 0.07 converges; eta 0.075 (> 1/14) diverges",
    close(0 - (1/28)*(-66), 33/14) and close(run3(0.07), 33/14, 1e-6) and abs(run3(0.075)) > 1e6)

# --- P4: circle x^2 + y^2 and canyon x^2 + 4y^2 ---
eta = sp.Symbol('eta')
Lc = x**2 + y**2; Le = x**2 + 4*y**2
chk("P4a circle grad (2x,2y): x <- (1-2eta)x, y <- (1-2eta)y; eta = 0.5 gives factor 0",
    [sp.diff(Lc, x), sp.diff(Lc, y)] == [2*x, 2*y] and sp.expand(x - eta*2*x - (1 - 2*eta)*x) == 0 and (1 - 2*eta).subs(eta, R(1,2)) == 0)
chk("P4b canyon grad (2x,8y): factors 1-2eta, 1-8eta; |1-8eta| < 1 => eta < 0.25; |1-2eta| < 1 => eta < 1; curvature d2L/dy2 = 8",
    [sp.diff(Le, x), sp.diff(Le, y)] == [2*x, 8*y] and sp.diff(Le, y, 2) == 8
    and abs(1 - 8*0.2499) < 1 and abs(1 - 8*0.2501) > 1 and abs(1 - 2*0.999) < 1 and abs(1 - 2*1.001) > 1)
p = np.array([10.0, 10.0]); pts = [p.copy()]; Ls = [p[0]**2 + 4*p[1]**2]
for _ in range(3):
    p = p - 0.24*np.array([2*p[0], 8*p[1]]); pts.append(p.copy()); Ls.append(p[0]**2 + 4*p[1]**2)
chk("P4c factors 0.52 and -0.92; trace (5.2,-9.2), (2.704,8.464), (1.406,-7.787)",
    close(1 - 2*0.24, 0.52) and close(1 - 8*0.24, -0.92) and np.allclose(pts[1], [5.2, -9.2])
    and np.allclose(pts[2], [2.704, 8.464]) and np.allclose(pts[3], [1.406, -7.787], atol=5e-4))
chk("P4c L = 500, 365.6, 293.9, 244.5", np.allclose(Ls, [500, 365.6, 293.9, 244.5], atol=5e-2))
chk("P4c L pieces: 100+400; 27.04+338.56; 7.31+286.56; 1.98+242.55",
    close(5.2**2, 27.04) and close(4*9.2**2, 338.56) and close(2.704**2, 7.31, 5e-3) and close(4*8.464**2, 286.56, 5e-3)
    and close(1.406**2, 1.98, 5e-3) and close(4*7.787**2, 242.55, 5e-3))
chk("P4c gradients (20,80), (10.4,-73.6), (5.408,67.71)",
    np.allclose([2*pts[0][0], 8*pts[0][1]], [20, 80]) and np.allclose([2*pts[1][0], 8*pts[1][1]], [10.4, -73.6])
    and np.allclose([2*pts[2][0], 8*pts[2][1]], [5.408, 67.71], atol=5e-3))
chk("P4d H = diag(2,8), kappa = 4; y flips sign each step, x monotone; |y| loses 8% per step",
    sp.hessian(Le, (x, y)) == sp.diag(2, 8) and close(8/2, 4) and all(pts[k][1]*pts[k+1][1] < 0 for k in range(3))
    and all(0 < pts[k+1][0] < pts[k][0] for k in range(3)) and close(abs(pts[1][1])/abs(pts[0][1]), 0.92))

# --- P5: house prices ---
x1 = np.array([1000, 1500, 2000.]); x2 = np.array([2, 3, 3.]); yh = np.array([50, 75, 90.])
chk("P5a dJ/dw1 = -2(50000 + 112500 + 180000) = -2(342500) = -685000",
    np.allclose(x1*yh, [50000, 112500, 180000]) and close((x1*yh).sum(), 342500) and close(-2*(x1*yh).sum(), -685000))
chk("P5a dJ/dw2 = -2(100 + 225 + 270) = -2(595) = -1190; ratio 685000/1190 ~ 576",
    np.allclose(x2*yh, [100, 225, 270]) and close((x2*yh).sum(), 595) and close(-2*595, -1190) and close(685000/1190, 576, 0.5))
w1s, w2s = sp.symbols('w1 w2')
J5 = sum((w1s*a + w2s*b - c)**2 for a, b, c in zip(x1, x2, yh))
chk("P5a sympy gradient at 0 agrees: (-685000, -1190)",
    close(float(sp.diff(J5, w1s).subs({w1s: 0, w2s: 0})), -685000) and close(float(sp.diff(J5, w2s).subs({w1s: 0, w2s: 0})), -1190))
z1 = (x1 - x1.mean())/x1.std(); z2 = (x2 - x2.mean())/x2.std()
chk("P5b mu1 = 1500, deviations (-500,0,500), sigma1 = sqrt(500000/3) ~ 408.25, z1 = (-1.2247, 0, 1.2247)",
    close(x1.mean(), 1500) and np.allclose(x1 - 1500, [-500, 0, 500]) and close(x1.std(), math.sqrt(500000/3))
    and close(x1.std(), 408.25, 5e-3) and close(500000/3, 166667, 0.5) and np.allclose(z1, [-1.2247, 0, 1.2247], atol=5e-5))
chk("P5b mu2 = 8/3 ~ 2.667, deviations (-0.667,0.333,0.333), sigma2 = sqrt(0.2222) ~ 0.4714, z2 = (-1.4142, 0.7071, 0.7071)",
    close(x2.mean(), 8/3) and close(8/3, 2.667, 5e-4) and np.allclose(x2 - 8/3, [-0.667, 0.333, 0.333], atol=5e-4)
    and np.allclose((x2 - 8/3)**2, [0.4444, 0.1111, 0.1111], atol=5e-5) and close(x2.var(), 0.2222, 5e-5)
    and close(x2.std(), 0.4714, 5e-5) and np.allclose(z2, [-1.4142, 0.7071, 0.7071], atol=5e-5))
chk("P5b partials: -2(-61.24 + 0 + 110.22) = -2(48.99) = -97.98; -2(-70.71 + 53.03 + 63.64) = -2(45.96) = -91.92",
    np.allclose(z1*yh, [-61.24, 0, 110.22], atol=1e-2) and close((z1*yh).sum(), 48.99, 5e-3) and close(-2*(z1*yh).sum(), -97.98, 5e-3)
    and np.allclose(z2*yh, [-70.71, 53.03, 63.64], atol=1e-2) and close((z2*yh).sum(), 45.96, 5e-3) and close(-2*(z2*yh).sum(), -91.92, 5e-3))
chk("P5c new ratio 97.98/91.92 ~ 1.07", close(97.98/91.92, 1.07, 5e-3) and close((z1*yh).sum()/(z2*yh).sum(), 1.07, 5e-3))
chk("P5 remember: sample sigma changes z by sqrt(2/3)", close((x1 - 1500)[2]/x1.std(ddof=1), 1.2247*math.sqrt(2/3), 5e-4))

# --- P6: L = 9x^2 + y^2 ---
L6 = 9*x**2 + y**2
chk("P6a grad (18x, 2y); factors 1-18eta, 1-2eta; eta < 2/18 = 1/9 ~ 0.111 (x); eta < 1 (y)",
    [sp.diff(L6, x), sp.diff(L6, y)] == [18*x, 2*y] and R(2,18) == R(1,9) and close(1/9, 0.111, 5e-4)
    and abs(1 - 18*0.1110) < 1 and abs(1 - 18*0.1112) > 1)
p = np.array([1.0, 3.0]); pts6 = [p.copy()]
for _ in range(3):
    p = p - 0.1*np.array([18*p[0], 2*p[1]]); pts6.append(p.copy())
L6n = lambda q: 9*q[0]**2 + q[1]**2
chk("P6b factors -0.8 and 0.8; trace (-0.8,2.4), (0.64,1.92), (-0.512,1.536)",
    close(1 - 1.8, -0.8) and close(1 - 0.2, 0.8) and np.allclose(pts6[1], [-0.8, 2.4]) and np.allclose(pts6[2], [0.64, 1.92])
    and np.allclose(pts6[3], [-0.512, 1.536]))
chk("P6b L = 18, 11.52, 7.373, 4.719; halves equal (5.76+5.76, 3.686+3.686, 2.359+2.359)",
    np.allclose([L6n(q) for q in pts6], [18, 11.52, 7.373, 4.719], atol=5e-4) and close(9*0.64, 5.76) and close(2.4**2, 5.76)
    and close(9*0.64**2, 3.686, 5e-4) and close(1.92**2, 3.686, 5e-4) and close(9*0.512**2, 2.359, 5e-4) and close(1.536**2, 2.359, 5e-4))
chk("P6b gradients (18,6), (-14.4,4.8), (11.52,3.84); x oscillates since 0.1 > 1/18 ~ 0.056; y monotone",
    np.allclose([18*pts6[0][0], 2*pts6[0][1]], [18, 6]) and np.allclose([18*pts6[1][0], 2*pts6[1][1]], [-14.4, 4.8])
    and np.allclose([18*pts6[2][0], 2*pts6[2][1]], [11.52, 3.84]) and 0.1 > 1/18 and close(1/18, 0.056, 5e-4)
    and all(pts6[k][0]*pts6[k+1][0] < 0 for k in range(3)) and all(0 < pts6[k+1][1] < pts6[k][1] for k in range(3)))
chk("P6c H = diag(18,2), kappa = 9; 9x^2+9y^2 at eta = 1/18 finishes in one step; L needs 1/18 and 1/2 at once",
    sp.hessian(L6, (x, y)) == sp.diag(18, 2) and close(18/2, 9) and close(1 - 18/18, 0) and close(1 - 2*(1/2), 0)
    and not close(1 - 2/18, 0) and np.allclose(np.array([1., 3.]) - (1/18)*np.array([18*1, 18*3]), [0, 0]))

# --- P7: least-squares gradient ---
X1 = np.array([2, 1.]); X2 = np.array([1, 3.]); y1v, y2v = 4.0, 5.0
wv1, wv2 = sp.symbols('v1 v2'); W = sp.Matrix([wv1, wv2])
J7 = (W.dot(sp.Matrix([2, 1])) - 4)**2 + (W.dot(sp.Matrix([1, 3])) - 5)**2
grad7 = sp.Matrix([sp.diff(J7, wv1), sp.diff(J7, wv2)])
form7 = 2*((W.dot(sp.Matrix([2, 1])) - 4)*sp.Matrix([2, 1]) + (W.dot(sp.Matrix([1, 3])) - 5)*sp.Matrix([1, 3]))
chk("P7a grad J = 2 sum (w.X_i - y_i) X_i (sympy agrees symbolically)", sp.simplify(grad7 - form7) == sp.zeros(2, 1))
chk("P7a grad of r_i = w.X_i - y_i is X_i", sp.Matrix([sp.diff(W.dot(sp.Matrix([2, 1])) - 4, v) for v in (wv1, wv2)]) == sp.Matrix([2, 1]))
w0 = np.zeros(2); r = np.array([w0@X1 - y1v, w0@X2 - y2v])
chk("P7b residuals (-4,-5), J0 = 16 + 25 = 41", np.allclose(r, [-4, -5]) and close((r**2).sum(), 41))
G0 = 2*(r[0]*X1 + r[1]*X2)
chk("P7b grad = 2[(-8,-4) + (-5,-15)] = 2(-13,-19) = (-26,-38)",
    np.allclose(-4*X1, [-8, -4]) and np.allclose(-5*X2, [-5, -15]) and np.allclose(G0, [-26, -38]))
w1v = w0 - 0.02*G0; r1 = np.array([w1v@X1 - y1v, w1v@X2 - y2v])
chk("P7b w1 = (0.52, 0.76); residuals 1.04+0.76-4 = -2.20, 0.52+2.28-5 = -2.20; J1 = 4.84+4.84 = 9.68 < 41",
    np.allclose(w1v, [0.52, 0.76]) and np.allclose(r1, [-2.2, -2.2]) and close(1.04 + 0.76 - 4, -2.2) and close(0.52 + 2.28 - 5, -2.2)
    and close((r1**2).sum(), 9.68) and close(2*4.84, 9.68) and 9.68 < 41)
chk("P7b fraction removed (41 - 9.68)/41 = 31.32/41 ~ 0.76", close(41 - 9.68, 31.32) and close(31.32/41, 0.76, 5e-3))

# --- P8: knobs versus facts ---
rows = np.array([[61, 2, 3, 0.1, 59], [40, 0, 4, 0.5, 40], [68, 0, 10, 1.0, 70]])
Xr, yr = rows[:, :4], rows[:, 4]
pred = lambda wv: Xr@wv[:4] + wv[4]
honest = np.array([1, 0, 0, 0, 0.])
chk("P8a honest: yhat (61,40,68), errors (2,0,-2), J = 4+0+4 = 8",
    np.allclose(pred(honest), [61, 40, 68]) and np.allclose(pred(honest) - yr, [2, 0, -2]) and close(((pred(honest) - yr)**2).sum(), 8))
a2, a3, a5 = sp.symbols('a2 a3 a5')
sol8 = sp.solve([2*a2 + 3*a3 + a5 - 59, 4*a3 + a5 - 40, 10*a3 + a5 - 70], [a2, a3, a5])
chk("P8b system: row3 - row2 => 6w3 = 30 => w3 = 5; w5 = 40 - 20 = 20; 2w2 = 59 - 15 - 20 = 24 => w2 = 12",
    sol8 == {a2: 12, a3: 5, a5: 20} and 70 - 40 == 30 and 10 - 4 == 6 and 40 - 4*5 == 20 and 59 - 35 == 24)
memo = np.array([0, 12, 5, 0, 20.])
chk("P8b memoriser (0,12,5,0,20): rows 24+15+20 = 59, 20+20 = 40, 50+20 = 70; J = 0",
    np.allclose(pred(memo), yr) and 24 + 15 + 20 == 59 and 20 + 20 == 40 and 50 + 20 == 70 and close(((pred(memo) - yr)**2).sum(), 0))
cand = np.array([0, 7, 5, 0, 20.])
chk("P8c candidate (0,7,5,0,20): row 1 = 14+15+20 = 49 != 59; rows 2,3 exact; J = (-10)^2 = 100",
    close(pred(cand)[0], 49) and 14 + 15 + 20 == 49 and np.allclose(pred(cand)[1:], yr[1:]) and close(((pred(cand) - yr)**2).sum(), 100))
xu = np.array([50, 1, 6, 0.3])
chk("P8d unseen row: honest 50 (error 0); memoriser 12+30+20 = 62 (error 12)",
    close(xu@honest[:4] + honest[4], 50) and close(xu@memo[:4] + memo[4], 62) and 12 + 30 + 20 == 62 and close(62 - 50, 12))
A8 = np.hstack([Xr, np.ones((3, 1))])
chk("P8e 5 unknowns, 3 equations of rank 3 -> 2 free parameters (null space dimension 2)",
    A8.shape == (3, 5) and np.linalg.matrix_rank(A8) == 3 and 5 - 3 == 2 and sp.Matrix(A8).nullspace().__len__() == 2)
chk("P8e both honest-ish and memoriser directions: honest + t*(null vector) stays a solution of the 3 equations? (memoriser is exact, honest is not)",
    not np.allclose(A8@honest, yr) and np.allclose(A8@memo, yr))

# --- P9: F = (x-1)^2((x-3)^2 - 1) ---
F9 = (x - 1)**2*((x - 3)**2 - 1)
F9p = sp.diff(F9, x)
chk("P9a F' = 2(x-1)(2x^2 - 10x + 11) = 4x^3 - 24x^2 + 42x - 22",
    sp.expand(F9p - 2*(x - 1)*(2*x**2 - 10*x + 11)) == 0 and sp.expand(F9p) == 4*x**3 - 24*x**2 + 42*x - 22)
chk("P9a bracket pieces: (x-3)^2 - 1 = x^2-6x+8; (x-1)(x-3) = x^2-4x+3; sum 2x^2-10x+11",
    sp.expand((x - 3)**2 - 1) == x**2 - 6*x + 8 and sp.expand((x - 1)*(x - 3)) == x**2 - 4*x + 3
    and sp.expand((x - 3)**2 - 1 + (x - 1)*(x - 3)) == 2*x**2 - 10*x + 11)
sta = sorted(sp.solve(F9p, x), key=lambda s: float(s))
chk("P9a stationary points 1, (5 - sqrt3)/2 ~ 1.634, (5 + sqrt3)/2 ~ 3.366; sqrt(100-88) = sqrt12 = 2 sqrt3",
    sta == [1, (5 - sp.sqrt(3))/2, (5 + sp.sqrt(3))/2] and close(float(sta[1]), 1.634, 5e-4) and close(float(sta[2]), 3.366, 5e-4)
    and 100 - 88 == 12 and sp.sqrt(12) == 2*sp.sqrt(3))
F9pp = sp.diff(F9, x, 2)
xa, xb = (5 - math.sqrt(3))/2, (5 + math.sqrt(3))/2
F9n = sp.lambdify(x, F9); F9ppn = sp.lambdify(x, F9pp); F9pn = sp.lambdify(x, F9p)
chk("P9b F'' = 12x^2 - 48x + 42; F''(1) = 6; F''(1.634) = -4.39; F''(3.366) = 16.39",
    sp.expand(F9pp) == 12*x**2 - 48*x + 42 and F9pp.subs(x, 1) == 6 and close(F9ppn(xa), -4.39, 5e-3) and close(F9ppn(xb), 16.39, 5e-3))
chk("P9b F'' pieces: 32.04 - 78.43 + 42 = -4.39; 135.96 - 161.57 + 42 = 16.39",
    close(12*xa**2, 32.04, 5e-3) and close(48*xa, 78.43, 5e-3) and close(12*xb**2, 135.96, 5e-3) and close(48*xb, 161.57, 5e-3)
    and close(32.04 - 78.43 + 42, -4.39) and close(135.96 - 161.57 + 42, 16.39))
chk("P9b F(1) = 0; F(1.634) = 0.4020*0.866 = 0.348; F(3.366) = 5.598*(-0.866) = -4.848",
    F9.subs(x, 1) == 0 and close(F9n(xa), 0.348, 5e-4) and close(F9n(xb), -4.848, 5e-4)
    and close((xa - 1)**2, 0.4020, 5e-4) and close((xa - 3)**2 - 1, 0.866, 5e-4) and close((xb - 1)**2, 5.598, 5e-4) and close((xb - 3)**2 - 1, -0.866, 5e-4))
xs9, fp9, fv9 = [], [], []
xv = 0.5
for k in range(5):
    xs9.append(xv); fp9.append(F9pn(xv)); fv9.append(F9n(xv)); xv = xv - 0.02*F9pn(xv)
chk("P9c x = 0.5000, 0.6300, 0.7113, 0.7679, 0.8097", np.allclose(xs9, [0.5, 0.63, 0.7113, 0.7679, 0.8097], atol=5e-5))
chk("P9c F' = -6.500, -4.065, -2.829, -2.089", np.allclose(fp9[:4], [-6.5, -4.065, -2.829, -2.089], atol=5e-4))
chk("P9c F = 1.3125, 0.6321, 0.3532, 0.2146, 0.1376", np.allclose(fv9, [1.3125, 0.6321, 0.3532, 0.2146, 0.1376], atol=5e-5))
chk("P9c first row: F'(0.5) = 0.5 - 6 + 21 - 22 = -6.5; F(0.5) = 0.25*5.25 = 1.3125; increments 0.1300, 0.0813, 0.0566, 0.0418",
    close(4*0.125 - 24*0.25 + 42*0.5 - 22, -6.5) and close(0.25*5.25, 1.3125)
    and np.allclose(np.diff(xs9), [0.13, 0.0813, 0.0566, 0.0418], atol=5e-5))
xv = 0.5
for _ in range(3000): xv = xv - 0.02*F9pn(xv)
xw = 1.7
for _ in range(3000): xw = xw - 0.02*F9pn(xw)
chk("P9c limit from 0.5 is x = 1, F = 0; |F'| shrinks each step; a start just above 1.634 reaches 3.366",
    close(xv, 1, 1e-6) and close(F9n(xv), 0, 1e-9) and all(abs(fp9[k+1]) < abs(fp9[k]) for k in range(3)) and close(xw, xb, 1e-6))
chk("P9d plateau: step 0.01*0.001 = 1e-5; 2/1e-5 = 200000 steps", close(0.01*0.001, 1e-5) and close(2/1e-5, 200000))

# --- P10: F = 3x^4 - 4x^3 - 12x^2 + 5 ---
F10 = 3*x**4 - 4*x**3 - 12*x**2 + 5
chk("P10 F' = 12x^3 - 12x^2 - 24x = 12x(x-2)(x+1); roots -1, 0, 2",
    sp.expand(sp.diff(F10, x)) == 12*x**3 - 12*x**2 - 24*x and sp.expand(sp.diff(F10, x) - 12*x*(x - 2)*(x + 1)) == 0
    and sorted(sp.solve(sp.diff(F10, x), x)) == [-1, 0, 2])
chk("P10 F(-1) = 3+4-12+5 = 0, F(0) = 5, F(2) = 48-32-48+5 = -27; F'' = 36, -24, 72",
    F10.subs(x, -1) == 0 and 3 + 4 - 12 + 5 == 0 and F10.subs(x, 0) == 5 and F10.subs(x, 2) == -27 and 48 - 32 - 48 + 5 == -27
    and [sp.diff(F10, x, 2).subs(x, v) for v in (-1, 0, 2)] == [36, -24, 72])
F10pn = sp.lambdify(x, sp.diff(F10, x))
def run10(x0, eta=0.005, steps=4000):
    q = x0
    for _ in range(steps): q = q - eta*F10pn(q)
    return q
chk("P10 basins: starts -2, -0.5, -0.01 -> -1; starts 0.01, 1, 3 -> 2 (small-step descent)",
    all(close(run10(s), -1, 1e-6) for s in (-2, -0.5, -0.01)) and all(close(run10(s), 2, 1e-6) for s in (0.01, 1, 3)))
chk("P10a p = 3/(3 - (-2)) = 3/5 = 0.6", close((3 - 0)/(3 - (-2)), 0.6) and R(3,5) == R(6,10))
chk("P10b 0.4^5 = 0.01024 > 0.01; 0.4^6 = 0.004096 <= 0.01; k = 6; success 0.995904 ~ 0.9959; k = 5 gives 0.98976",
    close(0.4**5, 0.01024) and 0.4**5 > 0.01 and close(0.4**6, 0.004096) and 0.4**6 <= 0.01
    and min(k for k in range(1, 20) if 1 - 0.4**k >= 0.99) == 6 and close(1 - 0.4**6, 0.995904) and close(1 - 0.4**5, 0.98976))
chk("P10c 0.6^10 = 0.0060466 ~ 0.006; 2^10 = 1024", close(0.6**10, 0.0060466, 5e-7) and close(0.6**10, 0.006, 5e-4) and 2**10 == 1024)

# --- P11: guns and butter ---
g1c = np.array([0.1, 0.8, 0.4]); g2c = np.array([25, 10, 10.]); gy = np.array([7, 1, 4.])
S11, S22, S12 = (g1c**2).sum(), (g2c**2).sum(), (g1c*g2c).sum()
chk("P11a sums 0.81 (0.01+0.64+0.16), 825 (625+100+100), 14.5 (2.5+8+4)",
    close(S11, 0.81) and np.allclose(g1c**2, [0.01, 0.64, 0.16]) and close(S22, 825) and np.allclose(g2c**2, [625, 100, 100])
    and close(S12, 14.5) and np.allclose(g1c*g2c, [2.5, 8, 4]))
H11 = 2*np.array([[S11, S12], [S12, S22]])
chk("P11a H = [[1.62, 29],[29, 1650]]", np.allclose(H11, [[1.62, 29], [29, 1650]]))
u1, u2 = sp.symbols('u1 u2')
J11 = (0.1*u1 + 25*u2 - 7)**2 + (0.8*u1 + 10*u2 - 1)**2 + (0.4*u1 + 10*u2 - 4)**2
chk("P11a sympy Hessian of the written-out J agrees", np.allclose(np.array(sp.hessian(J11, (u1, u2)), dtype=float), H11))
lam11 = np.sort(np.linalg.eigvalsh(H11))[::-1]
chk("P11a eigenvalues 825.81 ± sqrt(824.19^2 + 29^2) = 825.81 ± sqrt(679289 + 841) = 825.81 ± 824.70 -> 1650.5, 1.11",
    close((1.62 + 1650)/2, 825.81) and close((1650 - 1.62)/2, 824.19) and close(824.19**2, 679289, 0.5) and close(29**2, 841)
    and close(math.sqrt(824.19**2 + 29**2), 824.70, 5e-3) and close(lam11[0], 825.81 + math.sqrt(824.19**2 + 29**2), 1e-6)
    and close(lam11[0], 1650.5, 5e-2) and close(lam11[1], 1.11, 5e-3))
chk("P11a kappa = 1650.5/1.11 ~ 1487; 2/lambda_max ~ 0.00121; sqrt(1487) ~ 39",
    close(lam11[0]/lam11[1], 1487, 0.5) and close(2/lam11[0], 0.00121, 5e-6) and close(math.sqrt(1487), 39, 0.5))
mu1, mu2 = g1c.mean(), g2c.mean(); s1, s2 = g1c.std(), g2c.std()
zz1, zz2 = (g1c - mu1)/s1, (g2c - mu2)/s2
chk("P11b mu1 = 1.3/3 = 0.4333, deviations (-0.3333, 0.3667, -0.0333), sigma1^2 = 0.0822, sigma1 = 0.2867, z1 = (-1.163, 1.279, -0.116)",
    close(g1c.sum(), 1.3) and close(mu1, 0.4333, 5e-5) and np.allclose(g1c - mu1, [-0.3333, 0.3667, -0.0333], atol=5e-5)
    and np.allclose((g1c - mu1)**2, [0.1111, 0.1344, 0.0011], atol=5e-5) and close(g1c.var(), 0.0822, 5e-5)
    and close(s1, 0.2867, 5e-5) and np.allclose(zz1, [-1.163, 1.279, -0.116], atol=1e-3))
chk("P11b mu2 = 45/3 = 15, deviations (10,-5,-5), sigma2^2 = 150/3 = 50, sigma2 = 7.071, z2 = (1.414, -0.707, -0.707)",
    close(g2c.sum(), 45) and close(mu2, 15) and np.allclose(g2c - 15, [10, -5, -5]) and close(g2c.var(), 50) and close(s2, 7.071, 5e-4)
    and np.allclose(zz2, [1.414, -0.707, -0.707], atol=5e-4))
Z11, Z22, Z12 = (zz1**2).sum(), (zz2**2).sum(), (zz1*zz2).sum()
chk("P11b sums z1^2 = 1.352+1.635+0.014 = 3; z2^2 = 2+0.5+0.5 = 3; z1 z2 = -1.644-0.904+0.082 = -2.466",
    np.allclose(zz1**2, [1.352, 1.635, 0.014], atol=5e-3) and close(Z11, 3) and np.allclose(zz2**2, [2, 0.5, 0.5]) and close(Z22, 3)
    and np.allclose(zz1*zz2, [-1.644, -0.904, 0.082], atol=5e-3) and close(Z12, -2.466, 5e-4))
Hs = 2*np.array([[Z11, Z12], [Z12, Z22]]); lams = np.sort(np.linalg.eigvalsh(Hs))[::-1]
chk("P11b H_std = [[6, -4.93],[-4.93, 6]]; eigenvalues 6 ± 4.93 = 10.93, 1.07; kappa ~ 10.2; 2/lambda_max ~ 0.183",
    np.allclose(Hs, [[6, -4.93], [-4.93, 6]], atol=5e-3) and close(lams[0], 10.93, 5e-3) and close(lams[1], 1.07, 5e-3)
    and close(lams[0], 6 + 4.93, 5e-3) and close(lams[0]/lams[1], 10.2, 5e-2) and close(2/lams[0], 0.183, 5e-4))
chk("P11c improvement: kappa 1487/10.2 ~ 145x; stride 0.183/0.00121 ~ 151x",
    close((lam11[0]/lam11[1])/(lams[0]/lams[1]), 145, 0.5) and close(1487/10.2, 145, 1) and close((2/lams[0])/(2/lam11[0]), 151, 0.5)
    and close(0.183/0.00121, 151, 1))
chk("P11c correlation = sum z1 z2 / n = -2.466/3 ~ -0.822; equals np.corrcoef",
    close(Z12/3, -0.822, 5e-4) and close(np.corrcoef(g1c, g2c)[0, 1], Z12/3))
chk("P11 standardising forces sum z^2 = n, diagonal of H = 2n = 6", close(Z11, 3) and close(Z22, 3) and close(Hs[0, 0], 6) and close(Hs[1, 1], 6))

# --- P12: x1 = (100,500,900), x2 = (0.9,0.3,0.6) ---
q1 = np.array([100, 500, 900.]); q2 = np.array([0.9, 0.3, 0.6])
T11, T12, T22 = (q1**2).sum(), (q1*q2).sum(), (q2**2).sum()
chk("P12a sums: (1+25+81)e4 = 1070000; 90+150+540 = 780; 0.81+0.09+0.36 = 1.26",
    close(T11, 1070000) and (1 + 25 + 81)*10**4 == 1070000 and close(T12, 780) and np.allclose(q1*q2, [90, 150, 540])
    and close(T22, 1.26) and np.allclose(q2**2, [0.81, 0.09, 0.36]))
H12 = 2*np.array([[T11, T12], [T12, T22]]); lam12 = np.sort(np.linalg.eigvalsh(H12))[::-1]
chk("P12a H = [[2.14e6, 1560],[1560, 2.52]]", np.allclose(H12, [[2.14e6, 1560], [1560, 2.52]]))
chk("P12a det H = 5392800 - 2433600 = 2959200; lambda_min = det/lambda_max ~ 1.38; lambda_max ~ 2.14e6",
    close(2.14e6*2.52, 5392800) and close(1560**2, 2433600) and close(np.linalg.det(H12), 2959200, 1e-3)
    and close(2959200/2.14e6, 1.38, 5e-3) and close(lam12[1], 1.38, 5e-3) and close(lam12[0], 2.14e6, 10))
chk("P12a gamma_max = 2/2.14e6 ~ 9.3e-7; kappa = 2.14e6/1.38 ~ 1.6e6 (1.55e6)",
    close(2/lam12[0], 9.3e-7, 5e-8) and close(lam12[0]/lam12[1], 1.55e6, 5e4) and abs(lam12[0]/lam12[1] - 1.6e6) < 1e5)
m1 = (q1 - q1.min())/(q1.max() - q1.min()); m2 = (q2 - q2.min())/(q2.max() - q2.min())
chk("P12b min-max: column 1 min 100 range 800 -> (0, 0.5, 1); column 2 min 0.3 range 0.6 -> (1, 0, 0.5)",
    q1.min() == 100 and q1.max() - q1.min() == 800 and np.allclose(m1, [0, 0.5, 1]) and close(q2.min(), 0.3)
    and close(q2.max() - q2.min(), 0.6) and np.allclose(m2, [1, 0, 0.5]))
Hp = 2*np.array([[(m1**2).sum(), (m1*m2).sum()], [(m1*m2).sum(), (m2**2).sum()]]); lamp = np.sort(np.linalg.eigvalsh(Hp))[::-1]
chk("P12b sums 1.25, 0.5, 1.25; H' = [[2.5, 1],[1, 2.5]]; eigenvalues 2.5 ± 1 = 3.5, 1.5",
    close((m1**2).sum(), 1.25) and close((m1*m2).sum(), 0.5) and close((m2**2).sum(), 1.25)
    and np.allclose(Hp, [[2.5, 1], [1, 2.5]]) and np.allclose(lamp, [3.5, 1.5]))
chk("P12b gamma'_max = 2/3.5 ~ 0.571; kappa' = 3.5/1.5 ~ 2.33", close(2/3.5, 0.571, 5e-4) and close(3.5/1.5, 2.33, 5e-3))
chk("P12c improvement 0.571/9.3e-7 ~ 6e5", close(0.571/9.3e-7, 6e5, 2e4) and close((2/lamp[0])/(2/lam12[0]), 6e5, 2e4))

# =============== numbers the sections and widgets lean on ===============
# Hero / W10 blend on the guns-and-butter columns
def blend_H(t):
    zt1 = (g1c - t*mu1)/s1**t; zt2 = (g2c - t*mu2)/s2**t
    Z = np.stack([zt1, zt2], axis=1); return 2*Z.T@Z
eb0 = np.sort(np.linalg.eigvalsh(blend_H(0)))[::-1]; eb1 = np.sort(np.linalg.eigvalsh(blend_H(1)))[::-1]; ebh = np.sort(np.linalg.eigvalsh(blend_H(0.5)))[::-1]
chk("W10 blend t = 0: eigenvalues 1650.51 / 1.11; t = 1: 10.93 / 1.07; t = 0.5 has kappa strictly between",
    close(eb0[0], 1650.51, 5e-3) and close(eb0[1], 1.11, 5e-3) and close(eb1[0], 10.93, 5e-3) and close(eb1[1], 1.07, 5e-3)
    and eb1[0]/eb1[1] < ebh[0]/ebh[1] < eb0[0]/eb0[1])
mm1 = (g1c - g1c.min())/(g1c.max() - g1c.min()); mm2 = (g2c - g2c.min())/(g2c.max() - g2c.min())
Hmm = 2*np.stack([mm1, mm2], axis=1).T@np.stack([mm1, mm2], axis=1)
chk("W10 min-max at t = 1: H = 2 diag(1.1837, 1) (cross term 0), kappa ~ 1.18",
    np.allclose(Hmm, 2*np.diag([1.1837, 1]), atol=5e-4) and close((mm1*mm2).sum(), 0) and close(Hmm[0, 0]/Hmm[1, 1], 1.18, 5e-3))
Z = np.stack([zz1, zz2], axis=1); C = Z.T@Z/3
ev, V = np.linalg.eigh(C); Wh = Z@V@np.diag(ev**-0.5)
Hw = 2*Wh.T@Wh
chk("W10 PCA-whitened: standardise, eigendecompose Z^T Z/3, rotate and scale -> H = 2*3*I, kappa = 1 exactly",
    np.allclose(Hw, 6*np.eye(2)) and close(np.linalg.cond(Hw), 1))
# W1
chk("W1 J = 14w^2 - 66w + 78 trace at eta 0.02 (six w's, six J's) and threshold 1/14",
    np.allclose(ws, [0, 1.320, 1.901, 2.156, 2.269, 2.318], atol=5e-4) and np.allclose(Js, [78, 15.27, 3.13, 0.78, 0.32, 0.24], atol=5e-3)
    and abs(1 - 28/14) == 1 and abs(1 - 28*0.0713) < 1 and abs(1 - 28*0.0715) > 1)
# W2
chk("W2 x = 200, eta = 1e-3: factor 1 - 2 eta x^2 = 1 - 80 = -79; safe zone eta < 1/x^2 = 2.5e-5",
    close(1 - 2*1e-3*200**2, -79) and close(1/200**2, 2.5e-5) and abs(1 - 2*2.49e-5*200**2) < 1 and abs(1 - 2*2.51e-5*200**2) > 1)
gap0 = abs(1 - R(7, 200))  # w0 = 1, target y/x with y = 7, exact rational
big = sp.Integer(10)**308
ksteps = min(k for k in range(1, 1000) if sp.Integer(79)**k*gap0 > big)
print(f"        W2: |w_k - w*| = 79^k * {float(gap0):.4f} first exceeds 1e308 at k = {ksteps}")
chk("W2 from w0 = 1 the gap 79^k |w0 - y/x| first exceeds 1e308 within 165 steps (exact arithmetic)",
    ksteps <= 165 and sp.Integer(79)**(ksteps - 1)*gap0 <= big and ksteps == math.ceil(math.log(1e308/float(gap0))/math.log(79)))
wq = 1.0
for _ in range(ksteps):
    wq = wq - 1e-3*2*200*(200*wq - 7)
chk("W2 the float64 run overflows to inf at the same step count", math.isinf(wq))
# W3
chk("W3 memoriser 12 x2 + 5 x3 + 20 on (x1, 1, 6, 0.3) equals 62 for x1 = 40, 50, 60",
    all(close(np.array([xx, 1, 6, 0.3])@memo[:4] + memo[4], 62) for xx in (40, 50, 60)))
# W4
chk("W4 x1 = 50, x2 = 4: x1^2 = 2500, x2^2 = 16, ratio 156.25", 50**2 == 2500 and 4**2 == 16 and close(2500/16, 156.25))
# W6
pW6 = (4 - xa)/4; kW6 = math.ceil(math.log(0.01)/math.log(1 - pW6))
chk("W6 watershed 1.634; P(global | U[0,4]) = (4 - 1.634)/4 ~ 0.5915; k = ceil(ln 0.01 / ln 0.4085) = 6",
    close(xa, 1.634, 5e-4) and close(pW6, 0.5915, 5e-4) and close(1 - pW6, 0.4085, 5e-4) and kW6 == 6
    and (1 - pW6)**5 > 0.01 >= (1 - pW6)**6)
# W7 salt flat (the widget's landscape: cliff at x = -1.9, shelf, bowl at x = 2.4)
sig = lambda t: 1/(1 + np.exp(-t))
def fsf(px, py):
    return 1.6*sig(-5*(px + 1.9)) - 0.02*px + 0.35*py**2 - 1.2*np.exp(-((px - 2.4)**2 + py**2)/0.5)
def gsf(px, py):
    s = sig(-5*(px + 1.9)); e = np.exp(-((px - 2.4)**2 + py**2)/0.5)
    return np.array([1.6*s*(1 - s)*(-5) - 0.02 + 1.2*e*2*(px - 2.4)/0.5, 0.7*py + 1.2*e*2*py/0.5])
def numg(px, py, h=1e-5):
    return np.array([(fsf(px + h, py) - fsf(px - h, py))/(2*h), (fsf(px, py + h) - fsf(px, py - h))/(2*h)])
chk("W7 analytic gradient of the salt-flat f matches central differences at (-1.9, 0.3), (0.2, -0.5), (2.0, 0.8) to 1e-6",
    all(np.allclose(gsf(*pt), numg(*pt), atol=1e-6) for pt in [(-1.9, 0.3), (0.2, -0.5), (2.0, 0.8)]))
shelf = np.linspace(-1.0, 1.0, 2001)
gn = np.array([np.linalg.norm(gsf(sx, 0.0)) for sx in shelf])
cliff = np.array([np.linalg.norm(gsf(sx, 0.0)) for sx in np.linspace(-3.2, -1.2, 1001)])
print(f"        W7: min |grad f| on the shelf = {gn.min():.4f} at x = {shelf[gn.argmin()]:.2f}; cliff peak slope = {cliff.max():.3f}")
chk("W7 |grad f| < 0.03 on the shelf x in [-1, 1], y = 0, and the shelf is > 50x flatter than the cliff",
    gn.min() < 0.03 and cliff.max()/gn.min() > 50)
# the companion's plateau arithmetic
chk("W7 plateau: width 2 / (0.01 * 0.001) = 200 000 steps", abs(2/(0.01*0.001) - 200000) < 1e-6)
# W8 canyon
chk("W8 c = 4, eta = 0.24 from (10,10): six points / seven L values; c = 1 at eta 0.5 finishes in one step; stability eta < 1/c",
    np.allclose(pts[1], [5.2, -9.2]) and np.allclose(pts[3], [1.406, -7.787], atol=5e-4)
    and np.allclose(np.array([10., 10.]) - 0.5*np.array([20., 20.]), [0, 0]) and abs(1 - 2*4*0.2499) < 1 and abs(1 - 2*4*0.2501) > 1)
pW8 = np.array([10.0, 10.0]); LW8 = [500.0]
for _ in range(6):
    pW8 = np.array([0.52*pW8[0], -0.92*pW8[1]]); LW8.append(pW8[0]**2 + 4*pW8[1]**2)
chk("W8 seven L values 500, 365.6, 293.9, 244.5, 205.8, 173.9, 147.1; sixth point (0.198, 6.064)",
    np.allclose(LW8, [500, 365.6, 293.9, 244.5, 205.8, 173.9, 147.1], atol=5e-2) and np.allclose(pW8, [0.198, 6.064], atol=5e-4))
# W9 compass
gF = np.array([4.4, 8.8]); toC = np.array([2.2, 1.1]); tang = np.array([-8.8, 4.4])
ang = math.degrees(math.acos(gF@toC/np.linalg.norm(gF)/np.linalg.norm(toC)))
print(f"        W9: angle between grad F and the centre direction at (2.2, 1.1) = {ang:.2f} deg")
chk("W9 on x^2 + 4y^2 at (2.2, 1.1): grad = (4.4, 8.8); angle to the centre direction ~ 36.87 deg; angle to tangent (-8.8, 4.4) = 90; circle angle 0",
    np.allclose([2*2.2, 8*1.1], gF) and close(ang, 36.87, 5e-3) and close(gF@tang, 0)
    and close(math.degrees(math.acos(min(1.0, np.array([4.4, 2.2])@toC/np.linalg.norm([4.4, 2.2])/np.linalg.norm(toC)))), 0, 1e-4)
    and close(4.4*1.1 - 2.2*2.2, 0))
# contour orthogonality
Fe = lambda px, py: px**2 + 4*py**2
dvec = tang/np.linalg.norm(tang)*1e-4
dF = Fe(2.2 + dvec[0], 1.1 + dvec[1]) - Fe(2.2, 1.1)
chk("contour orthogonality: moving 1e-4 along (-F_y, F_x) on the ellipse changes F by O(1e-8) (1.6e-8)",
    abs(dF) < 1e-7 and close(dF, 1.6e-8, 2e-9))
# high-dimensional count
grid = np.linspace(0.2, 3.8, 7)
ends = set()
for a_ in grid:
    for b_ in grid:
        for c_ in grid:
            q = np.array([a_, b_, c_])
            for _ in range(600): q = q - 0.02*np.array([F9pn(v) for v in q])
            ends.add(tuple(np.round(q, 3)))
chk("high-dimensional count: separable F = sum A(x_i) with the 2-minimum A in d = 3 -> 2^3 = 8 minima found by descent from a grid",
    len(ends) == 8 and all(all(close(v, 1, 1e-3) or close(v, xb, 1e-3) for v in e) for e in ends))
# companion check-yourself
chk("companion Q2: L = x^2 + 9y^2 -> factors 1-2eta, 1-18eta; eta < 1/9 set by y (curvature 18)",
    sp.hessian(x**2 + 9*y**2, (x, y)) == sp.diag(2, 18) and close(2/18, 1/9))
chk("companion Q3: z = (56 - 40)/8 = 2", close((56 - 40)/8, 2))

print("=" * 60)
print(f"ALL {ok} UNIT-10 MATH CHECKS PASS ✓")
