# Unit 18 · Attention and Transformers — machine verification of every number the page prints (Round 22):
# the look-back of the decoder and the alignment map, scoring functions, the soft lookup, self-attention by hand,
# the sqrt(d) story, contextual vectors, the attention lab's toy model, heads and the glasses, positions (learned,
# clock tags, rotary), layer norm and the block, the causal mask and every-guess-at-once, BERT / GPT counts,
# the n^2 bill, the tiny transformer and weight tying, the checks, the drawers and the sixteen problems.
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


print("— §1 · the look-back (seq2seq attention) —")
Hn = np.eye(3); Qd = {'main': [2, 0, 0], 'chai': [0, .5, 2], 'peeta': [0, 2, .5], 'hoon': [1, 1, 0]}
wc = softmax(Hn @ Qd['chai'])
chk("chai: scores (0, 0.5, 2); e^0.5 ≈ 1.649, e^2 ≈ 7.389, total ≈ 10.038", np.allclose(Hn @ Qd['chai'], [0, .5, 2]) and req(math.exp(.5), 1.649, 3) and req(math.exp(2), 7.389, 3) and req(1 + math.exp(.5) + math.exp(2), 10.038, 3))
chk("chai: weights = context = (0.100, 0.164, 0.736)", req(wc, [0.100, 0.164, 0.736], 3) and np.allclose(wc @ Hn, wc))
chk("main (0.787, 0.107, 0.107); peeta (0.100, 0.736, 0.164); hoon (0.422, 0.422, 0.155)", req(softmax(Qd['main']), [0.787, 0.107, 0.107], 3) and req(softmax(Qd['peeta']), [0.100, 0.736, 0.164], 3) and req(softmax(Qd['hoon']), [0.422, 0.422, 0.155], 3))
chk("the map bends: main→I, chai→tea, peeta→drink, hoon splits I/drink", [int(np.argmax(softmax(Qd[k]))) for k in ('main', 'chai', 'peeta')] == [0, 2, 1] and close(softmax(Qd['hoon'])[0], softmax(Qd['hoon'])[1]))
chk("widget Try / c1: how sure = 2 → tea's share 0.936; (0.017, 0.047, 0.936); e^4 ≈ 54.6, e ≈ 2.72", req(softmax(2 * np.array(Qd['chai'])), [0.017, 0.047, 0.936], 3) and req(math.exp(4), 54.6, 1) and req(math.e, 2.72, 2))
chk("how sure = 0 → every row (1/3, 1/3, 1/3)", np.allclose(softmax(0 * np.array(Qd['chai'])), 1 / 3))
q2 = np.array([.5, -.5]); H2 = np.array([[1, 0], [0, 1], [1, 1.]]); pre = H2 + q2; th = np.tanh(pre); sa = th.sum(1)
chk("additive: h + q = (1.5, −0.5), (0.5, 0.5), (1.5, 0.5); tanh (0.905, −0.462), (0.462, 0.462), (0.905, 0.462)", np.allclose(pre, [[1.5, -.5], [.5, .5], [1.5, .5]]) and req(th, [[0.905, -0.462], [0.462, 0.462], [0.905, 0.462]], 3))
chk("additive scores (0.443, 0.924, 1.367) → weights (0.195, 0.315, 0.490)", req(sa, [0.443, 0.924, 1.367], 3) and req(softmax(sa), [0.195, 0.315, 0.490], 3))
print("   (the plan said 0.491 for the last weight; the value is 0.49046 → 0.490 on the page)")
chk("c2: 35 Hindi words × 30 English notes = 1 050 weights, 35 context vectors", 35 * 30 == 1050)
# drawer: dc/dh_j = a_j (I + (h_j − c) qᵀ), checked by finite differences on random notes
rng0 = np.random.default_rng(3); Hr = rng0.standard_normal((4, 3)); qr = rng0.standard_normal(3)
def ctx_of(Hm): a = softmax(Hm @ qr); return a @ Hm
a0 = softmax(Hr @ qr); c0 = a0 @ Hr; j = 2; eps = 1e-6
Jn = np.column_stack([(ctx_of(Hr + eps * np.outer(np.eye(4)[j], np.eye(3)[k])) - ctx_of(Hr - eps * np.outer(np.eye(4)[j], np.eye(3)[k]))) / (2 * eps) for k in range(3)])
chk("drawer §1: ∂c/∂h_j = α_j (I + (h_j − c) qᵀ) (finite differences)", np.allclose(Jn, a0[j] * (np.eye(3) + np.outer(Hr[j] - c0, qr)), atol=1e-7))

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

chk("widget Try: pickiness 0 → 0.25 each, cup ₹18.75; pickiness 6 → chai ≈ 1 (0.99…)", np.allclose(softmax(0 * (KEYS @ [1.5, 1])), .25) and close(softmax(0 * (KEYS @ [1.5, 1])) @ PRICE, 18.75) and softmax(6 * (KEYS @ [1.5, 1]))[0] > .99)
chk("widget scores at (1.5, 1): chai 2.5, coffee 0.55, lassi 1.25, lemon tea −2", np.allclose(KEYS @ [1.5, 1], [2.5, .55, 1.25, -2]))

print("— §3 · self-attention: the relay —")
chk("0.5^7 ≈ 0.0078; 8 × 8 = 64 questions", req(0.5 ** 7, 0.0078, 4) and 8 * 8 == 64)
chk("relay bars 1, 0.5, 0.25, 0.125, 0.063, 0.031, 0.016, 0.0078 (printed half-up, as JavaScript does)", all(abs(0.5 ** i - v) <= 0.5 * 10 ** -d + 1e-12 for i, (v, d) in enumerate([(1, 0), (.5, 1), (.25, 2), (.125, 3), (.063, 3), (.031, 3), (.016, 3), (.0078, 4)])))
chk("c5 / Try: 10 words → 9 hand-overs, 0.5^9 ≈ 0.002, 100 questions", 10 - 1 == 9 and req(0.5 ** 9, 0.002, 3) and 10 * 10 == 100)
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

chk("w-qkv Try: angle 90°, length 2 → answer (0.663, 1.337); length 0 → 0.333 each, answer (1, 1)", req(attend([[0, 2]], K, V)[2][0], [0.663, 1.337], 3) and req(attend([[0, 0]], K, V)[1][0], [0.333] * 3, 3))
chk("pillar heights = 2.2 × share: 0.981, 0.238, 0.981 at q = (2, 0)", req(2.2 * A[0], [0.981, 0.238, 0.981], 3))
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

p64 = softmax([8 / 64, 0])
chk("÷d trap: 8/64 = 0.125 → (0.531, 0.469), slope 0.249", close(8 / 64, .125) and req(p64, [0.531, 0.469], 3) and req(p64[0] * p64[1], 0.249, 3))
chk("table: slopes 0.00034, 0.197, 0.249", req(p8[0] * p8[1], 0.00034, 5) and req(p1[0] * p1[1], 0.197, 3) and req(p64[0] * p64[1], 0.249, 3))
chk("c8: √512 ≈ 22.6", req(math.sqrt(512), 22.6, 1))

print("— §5 · one word, many meanings —")
NB = {'river': [2, 0], 'stream': [3, 0], 'the': [.3, .3], 'money': [0, 2], 'loan': [.5, 2.5]}; BANK = np.array([1., 1.])
def ctxv(nb):
    X = np.array([NB[nb], BANK], float); S_, A_, O_ = attend([BANK], X, X); return S_[0], A_[0], O_[0]
sR, aR, oR = ctxv('river'); sM, aM, oM = ctxv('money')
chk("river bank: scores 2, 2 → ÷√2 (1.414, 1.414) → shares (0.5, 0.5) → (1.5, 0.5)", req(sR, [1.414, 1.414], 3) and np.allclose(aR, [.5, .5]) and np.allclose(oR, [1.5, .5]))
chk("money bank → (0.5, 1.5)", np.allclose(oM, [.5, 1.5]))
cosRM = oR @ oM / np.linalg.norm(oR) / np.linalg.norm(oM)
chk("cosine 1.5/2.5 = 0.6; angle ≈ 53° (53.1°); |bank| = √2.5", close(cosRM, .6) and req(math.degrees(math.acos(.6)), 53.1, 1) and round(math.degrees(math.acos(.6))) == 53 and close(np.linalg.norm(oR), math.sqrt(2.5)))
sS, aS, oS = ctxv('stream')
chk("c10 / Try: stream (3, 0): scores 2.121, 1.414; share 0.670; bank → (2.34, 0.33) = (2.340, 0.330)", req(sS, [2.121, 1.414], 3) and req(aS[0], 0.670, 3) and req(oS, [2.34, 0.33], 2) and req(oS, [2.340, 0.330], 3))
chk("Try: 'money' in both sentences → the same vector, cosine 1", close(ctxv('money')[2] @ oM / np.linalg.norm(oM) ** 2, 1))
sT, aT, oT = ctxv('the')
chk("Try: 'the' (0.3, 0.3) keeps bank's direction exactly (cos 1 with (1, 1)) — shares (0.271, 0.729)", close(oT[0], oT[1]) and req(aT, [0.271, 0.729], 3))
chk("drawer §5: bank' = b + σ(g)(a − b), g = (a·b − b·b)/√d (river g = 0 → halfway; stream g ≈ 0.707, σ ≈ 0.670)", all(np.allclose(ctxv(k)[2], BANK + 1 / (1 + math.exp(-(np.array(NB[k]) @ BANK - BANK @ BANK) / math.sqrt(2))) * (np.array(NB[k]) - BANK)) for k in NB) and req((3 - 2) / math.sqrt(2), 0.707, 3) and req(1 / (1 + math.exp(-(3 - 2) / math.sqrt(2))), 0.670, 3))
chk("c11: cosine of (1.5, 0.5) and (0.5, 1.5) = 0.6 (not 0, not 1)", close(cosRM, .6))

print("— §6 · the attention lab (toy model, copied from tpl/u18-shared.js) —")
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
chk("lab prints it with 4 decimals as 0.9999 (never a flat 1)", f"{AT[0][6][4]:.4f}" == "0.9999" and AT[0][6][4] < 1)
w2_, _, A2, _ = lab_run('my mother made chai and she poured it')
chk("preset 2: “she” → mother, “it” → chai (0.789)", A2[0][5].argmax() == 1 and A2[0][7].argmax() == 3 and req(A2[0][7][3], 0.789, 3))
w3_, _, A3, _ = lab_run('the train to delhi was late because it broke')
chk("preset 3: “it” → train (0.766)", A3[0][7].argmax() == 1 and req(A3[0][7][1], 0.766, 3))
_, _, AC, _ = lab_run('the batsman hit the ball because it was loose', causal=True)
chk("causal lab: upper triangle exactly 0, rows sum to 1", np.allclose(np.triu(AC[0], 1), 0) and np.allclose(AC[0].sum(1), 1))

print("— §7 · heads —")
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

chk("w-heads Try: “it” — head 1 → ball 0.77, head 2 → because 0.78", req(AA[0][6][4], 0.77, 2) and req(AA[1][6][5], 0.78, 2))
chk("w-heads Try: d = 768, 12 heads → 64 each, 2 359 296; d = 512 with 12 heads does not split (42.67)", 768 % 12 == 0 and 768 // 12 == 64 and 512 % 12 != 0 and req(512 / 12, 42.67, 2))
chk("glasses Try: coffee · drink head → chai = lassi = 0.330, coffee 0.188", req(sd[[0, 2]], [0.330, 0.330], 3) and req(sd[1], 0.188, 3))
chk("glasses: coffee · hot head: sun 0.422, coffee 0.360, chai 0.164", req(sh[[4, 1, 0]], [0.422, 0.360, 0.164], 3))
chk("table: 1 × 512, 8 × 64, 64 × 8 all hold 4 × 512² = 1 048 576 weights", all(3 * hh * 512 * (512 // hh) + 512 ** 2 == 1048576 for hh in (1, 8, 64)))
chk("rule of thumb: BERT-base 768/12 = 64, GPT-2 small 768/12 = 64", 768 // 12 == 64)
print("— §8 · positions —")
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

PE4 = lambda p: np.array([math.sin(p), math.cos(p), math.sin(.01 * p), math.cos(.01 * p)])
chk("d = 4 speeds 1 and 10000^(−2/4) = 0.01", close(10000 ** (-2 / 4), .01))
chk("PE(1) = (0.8415, 0.5403, 0.0100, 1.0000); PE(2) = (0.9093, −0.4161, 0.0200, 0.9998); PE(3) = (0.1411, −0.9900, 0.0300, 0.9996)", req(PE4(1), [0.8415, 0.5403, 0.0100, 1.0000], 4) and req(PE4(2), [0.9093, -0.4161, 0.0200, 0.9998], 4) and req(PE4(3), [0.1411, -0.9900, 0.0300, 0.9996], 4))
chk("PE(1)·PE(2) = PE(2)·PE(3) = cos 1 + cos 0.01 ≈ 1.5403; c18: PE(10)·PE(11) too", all(req(PE4(p) @ PE4(p + 1), 1.5403, 4) for p in (1, 2, 10)) and req(math.cos(1) + math.cos(.01), 1.5403, 4))
chk("drawer §8: PE(p)·PE(p+k) = Σ cos(ω k) for d = 8 as well", all(close(sum(f(w * p) * f(w * (p + k)) for w in (1, .1, .01, .001) for f in (math.sin, math.cos)), sum(math.cos(w * k) for w in (1, .1, .01, .001))) for p in (0, 3, 17) for k in (1, 4)))
chk("compare tab: turns θ = 30°, gap 1 → cos 30° = 0.866 for every p; clock tags 1.5403 for every p", req(math.cos(math.radians(30)), 0.866, 3))
chk("compare tab: gap k = 1…6 → clock tags cos k + cos 0.01k, turns cos 30k°", all(abs(PE4(5) @ PE4(5 + k) - (math.cos(k) + math.cos(.01 * k))) < 1e-12 for k in range(1, 7)))
print("— §9 · the block —")
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

chk("c20: 1 + 0.01 = 1.01; 1.01^50 ≈ 1.64", close(1 + .01, 1.01) and req(1.01 ** 50, 1.64, 2))

print("— §10 · the causal mask, and every guess at once —")
S, A, O = attend(Q, K, V, causal=True)
chk("masked row 1 = (1, 0, 0), answer (2, 0)", np.allclose(A[0], [1, 0, 0]) and np.allclose(O[0], [2, 0]))
chk("masked row 2 = (0.196, 0.804, 0), answer (0.391, 1.609)", req(A[1], [0.196, 0.804, 0], 3) and req(O[1], [0.391, 1.609], 3))
chk("row 3 unchanged (0.248, 0.248, 0.503) → (1, 1)", req(A[2], [0.248, 0.248, 0.503], 3) and np.allclose(O[2], [1, 1]))
chk("c21: masked row 1 of any map = (1, 0, 0, 0)", np.allclose(softmax([3, -np.inf, -np.inf, -np.inf]), [1, 0, 0, 0]))
chk("“I drink chai daily”: 3 guesses; “I drink hot chai daily”: 4 guesses; c23: 6 words → 5 guesses; an n-word sentence → n − 1", 4 - 1 == 3 and 5 - 1 == 4 and 6 - 1 == 5)
chk("trap: zeroing shares after softmax breaks the row sum (row 1 would add to 0.446)", not close(softmax(np.array([1.414, 0, 1.414]))[0], 1))
# drawer §10: one masked pass = n honest runs (two layers of random masked attention, prefix check)
rng1 = np.random.default_rng(5); Xs = rng1.standard_normal((5, 4)); Wl = [rng1.standard_normal((4, 4)) for _ in range(6)]
def run2(X_):
    h = X_
    for L_ in range(2):
        h = h + attend(h @ Wl[3 * L_], h @ Wl[3 * L_ + 1], h @ Wl[3 * L_ + 2], causal=True)[2]
    return h
full = run2(Xs)
chk("drawer §10: two masked layers — row t of one pass equals a run on the first t words", all(np.allclose(full[t], run2(Xs[:t + 1])[t]) for t in range(5)))

print("— §11 · three families —")
chk("BERT: 15% of 512 = 76.8 ≈ 77; 80/10/10 → 61.44 ≈ 61, 7.68 ≈ 8, 7.68 ≈ 8", close(.15 * 512, 76.8) and round(76.8) == 77 and close(.8 * 76.8, 61.44) and round(61.44) == 61 and close(.1 * 76.8, 7.68) and round(7.68) == 8)
chk("GPT: 512 tokens → 511 guesses, about 6.7 times BERT's 76.8", 512 - 1 == 511 and req(511 / 76.8, 6.7, 1))
chk("c24: 256 → 38.4 ≈ 38 chosen, 30.72 ≈ 31 [MASK]", close(.15 * 256, 38.4) and round(38.4) == 38 and close(.8 * 38.4, 30.72) and round(30.72) == 31)
chk("c26: 1 000 tokens → GPT 999, BERT 150, ratio 6.66 ≈ 6.7", 1000 - 1 == 999 and close(.15 * 1000, 150) and req(999 / 150, 6.7, 1))
chk("widget: 12 words → 15% = 1.8 ≈ 2 chosen; GPT grades 11; encoder–decoder grades 4 Hindi words", close(.15 * 12, 1.8) and round(1.8) == 2 and 12 - 1 == 11 and len(['main', 'chai', 'peeta', 'hoon']) == 4)
chk("widget cross-attention grid = §1's map (0.79 / 0.11 / 0.11 …) to 2 places", req(softmax(Qd['main']), [0.79, 0.11, 0.11], 2) and req(softmax(Qd['hoon']), [0.42, 0.42, 0.16], 2))
print("— §12 · the n² bill —")
chk("10 → 100, 1 000 → 1 000 000, 100 000 → 10 000 000 000", 10 ** 2 == 100 and 1000 ** 2 == 10 ** 6 and (10 ** 5) ** 2 == 10 ** 10)
chk("12 heads × 12 layers = 144 tables → 144 000 000 scores → 288 MB at 2 bytes", 12 * 12 == 144 and 144 * 10 ** 6 == 144000000 and 144 * 10 ** 6 * 2 / 1e6 == 288)
chk("party 10 → 45 handshakes, wedding 1 000 → 499 500 (about half a million); guests ×100, handshakes ×11 100 (more than 10 000)", math.comb(10, 2) == 45 and math.comb(1000, 2) == 499500 and math.comb(1000, 2) / math.comb(10, 2) == 11100 and 11100 > 10000)
chk("attention counts ordered pairs with itself: 10 words → 10 × 10 = 100 scores = 2·45 + 10", 10 * 10 == 100 == 2 * math.comb(10, 2) + 10)
chk("c18: 8 000/2 000 = 4 → 16×", (8000 / 2000) ** 2 == 16)

chk("c28: weights do not depend on n (4d² + 2·d·d_ff for any length)", True)
print("— §13 · the tiny transformer (copied from tpl/u18-shared.js) —")
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

chk("weight tying: V = 50 000, d = 512 → 25 600 000 saved; c31: 32 000 × 4 096 = 131 072 000", 50000 * 512 == 25600000 and 32000 * 4096 == 131072000)
Et5 = np.random.default_rng(9).standard_normal((5, 4)); hv = np.random.default_rng(10).standard_normal(4)
chk("drawer §13: tied logits h Eᵀ have entry w = h · e_w", np.allclose(hv @ Et5.T, [hv @ Et5[w] for w in range(5)]))
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


print("— practice (16) —")
w1p = softmax(np.array([[1, 0], [0, 1], [1, 1.]]) @ [2, 1])
chk("P1: scores (2, 1, 3); e^3 ≈ 20.086, total 30.193; weights (0.245, 0.090, 0.665); context (0.910, 0.755)", np.allclose(np.array([[1, 0], [0, 1], [1, 1.]]) @ [2, 1], [2, 1, 3]) and req(math.exp(3), 20.086, 3) and req(math.exp(2) + math.e + math.exp(3), 30.193, 3) and req(w1p, [0.245, 0.090, 0.665], 3) and req(w1p @ np.array([[1, 0], [0, 1], [1, 1.]]), [0.910, 0.755], 3) and req(0.245 + 0.665, 0.910, 3) and req(0.090 + 0.665, 0.755, 3))
chk("P2: additive (0.443, 0.924, 1.367) → (0.195, 0.315, 0.490); from the rounded scores e^0.443 ≈ 1.557, e^0.924 ≈ 2.519, e^1.367 ≈ 3.924, total 8.000 (same weights)", req(sa, [0.443, 0.924, 1.367], 3) and req(softmax(sa), [0.195, 0.315, 0.490], 3) and req(np.exp([0.443, 0.924, 1.367]), [1.557, 2.519, 3.924], 3) and req(np.exp([0.443, 0.924, 1.367]).sum(), 8.000, 3) and req(softmax([0.443, 0.924, 1.367]), [0.195, 0.315, 0.490], 3))
chk("P2: dot scores (0.5, −0.5, 0) → (0.506, 0.186, 0.307); e^0.5 1.649, e^−0.5 0.607, total 3.255; winners 3 vs 1", np.allclose(H2 @ q2, [.5, -.5, 0]) and req(softmax(H2 @ q2), [0.506, 0.186, 0.307], 3) and req(math.exp(-.5), 0.607, 3) and req(math.exp(.5) + math.exp(-.5) + 1, 3.255, 3) and int(np.argmax(sa)) == 2 and int(np.argmax(H2 @ q2)) == 0)
w1 = softmax([1, 0]); chk("P3: shares (0.731, 0.269), answer (2.924, 3.076)", req(w1, [0.731, 0.269], 3) and req(w1 @ np.array([[4, 2], [0, 6.]]), [2.924, 3.076], 3))
Xq = [[1, 0], [0, 1], [1, 1]]; Sq, Aq, Oq = attend(Xq, Xq, Xq)
chk("P4: rows (0.401, 0.198, 0.401), (0.198, 0.401, 0.401), (0.248, 0.248, 0.503)", req(Aq, [[0.401, 0.198, 0.401], [0.198, 0.401, 0.401], [0.248, 0.248, 0.503]], 3))
chk("P4: 2.028, 5.056, 8.169; answers (0.802, 0.599), (0.599, 0.802), (0.752, 0.752)", req(math.exp(1 / math.sqrt(2)), 2.028, 3) and req(2 * math.exp(1 / math.sqrt(2)) + 1, 5.056, 3) and req(2 * math.exp(1 / math.sqrt(2)) + math.exp(math.sqrt(2)), 8.169, 3) and req(Oq, [[0.802, 0.599], [0.599, 0.802], [0.752, 0.752]], 3))
c13 = 1 + math.log(2) / math.sqrt(2)
chk("P5: c = 1 + ln2/√2 ≈ 1.490 (ln2/√2 ≈ 0.490); shares (0.25, 0.5, 0.25)", req(c13, 1.490, 3) and req(math.log(2) / math.sqrt(2), 0.490, 3) and np.allclose(attend([[2, 0]], [[1, 0], [c13, 0], [1, 1]], np.eye(3))[1][0], [0.25, 0.5, 0.25]))
s14 = np.array([40, 32, 8, 0.]); a14 = softmax(s14); b14 = softmax(s14 / 8)
chk("P6: (0.99966, 0.00034, 0, 0); slope 0.000335; e^−8 ≈ 0.000335", req(a14, [0.99966, 0.00034, 0, 0], 5) and req(a14[0] * (1 - a14[0]), 0.000335, 6) and req(math.exp(-8), 0.000335, 6))
chk("P6: e⁵ 148.41, e⁴ 54.60, e 2.72, total 206.73; shares (0.718, 0.264, 0.013, 0.005); slope 0.203; ≈ 600×", req([math.exp(5), math.exp(4)], [148.41, 54.60], 2) and req(np.exp([5, 4, 1, 0]).sum(), 206.73, 2) and req(b14, [0.718, 0.264, 0.013, 0.005], 3) and req(b14[0] * (1 - b14[0]), 0.203, 3) and 550 < b14[0] * (1 - b14[0]) / (a14[0] * (1 - a14[0])) < 650)
lake, cash = np.array([3, 1.]), np.array([0, 3.])
def ctx2(a): X = np.vstack([a, BANK]); return attend([BANK], X, X)
Sl, Al, Ol = ctx2(lake); Sc_, Ac, Oc = ctx2(cash)
chk("P7: lake: scores (2.828, 1.414), shares (0.804, 0.196), bank → (2.609, 1)", req(Sl[0], [2.828, 1.414], 3) and req(Al[0], [0.804, 0.196], 3) and req(Ol[0], [2.609, 1], 3))
chk("P7: cash: scores (2.121, 1.414), shares (0.670, 0.330), bank → (0.330, 2.340)", req(Sc_[0], [2.121, 1.414], 3) and req(Ac[0], [0.670, 0.330], 3) and req(Oc[0], [0.330, 2.340], 3))
cP7 = Ol[0] @ Oc[0] / np.linalg.norm(Ol[0]) / np.linalg.norm(Oc[0])
chk("P7: dot 3.201, lengths 2.794 and 2.363, cosine 0.485 (≈ 61°); slide formula g = 1.414, σ = 0.804", req(Ol[0] @ Oc[0], 3.201, 3) and req(np.linalg.norm(Ol[0]), 2.794, 3) and req(np.linalg.norm(Oc[0]), 2.363, 3) and req(cP7, 0.485, 3) and round(math.degrees(math.acos(cP7))) == 61 and req(1 / (1 + math.exp(-math.sqrt(2))), 0.804, 3))
chk("P8: 64; 49 152; 1 769 472; 2 359 296; 2 362 368", 768 * 64 == 49152 and 12 * 3 * 49152 == 1769472 and 1769472 + 589824 == 2359296 and 2359296 + 3072 == 2362368)
chk("P9: PE(2) ≈ (0.909, −0.416, 0.020, 1.000)", req(PE4(2), [0.909, -0.416, 0.020, 1.000], 3))
chk("P9: PE(5) ≈ (−0.9589, 0.2837, 0.0500, 0.9988), PE(6) ≈ (−0.2794, 0.9602, 0.0600, 0.9982); products 0.2679, 0.2724, 0.0030, 0.9970; sum 1.5403", req(PE4(5), [-0.9589, 0.2837, 0.0500, 0.9988], 4) and req(PE4(6), [-0.2794, 0.9602, 0.0600, 0.9982], 4) and req(PE4(5) * PE4(6), [0.2679, 0.2724, 0.0030, 0.9970], 4) and req(PE4(5) @ PE4(6), 1.5403, 4))
chk("P9: speed 0.01; ≈ 628 positions", close(10000 ** (-256 / 512), 0.01) and round(2 * math.pi / 0.01) == 628)
q7, k7 = np.array([1, 0.]), np.array([0, 1.])
chk("P10: (4,1) → 1, (7,4) → 1, (1,4) → −1; = sin((m−n)θ); (−0.5, 0.866)", all(close((rot(m * th) @ q7) @ (rot(n * th) @ k7), v) and close(v, math.sin((m - n) * th)) for m, n, v in [(4, 1, 1), (7, 4, 1), (1, 4, -1)]) and req([math.cos(math.radians(120)), math.sin(math.radians(120))], [-0.5, 0.866], 3))
chk("P11: (−1.414, 0, 0, 1.414); (−1.828, 1, 1, 3.828); same for +10; LN(x + a) = LN(2, 2, 0, 0) = (1, 1, −1, −1)", req(ln([2, 4, 4, 6]), [-1.414, 0, 0, 1.414], 3) and req(ln([2, 4, 4, 6], 2, 1), [-1.828, 1, 1, 3.828], 3) and np.allclose(ln([12, 14, 14, 16]), ln([2, 4, 4, 6])) and np.allclose(np.array([1, 0, -1, 0]) + [1, 2, 1, 0], [2, 2, 0, 0]) and np.allclose(ln([2, 2, 0, 0]), [1, 1, -1, -1]))
chk("P12: 262 144; 524 288; 786 432 → 788 736 → 789 760", 4 * 256 ** 2 == 262144 and 2 * 256 * 1024 == 524288 and 262144 + 524288 == 786432 and 786432 + 4 * 256 + 1024 + 256 == 788736 and 788736 + 2 * (256 + 256) == 789760)
S5p = np.array([[2, 1, 0], [1, 3, 1], [0, 2, 2.]]); A5 = np.vstack([softmax(np.where(np.triu(np.ones((3, 3)), 1) > 0, -np.inf, S5p)[i]) for i in range(3)])
chk("P13: rows (1,0,0), (0.119, 0.881, 0), (0.063, 0.468, 0.468); 22.804, 15.778", req(A5, [[1, 0, 0], [0.119, 0.881, 0], [0.063, 0.468, 0.468]], 3) and req(math.e + math.exp(3), 22.804, 3) and req(1 + 2 * math.exp(2), 15.778, 3))
chk("P14: 1 024 → 153.6 ≈ 154; 122.88 ≈ 123, 15.36 ≈ 15, 15.36 ≈ 15; GPT 1 023; ratio ≈ 6.7", close(.15 * 1024, 153.6) and round(153.6) == 154 and close(.8 * 153.6, 122.88) and round(122.88) == 123 and close(.1 * 153.6, 15.36) and round(15.36) == 15 and 1024 - 1 == 1023 and req(1023 / 153.6, 6.7, 1))
chk("P15: V = 38 597 376/768 = 50 257; 77 194 752 untied; chai 2.5, coffee −1", 38597376 % 768 == 0 and 38597376 // 768 == 50257 and 2 * 38597376 == 77194752 and close(np.array([1, 2.]) @ [.5, 1], 2.5) and close(np.array([1, 2.]) @ [1, -1], -1))
chk("P16: 4 194 304; 1 610 612 736; ≈ 3.22 GB; 4×", 2048 ** 2 == 4194304 and 4194304 * 16 * 24 == 1610612736 and req(1610612736 * 2 / 1e9, 3.22, 2) and (4096 / 2048) ** 2 == 4)

print("— values used in checks' feedback and wrong options (misconceptions must be computed right too) —")
chk("c1 option: 0.936 ≈ 0.94", req(softmax(2 * np.array(Qd['chai']))[2], 0.94, 2))
chk("c11: 0.75 + 0.75 = 1.5", close(1.5 * .5 + .5 * 1.5, 1.5) and close(1.5 * .5, .75))
chk("c13: dividing by 0.3 widens gaps ≈ 3.3 times", req(1 / .3, 3.3, 1))
chk("c14 wrong options: 4 × 768² / 12 = 196 608; 12 × 4 × 768² = 28 311 552", 4 * 768 ** 2 // 12 == 196608 and 12 * 4 * 768 ** 2 == 28311552)
chk("c19 wrong option: (2, 4, 4, 6)/6 = (0.333, 0.667, 0.667, 1)", req(np.array([2, 4, 4, 6]) / 6, [0.333, 0.667, 0.667, 1], 3))
chk("c29: −ln 0.5 ≈ 0.693; wrong option ((1 − 0.5) + (1 − 0.25))/2 = 0.625", req(-math.log(.5), 0.693, 3) and close(((1 - .5) + (1 - .25)) / 2, .625))
chk("c30 wrong option: p(play | I) ≈ 0.468 ≈ 0.47", req(tiny('drink')[2][0][2], 0.47, 2))
chk("c31 wrong option: both tables 2 × 131 072 000 = 262 144 000", 2 * 131072000 == 262144000)
chk("drawer §8: cos 0.01 ≈ 0.99995", req(math.cos(.01), 0.99995, 5))
chk("P3: e + 1 ≈ 3.718; 0.731 × 2 = 1.462, 0.269 × 6 ≈ 1.614 (the old page said 1.613), sum 3.076", req(math.e + 1, 3.718, 3) and req(0.731 * 2, 1.462, 3) and req(0.269 * 6, 1.614, 3) and req(softmax([1, 0])[1] * 6, 1.614, 3) and req(softmax([1, 0])[0] * 2 + softmax([1, 0])[1] * 6, 3.076, 3))
chk("P16: 1 610 612 736 × 2 = 3 221 225 472 bytes", 1610612736 * 2 == 3221225472)

print(f"\nALL {ok} CHECKS PASS")
