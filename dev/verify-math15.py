# Unit 15 · The Network, Whole — machine verification of every number the page prints:
# the worked salary example (forward, backward, update, re-run, overshoot), the collapse,
# the hat from three ReLUs, the classification head, the vanishing bound, the widgets'
# fixed readouts, the derivation drawers and the fourteen practice problems (tpl/u15-*.html).
# Plain numpy, float64. Tolerance 1e-6 unless a rounded value is printed (then the rounding is checked).
import math
import numpy as np

ok = 0
def chk(name, cond):
    global ok
    assert cond, f"FAIL: {name}"
    ok += 1
    print(f"  ok    {name}")

TOL = 1e-6
close = lambda a, b, t=TOL: abs(a - b) < t
vclose = lambda a, b, t=TOL: np.allclose(np.asarray(a, float), np.asarray(b, float), atol=t)
rnd = lambda v, d: np.round(np.asarray(v, float), d)

relu = lambda z: np.maximum(0, z)
drelu = lambda z: (z > 0).astype(float)
sig = lambda z: 1 / (1 + np.exp(-z))
ACT = {'relu': (relu, drelu), 'none': (lambda z: z, lambda z: np.ones_like(z)),
       'sigmoid': (sig, lambda z: sig(z) * (1 - sig(z))), 'tanh': (np.tanh, lambda z: 1 - np.tanh(z) ** 2)}

def forward(Ws, bs, x, acts):
    a = np.asarray(x, float); cache = [(None, a)]
    for W, b, act in zip(Ws, bs, acts):
        z = W @ a + b; a = ACT[act][0](z); cache.append((z, a))
    return a, cache

def backward(Ws, bs, x, y, acts):
    """squared-error loss L = 1/2 |yhat - y|^2; returns loss, grads [(dW, db)], and dL/d(each node)"""
    yh, cache = forward(Ws, bs, x, acts)
    L = 0.5 * float(np.sum((yh - y) ** 2))
    g = yh - y; nodes = {'yhat': g.copy()}; grads = [None] * len(Ws)
    for l in range(len(Ws) - 1, -1, -1):
        z, _ = cache[l + 1]; a_prev = cache[l][1]
        dz = g * ACT[acts[l]][1](z)                     # Rule A
        grads[l] = (np.outer(dz, a_prev), dz.copy())      # Rule B (i), (ii)
        nodes[f'z{l+1}'] = dz
        g = Ws[l].T @ dz                                  # Rule B (iii)
        nodes[f'a{l}'] = g
    return L, grads, nodes, cache

def loss(Ws, bs, x, y, acts):
    yh, _ = forward(Ws, bs, x, acts); return 0.5 * float(np.sum((yh - y) ** 2))

# ---------------------------------------------------------------------------------------------
print('— the salary network (hero, §1, §5, §7, §8, §9, w-stepper, w-forward, w-train1) —')
W1 = np.array([[0.1, 0.3], [0.2, -0.1], [-0.1, 0.2]]); b1 = np.array([1., -1, -1])
W2 = np.array([[1, -0.5, 1], [1, 0.5, -1]]); b2 = np.array([1., -2])
W3 = np.array([[4., 2]]); b3 = np.array([2.])
Ws = [W1, W2, W3]; bs = [b1, b2, b3]; ACTS = ['relu'] * 3
x0 = np.array([30., 10]); y0 = np.array([50.])
nparams = sum(W.size + b.size for W, b in zip(Ws, bs))
chk('20 parameters: 6+3 + 6+2 + 2+1 (the handout says "17 gradients"; there are 20)', nparams == 20)
chk('shapes W1 3x2, W2 2x3, W3 1x2', W1.shape == (3, 2) and W2.shape == (2, 3) and W3.shape == (1, 2))
yh, cache = forward(Ws, bs, x0, ACTS)
z1, a1 = cache[1]; z2, a2 = cache[2]; z3, a3 = cache[3]
chk('F1 z1 = (7, 4, -2); rows 3+3+1, 6-1-1, -3+2-1', vclose(z1, [7, 4, -2]) and close(0.1*30, 3) and close(0.3*10, 3) and close(0.2*30, 6) and close(-0.1*30, -3) and close(0.2*10, 2))
chk('F2 a1 = (7, 4, 0), third neuron asleep', vclose(a1, [7, 4, 0]))
chk('F3 z2 = (6, 7): 7-2+0+1, 7+2-0-2', vclose(z2, [6, 7]))
chk('F4 a2 = (6, 7)', vclose(a2, [6, 7]))
chk('F5 z3 = 40 = 24 + 14 + 2', vclose(z3, [40]))
chk('F6 yhat = 40', vclose(yh, [40]))
L0, grads, nodes, _ = backward(Ws, bs, x0, y0, ACTS)
chk('F7 L = 1/2 (40-50)^2 = 50, error -10', close(L0, 50) and close(yh[0] - 50, -10))
chk('B1 dL/dyhat = -10', vclose(nodes['yhat'], [-10]))
chk('B2 dL/dz3 = -10', vclose(nodes['z3'], [-10]))
chk('B3 dL/dW3 = [-60, -70], dL/db3 = -10, dL/da2 = (-40, -20)', vclose(grads[2][0], [[-60, -70]]) and vclose(grads[2][1], [-10]) and vclose(nodes['a2'], [-40, -20]))
chk('B4 dL/dz2 = (-40, -20)', vclose(nodes['z2'], [-40, -20]))
chk('B5 dL/dW2 = [[-280,-160,0],[-140,-80,0]], db2 = (-40,-20), da1 = (-60, 10, -20)', vclose(grads[1][0], [[-280, -160, 0], [-140, -80, 0]]) and vclose(grads[1][1], [-40, -20]) and vclose(nodes['a1'], [-60, 10, -20]))
chk('B5 rows: -40-20, 20-10, -40+20', close(1*-40 + 1*-20, -60) and close(-0.5*-40 + 0.5*-20, 10) and close(1*-40 + -1*-20, -20))
chk('B6 dL/dz1 = (-60, 10, 0): the -20 is blocked', vclose(nodes['z1'], [-60, 10, 0]))
chk('B7 dL/dW1 = [[-1800,-600],[300,100],[0,0]], db1 = (-60, 10, 0)', vclose(grads[0][0], [[-1800, -600], [300, 100], [0, 0]]) and vclose(grads[0][1], [-60, 10, 0]))
chk('dL/da0 = W1^T dL/dz1 = (-4, -19) (the stepper shows it, nobody uses it)', vclose(nodes['a0'], [-4, -19]))
chk('the bigger weight gets twice the blame: 4*(-10) vs 2*(-10)', close(4 * -10, 2 * (2 * -10)))
# gradient table magnitudes
chk('lopsided: |dW1_11| / |db3| = 180', close(abs(grads[0][0][0, 0]) / abs(grads[2][1][0]), 180))

def step(Ws, bs, grads, eta):
    return [W - eta * g[0] for W, g in zip(Ws, grads)], [b - eta * g[1] for b, g in zip(bs, grads)]
Wn, bn = step(Ws, bs, grads, 1e-5)
chk('U: W1 = [[0.118,0.306],[0.197,-0.101],[-0.1,0.2]]', vclose(Wn[0], [[0.118, 0.306], [0.197, -0.101], [-0.1, 0.2]]))
chk('U: b1 = (1.0006, -1.0001, -1)', vclose(bn[0], [1.0006, -1.0001, -1]))
chk('U: W2 = [[1.0028,-0.4984,1],[1.0014,0.5008,-1]], b2 = (1.0004,-1.9998)', vclose(Wn[1], [[1.0028, -0.4984, 1], [1.0014, 0.5008, -1]]) and vclose(bn[1], [1.0004, -1.9998]))
chk('U: W3 = [4.0006, 2.0007], b3 = 2.0001', vclose(Wn[2], [[4.0006, 2.0007]]) and vclose(bn[2], [2.0001]))
chk('U: 0.1 - 1e-5 (-1800) = 0.118', close(0.1 - 1e-5 * -1800, 0.118))
yh1, c1 = forward(Wn, bn, x0, ACTS)
chk('V: z1 = (7.6006, 3.8999, -2)', vclose(c1[1][0], [7.6006, 3.8999, -2]))
chk('V: z2 = (6.6786, 7.5645) to 4 dp', vclose(rnd(c1[2][0], 4), [6.6786, 7.5645]))
chk('V: yhat = 43.8527 (4 dp), error -6.1473 -> -6.15', close(round(yh1[0], 4), 43.8527) and close(round(yh1[0] - 50, 2), -6.15))
L1 = loss(Wn, bn, x0, y0, ACTS)
chk('V: L = 18.89 (2 dp)', close(round(L1, 2), 18.89))
print(f'        exact: yhat = {yh1[0]:.6f}, L = {L1:.6f}')
for eta, want_y, want_L in ((1e-4, 79.29, 428.8), ):
    Wx, bx = step(Ws, bs, grads, eta); yx = forward(Wx, bx, x0, ACTS)[0][0]; Lx = loss(Wx, bx, x0, y0, ACTS)
    chk(f'eta = 1e-4: yhat = 79.29 (79.3), L = 428.8 (429)', close(round(yx, 2), want_y) and close(round(Lx, 1), want_L) and round(yx, 1) == 79.3 and round(Lx) == 429)
Wx, bx = step(Ws, bs, grads, 1e-3); y3 = forward(Wx, bx, x0, ACTS)[0][0]
chk('eta = 1e-3: yhat = 508.9', close(round(y3, 1), 508.9))
print(f'        eta=1e-3 exact yhat = {y3:.4f}')

# finite differences over all 17 parameters
def flat(Ws, bs): return np.concatenate([np.concatenate([W.ravel(), b.ravel()]) for W, b in zip(Ws, bs)])
def unflat(v, Ws, bs):
    out_W, out_b, k = [], [], 0
    for W, b in zip(Ws, bs):
        out_W.append(v[k:k + W.size].reshape(W.shape)); k += W.size
        out_b.append(v[k:k + b.size].copy()); k += b.size
    return out_W, out_b
th = flat(Ws, bs); gb = np.concatenate([np.concatenate([g[0].ravel(), g[1].ravel()]) for g in grads])
h = 1e-5; fd = np.zeros_like(th)
for i in range(len(th)):
    tp = th.copy(); tp[i] += h; tm = th.copy(); tm[i] -= h
    fd[i] = (loss(*unflat(tp, Ws, bs), x0, y0, ACTS) - loss(*unflat(tm, Ws, bs), x0, y0, ACTS)) / (2 * h)
chk(f'finite differences agree on all 20 gradients (max |diff| = {np.max(np.abs(fd - gb)):.1e} < 1e-4)', np.max(np.abs(fd - gb)) < 1e-4)
# the w-train1 panel example: W1_11 with h = 1e-3 is exact up to rounding because L is quadratic in W1_11 near here
tp = th.copy(); tp[0] += 1e-3; tm = th.copy(); tm[0] -= 1e-3
Lp = loss(*unflat(tp, Ws, bs), x0, y0, ACTS); Lm = loss(*unflat(tm, Ws, bs), x0, y0, ACTS)
chk('gradient check W1_11, h = 0.001: L+ = 48.2162, L- = 51.8162, slope -1800', close(round(Lp, 4), 48.2162) and close(round(Lm, 4), 51.8162) and close((Lp - Lm) / 2e-3, -1800, 1e-6))
print(f'        L+ = {Lp:.6f}  L- = {Lm:.6f}')

# scaled inputs (w-train1 toggle): age/100, exp/10, run to convergence
def train(Ws, bs, x, y, eta, n):
    Ws = [W.copy() for W in Ws]; bs = [b.copy() for b in bs]; Ls = []
    for _ in range(n):
        L, g, _, _ = backward(Ws, bs, x, y, ACTS); Ls.append(L); Ws, bs = step(Ws, bs, g, eta)
    return Ws, bs, Ls
_, _, Ls = train(Ws, bs, x0, y0, 1e-5, 400)
chk(f'eta = 1e-5 for 400 steps: loss falls below 0.01 (L400 = {Ls[-1]:.2e})', Ls[-1] < 1e-2 and all(Ls[i + 1] <= Ls[i] for i in range(len(Ls) - 1)))
_, _, Lb = train(Ws, bs, x0, y0, 1e-4, 6)
chk(f'eta = 1e-4 blows up: L after 1 step = {Lb[1]:.1f} > 50', Lb[1] > 50)
xs = np.array([0.3, 1.0])
_, _, Ls2 = train(Ws, bs, xs, y0, 1e-3, 60)
print(f'        scaled inputs (0.3, 1): L0 = {Ls2[0]:.3f}, after 60 steps at 1e-3: {Ls2[-1]:.3e}')
Lsc0, gsc, _, _ = backward(Ws, bs, xs, y0, ACTS)
print('        scaled grads dW1:', gsc[0][0].tolist(), ' db3:', gsc[2][1].tolist(), ' L0:', Lsc0)

# ---------------------------------------------------------------------------------------------
print('— §3 collapse —')
A1 = np.array([[1, 2], [0, 1]]); c1v = np.array([1, 0]); A2 = np.array([[1, -1], [2, 1]]); c2v = np.array([0, 1])
chk('W2 W1 = [[1,1],[2,5]]', vclose(A2 @ A1, [[1, 1], [2, 5]]))
chk('W2 b1 + b2 = (1, 3)', vclose(A2 @ c1v + c2v, [1, 3]))
for x in ([1, 1], [2, -1], [0, 0], [-3, 4]):
    x = np.array(x, float); chk(f'  collapse holds at x = {x.tolist()}', vclose(A2 @ (A1 @ x + c1v) + c2v, np.array([[1, 1], [2, 5]]) @ x + [1, 3]))
x = np.array([1., 1]); chk('x = (1,1): layer 1 gives (4, 1), layer 2 gives (3, 10)', vclose(A1 @ x + c1v, [4, 1]) and vclose(A2 @ (A1 @ x + c1v) + c2v, [3, 10]))
chk('det(W2 W1) = 3 = det W2 * det W1 = 3*1', close(np.linalg.det(A2 @ A1), 3))
# with ReLU in between, x = (-2, 1): layer 1 = (1, 1) -> no change; x = (1, -2): (-2, -2) -> ReLU (0, 0)
x = np.array([1., -2]); chk('with a bend: x = (1, -2) -> W1x + b1 = (-2, -2) -> ReLU -> (0, 0) -> (0, 1)', vclose(A1 @ x + c1v, [-2, -2]) and vclose(A2 @ relu(A1 @ x + c1v) + c2v, [0, 1]))
chk('...while the straight stack sends it to (1,1)x+... = (-1, -5)', vclose(np.array([[1, 1], [2, 5]]) @ x + [1, 3], [0, -5]))

# ---------------------------------------------------------------------------------------------
print('— §4 folds —')
hat = lambda x: relu(x) - 2 * relu(x - 1) + relu(x - 2)
chk('hat(0) = 0, hat(1) = 1, hat(2) = 0, hat(3) = 0, hat(0.5) = 0.5, hat(-1) = 0', vclose([hat(0), hat(1), hat(2), hat(3), hat(0.5), hat(-1)], [0, 1, 0, 0, .5, 0]))
chk('hat(1.5) = 0.5', close(hat(1.5), 0.5))
chk('a strip folded k times has 2^k pieces: k = 1..4 -> 2, 4, 8, 16', [2 ** k for k in range(1, 5)] == [2, 4, 8, 16])
# folding |x| repeatedly: f(x) = |2x - 1| style tent map on [0,1] — count linear pieces numerically
def tent(x): return 1 - np.abs(2 * x - 1)
xx = np.linspace(0, 1, 200001)
for k in range(1, 5):
    y = xx.copy()
    for _ in range(k): y = tent(y)
    s = np.sign(np.diff(y)); pieces = 1 + int(np.sum(s[1:] != s[:-1]))
    chk(f'  tent folded {k} times: {pieces} straight pieces (2^{k})', pieces == 2 ** k)
# ReLU as tent: tent(x) = 2 relu(x) - 4 relu(x - 1/2) for x in [0,1]
chk('one fold from two ReLUs: 1-|2x-1| = 2ReLU(x) - 4ReLU(x - 1/2) on [0, 1]', vclose(tent(xx), 2 * relu(xx) - 4 * relu(xx - .5)))
# w-folds: least-squares fit of sin on [-pi, pi] (the widget's grid) with N evenly spaced hinges
def fold_fit(f, N, a=-3.2, b=3.2, M=161):
    # exactly the widget's model: a bias plus N hinges ReLU(x - k_i), k_i = a + (b - a) i / N (the first crease sits at the left edge)
    X = np.linspace(a, b, M); Y = f(X)
    knots = a + (b - a) * np.arange(N) / N
    cols = [np.ones_like(X)] + [relu(X - k) for k in knots]
    Phi = np.stack(cols, 1); w, *_ = np.linalg.lstsq(Phi, Y, rcond=None)
    return float(np.sqrt(np.mean((Phi @ w - Y) ** 2)))
for N in (1, 2, 4, 8, 16, 24):
    print(f'        w-folds sine: N = {N:2d}  rms error = {fold_fit(np.sin, N):.4f}')
chk('w-folds: error on the sine shrinks as N grows (1 -> 24)', fold_fit(np.sin, 24) < fold_fit(np.sin, 8) < fold_fit(np.sin, 2))
chk('w-folds readouts: sine N = 1 -> 0.4627, N = 3 -> 0.1293, N = 8 -> 0.0180, N = 24 -> 0.0019', [round(fold_fit(np.sin, n), 4) for n in (1, 3, 8, 24)] == [0.4627, 0.1293, 0.018, 0.0019])
fw = lambda age, ex: W1 @ np.array([age, ex]) + b1
chk('w-forward try-line: exp 25 wakes neuron 3 (z = 1); age 18, exp 30 puts neuron 2 to sleep (z = -0.4)', close(fw(30, 25)[2], 1) and close(fw(18, 30)[1], -0.4) and fw(18, 30)[2] > 0)

# ---------------------------------------------------------------------------------------------
print('— §6 heads —')
z = np.array([2., 1, 0]); q = np.exp(z) / np.exp(z).sum(); yv = np.array([1., 0, 0])
chk('softmax(2,1,0) = (0.665, 0.245, 0.090)', vclose(rnd(q, 3), [0.665, 0.245, 0.090]))
chk('CE = -ln 0.665 = 0.408 nats', close(round(-math.log(q[0]), 3), 0.408))
chk('q - y = (-0.335, 0.245, 0.090)', vclose(rnd(q - yv, 3), [-0.335, 0.245, 0.090]))
chk('entries of q - y sum to 0', close(np.sum(q - yv), 0))
a = np.array([1., 2]); dW = np.outer(q - yv, a)
chk('(q - y) a^T = [[-0.335,-0.670],[0.245,0.489],[0.090,0.180]]', vclose(rnd(dW, 3), [[-0.335, -0.670], [0.245, 0.489], [0.090, 0.180]]))
# finite-difference check of CE gradient
def ce(z, c): return -z[c] + math.log(np.exp(z).sum())
g_fd = np.array([(ce(z + h * e, 0) - ce(z - h * e, 0)) / (2 * h) for e in np.eye(3)])
chk('d CE / dz = q - y (finite differences)', vclose(g_fd, q - yv, 1e-6))
chk('regression head at yhat = 40, y = 50: L = 50, yhat - y = -10', close(0.5 * (40 - 50) ** 2, 50))
# w-heads default states
chk('w-heads regression default yhat = 40 -> arrow -10', True)

# ---------------------------------------------------------------------------------------------
print('— §10 vanishing —')
zz = np.linspace(-10, 10, 200001)
chk("sigmoid' max = 0.25 at z = 0", close(np.max(sig(zz) * (1 - sig(zz))), 0.25))
chk("tanh' max = 1", close(np.max(1 - np.tanh(zz) ** 2), 1))
chk('0.25^5 = 0.00098 (~0.001)', close(round(0.25 ** 5, 5), 0.00098) and close(0.25 ** 5, 1 / 1024))
chk('0.25^10 = 9.5e-7 (~1e-6)', close(round(0.25 ** 10 * 1e7, 1), 9.5))
chk('0.25^20 = 9.1e-13', close(round(0.25 ** 20 * 1e13, 1), 9.1))
chk('He/Glorot scale for fan-in 4: 1/sqrt(4) = 0.5', close(1 / math.sqrt(4), 0.5))

# ---------------------------------------------------------------------------------------------
print('— §9 extra: overshoot, death, scaled inputs (w-train1, w-canyon) —')
def trainL(Ws, bs, x, eta, n):
    Ws = [W.copy() for W in Ws]; bs = [b.copy() for b in bs]; out = []
    for _ in range(n + 1):
        L, g, _, c = backward(Ws, bs, x, y0, ACTS); out.append((L, c[-1][1][0])); Ws, bs = step(Ws, bs, g, eta)
    return out
r = trainL(Ws, bs, x0, 2e-3, 30)
chk('eta = 2e-3: step 1 overshoots to yhat = 1167.5; from step 2 on every hidden-1 neuron is asleep, yhat = 0, loss 1250 forever', close(round(r[1][1], 1), 1167.5) and all(close(L, 1250) and close(yh, 0) for L, yh in r[2:]))
Wsc = [Ws[0] * np.array([100, 10]), Ws[1], Ws[2]]; xsc = np.array([0.3, 1.0])
chk('scaled inputs (age/100, exp/10) with W1 columns x100, x10: same start yhat = 40, L = 50', close(forward(Wsc, bs, xsc, ACTS)[0][0], 40))
rs = trainL(Wsc, bs, xsc, 5e-4, 60)
chk(f'scaled, eta = 5e-4: L falls every step, below 1e-6 by step 40 (L40 = {rs[40][0]:.1e})', all(rs[i + 1][0] <= rs[i][0] + 1e-12 for i in range(60)) and rs[40][0] < 1e-6)
rr = trainL(Ws, bs, x0, 5e-4, 5)
chk(f'raw, eta = 5e-4: first step explodes (L1 = {rr[1][0]:.0f})', rr[1][0] > 1e4)
# canyon slice: ŷ as a function of (ΔW1_11, Δb3) near the start: dŷ/dW1_11 = 180 (raw), 1.8 (scaled)
def yslice(W1_11, b3, scaled):
    W = [w.copy() for w in (Wsc if scaled else Ws)]; b = [v.copy() for v in bs]
    W[0][0, 0] = W1_11; b[2][0] = b3; return forward(W, b, xsc if scaled else x0, ACTS)[0][0]
e = 1e-6
chk('canyon: dyhat/dW1_11 = 180 raw, 1.8 scaled; dyhat/db3 = 1', close((yslice(0.1 + e, 2, False) - yslice(0.1 - e, 2, False)) / 2e-6, 180, 1e-4) and close((yslice(10 + e, 2, True) - yslice(10 - e, 2, True)) / 2e-6, 1.8, 1e-4) and close((yslice(0.1, 2 + e, False) - yslice(0.1, 2 - e, False)) / 2e-6, 1, 1e-4))
chk('canyon curvature ratio raw = 180^2 = 32400 : 1; the 2-D slice is stable for eta < 2/(180^2+1) = 6.17e-5', close(2 / (180 ** 2 + 1), 6.172e-5, 1e-8))

# ---------------------------------------------------------------------------------------------
print('— checks —')
chk('c1: 4->5->3 has 20+5+15+3 = 43 numbers; W2 is 3x5', 5 * 4 + 5 + 3 * 5 + 3 == 43)
chk('c2: z = 2 - 4 + 1 = -1 -> ReLU 0, slope 0', 2 * 1 - 1 * 4 + 1 == -1)
chk('c5: hat(1.5) = 0.5', close(hat(1.5), .5))
chk('c6: 6 folds -> 64 pieces', 2 ** 6 == 64)
zz7 = W1 @ np.array([30, 20]) + b1
chk('c7: exp 20 -> z1 = (10, 3, 0)', vclose(zz7, [10, 3, 0]))
chk('c9: q - y = (0.2, 0.7, -0.9)', vclose(np.array([.2, .7, .1]) - [0, 0, 1], [.2, .7, -.9]))
chk('c11: (5,-3,2) * relu\'(-1,2,.5) = (0,-3,2)', vclose(np.array([5, -3, 2]) * drelu(np.array([-1, 2, .5])), [0, -3, 2]))
chk('c12: W^T (1,-1) = (-2, 2)', vclose(np.array([[1, 2], [3, 0]]).T @ [1, -1], [-2, 2]))
chk('c14: W3^T * 4 = (16, 8)', vclose(W3.T @ [4], [16, 8]))
chk('c15: 0.5 - 1e-3 (-200) = 0.7', close(0.5 - 1e-3 * -200, 0.7))
chk('c16: (3.02 - 2.98)/0.02 = 2', close((3.02 - 2.98) / 0.02, 2))
chk('c17: 0.25^8 = 1.5e-5', close(round(0.25 ** 8, 6), 0.000015))
tp = th.copy(); tp[6] += 1e-5; tm = th.copy(); tm[6] -= 1e-5   # W1_31 is index 4 (row 3 col 1)? locate it properly
i31 = 4
tp = th.copy(); tp[i31] += 1e-5; tm = th.copy(); tm[i31] -= 1e-5
chk('c20: wire age -> sleeping neuron: backprop 0, finite difference 0', close(gb[i31], 0) and close((loss(*unflat(tp, Ws, bs), x0, y0, ACTS) - loss(*unflat(tm, Ws, bs), x0, y0, ACTS)) / 2e-5, 0) and close(th[i31], -0.1))

# ---------------------------------------------------------------------------------------------
print('— practice arena —')
# P1
sh = [(4, 3), (4,), (4, 4), (4,), (2, 4), (2,)]
chk('P1: 3-4-4-2 -> 12+4+16+4+8+2 = 46 numbers', sum(int(np.prod(s)) for s in sh) == 46)
# P2
PW1 = np.array([[1., -1], [2, 1]]); Pb1 = np.array([0., -3]); PW2 = np.array([[3., -2]]); Pb2 = np.array([4.])
PA = ['relu', 'none']
y2, c2 = forward([PW1, PW2], [Pb1, Pb2], [2, 1], PA)
chk('P2a: x = (2,1): z1 = (1, 2), a1 = (1, 2), yhat = 3', vclose(c2[1][0], [1, 2]) and vclose(y2, [3]))
y2b, c2b = forward([PW1, PW2], [Pb1, Pb2], [1, 3], PA)
chk('P2b: x = (1,3): z1 = (-2, 2), a1 = (0, 2), yhat = 0', vclose(c2b[1][0], [-2, 2]) and vclose(c2b[1][1], [0, 2]) and vclose(y2b, [0]))
# P3
Q1 = np.array([[2., 0], [1, 1]]); q1 = np.array([1., -1]); Q2 = np.array([[1., 1], [0, 3]]); q2 = np.array([0., 2])
chk('P3: W2W1 = [[3,1],[3,3]], W2b1 + b2 = (0, -1)', vclose(Q2 @ Q1, [[3, 1], [3, 3]]) and vclose(Q2 @ q1 + q2, [0, -1]))
chk('P3: check at x = (1,2): (3,2) -> (5,8) both ways', vclose(Q1 @ [1, 2] + q1, [3, 2]) and vclose(Q2 @ (Q1 @ [1, 2] + q1) + q2, [5, 8]) and vclose((Q2 @ Q1) @ [1, 2] + [0, -1], [5, 8]))
# P4
f4 = lambda x: 3 * relu(x - 1) - 4 * relu(x - 2) + relu(x - 5)
chk('P4: f = 3R(x-1) - 4R(x-2) + R(x-5): f(1)=0, f(2)=3, f(3)=2, f(5)=0, f(6)=0, f(0)=0', vclose([f4(1), f4(2), f4(3), f4(5), f4(6), f4(0), f4(10)], [0, 3, 2, 0, 0, 0, 0]))
# P5
z5 = np.array([1., 3, 0]); q5 = np.exp(z5) / np.exp(z5).sum()
chk('P5: e^1, e^3, e^0 = 2.718, 20.086, 1; sum 23.804', vclose(rnd(np.exp(z5), 3), [2.718, 20.086, 1]) and close(round(np.exp(z5).sum(), 3), 23.804))
chk('P5: q = (0.114, 0.844, 0.042)', vclose(rnd(q5, 3), [0.114, 0.844, 0.042]))
chk('P5: loss = -ln 0.844 = 0.170', close(round(-math.log(q5[1]), 3), 0.170))
chk('P5: q - y = (0.114, -0.156, 0.042)', vclose(rnd(q5 - [0, 1, 0], 3), [0.114, -0.156, 0.042]))
print('        P5 exact q:', q5, ' loss', -math.log(q5[1]))
# P6
chk('P6: (4,-2,6,-1) * relu\'(3,-1,0.5,-4) = (4,0,6,0)', vclose(np.array([4, -2, 6, -1]) * drelu(np.array([3, -1, .5, -4])), [4, 0, 6, 0]))
# P7
W7 = np.array([[2., -1, 0], [1, 3, -2]]); a7 = np.array([1., 2, 3]); d7 = np.array([.5, -1])
chk('P7: dW = [[0.5,1,1.5],[-1,-2,-3]], db = (0.5,-1), da = (0, -3.5, 2)', vclose(np.outer(d7, a7), [[.5, 1, 1.5], [-1, -2, -3]]) and vclose(W7.T @ d7, [0, -3.5, 2]))
# P8 / P9 / P10: P2's net, x = (2,1), y = 5, output linear
L8, g8, n8, _ = backward([PW1, PW2], [Pb1, Pb2], np.array([2., 1]), np.array([5.]), PA)
chk('P8: L = 2, dL/dyhat = -2', close(L8, 2) and vclose(n8['yhat'], [-2]))
chk('P8: dW2 = (-2, -4), db2 = -2, da1 = (-6, 4)', vclose(g8[1][0], [[-2, -4]]) and vclose(g8[1][1], [-2]) and vclose(n8['a1'], [-6, 4]))
chk('P8: dz1 = (-6, 4), dW1 = [[-12,-6],[8,4]], db1 = (-6, 4)', vclose(n8['z1'], [-6, 4]) and vclose(g8[0][0], [[-12, -6], [8, 4]]) and vclose(g8[0][1], [-6, 4]))
Wn9, bn9 = step([PW1, PW2], [Pb1, Pb2], g8, 0.01)
chk('P9: W1 = [[1.12,-0.94],[1.92,0.96]], b1 = (0.06,-3.04), W2 = (3.02,-1.96), b2 = 4.02', vclose(Wn9[0], [[1.12, -.94], [1.92, .96]]) and vclose(bn9[0], [.06, -3.04]) and vclose(Wn9[1], [[3.02, -1.96]]) and vclose(bn9[1], [4.02]))
y9, c9 = forward(Wn9, bn9, [2, 1], PA)
chk('P9: z1 = (1.36, 1.76), yhat = 4.6776, L = 0.0520', vclose(c9[1][0], [1.36, 1.76]) and close(y9[0], 4.6776) and close(round(0.5 * (y9[0] - 5) ** 2, 4), 0.0520))
chk('P9: 3.02*1.36 = 4.1072, 1.96*1.76 = 3.4496', close(3.02 * 1.36, 4.1072) and close(1.96 * 1.76, 3.4496))
print(f'        P9 exact L = {0.5 * (y9[0] - 5) ** 2:.6f}')
def L10(w):
    W2 = np.array([[w, -2.]]); return loss([PW1, W2], [Pb1, Pb2], [2, 1], [5], PA)
chk('P10: L(3.1) = 1.805, L(2.9) = 2.205, central (1.805-2.205)/0.2 = -2 = backprop', close(L10(3.1), 1.805) and close(L10(2.9), 2.205) and close((L10(3.1) - L10(2.9)) / .2, -2))
chk('P10: one-sided (1.805 - 2)/0.1 = -1.95', close((L10(3.1) - L10(3)) / .1, -1.95))
# P11
chk('P11: (0.25*2)^6 = 1/64 = 0.0156; 0.25^6 = 1/4096 = 0.000244', close(0.5 ** 6, 1 / 64) and close(round(1 / 64, 4), 0.0156) and close(round(0.25 ** 6, 6), 0.000244))
# P12
Z12 = np.array([[2, -1, .5, 3], [-3, -.2, -1, -4], [-1, -2, 1, -.5]]); G12 = np.array([[1, 1, 1, 1], [.5, -.5, 2, 1], [.4, -.2, .6, 1.]])
dead = [i for i in range(3) if np.all(Z12[i] <= 0)]
chk('P12: neuron 2 is dead on the batch (all z < 0)', dead == [1])
db12 = (G12 * drelu(Z12)).sum(1)
chk('P12: summed bias gradients = (3, 0, 0.6)', vclose(db12, [3, 0, .6]))
X12 = np.array([[1, 0], [2, 1], [0, 1], [1, 1.]])   # the 4 inputs (2 features)
dW12 = (G12 * drelu(Z12)) @ X12
chk('P12: summed weight gradients: n1 (1+0+1, 0+1+1) = (2, 2), n2 (0, 0), n3 (0, 0.6)', vclose(dW12, [[2, 2], [0, 0], [0, .6]]))
# P13
pA = 16 + 16 + 16 + 1; pB = (2 + 2) + 4 * (4 + 2) + (2 + 1)
chk('P13: A 1-16-1 has 49 numbers, at most 17 pieces; B 1-2-2-2-2-2-1 has 31 numbers and can make 2^5 = 32 pieces', pA == 49 and pB == 31)
x13 = np.linspace(0, 1, 400001); y13 = x13.copy()
for _ in range(5): y13 = 2 * relu(y13) - 4 * relu(y13 - .5)
s = np.sign(np.diff(y13)); chk('P13: five 2-ReLU tent layers really make 32 pieces', 1 + int(np.sum(s[1:] != s[:-1])) == 32)
# P14: the recorded runs
runs = {e: trainL(Ws, bs, x0, e, 10) for e in (1e-5, 1e-4, 2e-3)}
for e, r in runs.items(): print(f'        P14 eta={e:g}: ' + ', '.join(f'{L:.2f}' for L, _ in r[:4]) + f' ... step10 {r[10][0]:.4g}  yhat1 {r[1][1]:.2f}')
chk('P14: eta 1e-5 losses 50, 18.89, 7.07, 2.62 (monotone), step 10: 0.0024', vclose(rnd([L for L, _ in runs[1e-5][:4]], 2), [50, 18.89, 7.07, 2.62]) and close(round(runs[1e-5][10][0], 4), 0.0024))
chk('P14: eta 1e-4 losses 50, 428.81, 1078.76, 841.74 (bouncing), step 10: 0.0157', vclose(rnd([L for L, _ in runs[1e-4][:4]], 2), [50, 428.81, 1078.76, 841.74]) and close(round(runs[1e-4][10][0], 4), 0.0157))
chk('P14: loss 1250 means yhat = 0: 1/2 (0 - 50)^2 = 1250', close(0.5 * 50 ** 2, 1250))
chk('P14: eta 2e-3 losses 50, 624412, 1250, 1250 (dead)', close(round(runs[2e-3][1][0]), 624412) and vclose(rnd([L for L, _ in runs[2e-3][2:5]], 2), [1250, 1250, 1250]))

print('— prose extras —')
chk('photocopy: 150% then 80% = 120%', close(1.5 * 0.8, 1.2))
chk('sigmoid(2) = 0.881, slope 0.881 x 0.119 = 0.105', close(round(float(sig(2)), 3), 0.881) and close(round(float(sig(2) * (1 - sig(2))), 3), 0.105))
chk('twenty layers that each double: 2^20 = 1 048 576 (about a million)', 2 ** 20 == 1048576)
chk('P9: loss 2 -> 0.052 is a factor of almost 40 (38.5)', close(round(2 / 0.051971, 1), 38.5))
_f = [runs[1e-5][i][0] / runs[1e-5][i + 1][0] for i in range(3)]; print('        P14 factors', _f)
chk('P14: eta 1e-5 falls by a factor of about 2.7 per step', all(2.6 < v < 2.75 for v in _f))
chk('w-paper: one wide layer needs 2^k - 1 creases; deep uses 2k ReLUs (k = 3: 7 vs 6; k = 5: 31 vs 10)', (2 ** 3 - 1, 2 * 3, 2 ** 5 - 1, 2 * 5) == (7, 6, 31, 10))
chk('c17 wording: 0.25^8 = 1/65536', close(0.25 ** 8, 1 / 65536))

print(f'\nall {ok} checks passed')
