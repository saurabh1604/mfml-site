# Unit 17 · Machines with Memory — machine verification of every number the page prints:
# the running note of §1, the recurrent cell, the unrolled count, the read-out softmax, backprop through time,
# powers and eigenvalues, clipping, the LSTM and GRU steps, parameter counts, the bottleneck, beam search,
# the hero's numbers, the widgets' fixed readouts, the memory lab (same RNG as the page), the derivation drawers
# the tiny talking model (re-run from its weights), and the sixteen practice problems (tpl/u17-*.html). Plain numpy, float64. Tolerance 1e-6 unless a rounded value is printed.
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
chk('check c9: −0.1444 − 0.1588 − 0.1623 = −0.4655 (and −0.1552 is the 3-way average)', r(-0.1444 - 0.1588 - 0.1623, 4) == -0.4655 and r(g['dw'], 4) == -0.4655 and r((-0.1444 - 0.1588 - 0.1623) / 3, 4) == -0.1552)
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

print('— Round 22 · §1 the half turn (check c21) —')
Wh = np.array([[-1, 0], [0, -1]])
chk('180°: note = x1 − x2 + x3; both sentences end at (0, 0)', np.allclose(note(['dog', 'bites', 'man'], Wh)[-1], [0, 0]) and np.allclose(note(['man', 'bites', 'dog'], Wh)[-1], [0, 0]))

print('— §5 · temperature —')
def smT(s, T): e = np.exp(np.array(s) / T); return e / e.sum()
q1, q05, q2 = smT([2, 1, .5, -1], 1), smT([2, 1, .5, -1], .5), smT([2, 1, .5, -1], 2)
chk('T = 1: 0.609, 0.224, 0.136, 0.030', [r(v, 3) for v in q1] == [0.609, 0.224, 0.136, 0.030])
chk('T = 0.5: 0.842, 0.114, 0.042, 0.002 (scores 4, 2, 1, −2)', [r(v, 3) for v in q05] == [0.842, 0.114, 0.042, 0.002])
chk('T = 2: 0.434, 0.263, 0.205, 0.097 (the brief said 0.264; 0.26348 rounds to 0.263); "the" about one time in ten', [r(v, 3) for v in q2] == [0.434, 0.263, 0.205, 0.097] and r(q2[1], 5) == 0.26348 and abs(q2[3] - .1) < .005)
chk('check c23: e⁴ ≈ 54.60, e² ≈ 7.389, e ≈ 2.718, e⁻² ≈ 0.135, total ≈ 64.84 → 0.842', r(math.exp(4), 2) == 54.60 and r(math.exp(-2), 3) == 0.135 and r(math.exp(4) + math.exp(2) + math.e + math.exp(-2), 2) == 64.84)
chk('drawer s5: ratios e¹ ≈ 2.718, e² ≈ 7.389, e^0.5 ≈ 1.649; 0.842/0.114 ≈ 7.39 ≈ e²; 0.434/0.263 ≈ 1.65 ≈ e^0.5', r(math.e, 3) == 2.718 and r(math.exp(2), 3) == 7.389 and r(math.exp(.5), 3) == 1.649 and r(.842 / .114, 2) == 7.39 and r(.434 / .263, 2) == 1.65 and r(q05[0] / q05[1], 2) == 7.39 and r(q2[0] / q2[1], 2) == 1.65)

print('— §5 · the tiny talking model (weights read back from tpl/u17-talk-model.js; the page runs the same loops) —')
import json, re
TJ = open('tpl/u17-talk-model.js').read()
def tarr(name):
    m = re.search(r'\b' + name + r':(\[.*?\])(?=,\s*[a-zA-Z]+:)', TJ, re.S); return json.loads(m.group(1))
TK = {k: tarr(k) for k in ['U', 'W', 'b', 'V', 'c']}
CH = json.loads(re.search(r'chars:("[^"]*")', TJ).group(1)); HH = int(re.search(r'\bH:(\d+)', TJ).group(1)); NV = len(CH); IXc = {c: i for i, c in enumerate(CH)}
CORPUS = json.loads(re.search(r'corpus:(\[.*?\])\}', TJ, re.S).group(1))
def tstep(h, ch):
    x = IXc[ch]; out = []
    for i in range(HH):
        z = TK['b'][i] + TK['U'][i][x]
        for j in range(HH): z += TK['W'][i][j] * h[j]
        out.append(math.tanh(z))
    return out
def tscores(h):
    out = []
    for i in range(NV):
        z = TK['c'][i]
        for j in range(HH): z += TK['V'][i][j] * h[j]
        out.append(z)
    return out
def tsoft(s, T):
    m = max(s); e = [math.exp((v - m) / T) for v in s]; tot = 0.0
    for v in e: tot += v
    return [v / tot for v in e]
def tpark(seed):
    # the page's dice (u17-w5.js): mulberry32 started from a hash of the dice number, in 32-bit arithmetic
    M = 0xffffffff; st = [((seed * 0x9E3779B1) + 4) & M]; imul = lambda a, b: (a * b) & M
    def rnd():
        st[0] = (st[0] + 0x6D2B79F5) & M; t = st[0]
        t = imul(t ^ (t >> 15), t | 1)
        t = (t ^ ((t + imul(t ^ (t >> 7), t | 61)) & M)) & M
        return ((t ^ (t >> 14)) & M) / 4294967296
    return rnd
def ttalk(seed, how, T=1.0, dice=1):
    h = [0.0] * HH
    for ch in ' ' + seed: h = tstep(h, ch)
    rnd = tpark(dice); out = ''
    while True:
        p = tsoft(tscores(h), T if how == 'sample' else 1.0)
        if how == 'greedy':
            k = 0
            for i in range(1, NV):
                if p[i] > p[k]: k = i
        else:
            rr = rnd(); acc = 0.0; k = NV - 1
            for i in range(NV):
                acc += p[i]
                if rr < acc: k = i; break
        out += CH[k]; h = tstep(h, CH[k])
        if out.count('.') >= 2 or len(out) >= 110: return out
chk('model size: 48·48 + 48·28 + 48 + 28·48 + 28 = 5 068 numbers; 28 characters; 300 sentences', HH == 48 and NV == 28 and HH * HH + HH * NV + HH + NV * HH + NV == 5068 and len(CORPUS) == 300 and len(TK['W']) == 48 and len(TK['V']) == 28)
import hashlib, os, subprocess, tempfile
MD5 = '90e68d5959c087b08144e06dfe6dddb3'          # the weights produced by `python3 train-u17-talk.py` (fixed seeds); U17_RETRAIN=1 re-trains and compares
chk('the embedded weights are the ones train-u17-talk.py produces (md5 ' + MD5[:8] + '…)', hashlib.md5(TJ.encode()).hexdigest() == MD5)
if os.environ.get('U17_RETRAIN'):
    tmp = os.path.join(tempfile.mkdtemp(), 'talk.js'); subprocess.run(['python3', 'train-u17-talk.py'], env=dict(os.environ, U17_OUT=tmp), check=True, capture_output=True)
    chk('re-training from scratch rebuilds the identical weights file', hashlib.md5(open(tmp).read().encode()).hexdigest() == MD5)
h0 = [0.0] * HH
for ch in ' the train to ': h0 = tstep(h0, ch)
p0 = tsoft(tscores(h0), 1.0); top0 = sorted(range(NV), key=lambda i: -p0[i])[:6]
chk('after "the train to " the top guess is "p" 0.171, then "c" 0.134, "s" 0.114', [CH[i] for i in top0[:3]] == ['p', 'c', 's'] and [r(p0[i], 3) for i in top0[:3]] == [0.171, 0.134, 0.114])
chk('two of its cities start with p (pune, patna) — and no other training sentence continues "the train to p…"', sorted({s.split('the train to ')[1].split(' ')[0] for s in CORPUS if s.startswith('the train to ') and s.split('the train to ')[1].startswith('p')}) == ['patna', 'pune'])
G = ttalk('the train to ', 'greedy')
chk('greedy: "patna will arrive on platform three. the train to patna will arrive on platform three." (it loops)', G == 'patna will arrive on platform three. the train to patna will arrive on platform three.')
s02 = ttalk('the train to ', 'sample', .2, 1); s05 = ttalk('the train to ', 'sample', .5, 1); s1 = ttalk('the train to ', 'sample', 1.0, 1); s2 = ttalk('the train to ', 'sample', 2.0, 1)
chk('dice #1, T = 0.2: the greedy line again (T → 0 is greedy)', s02 == G)
chk('dice #1, T = 0.5: a clean announcement ("patna will leave from platform one. …")', s05 == 'patna will leave from platform one. the train to agra will leave from platform three.')
chk('dice #1, T = 1: "patna is cancelled today. the train to surat is cancelled today."', s1 == 'patna is cancelled today. the train to surat is cancelled today.')
chk('dice #1, T = 2 babbles: "pendy mare tom frimn …"', s2.startswith('pendy mare tom frimn ') and not all(w in {x for q in CORPUS for x in q.replace('.', ' ').split()} for w in s2.replace('.', ' ').split()))
first = [tpark(d)() for d in range(1, 21)]
chk('the dice are fair from the first roll: dice #1–#20 first rolls spread over (0, 1) (the old Park–Miller start gave ≈ 0.00001·d)', min(first) > 0.02 and max(first) > 0.9 and len({int(v * 4) for v in first}) == 4)
chk('the typo seed "the trian to " (greedy) snowballs into "buny misun"', ttalk('the trian to ', 'greedy').startswith('buny misun.'))
def tteach(sent):
    h = [0.0] * HH; prev = ' '; tot = 0.0; rows = []
    for ch in sent:
        h = tstep(h, prev); p = tsoft(tscores(h), 1.0); k = max(range(NV), key=lambda i: (p[i], -i)); rows.append((ch, CH[k], -math.log(p[IXc[ch]]))); tot += rows[-1][2]; prev = ch
    return tot, rows
TOT, ROWS = tteach('the train to pune is late.')
worst = max(ROWS, key=lambda x: x[2])
chk('training: "the train to pune is late." — 26 characters, total surprise 6.507 (0.25 per character), 23 top guesses right, hardest "i" (1.873)', len(ROWS) == 26 and r(TOT, 3) == 6.507 and r(TOT / 26, 3) == 0.25 and sum(1 for c, g, _ in ROWS if c == g) == 23 and worst[0] == 'i' and r(worst[2], 3) == 1.873)
chk('drawer s5: e^−6.507 ≈ 0.0015, about 1 in 670', r(math.exp(-6.507), 4) == 0.0015 and round(1 / math.exp(-6.507), -1) == 670)
chk('exposure-bias check c25: the 5th character of "the train to pune is late." is "t"', 'the train to pune is late.'[4] == 't')

print('— §6 · truncated BPTT —')
chk('1000 / 20 = 50 chunks; word 45 in chunk ⌈45/20⌉ = 3 (words 41–60); its blame stops at 41', math.ceil(1000 / 20) == 50 and math.ceil(45 / 20) == 3 and (3 - 1) * 20 + 1 == 41)
chk('w-bptt cut after 2 steps: only words 4 and 3 report: −0.1623 − 0.1588 = −0.3211 (full −0.4655)', r(g['cw'][4] + g['cw'][3], 4) == -0.3211 and r(g['dw'], 4) == -0.4655)

print('— §7 · the whisper line —')
chk('0.9²⁰ ≈ 0.1216, 1.1²⁰ ≈ 6.7275; 1.5¹⁰ ≈ 58 times', r(.9 ** 20, 4) == 0.1216 and r(1.1 ** 20, 4) == 6.7275 and round(1.5 ** 10) == 58)
kw = 'The keys to the old wooden cabinet in the hall are'.split()
chk('"The keys … are": "are" is 9 words after "keys"; 0.5⁹ ≈ 0.00195', kw.index('are') - kw.index('keys') == 9 and r(.5 ** 9, 5) == 0.00195)
chk('eigen-memory keep: the bars go flat at ‖(0.8, 0.2)‖ ≈ 0.8246; ‖W³⁰v‖ ≈ 0.8246', r(math.hypot(.8, .2), 4) == 0.8246 and r(np.linalg.norm(Wt(30)), 4) == 0.8246)
def em_off(M, R=None):
    M = np.array(M); P = [np.array([1.0, 0])]
    for t in range(30): P.append(M @ P[-1])
    inf = max(max(abs(p[0]), abs(p[1])) for p in P); R = max(1.25, min(3, 1.12 * max(1, min(inf, 3))))
    for t, p in enumerate(P):
        if not (abs(p[0]) <= R and abs(p[1]) <= R * 380 / 400): return t, P
    return -1, P
off, Pex = em_off([[1.1, .2], [.1, 1.0]])
chk('explode: off the map (±3 by ±2.85) from t = 8; ‖W³⁰v‖ ≈ 176.9362; W¹⁰v ≈ (4.2441, 1.9477)', off == 8 and r(np.linalg.norm(Pex[30]), 4) == 176.9362 and np.allclose(np.round(Pex[10], 4), [4.2441, 1.9477]))
Rr = np.array([[.8, -.6], [.6, .8]])
chk('rotate: every bar exactly 1 (‖Rᵗv‖ = 1 for t = 0…30); W²v = (0.28, 0.96)', all(abs(np.linalg.norm(np.linalg.matrix_power(Rr, t) @ [1, 0]) - 1) < 1e-12 for t in range(31)) and np.allclose(Rr @ Rr @ [1, 0], [.28, .96]))
Fd = np.array([[.5, .2], [.1, .4]])
chk('fade: W¹v = (0.5, 0.1), W²v = (0.27, 0.09); ‖W³⁰v‖ ≈ 1.6478 × 10⁻⁷', np.allclose(Fd @ [1, 0], [.5, .1]) and np.allclose(Fd @ Fd @ [1, 0], [.27, .09]) and r(np.linalg.norm(np.linalg.matrix_power(Fd, 30) @ [1, 0]) * 1e7, 4) == 1.6478)
chk('check c27: (1,0) settles at (0.8, 0.2) though every entry of W is below 1', np.allclose(Wt(80), [.8, .2]) and (W < 1).all())

print('— §8 · clipping and good starts —')
chk('clip each entry of (30, 40) at 5 → (5, 5): 53.13° turns into 45°; (3, 4) keeps 53.13°', r(math.degrees(math.atan2(40, 30)), 2) == 53.13 and r(math.degrees(math.atan2(5, 5)), 2) == 45.0 and r(math.degrees(math.atan2(4, 3)), 2) == 53.13)
Qr = np.linalg.qr(np.random.default_rng(3).normal(size=(6, 6)))[0]
chk('drawer s8: an orthogonal Q keeps lengths and has every |λ| = 1; 0.9Q has every |λ| = 0.9', np.allclose(abs(np.linalg.eigvals(Qr)), 1) and np.allclose(abs(np.linalg.eigvals(.9 * Qr)), .9) and abs(np.linalg.norm(Qr @ np.arange(6.)) - np.linalg.norm(np.arange(6.))) < 1e-12)

print('— §9 · the full LSTM step and the forget shift —')
fL, iL, oL, gL = sig(2), sig(0), sig(1), th(1); cL = fL * 1 + iL * gL; hL = oL * th(cL)
chk('f ≈ 0.8808, i = 0.5, o ≈ 0.7311, g ≈ 0.7616; c = 0.8808 + 0.3808 = 1.2616; tanh c ≈ 0.8515; h ≈ 0.6225', r(fL, 4) == 0.8808 and r(oL, 4) == 0.7311 and r(gL, 4) == 0.7616 and r(iL * gL, 4) == 0.3808 and r(cL, 4) == 1.2616 and r(th(cL), 4) == 0.8515 and r(hL, 4) == 0.6225)
chk('forget shift: σ(1) ≈ 0.73, σ(2) ≈ 0.88; 0.8808¹⁰ ≈ 0.281 vs 0.5¹⁰ ≈ 0.001 (check c29)', r(sig(1), 2) == 0.73 and r(sig(2), 2) == 0.88 and r(sig(2) ** 10, 3) == 0.281 and r(.5 ** 10, 3) == 0.001)

print('— §10 · the full GRU step —')
zG, rG = sig(0), sig(2); aG = 1 + rG * .5; hcG = th(aG); hG = .5 * .5 + .5 * hcG
chk('z = 0.5, r ≈ 0.8808; 1 + 0.8808·0.5 = 1.4404; h̃ = tanh(1.4404) ≈ 0.8938; h ≈ 0.6969', zG == .5 and r(aG, 4) == 1.4404 and r(hcG, 4) == 0.8938 and r(hG, 4) == 0.6969)
chk('check c37: z = 0 copies the note: (1 − 0)·h + 0·h̃ = h', all((1 - 0) * hv + 0 * 0.3 == hv for hv in [-.7, 0.1, .5]))

print('— §11 · both ways, and floors —')
def fwd(xs, w):
    h = 0.0; out = []
    for x in xs: h = th(w * h + x); out.append(h)
    return out
def bwd(xs, w): return fwd(xs[::-1], w)[::-1]
F3, B3 = fwd([0, 0, 1], .5), bwd([0, 0, 1], .5)
chk('x = (0, 0, 1): forward (0, 0, 0.7616), backward (0.1797, 0.3634, 0.7616); word 1 = (0, 0.1797)', [r(v, 4) for v in F3] == [0, 0, 0.7616] and [r(v, 4) for v in B3] == [0.1797, 0.3634, 0.7616])
chk('counts (h = 128, d = 64): one-way 24 704, two-way 49 408, floor 2 = 128·256 + 128 = 32 896, two floors 57 600', cnt(128, 64) == 24704 and 2 * cnt(128, 64) == 49408 and cnt(128, 128) == 32896 and 24704 + 32896 == 57600)
bears = [.2, -.3, .5, .9, -.4, .1, .8]; pres = [.2, -.3, .5, -.9, .3, -.1, -.8]
fb, bb, fp_, bp_ = fwd(bears, .5), bwd(bears, .5), fwd(pres, .5), bwd(pres, .5)
chk('w-bidir Teddy (toy codes): forward note at "Teddy" 0.3805 in both; backward 0.682 (bears) vs 0.1528 (Roosevelt); floor 2: 0.3186 in both', r(fb[2], 4) == r(fp_[2], 4) == 0.3805 and r(bb[2], 3) == 0.682 and r(bp_[2], 4) == 0.1528 and r(fwd(fb, .5)[2], 4) == r(fwd(fp_, .5)[2], 4) == 0.3186)

print('— §12 · the bottleneck, 5 against 50 words —')
chk('5 words: 40 numbers into 8, word 1 at 0.9⁴ = 0.6561; 50 words: 400 into 8, word 1 at 0.9⁴⁹ ≈ 0.005726', 5 * 8 == 40 and r(.9 ** 4, 4) == 0.6561 and 50 * 8 == 400 and r(.9 ** 49, 6) == 0.005726)
chk('check c34: 0.9¹⁹ ≈ 0.135 → 0.9³⁹ ≈ 0.0164, about eight times fainter', r(.9 ** 19, 3) == 0.135 and r(.9 ** 39, 4) == 0.0164 and round(.9 ** 19 / .9 ** 39) == 8)

print('— §13 · BLEU —')
def bleu2(cand, ref='the train is running late'):
    c, rf = cand.split(), ref.split()
    def clip(cg, rg):
        left = {}
        for x in rg: left[x] = left.get(x, 0) + 1
        k = 0
        for x in cg:
            if left.get(x, 0) > 0: left[x] -= 1; k += 1
        return k
    g2 = lambda w: [' '.join(w[i:i + 2]) for i in range(len(w) - 1)]
    k1, k2 = clip(c, rf), clip(g2(c), g2(rf)); p1 = k1 / len(c); p2 = k2 / len(g2(c)) if len(c) > 1 else 0
    BPv = 1 if len(c) >= len(rf) else math.exp(1 - len(rf) / len(c))
    return p1, p2, BPv, (BPv * math.sqrt(p1 * p2) if p1 > 0 and p2 > 0 else 0)
b1 = bleu2('the train is late')
chk('"the train is late": p1 = 1, p2 = 2/3, BP = e^(1 − 5/4) ≈ 0.7788, √(2/3) ≈ 0.8165, BLEU-2 ≈ 0.636 (0.6359)', b1[0] == 1 and close(b1[1], 2 / 3) and r(b1[2], 4) == 0.7788 and r(math.sqrt(2 / 3), 4) == 0.8165 and r(b1[3], 3) == 0.636 and r(b1[3], 4) == 0.6359)
chk('word salad "late is the train": p1 = 1, p2 = 1/3 → 0.450 (0.4496)', bleu2('late is the train')[:2] == (1.0, 1 / 3) and r(bleu2('late is the train')[3], 3) == 0.450 and r(bleu2('late is the train')[3], 4) == 0.4496)
chk('too short "the train": p1 = p2 = 1, BP = e^(−1.5) ≈ 0.2231 → 0.2231 (check c35); 2/5 = 0.4 distractor', bleu2('the train')[:2] == (1.0, 1.0) and r(bleu2('the train')[3], 4) == 0.2231 and 2 / 5 == 0.4)
chk('"the the the the": clipped p1 = 1/4, p2 = 0 → BLEU 0 (check c36)', bleu2('the the the the')[:2] == (.25, 0) and bleu2('the the the the')[3] == 0)
chk('"the train is delayed" ≈ 0.55 (0.5507); the perfect candidate scores 1', r(bleu2('the train is delayed')[3], 2) == 0.55 and r(bleu2('the train is delayed')[3], 4) == 0.5507 and bleu2('the train is running late')[3] == 1)

print('— practice problems (16) —')
hp, _ = rnn1(0.8, 1, 0, [1, -1, 0.5])
chk('P1: 0.7616, −0.3720, 0.1997 (with 0.6093 and −0.2976 along the way)', [r(v, 4) for v in hp[1:]] == [0.7616, -0.3720, 0.1997] and r(0.8 * hp[1], 4) == 0.6093 and r(0.8 * hp[2], 4) == -0.2976 and r(0.8 * hp[1] - 1, 4) == -0.3907 and r(0.8 * hp[2] + .5, 4) == 0.2024)
Wp = np.array([[.5, -.5], [0, 1]]); Up = np.array([1, 2.]); bp = np.array([0, -1.])
z1 = Wp @ [1, 0] + Up * .5 + bp; h1 = np.tanh(z1); z2 = Wp @ h1 + bp; h2 = np.tanh(z2)
chk('P2: z1 = (1,0) → h1 ≈ (0.7616, 0); z2 = (0.3808, −1) → h2 ≈ (0.3634, −0.7616)', np.allclose(z1, [1, 0]) and np.allclose(np.round(h1, 4), [0.7616, 0]) and np.allclose(np.round(z2, 4), [0.3808, -1]) and np.allclose(np.round(h2, 4), [0.3634, -0.7616]))
P3 = cnt(64, 32)
chk('P3: 64·96 = 6144 (+64 = 6208); two-way 12 416; floor 2 = 8192 + 64 = 8256 → 14 464; LSTM 24 832, GRU 18 624; two-way LSTM 49 664 + read-out 12·128 + 12 = 1548 → 51 212', 64 * 96 == 6144 and P3 == 6208 and 2 * P3 == 12416 and cnt(64, 64) == 8256 and 64 * 128 == 8192 and P3 + cnt(64, 64) == 14464 and 4 * P3 == 24832 and 3 * P3 == 18624 and 8 * P3 == 49664 and 12 * 128 == 1536 and 12 * 128 + 12 == 1548 and 49664 + 1548 == 51212)
e4 = np.exp([3, 1, 0, -1.]); q4 = e4 / e4.sum()
chk('P4: e³ ≈ 20.0855, e ≈ 2.7183, e⁻¹ ≈ 0.3679, total ≈ 24.1717; 0.8310, 0.1125, 0.0414, 0.0152; loss 2.185 (0.185 for hot); blame (0.8310, −0.8875, 0.0414, 0.0152)', [r(v, 4) for v in e4] == [20.0855, 2.7183, 1.0, 0.3679] and r(e4.sum(), 4) == 24.1717 and [r(v, 4) for v in q4] == [0.8310, 0.1125, 0.0414, 0.0152] and r(-math.log(q4[1]), 3) == 2.185 and r(-math.log(q4[0]), 3) == 0.185 and r(q4[1] - 1, 4) == -0.8875)
chk('P5: σ(2) ≈ 0.8808, σ(4) ≈ 0.9820, σ(1) ≈ 0.7311; ln 4 ≈ 1.3863, ln 1.5 ≈ 0.4055, T ≈ 3.419', r(sig(2), 4) == 0.8808 and r(sig(4), 4) == 0.9820 and r(sig(1), 4) == 0.7311 and r(math.log(4), 4) == 1.3863 and r(math.log(1.5), 4) == 0.4055 and r(math.log(4) / math.log(1.5), 3) == 3.419 and close(smT([2, 0], 1)[0], sig(2)) and close(smT([2, 0], .5)[0], sig(4)) and close(smT([2, 0], 2)[0], sig(1)))
chk('P5 check: at T = 3.419 the two shares are 0.6 and 0.4', abs(smT([math.log(4), 0], math.log(4) / math.log(1.5))[0] - .6) < 1e-12)
h4, _ = rnn1(0.8, 1, 0, [1, 0, 0]); a3 = 0.8 * (1 - h4[3] ** 2); a2 = 0.8 * (1 - h4[2] ** 2)
chk('P6: h = 0.7616, 0.5436, 0.4094; factors 0.6659, 0.5636; product 0.3753; 1 − h1² ≈ 0.4200; ∂h3/∂x1 ≈ 0.1576; tanh(0.6093), tanh(0.4349)', [r(v, 4) for v in h4[1:]] == [0.7616, 0.5436, 0.4094] and r(a3, 4) == 0.6659 and r(a2, 4) == 0.5636 and r(a3 * a2, 4) == 0.3753 and r(1 - h4[1] ** 2, 4) == 0.4200 and r(a3 * a2 * (1 - h4[1] ** 2), 4) == 0.1576 and r(0.8 * h4[1], 4) == 0.6093 and r(0.8 * h4[2], 4) == 0.4349)
chunk = lambda t, k: math.ceil(t / k)
chk('P7: ⌈2500/50⌉ = 50; char 130 in chunk 3 (101–150) → back to 101 (29 steps); 30 & 70 in chunks 1 & 2 (no); 60 & 90 both in chunk 2 (yes); 2 499 vs 49 steps', chunk(2500, 50) == 50 and chunk(130, 50) == 3 and (3 - 1) * 50 + 1 == 101 and 130 - 101 == 29 and chunk(30, 50) != chunk(70, 50) and chunk(60, 50) == chunk(90, 50) == 2 and 2500 - 1 == 2499 and 50 - 1 == 49)
chk('P8: ln 10⁻³ ≈ −6.9078, ln 0.8 ≈ −0.2231, ratio ≈ 30.96 → T = 31; 0.8³⁰ ≈ 0.00124, 0.8³¹ ≈ 0.00099; ln 1.2 ≈ 0.1823, ratio ≈ 37.89 → 38; 1.2³⁷ ≈ 850.6, 1.2³⁸ ≈ 1020.7', r(math.log(1e-3), 4) == -6.9078 and r(math.log(.8), 4) == -0.2231 and r(math.log(1e-3) / math.log(.8), 2) == 30.96 and first_below(.8) == 31 and r(.8 ** 30, 5) == 0.00124 and r(.8 ** 31, 5) == 0.00099 and r(math.log(1.2), 4) == 0.1823 and r(math.log(1e3) / math.log(1.2), 2) == 37.89 and r(1.2 ** 37, 1) == 850.6 and r(1.2 ** 38, 1) == 1020.7)
Ap = np.array([[.6, .2], [.2, .6]]); Bp = np.array([[1.1, .3], [.3, 1.1]]); A10 = np.linalg.matrix_power(Ap, 10) @ [1, 0]; B10 = np.linalg.matrix_power(Bp, 10) @ [1, 0]
chk('P9: A eigen 0.8, 0.4; B 1.4, 0.8; ½·0.8¹⁰ ≈ 0.053687, ½·0.4¹⁰ ≈ 0.0000524, ½·1.4¹⁰ ≈ 14.4627; A¹⁰v ≈ (0.0537, 0.0536), B¹⁰v ≈ (14.52, 14.41)', np.allclose(sorted(np.linalg.eigvals(Ap)), [.4, .8]) and np.allclose(sorted(np.linalg.eigvals(Bp)), [.8, 1.4]) and r(.5 * .8 ** 10, 6) == 0.053687 and r(.5 * .4 ** 10, 7) == 0.0000524 and r(.5 * 1.4 ** 10, 4) == 14.4627 and np.allclose(np.round(A10, 5), [0.05374, 0.05363]) and np.allclose(np.round(B10, 3), [14.516, 14.409]))
chk('P10: (6,−8,0) length 10 → ×0.4 = (2.4,−3.2,0), change (−0.24, 0.32, 0); (1,2,2) length 3 unchanged', np.allclose(clip(np.array([6., -8, 0]), 4), [2.4, -3.2, 0]) and np.allclose(-0.1 * clip(np.array([6., -8, 0]), 4), [-0.24, 0.32, 0]) and np.allclose(clip(np.array([1., 2, 2]), 4), [1, 2, 2]))
fg, ig, og, gg = sig(2), sig(0), sig(1), th(1); cP = fg * 2 + ig * gg
chk('P11: c ≈ 2.1424 (1.7616 + 0.3808); tanh c ≈ 0.9728; h ≈ 0.7112', r(cP, 4) == 2.1424 and r(fg * 2, 4) == 1.7616 and r(th(cP), 4) == 0.9728 and r(og * th(cP), 4) == 0.7112)
runA = [1, .42, .176, .0741, .0311, .0131]; runB = [1, 2.1, 4.41, 9.26, 19.4, 40.8]; runC = [1, .97, .941, .913, .885, .859]
chk('P12: rows are 0.42ᵏ, 2.1ᵏ, 0.97ᵏ (3 s.f.); fifth roots 0.42, 2.1, 0.97; 0.42²⁰ ≈ 2.9×10⁻⁸, 2.1²⁰ ≈ 2.8×10⁶, 0.97²⁰ ≈ 0.544; 5/40.8 ≈ 0.1225', all(abs(a - .42 ** k) / .42 ** k < 6e-3 for k, a in enumerate(runA)) and all(abs(b - 2.1 ** k) / 2.1 ** k < 6e-3 for k, b in enumerate(runB)) and all(abs(c - .97 ** k) / .97 ** k < 6e-3 for k, c in enumerate(runC)) and r(runA[5] ** .2, 2) == 0.42 and r(runB[5] ** .2, 1) == 2.1 and r(runC[5] ** .2, 2) == 0.97 and r(.42 ** 20 * 1e8, 1) == 2.9 and r(2.1 ** 20 / 1e6, 1) == 2.8 and r(.97 ** 20, 3) == 0.544 and r(5 / 40.8, 4) == 0.1225)
chk('P12 (e): 0.5^(1/100) ≈ 0.99309 (e^−0.006931); 0.97¹⁰⁰ ≈ 0.048', r(.5 ** .01, 5) == 0.99309 and r(math.log(.5) / 100, 6) == -0.006931 and r(.97 ** 100, 3) == 0.048)
z13, r13 = sig(1), sig(-1); rh13 = r13 * -.5; a13 = 2 + 2 * rh13; hc13 = th(a13); h13 = (1 - z13) * -.5 + z13 * hc13; hcb = th(2 + 2 * -.5); hb = (1 - z13) * -.5 + z13 * hcb
chk('P13: z ≈ 0.7311, r ≈ 0.2689; r·h ≈ −0.1345, ×2 ≈ −0.2689; 1.7311; h̃ ≈ 0.9392; h ≈ −0.1345 + 0.6866 = 0.5521; (b) h̃ = tanh 1 ≈ 0.7616, 0.5568, h ≈ 0.4223', r(z13, 4) == 0.7311 and r(r13, 4) == 0.2689 and r(rh13, 4) == -0.1345 and r(2 * rh13, 4) == -0.2689 and r(a13, 4) == 1.7311 and r(hc13, 4) == 0.9392 and r((1 - z13) * -.5, 4) == -0.1345 and r(z13 * hc13, 4) == 0.6866 and r(h13, 4) == 0.5521 and r(hcb, 4) == 0.7616 and r(z13 * hcb, 4) == 0.5568 and r(hb, 4) == 0.4223)
F14, B14 = fwd([1, 0, .5], .5), bwd([1, 0, .5], .5)
chk('P14: forward 0.7616, 0.3634, tanh(0.6817) ≈ 0.5926; backward tanh 0.5 ≈ 0.4621, tanh(0.2311) ≈ 0.2270, tanh(1.1135) ≈ 0.8053; word 2 = (0.3634, 0.2270)', [r(v, 4) for v in F14] == [0.7616, 0.3634, 0.5926] and r(.5 * F14[1] + .5, 4) == 0.6817 and [r(v, 4) for v in B14] == [0.8053, 0.2270, 0.4621] and r(.5 * B14[2], 4) == 0.2311 and r(.5 * B14[1] + 1, 4) == 1.1135 and r(.5 * .3634, 4) == 0.1817)
chk('P15: greedy "the cup" 0.24; beam "my chai" 0.32; candidates 0.18, 0.18, 0.24, 0.32, 0.08; ln −1.427, −1.139', close(.6 * .4, .24) and close(.4 * .8, .32) and [r(v, 2) for v in [.6 * .3, .6 * .3, .6 * .4, .4 * .8, .4 * .2]] == [.18, .18, .24, .32, .08] and r(math.log(.24), 3) == -1.427 and r(math.log(.32), 3) == -1.139)
A16, B16, C16 = (bleu2(c, 'we drink chai every morning') for c in ('each morning we drink chai', 'we drink chai every evening', 'we drink chai'))
chk('P16: A p1 = 4/5, p2 = 1/2, BP = 1, BLEU-2 = √0.4 ≈ 0.6325; B p1 = 4/5, p2 = 3/4, BP = 1, √0.6 ≈ 0.7746; C p1 = p2 = 1, BP = e^(−2/3) ≈ 0.5134 = BLEU-2; B > A > C', A16[:3] == (.8, .5, 1) and r(A16[3], 4) == 0.6325 and B16[:3] == (.8, .75, 1) and r(B16[3], 4) == 0.7746 and C16[:2] == (1.0, 1.0) and r(C16[2], 4) == 0.5134 and r(C16[3], 4) == 0.5134 and B16[3] > A16[3] > C16[3])

print(f'\n✓ all {ok} checks passed')
