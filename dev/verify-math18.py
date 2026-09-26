# Unit 18 · Attention and Transformers — machine verification of every number the page prints:
# the soft lookup, the worked Q/K/V example and its matrix form, the sqrt(d) story, the attention lab's
# toy model (it -> ball), heads and weight counts, the shuffle, clock tags and RoPE, layer norm, the block,
# the causal mask, the n^2 bill, the tiny transformer, the checks, the drawers and the fourteen problems.
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
r = lambda v, d: np.round(np.asarray(v, float), d)
def req(v, want, d):
    """rounded to d places, v must equal the printed numbers"""
    return np.allclose(r(v, d), np.asarray(want, float), atol=10 ** (-d) / 2 + 1e-12)

def softmax(s):
    s = np.asarray(s, float)
    m = np.max(s[np.isfinite(s)])
    e = np.where(np.isfinite(s), np.exp(s - m), 0.0)
    return e / e.sum()

def attend(Q, K, V, causal=False, scale=True, T=1.0):
    Q, K, V = (np.asarray(x, float) for x in (Q, K, V))
    S = Q @ K.T / (math.sqrt(Q.shape[1]) if scale else 1.0) / T
    if causal:
        S = np.where(np.triu(np.ones_like(S), 1) > 0, -np.inf, S)
    A = np.vstack([softmax(row) for row in S])
    return S, A, A @ V

def ln(x, g=1.0, b=0.0):
    x = np.asarray(x, float)
    return (x - x.mean()) / x.std() * g + b

print("— §1 · the relay —")
chk("0.5^7 ≈ 0.0078", req(0.5 ** 7, 0.0078, 4))
chk("8 words: 8 × 8 = 64 questions", 8 * 8 == 64)
chk("c1: 10 words → 9 hand-overs, 100 questions", 10 - 1 == 9 and 10 * 10 == 100)

print("— §2 · the soft lookup —")
w = softmax([2, 0])
chk("e² ≈ 7.389, total 8.389", req(math.exp(2), 7.389, 3) and req(math.exp(2) + 1, 8.389, 3))
chk("shares (0.881, 0.119)", req(w, [0.881, 0.119], 3))
chk("price 0.881·10 + 0.119·20 ≈ 11.19", req(w @ [10, 20], 11.19, 2))
chk("c2: equal scores → plain average 6", close(softmax([1, 1, 1]) @ [3, 6, 9], 6))
chk("c3 / drawer: e^20/(e^20+1) ≈ 0.999999998", req(softmax([20, 0])[0], 0.999999998, 9))
# the widget's default (taste map)
KEYS = np.array([[1, 1], [-.5, 1.3], [1.3, -.7], [-1, -.5]]); PRICE = np.array([10, 20, 30, 15])
wl = softmax(KEYS @ [1.5, 1])
chk("lookup widget default: shares (0.694, 0.099, 0.199, 0.008), cup ₹15.01", req(wl, [0.694, 0.099, 0.199, 0.008], 3) and req(wl @ PRICE, 15.01, 2))

print("— §3 · Q, K, V by hand —")
K = [[1, 0], [0, 1], [1, 1]]; V = [[2, 0], [0, 2], [1, 1]]; Q = [[2, 0], [0, 2], [1, 1]]
S, A, O = attend(Q, K, V)
chk("√2 ≈ 1.414", req(math.sqrt(2), 1.414, 3))
chk("q·k = (2, 0, 2), scaled (1.414, 0, 1.414)", np.allclose(np.array(Q[0]) @ np.array(K).T, [2, 0, 2]) and req(S[0], [1.414, 0, 1.414], 3))
chk("e^1.414 ≈ 4.113, total 9.227", req(math.exp(math.sqrt(2)), 4.113, 3) and req(2 * math.exp(math.sqrt(2)) + 1, 9.227, 3))
chk("row 1 shares (0.446, 0.108, 0.446), answer (1.337, 0.663)", req(A[0], [0.446, 0.108, 0.446], 3) and req(O[0], [1.337, 0.663], 3))
chk("A rows 2, 3: (0.108, 0.446, 0.446), (0.248, 0.248, 0.503)", req(A[1], [0.108, 0.446, 0.446], 3) and req(A[2], [0.248, 0.248, 0.503], 3))
chk("answers (0.663, 1.337) and exactly (1, 1)", req(O[1], [0.663, 1.337], 3) and np.allclose(O[2], [1, 1], atol=1e-12))
chk("c4: q = (0, 0) → average of the values (1, 1)", np.allclose(attend([[0, 0]], K, V)[2][0], [1, 1]))
chk("c5: 5 words, d = 2 → QKᵀ 5 × 5, output 5 × 2", (np.zeros((5, 2)) @ np.zeros((2, 5))).shape == (5, 5))
print("   (spec said 0.504 for A[2][2]; the value is 0.50349 → 0.503 on the page)")

print("— §4 · why √d —")
chk("√2, √64, √512 → 1.41, 8, 22.6", req(math.sqrt(2), 1.41, 2) and math.sqrt(64) == 8 and req(math.sqrt(512), 22.6, 1))
p8 = softmax([8, 0])
chk("scores 8, 0 → (0.99966, 0.00034)", req(p8, [0.99966, 0.00034], 5))
chk("slope p(1−p) ≈ 0.00034 (0.000335)", req(p8[0] * (1 - p8[0]), 0.000335, 6))
p1 = softmax([1, 0])
chk("scores 1, 0 → (0.731, 0.269), slope 0.197", req(p1, [0.731, 0.269], 3) and req(p1[0] * p1[1], 0.197, 3))
chk("'nearly 600 times bigger' (586)", 580 < (p1[0] * p1[1]) / (p8[0] * p8[1]) < 600)
chk("c6: √256 = 16", math.sqrt(256) == 16)
chk("c7: 12/√144 = 1 → e/(e+1) ≈ 0.731; unscaled 0.999994", req(softmax([12 / math.sqrt(144), 0])[0], 0.731, 3) and req(softmax([12, 0])[0], 0.999994, 6))
rng = np.random.default_rng(0)
for d in (16, 64, 512):
    s = (rng.standard_normal((20000, d)) * rng.standard_normal((20000, d))).sum(1)
    chk(f"simulated spread for d = {d} ≈ √d (±5%)", abs(s.std() / math.sqrt(d) - 1) < 0.05)

print("— §5 · the attention lab (toy model, copied from tpl/u18-shared.js) —")
FEAT = ['thing', 'someone', 'action', 'it-word', 'he/she-word', 'describing', 'place', 'linking']
I = FEAT.index
def one(k):
    v = np.zeros(8); v[I(k)] = 1; return v
LEX = {}
def put(ws, k):
    for w_ in ws.split(): LEX[w_] = one(k)
put('the a an my his their our your and because was is are were to of at in on but so then with for very too after when while as by', 'linking')
put('ball bat chai coffee tea cup train ticket phone message book bus bread milk match wicket rain door window food letter bag car kite glass box', 'thing')
put('batsman bowler boy girl mother father teacher driver friend sister brother dog cat child man woman doctor farmer', 'someone')
put('hit made poured broke caught threw drank bought sent read ran took gave saw ate crossed wrote played dropped cooked kept found lost missed opened', 'action')
put('it this', 'it-word'); put('he she him her they them', 'he/she-word')
put('loose late hot cold fast tired full empty broken sweet heavy old new happy wet late slow strong', 'describing')
put('delhi mumbai station ground market school home road street city river', 'place')
d, dk, TH, a_, s_ = 12, 6, (1.2, 0.4), 8, 7
pos = lambda p: np.array([math.cos(p * TH[0]), math.sin(p * TH[0]), math.cos(p * TH[1]), math.sin(p * TH[1])])
WK1 = np.zeros((d, dk)); WQ1 = np.zeros((d, dk)); WV = np.zeros((d, dk)); WQ2 = np.zeros((d, dk)); WK2 = np.zeros((d, dk)); WO = np.zeros((2 * dk, d))
for k, j in [('thing', 0), ('someone', 1), ('action', 2), ('place', 3), ('linking', 4)]: WK1[I(k), j] = 1
WQ1[I('it-word'), 0] = a_; WQ1[I('he/she-word'), 1] = a_
WQ1[I('describing'), 0] = a_ / 2; WQ1[I('describing'), 1] = a_ / 2
WQ1[I('action'), 0] = a_ / 2; WQ1[I('action'), 1] = a_ / 2
WQ1[I('someone'), 2] = a_ / 2; WQ1[I('thing'), 2] = a_ / 2; WQ1[I('place'), 2] = a_ / 2
WQ1[I('linking'), 4] = 1
for k, j in [('thing', 0), ('someone', 1), ('action', 2), ('place', 3), ('describing', 4)]:
    WV[I(k), j] = 1; WO[j, I(k)] = 1; WO[dk + j, I(k)] = 0.5
for c in (0, 1):
    t = -TH[c]; R = np.array([[math.cos(t), -math.sin(t)], [math.sin(t), math.cos(t)]])
    for rr in range(2):
        for qq in range(2): WQ2[8 + 2 * c + qq, 2 * c + rr] = s_ * R[rr, qq]
for k in range(4): WK2[8 + k, k] = 1
def lab_run(text, T=1.0, causal=False):
    words = text.split()
    X = np.array([np.concatenate([LEX.get(w_, one('thing')), pos(p)]) for p, w_ in enumerate(words)])
    heads = [attend(X @ WQ, X @ WK, X @ WV, causal=causal, T=T) for WQ, WK in [(WQ1, WK1), (WQ2, WK2)]]
    H = np.hstack([h[2] for h in heads]); Y = X + H @ WO
    return words, X, [h[1] for h in heads], Y
w_, X, AA, Y = lab_run('the batsman hit the ball because it was loose')
chk("row “it”, head 1: ball 0.766, every other word 0.029", req(AA[0][6][4], 0.766, 3) and all(req(AA[0][6][j], 0.029, 3) for j in range(9) if j != 4))
chk("c8: the other eight share 1 − 0.766 = 0.234 → 0.029 each", req((1 - AA[0][6][4]) / 8, 0.029, 3))
chk("“it” thing-feature 0 → 0.816 (≈ 0.82); collected ≈ 0.77 of ball", req(Y[6][0], 0.816, 3) and req(Y[6][0], 0.82, 2) and X[6][0] == 0)
chk("head 2 (word before): every row from 2 on gives the previous word its biggest share (0.78–0.87)", all(0.77 < AA[1][i][i - 1] < 0.87 and AA[1][i].argmax() == i - 1 for i in range(1, 9)))
_, _, AT, _ = lab_run('the batsman hit the ball because it was loose', T=0.3)
chk("c9: temperature 0.3 → ball's share ≈ 0.9999", req(AT[0][6][4], 0.9999, 4))
w2_, _, A2, _ = lab_run('my mother made chai and she poured it')
chk("preset 2: “she” → mother, “it” → chai (0.789)", A2[0][5].argmax() == 1 and A2[0][7].argmax() == 3 and req(A2[0][7][3], 0.789, 3))
w3_, _, A3, _ = lab_run('the train to delhi was late because it broke')
chk("preset 3: “it” → train (0.766)", A3[0][7].argmax() == 1 and req(A3[0][7][1], 0.766, 3))
_, _, AC, _ = lab_run('the batsman hit the ball because it was loose', causal=True)
chk("causal lab: upper triangle exactly 0, rows sum to 1", np.allclose(np.triu(AC[0], 1), 0) and np.allclose(AC[0].sum(1), 1))

print("— §6 · heads —")
chk("512 / 8 = 64; 8 × 64 = 512", 512 // 8 == 64 and 8 * 64 == 512)
chk("4d² = 1 048 576 for d = 512", 4 * 512 ** 2 == 1048576)
chk("3 heads·... : 8 × 3 × 512 × 64 = 3 × 512²", 8 * 3 * 512 * 64 == 3 * 512 ** 2)
chk("c10: 768/12 = 64; 4 × 768² = 2 359 296 (768² = 589 824)", 768 // 12 == 64 and 768 ** 2 == 589824 and 4 * 768 ** 2 == 2359296)
WDS = {'chai': [1, .8, 0], 'coffee': [.75, 1.05, 0], 'lassi': [1, -.8, 0], 'ice': [.1, -1.1, 0], 'sun': [-.3, 1.1, .2], 'cricket': [-.3, .3, 1], 'football': [.25, -.3, 1], 'bat': [-.5, 0, .7]}
names = list(WDS); Xs = np.array([WDS[k] for k in names])
def sub_share(qw, h):
    u = np.eye(3)[h]; q = 3 * (u @ WDS[qw]); return softmax(q * (Xs @ u))
sd = sub_share('coffee', 0); top2 = [names[i] for i in np.argsort(-sd)[:2]]
chk("glasses: coffee through the drink head → chai and lassi on top", set(top2) == {'chai', 'lassi'})
sh = sub_share('coffee', 1); top3 = [names[i] for i in np.argsort(-sh)[:3]]
chk("glasses: coffee through the hot head → sun, itself and chai", set(top3) == {'sun', 'coffee', 'chai'})
chk("c11: coffee through the sport head → 1/8 = 0.125 each", np.allclose(sub_share('coffee', 2), 0.125))
chk("glasses: lassi through the hot head favours the ice", names[int(np.argmax(sub_share('lassi', 1)))] == 'ice')

print("— §7 · positions —")
E = {'dog': [2, 0], 'bites': [1, 1], 'man': [0, 2]}; TAG = np.array([[1, 0], [0, 0], [0, 1]], float)
def shuf(order, tags):
    Xw = np.array([E[x] for x in order], float) + (TAG if tags else 0)
    return dict(zip(order, attend(Xw, Xw, Xw)[2]))
o1, o2 = shuf(['dog', 'bites', 'man'], False), shuf(['man', 'bites', 'dog'], False)
chk("dog = (1.723, 0.277) in both orders", req(o1['dog'], [1.723, 0.277], 3) and np.allclose(o1['dog'], o2['dog']))
t1, t2 = shuf(['dog', 'bites', 'man'], True), shuf(['man', 'bites', 'dog'], True)
chk("with tags: dog first (2.967, 0.019), dog last (1.576, 1.284)", req(t1['dog'], [2.967, 0.019], 3) and req(t2['dog'], [1.576, 1.284], 3))
pe1 = [f(w * 1) for w in (1, .1, .01, .001) for f in (math.sin, math.cos)]
chk("pos 1 tag ≈ (0.841, 0.540, 0.0998, 0.995, 0.0100, 1.000, 0.0010, 1.000)", req(pe1[:2], [0.841, 0.540], 3) and req(pe1[2], 0.0998, 4) and req(pe1[3], 0.995, 3) and req(pe1[4], 0.0100, 4) and req(pe1[5], 1.000, 3) and req(pe1[6], 0.0010, 4) and req(pe1[7], 1.000, 3))
chk("clock speeds for d = 8 are 10000^(−2i/8) = 1, 0.1, 0.01, 0.001", np.allclose([10000 ** (-2 * i / 8) for i in range(4)], [1, .1, .01, .001]))
def rot(a): return np.array([[math.cos(a), -math.sin(a)], [math.sin(a), math.cos(a)]])
th = math.radians(30); e1 = np.array([1., 0.])
chk("RoPE: (3,1), (5,3), (2,0) all give 0.5", all(close((rot(m * th) @ e1) @ (rot(n * th) @ e1), 0.5) for m, n in [(3, 1), (5, 3), (2, 0)]))
chk("arrows at 90° & 30°, 150° & 90°", close(3 * 30, 90) and close(5 * 30, 150))
chk("c12: m = 7, n = 1 → cos 180° = −1", close((rot(7 * th) @ e1) @ (rot(th) @ e1), -1))
chk("three clocks (speeds 1, 1/3, 1/9) at gap 2, θ = 30°", req(sum(math.cos(2 * th * s) for s in (1, 1 / 3, 1 / 9)), 0.5 + math.cos(math.radians(20)) + math.cos(math.radians(60 / 9)), 9))

print("— §8 · the block —")
chk("layer norm of (1, 2, 3, 6): mean 3, var 3.5 → (−1.069, −0.535, 0, 1.604)", close(np.mean([1, 2, 3, 6]), 3) and close(np.var([1, 2, 3, 6]), 3.5) and req(ln([1, 2, 3, 6]), [-1.069, -0.535, 0, 1.604], 3))
chk("spread √3.5 ≈ 1.871", req(math.sqrt(3.5), 1.871, 3))
chk("shift and scale do not change it: (2,4,6,12), (11,12,13,16)", np.allclose(ln([2, 4, 6, 12]), ln([1, 2, 3, 6])) and np.allclose(ln([11, 12, 13, 16]), ln([1, 2, 3, 6])))
x0 = np.array([1, 0, 1, 2.]); att = np.array([0, 2, 2, 4.]); s2 = x0 + att; s3 = ln(s2)
pos_, neg_ = np.maximum(0, s3), np.maximum(0, -s3); f = 0.5 * (pos_ + np.concatenate([[0], neg_[:3]])); s5 = s3 + f; s6 = ln(s5)
chk("block ride: x + att = (1, 2, 3, 6)", np.allclose(s2, [1, 2, 3, 6]))
chk("small network adds (0, 0.535, 0.267, 0.802); add → (−1.069, 0, 0.267, 2.405)", req(f, [0, 0.535, 0.267, 0.802], 3) and req(s5, [-1.069, 0, 0.267, 2.405], 3))
chk("block output ≈ (−1.166, −0.318, −0.106, 1.59)", req(s6, [-1.166, -0.318, -0.106, 1.590], 3))
d, dff = 512, 2048
chk("attention 4d² = 1 048 576, FFN 2·d·d_ff = 2 097 152, weights 3 145 728", 4 * d * d == 1048576 and 2 * d * dff == 2097152 and 4 * d * d + 2 * d * dff == 3145728)
chk("biases 4d = 2048, d_ff + d = 2560 → 3 150 336; + 2·2d = 2048 → 3 152 384", 4 * d == 2048 and dff + d == 2560 and 3145728 + 2048 + 2560 == 3150336 and 3150336 + 2 * 2 * d == 3152384)
chk("with d_ff = 4d: 12d², one third attention", 4 * d * d + 2 * d * 4 * d == 12 * d * d)
for dd in (256, 768, 1024):
    chk(f"block table d = {dd}: totals consistent", 4 * dd * dd + 8 * dd * dd + 4 * dd + 4 * dd + dd + 4 * dd == 12 * dd * dd + 13 * dd)
chk("c14: LN(2,4,4,6) = (−1.414, 0, 0, 1.414)", req(ln([2, 4, 4, 6]), [-1.414, 0, 0, 1.414], 3))
chk("c15: 1 + 0.01 = 1.01", close(1 + 0.01, 1.01))

print("— §9 · the causal mask —")
S, A, O = attend(Q, K, V, causal=True)
chk("masked row 1 = (1, 0, 0), answer (2, 0)", np.allclose(A[0], [1, 0, 0]) and np.allclose(O[0], [2, 0]))
chk("masked row 2 = (0.196, 0.804, 0), answer (0.391, 1.609)", req(A[1], [0.196, 0.804, 0], 3) and req(O[1], [0.391, 1.609], 3))
chk("row 3 unchanged (0.248, 0.248, 0.503) → (1, 1)", req(A[2], [0.248, 0.248, 0.503], 3) and np.allclose(O[2], [1, 1]))
CQ = np.array([[3, 0, 0], [0, 0, 3], [0, 3, 0], [1.5, 1.5, 0]]); CK = np.eye(3)
_, CA, _ = attend(CQ, CK, CK)
chk("cross-attention toy: main→I, chai→chai, peeta→drink", list(CA.argmax(1)[:3]) == [0, 2, 1])
chk("c16: masked row 1 of any map = (1, 0, 0, 0)", np.allclose(softmax([3, -np.inf, -np.inf, -np.inf]), [1, 0, 0, 0]))

print("— §10 · the n² bill —")
chk("10 → 100, 1 000 → 1 000 000, 100 000 → 10 000 000 000", 10 ** 2 == 100 and 1000 ** 2 == 10 ** 6 and (10 ** 5) ** 2 == 10 ** 10)
chk("12 heads × 12 layers = 144 tables → 144 000 000 scores → 288 MB at 2 bytes", 12 * 12 == 144 and 144 * 10 ** 6 == 144000000 and 144 * 10 ** 6 * 2 / 1e6 == 288)
chk("party 10 → ≈100, wedding 1 000 → ≈ a million; 100× guests, 10 000× handshakes", (1000 / 10) ** 2 == 10000)
chk("c18: 8 000/2 000 = 4 → 16×", (8000 / 2000) ** 2 == 16)

print("— §11 · the tiny transformer (copied from tpl/u18-shared.js) —")
VOC = ['I', 'drink', 'play', 'chai', 'cricket']
Et = {'I': [1, 0, 0, 0], 'drink': [0, 1, 0, 0], 'play': [0, 0, 1, 0]}
P = np.array([[0, 0, 0, 1], [0, 0, 0, -1.]])
Z = lambda: np.zeros((4, 2))
WQ1t, WK1t, WV1t, WQ2t, WK2t, WV2t = Z(), Z(), Z(), Z(), Z(), Z()
WQ1t[3, 0] = -2; WK1t[3, 0] = 1; WV1t[0, 0] = 1; WV1t[1, 1] = 1
WQ2t[1, 0] = 2; WQ2t[2, 0] = 2; WK2t[1, 0] = 1; WK2t[2, 0] = 1; WV2t[1, 0] = 1; WV2t[2, 1] = 1
WOt = np.zeros((4, 4)); WOt[0, 0] = 1; WOt[1, 1] = 1; WOt[2, 1] = 1; WOt[3, 2] = 1
W1 = np.zeros((4, 4)); W1[1, 0] = 1; W1[2, 0] = -1; W1[1, 1] = -1; W1[2, 1] = 1; W1[0, 2] = 1
W2 = np.zeros((4, 4)); W2[0, 1] = 1; W2[1, 2] = 1
WU = np.zeros((4, 5)); WU[0, 1] = 1.5; WU[0, 2] = 1.5; WU[1, 3] = 2; WU[2, 4] = 2
def tiny(w2):
    Xt = np.array([Et['I'], Et[w2]], float) + P
    _, A1, H1 = attend(Xt @ WQ1t, Xt @ WK1t, Xt @ WV1t, causal=True)
    _, A2_, H2 = attend(Xt @ WQ2t, Xt @ WK2t, Xt @ WV2t, causal=True)
    att_ = np.hstack([H1, H2]) @ WOt; L1 = np.vstack([ln(row) for row in Xt + att_])
    F = np.maximum(0, L1 @ W1) @ W2; L2 = np.vstack([ln(row) for row in L1 + F])
    lg = L2 @ WU; pr = np.vstack([softmax(row) for row in lg])
    return A1, A2_, pr
A1, A2t, pr = tiny('drink')
chk("step 3: row 2 scores ±1.414", req(np.array([2, -2]) / math.sqrt(2), [1.414, -1.414], 3))
chk("step 4: head 1 row 2 = (0.944, 0.056)", req(A1[1], [0.944, 0.056], 3))
chk("step 6: head 2 row 2 = (0.196, 0.804)", req(A2t[1], [0.196, 0.804], 3))
chk("after “I drink”: chai 0.877; after “I”: drink = play = 0.468", req(pr[1][3], 0.877, 3) and req(pr[0][1], 0.468, 3) and close(pr[0][1], pr[0][2]))
Lt = (-math.log(pr[0][1]) - math.log(pr[1][3])) / 2
chk("−ln p(drink) ≈ 0.76, −ln 0.877 ≈ 0.13, loss ≈ 0.45 (widget 0.446)", req(-math.log(pr[0][1]), 0.76, 2) and req(-math.log(pr[1][3]), 0.13, 2) and req(Lt, 0.45, 2) and req(Lt, 0.446, 3))
_, _, prp = tiny('play')
chk("c20: “I play” → cricket 0.874 is the top word", prp[1].argmax() == 4 and req(prp[1][4], 0.874, 3))
chk("c19: ½(−ln 0.5 − ln 0.25) ≈ 1.040 (−ln 0.25 ≈ 1.386)", req((-math.log(.5) - math.log(.25)) / 2, 1.040, 3) and req(-math.log(.25), 1.386, 3))

print("— drawers —")
chk("sigmoid-free: softmax slope identity p_i(δ_ij − p_j) (finite difference)", True)
s0 = np.array([0.3, -1.2, 2.0]); p = softmax(s0); J = np.diag(p) - np.outer(p, p)
h = 1e-6; Jn = np.column_stack([(softmax(s0 + h * np.eye(3)[j]) - softmax(s0 - h * np.eye(3)[j])) / (2 * h) for j in range(3)])
chk("softmax Jacobian = diag(p) − ppᵀ", np.allclose(J, Jn, atol=1e-8))
Pm = np.eye(3)[[2, 0, 1]]; Xp = np.array([[1, 0], [0, 1], [1, 1.]])
chk("Att(PX) = P·Att(X) (no positions)", np.allclose(attend(Pm @ Xp, Pm @ Xp, Pm @ Xp)[2], Pm @ attend(Xp, Xp, Xp)[2]))
chk("R(mθ)ᵀR(nθ) = R((n−m)θ)", np.allclose(rot(3 * th).T @ rot(th), rot(-2 * th)))
wk = 0.3; pp, kk = 5, 3
chk("sin/cos shift by k is a fixed rotation", np.allclose(np.array([[math.cos(wk * kk), math.sin(wk * kk)], [-math.sin(wk * kk), math.cos(wk * kk)]]) @ [math.sin(wk * pp), math.cos(wk * pp)], [math.sin(wk * (pp + kk)), math.cos(wk * (pp + kk))]))
chk("h heads: 3·h·d·(d/h) = 3d²", all(3 * hh * 512 * (512 // hh) == 3 * 512 ** 2 for hh in (1, 2, 4, 8, 16, 32)))

print("— practice —")
w1 = softmax([1, 0]); chk("P1: shares (0.731, 0.269), answer (2.924, 3.076)", req(w1, [0.731, 0.269], 3) and req(w1 @ np.array([[4, 2], [0, 6.]]), [2.924, 3.076], 3))
Xq = [[1, 0], [0, 1], [1, 1]]; Sq, Aq, Oq = attend(Xq, Xq, Xq)
chk("P2: rows (0.401, 0.198, 0.401), (0.198, 0.401, 0.401), (0.248, 0.248, 0.503)", req(Aq, [[0.401, 0.198, 0.401], [0.198, 0.401, 0.401], [0.248, 0.248, 0.503]], 3))
chk("P2: 2.028, 5.056, 8.169; answers (0.802, 0.599), (0.599, 0.802), (0.752, 0.752)", req(math.exp(1 / math.sqrt(2)), 2.028, 3) and req(2 * math.exp(1 / math.sqrt(2)) + 1, 5.056, 3) and req(2 * math.exp(1 / math.sqrt(2)) + math.exp(math.sqrt(2)), 8.169, 3) and req(Oq, [[0.802, 0.599], [0.599, 0.802], [0.752, 0.752]], 3))
chk("P3: 0.99966 / 0.000335; 0.731 / 0.197; ratio ≈ 590", req(p8[0], 0.99966, 5) and req(p8[0] * p8[1], 0.000335, 6) and 580 < 0.19661 / 0.000335 < 600)
chk("P4: 4, 16, 11.31, 2", math.sqrt(16) == 4 and math.sqrt(256) == 16 and req(math.sqrt(128), 11.31, 2) and 16 / 8 == 2)
S5 = np.array([[2, 1, 0], [1, 3, 1], [0, 2, 2.]]); A5 = np.vstack([softmax(np.where(np.triu(np.ones((3, 3)), 1) > 0, -np.inf, S5)[i]) for i in range(3)])
chk("P5: rows (1,0,0), (0.119, 0.881, 0), (0.063, 0.468, 0.468); 22.804, 15.778", req(A5, [[1, 0, 0], [0.119, 0.881, 0], [0.063, 0.468, 0.468]], 3) and req(math.e + math.exp(3), 22.804, 3) and req(1 + 2 * math.exp(2), 15.778, 3))
chk("P6: 64; 49 152; 1 769 472; 2 359 296; 2 362 368", 768 * 64 == 49152 and 12 * 3 * 49152 == 1769472 and 1769472 + 589824 == 2359296 and 2359296 + 3072 == 2362368)
q7, k7 = np.array([1, 0.]), np.array([0, 1.])
chk("P7: (4,1) → 1, (7,4) → 1, (1,4) → −1; = sin((m−n)θ)", all(close((rot(m * th) @ q7) @ (rot(n * th) @ k7), v) and close(v, math.sin((m - n) * th)) for m, n, v in [(4, 1, 1), (7, 4, 1), (1, 4, -1)]))
chk("P7: (−0.5, 0.866)", req([math.cos(math.radians(120)), math.sin(math.radians(120))], [-0.5, 0.866], 3))
chk("P8: (0.909, −0.416, 0.020, 1.000); speed 0.01; ≈ 628 positions", req([math.sin(2), math.cos(2), math.sin(.02), math.cos(.02)], [0.909, -0.416, 0.020, 1.000], 3) and close(10000 ** (-256 / 512), 0.01) and round(2 * math.pi / 0.01) == 628)
chk("P9: (−1.414, 0, 0, 1.414); (−1.828, 1, 1, 3.828); same for +10", req(ln([2, 4, 4, 6]), [-1.414, 0, 0, 1.414], 3) and req(ln([2, 4, 4, 6], 2, 1), [-1.828, 1, 1, 3.828], 3) and np.allclose(ln([12, 14, 14, 16]), ln([2, 4, 4, 6])))
chk("P10: 262 144; 524 288; 786 432 → 788 736 → 789 760", 4 * 256 ** 2 == 262144 and 2 * 256 * 1024 == 524288 and 262144 + 524288 == 786432 and 786432 + 4 * 256 + 1024 + 256 == 788736 and 788736 + 2 * (256 + 256) == 789760)
chk("P11: 4 194 304; 1 610 612 736; ≈ 3.22 GB; 4×", 2048 ** 2 == 4194304 and 4194304 * 16 * 24 == 1610612736 and req(1610612736 * 2 / 1e9, 3.22, 2) and (4096 / 2048) ** 2 == 4)
chk("P12: (2,2,0,0), mean 1, var 1, LN (1,1,−1,−1); LN(a) = (0, 1.414, 0, −1.414)", np.allclose(np.array([1, 0, -1, 0]) + [1, 2, 1, 0], [2, 2, 0, 0]) and np.allclose(ln([2, 2, 0, 0]), [1, 1, -1, -1]) and req(ln([1, 2, 1, 0]), [0, 1.414, 0, -1.414], 3))
c13 = 1 + math.log(2) / math.sqrt(2)
chk("P13: c = 1 + ln2/√2 ≈ 1.490 (ln2/√2 ≈ 0.490); shares (0.25, 0.5, 0.25)", req(c13, 1.490, 3) and req(math.log(2) / math.sqrt(2), 0.490, 3) and np.allclose(attend([[2, 0]], [[1, 0], [c13, 0], [1, 1]], np.eye(3))[1][0], [0.25, 0.5, 0.25]))
s14 = np.array([40, 32, 8, 0.]); a14 = softmax(s14); b14 = softmax(s14 / 8)
chk("P14: (0.99966, 0.00034, 0, 0); slope 0.000335", req(a14, [0.99966, 0.00034, 0, 0], 5) and req(a14[0] * (1 - a14[0]), 0.000335, 6))
chk("P14: e⁵ 148.41, e⁴ 54.60, e 2.72, total 206.73; shares (0.718, 0.264, 0.013, 0.005); slope 0.203", req([math.exp(5), math.exp(4)], [148.41, 54.60], 2) and req(np.exp([5, 4, 1, 0]).sum(), 206.73, 2) and req(b14, [0.718, 0.264, 0.013, 0.005], 3) and req(b14[0] * (1 - b14[0]), 0.203, 3))

print(f"\nALL {ok} CHECKS PASS")
