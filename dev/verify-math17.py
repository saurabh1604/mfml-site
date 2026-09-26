# Unit 17 · Machines with Memory — machine verification of every number the page prints:
# the running note of §1, the recurrent cell, the unrolled count, the read-out softmax, backprop through time,
# powers and eigenvalues, clipping, the LSTM and GRU steps, parameter counts, the bottleneck, beam search,
# the hero's numbers, the widgets' fixed readouts, the memory lab (same RNG as the page), the derivation drawers
# and the fourteen practice problems (tpl/u17-*.html). Plain numpy, float64. Tolerance 1e-6 unless a rounded value is printed.
import math
import numpy as np

ok = 0
def chk(name, cond):
    global ok
    assert cond, f"FAIL: {name}"
    ok += 1
    print(f"  ok    {name}")

close = lambda a, b, t=1e-6: abs(a - b) < t
r = lambda v, d: round(float(v), d)
from decimal import Decimal, ROUND_HALF_UP
rh = lambda v, d: float(Decimal(repr(float(v))).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP))   # JavaScript's toFixed rounds halves up
sig = lambda z: 1 / (1 + math.exp(-z))
th = math.tanh

def rnn1(w, u, b, xs, h0=0.0):
    h = [h0]; z = [None]
    for x in xs:
        z.append(w * h[-1] + u * x + b); h.append(th(z[-1]))
    return h, z

def bptt1(w, u, b, xs, y):
    h, z = rnn1(w, u, b, xs); T = len(xs)
    dh = [0.0] * (T + 1); dz = [0.0] * (T + 1); cw = [0.0] * (T + 1)
    dh[T] = h[T] - y; dw = du = 0.0
    for t in range(T, 0, -1):
        dz[t] = dh[t] * (1 - h[t] ** 2); cw[t] = dz[t] * h[t - 1]; dw += cw[t]; du += dz[t] * xs[t - 1]; dh[t - 1] = w * dz[t]
    return dict(h=h, z=z, dh=dh, dz=dz, cw=cw, dw=dw, du=du, L=0.5 * (h[T] - y) ** 2)

# ---------------------------------------------------------------------------------------------
print('— §1 · the running note (quarter turn, then add) —')
Wq = np.array([[0, -1], [1, 0]]); V = {'dog': np.array([1, 0]), 'man': np.array([0, 1]), 'bites': np.array([1, 1]), 'sees': np.array([-1, 1])}
def note(ws, W=Wq):
    h = np.zeros(2); P = []
    for w in ws: h = W @ h + V[w]; P.append(h.copy())
    return P
A = note(['dog', 'bites', 'man']); B = note(['man', 'bites', 'dog'])
chk('dog bites man: (1,0) → (1,2) → (−2,2)', np.allclose(A, [[1, 0], [1, 2], [-2, 2]]))
chk('man bites dog: (0,1) → (0,1) → (0,0)', np.allclose(B, [[0, 1], [0, 1], [0, 0]]))
chk('intermediate turns: W(1,0) = (0,1), W(1,2) = (−2,1); W(0,1) = (−1,0)', np.allclose(Wq @ [1, 0], [0, 1]) and np.allclose(Wq @ [1, 2], [-2, 1]) and np.allclose(Wq @ [0, 1], [-1, 0]))
chk('without the turn both end at the plain sum (2,2)', np.allclose(note(['dog', 'bites', 'man'], np.eye(2))[-1], [2, 2]) and np.allclose(note(['man', 'bites', 'dog'], np.eye(2))[-1], [2, 2]))
chk('check c2: "bites dog" → (0,1)', np.allclose(note(['bites', 'dog'])[-1], [0, 1]))
LONG = ['The', 'train', 'to', 'Delhi', 'from', 'platform', 'four', 'is', 'late']
chk('w-order window: a 3-word window at "late" holds "four is late"; "train" needs a window of 8', LONG[-3:] == ['four', 'is', 'late'] and len(LONG) - LONG.index('train') == 8)

print('— §2 · the recurrent cell —')
h, z = rnn1(0.5, 1, 0, [1, 0, 0])
chk('h1 = tanh 1 ≈ 0.7616, h2 = tanh(0.3808) ≈ 0.3634, h3 = tanh(0.1817) ≈ 0.1797', [r(v, 4) for v in h[1:]] == [0.7616, 0.3634, 0.1797] and r(z[2], 4) == 0.3808 and r(z[3], 4) == 0.1817)
chk('"after three steps only 0.18 is left of the 0.76"', r(h[3], 2) == 0.18 and r(h[1], 2) == 0.76)
chk('w-rnn-step: h3/h1 kept ≈ 23.6%', r(h[3] / h[1] * 100, 1) == 23.6)
chk('check c3: w = 1 → h2 = tanh(0.7616) ≈ 0.642', r(rnn1(1, 1, 0, [1, 0])[0][2], 3) == 0.642)
chk('drawer s2: tanh slope at h1: 1 − 0.7616² ≈ 0.42 (0.5800 squared)', r(h[1] ** 2, 4) == 0.5800 and r(1 - h[1] ** 2, 2) == 0.42)
chk('drawer s2: small-signal weights w²u x1 with w = 0.5 → 0.25', 0.5 ** 2 == 0.25)

print('— §3 · unrolling and counting —')
cnt = lambda h, d: h * (h + d) + h
chk('h = 4, d = 3: 16 + 12 + 4 = 32', cnt(4, 3) == 32 and 4 * 4 == 16 and 4 * 3 == 12)
chk('check c5: h = 3, d = 2 → 18 (9 + 6 + 3); 15 without b; 900 for 50 unshared copies', cnt(3, 2) == 18 and 9 + 6 == 15 and 18 * 50 == 900)
chk('drawer s3: 10 unshared steps of h = 4, d = 3 → 320', 10 * cnt(4, 3) == 320)

print('— §4 · the read-out —')
sc = np.array([2, 1, 0.5, -1.0]); e = np.exp(sc); q = e / e.sum()
chk('e² ≈ 7.389, e ≈ 2.718, e^0.5 ≈ 1.649, e^−1 ≈ 0.368, total ≈ 12.124', [r(v, 3) for v in e] == [7.389, 2.718, 1.649, 0.368] and r(e.sum(), 3) == 12.124)
chk('softmax ≈ (0.609, 0.224, 0.136, 0.030)', [r(v, 3) for v in q] == [0.609, 0.224, 0.136, 0.030])
chk('loss for Delhi −ln 0.609 ≈ 0.495', r(-math.log(q[0]), 3) == 0.495)
chk('check c7: loss for Mumbai −ln 0.224 ≈ 1.50; distractor −ln(1 − 0.609) ≈ 0.94', r(-math.log(q[1]), 2) == 1.50 and r(-math.log(1 - 0.609), 2) == 0.94)
chk('drawer s4: blame q − y for Delhi = (−0.391, 0.224, 0.136, 0.030)', [r(v, 3) for v in q - np.array([1, 0, 0, 0])] == [-0.391, 0.224, 0.136, 0.030])
LMtoy = [[.5, .3, .15, .05], [.55, .3, .1, .05], [.6, .25, .1, .05]]
chk('w-shapes toy next-word bars each sum to 1', all(abs(sum(p) - 1) < 1e-12 for p in LMtoy))

print('— §5 · backprop through time —')
f32 = 0.5 * (1 - h[3] ** 2); f21 = 0.5 * (1 - h[2] ** 2)
chk('∂h3/∂h2 ≈ 0.4838, ∂h2/∂h1 ≈ 0.4340, ∂h3/∂h1 ≈ 0.2100', r(f32, 4) == 0.4838 and r(f21, 4) == 0.4340 and r(f32 * f21, 4) == 0.2100)
g = bptt1(0.5, 1, 0, [1, 0, 0, 0], 1)
chk('step machine forward: h = 0.7616, 0.3634, 0.1797, 0.0896; z4 ≈ 0.0899', [r(v, 4) for v in g['h'][1:]] == [0.7616, 0.3634, 0.1797, 0.0896] and r(g['z'][4], 4) == 0.0899)
chk('seed: L = ½(h4 − 1)² ≈ 0.4144, ∂L/∂h4 ≈ −0.9104', r(g['L'], 4) == 0.4144 and r(g['dh'][4], 4) == -0.9104)
chk('blame to the notes: −0.9104, −0.4515, −0.2185, −0.0948', [r(g['dh'][t], 4) for t in (4, 3, 2, 1)] == [-0.9104, -0.4515, -0.2185, -0.0948])
chk('∂L/∂z: −0.9031, −0.4369, −0.1896, −0.0398', [r(g['dz'][t], 4) for t in (4, 3, 2, 1)] == [-0.9031, -0.4369, -0.1896, -0.0398])
chk('reports for w: −0.1623, −0.1588, −0.1444, 0 → ∂L/∂w ≈ −0.4655', [r(g['cw'][t], 4) for t in (4, 3, 2, 1)] == [-0.1623, -0.1588, -0.1444, 0] and r(g['dw'], 4) == -0.4655)
chk('∂L/∂u ≈ −0.0398 (word 1 only); blame shrinks about 9.6 times from word 4 to word 1', r(g['du'], 4) == -0.0398 and r(g['dh'][4] / g['dh'][1], 1) == 9.6)
chk('check c9: −0.144 − 0.159 − 0.162 ≈ −0.466 (and −0.155 is the 3-way average)', r(g['dw'], 3) == -0.466 and r((-0.144 - 0.159 - 0.162) / 3, 3) == -0.155)
chk('check c8: 0.5⁴ = 0.0625 (0.5⁵ ≈ 0.031)', 0.5 ** 4 == 0.0625 and r(0.5 ** 5, 3) == 0.031)
chk('step-card shrink factors w(1 − h²): 0.496, 0.484, 0.434', [r(0.5 * (1 - g['h'][t] ** 2), 3) for t in (4, 3, 2)] == [0.496, 0.484, 0.434])

print('— §6 · powers and eigenvalues —')
chk('0.5¹⁰ ≈ 0.000977, 1.5¹⁰ ≈ 57.67, 1¹⁰ = 1', r(0.5 ** 10, 6) == 0.000977 and r(1.5 ** 10, 2) == 57.67)
chk('0.9⁵⁰ ≈ 0.005 (0.00515), 1.1⁵⁰ ≈ 117', r(0.9 ** 50, 5) == 0.00515 and r(1.1 ** 50, 0) == 117)
chk('check c10: 0.5⁹ ≈ 0.00195 > 0.001 > 0.5¹⁰; 2¹⁰ = 1024', r(0.5 ** 9, 5) == 0.00195 and 0.5 ** 9 > 1e-3 > 0.5 ** 10 and 2 ** 10 == 1024)
first_below = lambda w, eps=1e-3: math.floor(math.log(eps) / math.log(w)) + 1
chk('w-power readout: w = 0.5 first below 10⁻³ at t = 10; w = 1.5 passes 1000 at t = 18', first_below(0.5) == 10 and math.floor(math.log(1e3) / math.log(1.5)) + 1 == 18)
W = np.array([[0.9, 0.4], [0.1, 0.6]]); ev = sorted(np.linalg.eigvals(W).real, reverse=True)
chk('W = [[0.9,0.4],[0.1,0.6]]: eigenvalues 1 and 0.5; trace 1.5, det 0.5', np.allclose(ev, [1, 0.5]) and close(np.trace(W), 1.5) and close(np.linalg.det(W), 0.5))
chk('eigen-directions: W(4,1) = (4,1), W(1,−1) = 0.5(1,−1); W(4,1) = (3.6+0.4, 0.4+0.6)', np.allclose(W @ [4, 1], [4, 1]) and np.allclose(W @ [1, -1], [0.5, -0.5]))
chk('(1,0) = 0.2(4,1) + 0.2(1,−1)', np.allclose(0.2 * np.array([4, 1]) + 0.2 * np.array([1, -1]), [1, 0]))
Wt = lambda t: np.linalg.matrix_power(W, t) @ np.array([1.0, 0])
chk('W¹v = (0.9,0.1), W²v = (0.85,0.15), W¹⁰v ≈ (0.8,0.2), limit (0.8,0.2)', np.allclose(Wt(1), [0.9, 0.1]) and np.allclose(Wt(2), [0.85, 0.15]) and np.allclose(Wt(10), [0.8, 0.2], atol=2e-4) and np.allclose(Wt(60), [0.8, 0.2]))
chk('formula W^t v = 0.2(4,1) + 0.2·0.5^t (1,−1) for t = 0…30', all(np.allclose(Wt(t), 0.2 * np.array([4, 1]) + 0.2 * 0.5 ** t * np.array([1, -1])) for t in range(31)))
chk('check c11: diag(0.5, 1.2) from (1,1) → (0.5^t, 1.2^t)', np.allclose(np.linalg.matrix_power(np.diag([0.5, 1.2]), 7) @ [1, 1], [0.5 ** 7, 1.2 ** 7]))
R = np.array([[0.8, -0.6], [0.6, 0.8]]); lr = np.linalg.eigvals(R)
chk('rotate preset: eigenvalues 0.8 ± 0.6i, |λ| = 1, turn ≈ 36.87°, length kept', np.allclose(sorted(lr.imag), [-0.6, 0.6]) and np.allclose(abs(lr), 1) and r(math.degrees(math.atan2(0.6, 0.8)), 2) == 36.87 and close(np.linalg.norm(np.linalg.matrix_power(R, 30) @ [1, 0]), 1))
for name, M, want in [('fade', [[.5, .2], [.1, .4]], [0.6, 0.3]), ('explode', [[1.1, .2], [.1, 1.0]], [1.2, 0.9])]:
    chk(f'eigen-memory preset {name}: eigenvalues {want}', np.allclose(sorted(np.linalg.eigvals(np.array(M)).real, reverse=True), want))
chk('drawer s6: tanh can only shrink — |w(1−h²)| ≤ |w| along the §2 run', all(abs(0.5 * (1 - v ** 2)) <= 0.5 for v in h[1:]))

print('— §7 · clipping —')
clip = lambda gv, c: gv * min(1, c / np.linalg.norm(gv))
chk('(30,40): length 50, c = 5 → (3,4), scale 0.1', np.allclose(clip(np.array([30., 40]), 5), [3, 4]) and close(np.linalg.norm([30, 40]), 50))
chk('(1,2,2): length 3 < 5, unchanged', np.allclose(clip(np.array([1., 2, 2]), 5), [1, 2, 2]) and close(np.linalg.norm([1, 2, 2]), 3))
chk('check c13: (0,−12,5) length 13, c = 2.6 → (0,−2.4,1)', close(np.linalg.norm([0, -12, 5]), 13) and np.allclose(clip(np.array([0., -12, 5]), 2.6), [0, -2.4, 1]))
# the w-clip landscape (the same function and schedule as the page)
Hc, Kc, A0, eta = 3, 14, 0.4, 0.35
Lf = lambda a, b: 0.09 * ((a + 1.8) ** 2 + 1.4 * b * b) + Hc * sig(Kc * (a - A0))
def gf(a, b):
    s = sig(Kc * (a - A0)); return np.array([0.18 * (a + 1.8) + Hc * Kc * s * (1 - s), 0.252 * b])
def roll(c):
    p = np.array([2.2, 1.5]); P = [p]; G = []
    for i in range(40):
        gv = gf(*p); G.append(np.linalg.norm(gv)); gc = clip(gv, c) if c else gv; p = p - eta * gc; P.append(p)
        if abs(p[0]) > 3.2 or abs(p[1]) > 3.2: return P, G, True
    return P, G, False
P0, G0, off0 = roll(None); P2, G2, off2 = roll(2)
chk('w-clip unclipped: flung off the map at step 9 by a gradient of length ≈ 10.9', off0 and len(P0) - 1 == 9 and r(max(G0), 1) == 10.9)
chk('w-clip with c = 2: stays on the map and reaches the valley (loss < 0.02)', (not off2) and Lf(*P2[-1]) < 0.02)

print('— §8 · the LSTM —')
chk('c = 0.9·1 + 0.2·0.5 = 1.0; h = tanh(1.0) ≈ 0.7616', close(0.9 * 1 + 0.2 * 0.5, 1.0) and r(th(1.0), 4) == 0.7616)
chk('express lane: 0.9¹⁰ ≈ 0.349 vs 0.5¹⁰ ≈ 0.000977 — about 350 times more', r(0.9 ** 10, 3) == 0.349 and round(0.9 ** 10 / 0.5 ** 10, -1) == 360 and 0.9 ** 10 / 0.5 ** 10 > 350)
chk('0.9⁵⁰ ≈ 0.00515, 0.99⁵⁰ ≈ 0.605', r(0.9 ** 50, 5) == 0.00515 and r(0.99 ** 50, 3) == 0.605)
chk('check c14: 0.5·2 + 1·(−0.4) = 0.6', close(0.5 * 2 - 0.4, 0.6))
chk('check c15: 0.95²⁰ ≈ 0.358; plain 0.5²⁰ < 10⁻⁶', r(0.95 ** 20, 3) == 0.358 and 0.5 ** 20 < 1e-6)
chk('lab gates: σ(5) ≈ 0.993, σ(−5) ≈ 0.0067', r(sig(5), 3) == 0.993 and r(sig(-5), 4) == 0.0067)
chk('drawer s8: leaky sum c3 = f3 f2 i1 g1 + f3 i2 g2 + i3 g3 (random check)', (lambda f, i, gg: close(((0 * f[0] + i[0] * gg[0]) * f[1] + i[1] * gg[1]) * f[2] + i[2] * gg[2], f[2] * f[1] * i[0] * gg[0] + f[2] * i[1] * gg[1] + i[2] * gg[2]))([.3, .7, .9], [.2, .5, .1], [.4, -.6, .8]))

print('— §8 · the memory lab (the page\'s own RNG: Park–Miller, seed 1000 + T) —')
def seeded(seed):
    s = [seed % 2147483647 or 1]
    def rnd():
        s[0] = (s[0] * 16807) % 2147483647; return (s[0] - 1) / 2147483646
    return rnd
def lab_cells(sv, w, f):
    hr = c = hg = 0.0; ok = {}
    for t, x in enumerate(sv):
        m = 1 if t == 0 else 0
        hr = th(w * hr + x); i = sig(10 * m - 5); c = f * c + i * th(x); zz = sig(10 * m - 5); hg = (1 - zz) * hg + zz * th(x)
    return {'rnn': np.sign(hr) == sv[0], 'lstm': np.sign(c) == sv[0], 'gru': np.sign(hg) == sv[0]}
def lab_acc(T, w, f, A, trials=400):
    rnd = seeded(1000 + T); a = {'rnn': 0, 'lstm': 0, 'gru': 0}
    for k in range(trials):
        first = 1 if rnd() < .5 else -1; sv = [first] + [A * (2 * rnd() - 1) for _ in range(T - 1)]
        o = lab_cells(sv, w, f)
        for key in a: a[key] += o[key]
    return {k: v / trials for k, v in a.items()}
acc5 = lab_acc(5, .9, .99, .5); acc20 = lab_acc(20, .9, .99, .5); acc50 = lab_acc(50, .9, .99, .5); hon50 = lab_acc(50, .9, .9, .5)
chk('default: plain cell ≈ 80% at 5 words (79.8%), a coin toss by 20 (51.2%)', r(acc5['rnn'] * 100, 1) == 79.8 and r(acc20['rnn'] * 100, 1) == 51.2)
chk('default: LSTM and GRU 100% at 50 words; plain cell 45.8%', acc50['lstm'] == 1 and acc50['gru'] == 1 and r(acc50['rnn'] * 100, 1) == 45.8)
chk('check c16: honest LSTM (f = 0.9) slips to about 86% at 50 words (85.5%); GRU stays 100%', r(hon50['lstm'] * 100, 1) == 85.5 and hon50['gru'] == 1)
chk('GRU lane factor 1 − σ(−5) ≈ 0.993', r(1 - sig(-5), 3) == 0.993)

print('— §9 · the GRU and the parameter counts —')
chk('0.75·0.8 + 0.25·(−0.4) = 0.6 − 0.1 = 0.5', close(0.75 * 0.8 + 0.25 * (-0.4), 0.5))
chk('check c17: 0.5·0.2 + 0.5·0.6 = 0.4', close(0.5 * 0.2 + 0.5 * 0.6, 0.4))
Pb = cnt(128, 64)
chk('h = 128, d = 64: 128·192 = 24 576, +128 = 24 704; GRU 74 112; LSTM 98 816', 128 * 192 == 24576 and Pb == 24704 and 3 * Pb == 74112 and 4 * Pb == 98816)
chk('check c18: LSTM h = 10, d = 5 → 640 (one block 160, GRU 480)', cnt(10, 5) == 160 and 4 * cnt(10, 5) == 640 and 3 * cnt(10, 5) == 480)
H0 = np.array([.8, -.2]); Cc = np.array([math.atanh(-.4) + .5 * .8, math.atanh(.6) - .4 * -.2])
cand = np.tanh(np.array([-.5, .4]) * H0 + Cc)
chk('w-gru: candidate at r = 1 is (−0.4, 0.6); z = 0.25 → new note (0.5, 0)', np.allclose(cand, [-.4, .6]) and np.allclose(0.75 * H0 + 0.25 * cand, [0.5, 0]))

print('— §10 · the bottleneck —')
chk('5 words × 8 = 40 → 8; 50 words × 8 = 400 → 8', 5 * 8 == 40 and 50 * 8 == 400)
chk('0.9⁴⁹ ≈ 0.0057; 0.9⁵ ≈ 0.59', r(0.9 ** 49, 4) == 0.0057 and r(0.9 ** 5, 2) == 0.59)
chk('drawer s10: first below 0.01 at n = 45 (ln 0.01/ln 0.9 ≈ 43.7; 0.9⁴³ ≈ 0.0108, 0.9⁴⁴ ≈ 0.0097)', r(math.log(.01) / math.log(.9), 1) == 43.7 and r(0.9 ** 43, 4) == 0.0108 and r(0.9 ** 44, 4) == 0.0097 and first_below(0.9, 0.01) + 1 == 45)
chk('check c19: 40 × 100 = 4000 in, 256 out (more than 15 to 1); 40 × 256 = 10 240', 40 * 100 == 4000 and 4000 / 256 > 15 and 40 * 256 == 10240)

print('— §11 · beam search —')
root = [('the', .5), ('our', .4), ('a', .1)]; nxt = {'the': [('train', .4), ('bus', .3), ('rain', .3)], 'our': [('train', .9), ('bus', .1)], 'a': [('train', .6), ('bus', .4)]}
allS = {f'{a} {b}': pa * pb for a, pa in root for b, pb in nxt[a]}
def beam(k):
    beams = [((), 1.0)]
    for step in range(2):
        cand = [(bw + (w,), bp * p) for bw, bp in beams for w, p in (root if not bw else nxt[bw[0]])]
        cand.sort(key=lambda c: -c[1]); beams = cand[:k]
    return ' '.join(beams[0][0]), beams[0][1]
chk('greedy (k = 1): "the train" 0.20', beam(1)[0] == 'the train' and close(beam(1)[1], 0.2))
chk('beam k = 2: "our train" 0.36; candidates 0.20, 0.15, 0.15, 0.36, 0.04', beam(2)[0] == 'our train' and close(beam(2)[1], .36) and [r(allS[s], 2) for s in ['the train', 'the bus', 'the rain', 'our train', 'our bus']] == [0.2, 0.15, 0.15, 0.36, 0.04])
chk('check c20: k = 3 finds the same 0.36, the best of all seven; "a train" = 0.06', beam(3)[0] == 'our train' and max(allS.values()) == allS['our train'] and len(allS) == 7 and close(allS['a train'], .06))
chk('ln 0.36 ≈ −1.022, ln 0.20 ≈ −1.609', r(math.log(.36), 3) == -1.022 and r(math.log(.2), 3) == -1.609)
chk('drawer s11: 200 × ln 0.01 ≈ −921.0; 0.01²⁰⁰ underflows to 0 in float64', r(200 * math.log(.01), 1) == -921.0 and 0.01 ** 200 == 0.0)

print('— the hero —')
chk('six words back: ×0.5 → 0.031, ×1.5 → 7.6, ×0.97 → 0.86', r(.5 ** 5, 3) == 0.031 and r(1.5 ** 5, 1) == 7.6 and r(.97 ** 5, 2) == 0.86)
chk('hero tags (×0.5): 1, 0.5, 0.25, 0.125, 0.063, 0.031', [rh(.5 ** k, 3) for k in range(6)] == [1, .5, .25, .125, .063, .031])

print('— practice problems —')
hp, _ = rnn1(0.8, 1, 0, [1, -1, 0.5])
chk('P1: 0.7616, −0.3720, 0.1997 (with 0.6093 and −0.2976 along the way)', [r(v, 4) for v in hp[1:]] == [0.7616, -0.3720, 0.1997] and r(0.8 * hp[1], 4) == 0.6093 and r(0.8 * hp[2], 4) == -0.2976)
Wp = np.array([[.5, -.5], [0, 1]]); Up = np.array([1, 2.]); bp = np.array([0, -1.])
z1 = Wp @ [1, 0] + Up * .5 + bp; h1 = np.tanh(z1); z2 = Wp @ h1 + bp; h2 = np.tanh(z2)
chk('P2: z1 = (1,0) → h1 ≈ (0.7616, 0); z2 = (0.3808, −1) → h2 ≈ (0.3634, −0.7616)', np.allclose(z1, [1, 0]) and np.allclose(np.round(h1, 4), [0.7616, 0]) and np.allclose(np.round(z2, 4), [0.3808, -1]) and np.allclose(np.round(h2, 4), [0.3634, -0.7616]))
chk('P3: 32 + 25 = 57; 10 unshared → 345', cnt(4, 3) + 5 * 4 + 5 == 57 and 10 * 32 + 25 == 345)
h4, _ = rnn1(0.8, 1, 0, [1, 0, 0]); a3 = 0.8 * (1 - h4[3] ** 2); a2 = 0.8 * (1 - h4[2] ** 2)
chk('P4: h = 0.7616, 0.5436, 0.4094; factors 0.6659, 0.5636; product 0.3753; ∂h3/∂x1 ≈ 0.1576 (1 − h1² ≈ 0.4200)', [r(v, 4) for v in h4[1:]] == [0.7616, 0.5436, 0.4094] and r(a3, 4) == 0.6659 and r(a2, 4) == 0.5636 and r(a3 * a2, 4) == 0.3753 and r(1 - h4[1] ** 2, 4) == 0.4200 and r(a3 * a2 * (1 - h4[1] ** 2), 4) == 0.1576)
chk('P4 intermediate: tanh(0.6093) and tanh(0.4349)', r(0.8 * h4[1], 4) == 0.6093 and r(0.8 * h4[2], 4) == 0.4349)
chk('P5: ln 10⁻³ ≈ −6.9078, ln 0.8 ≈ −0.2231, ratio ≈ 30.96 → T = 31; 0.8³⁰ ≈ 0.00124, 0.8³¹ ≈ 0.00099', r(math.log(1e-3), 4) == -6.9078 and r(math.log(.8), 4) == -0.2231 and r(math.log(1e-3) / math.log(.8), 2) == 30.96 and first_below(.8) == 31 and r(.8 ** 30, 5) == 0.00124 and r(.8 ** 31, 5) == 0.00099)
chk('P5: ln 1.2 ≈ 0.1823, ratio ≈ 37.89 → T = 38; 1.2³⁷ ≈ 850.6, 1.2³⁸ ≈ 1020.7', r(math.log(1.2), 4) == 0.1823 and r(math.log(1e3) / math.log(1.2), 2) == 37.89 and r(1.2 ** 37, 1) == 850.6 and r(1.2 ** 38, 1) == 1020.7)
Ap = np.array([[.6, .2], [.2, .6]]); Bp = np.array([[1.1, .3], [.3, 1.1]])
chk('P6: A eigenvalues 0.8, 0.4; B 1.4, 0.8', np.allclose(sorted(np.linalg.eigvals(Ap)), [.4, .8]) and np.allclose(sorted(np.linalg.eigvals(Bp)), [.8, 1.4]))
A10 = np.linalg.matrix_power(Ap, 10) @ [1, 0]; B10 = np.linalg.matrix_power(Bp, 10) @ [1, 0]
chk('P6: ½·0.8¹⁰ ≈ 0.053687, ½·0.4¹⁰ ≈ 0.0000524, ½·1.4¹⁰ ≈ 14.4627, ½·0.8¹⁰ ≈ 0.0537', r(.5 * .8 ** 10, 6) == 0.053687 and r(.5 * .4 ** 10, 7) == 0.0000524 and r(.5 * 1.4 ** 10, 4) == 14.4627 and r(.5 * .8 ** 10, 4) == 0.0537)
chk('P6: A¹⁰v ≈ (0.05374, 0.05363) ≈ (0.0537, 0.0536); B¹⁰v ≈ (14.516, 14.409) ≈ (14.52, 14.41)', np.allclose(np.round(A10, 5), [0.05374, 0.05363]) and np.allclose(np.round(A10, 4), [0.0537, 0.0536]) and np.allclose(np.round(B10, 3), [14.516, 14.409]) and np.allclose(np.round(B10, 2), [14.52, 14.41]))
chk('P7: (6,−8,0) length 10 → (2.4,−3.2,0), change (−0.24, 0.32, 0); (1,2,2) unchanged', np.allclose(clip(np.array([6., -8, 0]), 4), [2.4, -3.2, 0]) and np.allclose(-0.1 * clip(np.array([6., -8, 0]), 4), [-0.24, 0.32, 0]))
fg, ig, og, gg = sig(2), sig(0), sig(1), th(1); cP = fg * 2 + ig * gg
chk('P8: f ≈ 0.8808, i = 0.5, o ≈ 0.7311, g ≈ 0.7616; c ≈ 2.1424 (1.7616 + 0.3808); tanh c ≈ 0.9728; h ≈ 0.7112', r(fg, 4) == 0.8808 and ig == 0.5 and r(og, 4) == 0.7311 and r(gg, 4) == 0.7616 and r(cP, 4) == 2.1424 and r(fg * 2, 4) == 1.7616 and r(th(cP), 4) == 0.9728 and r(og * th(cP), 4) == 0.7112)
chk('P9: 0.95²⁰ ≈ 0.3585, 0.95¹⁰⁰ ≈ 0.00592, 0.5^(1/100) ≈ 0.99309 (e^−0.006931)', r(.95 ** 20, 4) == 0.3585 and r(.95 ** 100, 5) == 0.00592 and r(.5 ** .01, 5) == 0.99309 and r(math.log(.5) / 100, 6) == -0.006931)
chk('P10: (0.5, 0.2); 0.9⁶ ≈ 0.531, 0.9⁷ ≈ 0.478 → 7 steps', np.allclose(np.array([.75, .5]) * [.8, -.2] + np.array([.25, .5]) * [-.4, .6], [.5, .2]) and r(.9 ** 6, 3) == 0.531 and r(.9 ** 7, 3) == 0.478)
chk('P11: 256·356 = 91 136; block 91 392; GRU 274 176; LSTM 365 568; saving 91 392', 256 * 356 == 91136 and cnt(256, 100) == 91392 and 3 * 91392 == 274176 and 4 * 91392 == 365568 and 365568 - 274176 == 91392)
chk('P12: greedy "the cup" 0.24; beam "my chai" 0.32; candidates 0.18, 0.18, 0.24, 0.32, 0.08; ln −1.427, −1.139', close(.6 * .4, .24) and close(.4 * .8, .32) and [r(v, 2) for v in [.6 * .3, .6 * .3, .6 * .4, .4 * .8, .4 * .2]] == [.18, .18, .24, .32, .08] and r(math.log(.24), 3) == -1.427 and r(math.log(.32), 3) == -1.139)
chk('P13: block 512·768 = 393 216 + 512 = 393 728; ×2 = 787 456; read-out 5 130 000; total 5 917 456; 20·256 = 5120', 512 * 768 == 393216 and cnt(512, 256) == 393728 and 2 * 393728 == 787456 and 10000 * 512 + 10000 == 5130000 and 787456 + 5130000 == 5917456 and 20 * 256 == 5120)
runA = [1, .42, .176, .0741, .0311, .0131]; runB = [1, 2.1, 4.41, 9.26, 19.4, 40.8]; runC = [1, .97, .941, .913, .885, .859]
chk('P14 table rows are 0.42ᵏ, 2.1ᵏ, 0.97ᵏ to 3 significant figures', all(abs(a - .42 ** k) / .42 ** k < 6e-3 for k, a in enumerate(runA)) and all(abs(b - 2.1 ** k) / 2.1 ** k < 6e-3 for k, b in enumerate(runB)) and all(abs(c - .97 ** k) / .97 ** k < 6e-3 for k, c in enumerate(runC)))
chk('P14: fifth roots 0.42, 2.1, 0.97', r(runA[5] ** .2, 2) == 0.42 and r(runB[5] ** .2, 1) == 2.1 and r(runC[5] ** .2, 2) == 0.97)
chk('P14: 0.42²⁰ ≈ 2.9×10⁻⁸, 2.1²⁰ ≈ 2.8×10⁶, 0.97²⁰ ≈ 0.544; 5/40.8 ≈ 0.1225', r(.42 ** 20 * 1e8, 1) == 2.9 and r(2.1 ** 20 / 1e6, 1) == 2.8 and r(.97 ** 20, 3) == 0.544 and r(5 / 40.8, 4) == 0.1225)

print(f'\n✓ all {ok} checks passed')
