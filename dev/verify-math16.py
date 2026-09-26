# Unit 16 · Words as Vectors — machine verification of every number the page prints:
# one-hot geometry, the bigram corpus, perplexity, the co-occurrence table and its corpus, the SVD squeeze,
# PPMI, the skip-gram round, the cost of a softmax, the tiny neural language model, the analogy toys and the
# 60-word explorer, the polysemy blend, the three similarity rulers, the derivation drawers and the fourteen
# practice problems (tpl/u16-*.html). Hand-made data are read straight from tpl/u16-shared.js, so the page and
# this file can never drift apart. Plain numpy, float64. Tolerance 1e-6 unless a rounded value is printed
# (then the rounding is checked).
import json, math, re
import numpy as np

ok = 0
def chk(name, cond):
    global ok
    assert cond, f"FAIL: {name}"
    ok += 1
    print(f"  ok    {name}")

TOL = 1e-6
close = lambda a, b, t=TOL: abs(a - b) < t
r = lambda v, d: round(float(v) + 0.0, d)          # printed rounding
cos = lambda a, b: float(np.dot(a, b) / np.linalg.norm(a) / np.linalg.norm(b))
sig = lambda z: 1 / (1 + math.exp(-z))
L2 = math.log2

SH = open('tpl/u16-shared.js', encoding='utf8').read()
EX = json.loads(re.search(r'const EX=/\*@EX\*/(.*?)/\*@END\*/', SH, re.S).group(1))
NLM = json.loads(re.search(r'const NLM=/\*@NLM\*/(.*?)/\*@END\*/', SH, re.S).group(1))
jsnum = lambda t: re.sub(r'(?<![\d.])(-?)\.(\d)', r'\g<1>0.\2', t)
EX_P = np.array(json.loads(jsnum(re.search(r'const EX_P=(\[\[.*?\]\]);', SH).group(1))))
def jsarr(name):
    i = re.search(r'(?:const |,\s*)' + name + r'=\[', SH).end() - 1; d = 0
    for j in range(i, len(SH)):
        d += {'[': 1, ']': -1}.get(SH[j], 0)
        if d == 0: return json.loads(jsnum(SH[i:j + 1].replace("'", '"')))

# ---------------------------------------------------------------------------------------------
print('— §1 · one-hot —')
E3 = np.eye(3)
chk('one-hot dot products are 0', all(E3[i] @ E3[j] == 0 for i in range(3) for j in range(3) if i != j))
chk('one-hot distance √2 ≈ 1.414 (any V)', r(np.linalg.norm(E3[0] - E3[1]), 3) == 1.414 and close(np.linalg.norm(np.eye(10000)[3] - np.eye(10000)[7]), math.sqrt(2)))
MEAN = np.array([[.84, .52, .16], [.55, .82, .17], [.13, .1, .99]]); MEAN = MEAN / np.linalg.norm(MEAN, axis=1, keepdims=True)
chk('w-onehot meaning mode: chai·coffee lean together (cos %.3f), cricket apart (%.3f)' % (cos(MEAN[0], MEAN[1]), cos(MEAN[0], MEAN[2])), cos(MEAN[0], MEAN[1]) > .9 and cos(MEAN[0], MEAN[2]) < .4)
chk('P1: 20 000 / 300 ≈ 66.7', r(20000 / 300, 1) == 66.7)

print('— §2 · bigrams —')
def bigram(lines):
    C, starts, vocab = {}, {}, []
    for l in lines:
        w = l.split(); starts[w[0]] = starts.get(w[0], 0) + 1
        for x in w:
            if x not in vocab: vocab.append(x)
        for a, b in zip(w, w[1:]): C.setdefault(a, {}); C[a][b] = C[a].get(b, 0) + 1
    return C, starts, vocab
C, S, VOC = bigram(['I drink chai .', 'I drink coffee .', 'I drink chai .', 'I play cricket .'])
P = lambda a, b, sm=False: ((C[a].get(b, 0) + 1) / (sum(C[a].values()) + len(VOC))) if sm else C[a].get(b, 0) / sum(C[a].values())
chk('vocabulary has 7 words (full stop included)', len(VOC) == 7)
chk('P(drink|I) = 3/4, P(chai|drink) = 2/3, P(coffee|drink) = 1/3', close(P('I', 'drink'), .75) and close(P('drink', 'chai'), 2 / 3) and close(P('drink', 'coffee'), 1 / 3))
chk('P(I drink chai .) = 3/4 · 2/3 · 1 = 1/2', close(P('I', 'drink') * P('drink', 'chai') * P('chai', '.'), .5))
chk('"I drink cricket ." gets 0', P('drink', 'cricket') == 0)
chk('add-one: P(chai|drink) = 0.3, P(cricket|drink) = 0.1, P(coffee|drink) = 0.2 (c4)', close(P('drink', 'chai', 1), .3) and close(P('drink', 'cricket', 1), .1) and close(P('drink', 'coffee', 1), .2))
chk('add-one row sums to 1 (drawer: 3/10 + 2/10 + 5·1/10)', close(sum(P('drink', w, 1) for w in VOC), 1))
chk('c3: P(cricket|play) = 1', close(P('play', 'cricket'), 1))
C, S, VOC = bigram(['we play cricket .', 'we play football .', 'we watch cricket .'])
chk('P2 (a): 2/3, 1/2, 1', close(P('we', 'play'), 2 / 3) and close(P('play', 'cricket'), .5) and close(P('watch', 'cricket'), 1))
chk('P2 (b): 1/3', close(P('we', 'play') * P('play', 'cricket') * P('cricket', '.'), 1 / 3))
chk('P2 (c): 0.25, 0.125, 0.375 (V = 6)', len(VOC) == 6 and close(P('play', 'cricket', 1), .25) and close(P('play', 'watch', 1), .125) and close(P('cricket', '.', 1), .375))
chk('P2 (d): 1/3 · 0.25 · 0.375 = 0.03125', close(P('we', 'play', 1) * P('play', 'cricket', 1) * P('cricket', '.', 1), .03125))

print('— §3 · perplexity —')
pp = lambda ps: 2 ** np.mean([L2(1 / p) for p in ps])
chk('surprises 1, 2, 1, 3; average 1.75; perplexity 3.364', [L2(1 / p) for p in (.5, .25, .5, .125)] == [1, 2, 1, 3] and r(pp([.5, .25, .5, .125]), 3) == 3.364)
chk('same in nats (drawer) and as (1/128)^(-1/4)', close(math.exp(np.mean([math.log(1 / p) for p in (.5, .25, .5, .125)])), pp([.5, .25, .5, .125])) and close(128 ** .25, pp([.5, .25, .5, .125])))
chk('c5: all 0.5 → 2 · c6: uniform over 10 000 → 10 000 (log₂ 10 000 ≈ 13.29)', close(pp([.5] * 4), 2) and close(pp([1e-4] * 3), 1e4) and r(L2(1e4), 2) == 13.29)
chk('w-perplexity presets: 1/6 each → 6; perfect → 1; one bad miss (0.01) → %.3f' % pp([.5, .25, .5, .01]), close(pp([1 / 6] * 4), 6) and close(pp([1] * 4), 1) and pp([.5, .25, .5, .01]) > 5)
chk('P3: 1.4 bits, 2^1.4 ≈ 2.639, 0.9704 nats', close(np.mean([L2(1 / p) for p in (.25, .5, .125, .5, 1)]), 1.4) and r(pp([.25, .5, .125, .5, 1]), 3) == 2.639 and r(1.4 * math.log(2), 4) == .9704)
chk('P4: 8, 5, p = 0.125', close(pp([1 / 8] * 5), 8) and close(pp([.2] * 7), 5) and close((1 / 64) / (.5 * .25), .125) and close(pp([.5, .25, .125]), 4))

print('— §4 · co-occurrence —')
CO_T, CO_C, CO_S = jsarr('CO_TARGETS'), jsarr('CO_CTX'), jsarr('CO_SENT')
def co(win):
    M = np.zeros((4, 4), int)
    for s in CO_S:
        w = s.split()
        for i, a in enumerate(w):
            if a in CO_T:
                for j in range(max(0, i - win), min(len(w), i + win + 1)):
                    if j != i and w[j] in CO_C: M[CO_T.index(a), CO_C.index(w[j])] += 1
    return M
CO4 = np.array([[5, 4, 0, 1], [4, 5, 0, 0], [0, 0, 5, 4], [0, 1, 4, 5]], float)
chk('the corpus with window 2 gives exactly the 4 × 4 table', (co(2) == CO4).all())
chk('window 1: chai loses "drink" and chai·cricket drops to 0', co(1)[0, 0] == 0 and co(1)[0] @ co(1)[2] == 0)
chk('window 3: "chai before every match" adds one match', co(3)[0, 3] == 2 and (co(3)[1:] == CO4[1:]).all())
chk('chai·coffee = 40, |chai|² = 42, |coffee|² = 41', CO4[0] @ CO4[1] == 40 and CO4[0] @ CO4[0] == 42 and CO4[1] @ CO4[1] == 41)
chk('cos(chai, coffee) ≈ 0.964, cos(chai, cricket) ≈ 0.096, cos(cricket, football) ≈ 0.964', r(cos(CO4[0], CO4[1]), 3) == .964 and r(cos(CO4[0], CO4[2]), 3) == .096 and r(cos(CO4[2], CO4[3]), 3) == .964)
chk('c7: cos(coffee, football) = 5/√1722 ≈ 0.120', CO4[1] @ CO4[3] == 5 and r(cos(CO4[1], CO4[3]), 3) == .12)
chk('c8 / drawer: doubling chai keeps 0.964 (80/(√168·√41))', close(cos(2 * CO4[0], CO4[1]), cos(CO4[0], CO4[1])) and close(80 / math.sqrt(168 * 41), cos(CO4[0], CO4[1])))
chk('w-cooc angle chai–coffee ≈ 15.4°', r(math.degrees(math.acos(cos(CO4[0], CO4[1]))), 1) == 15.4)

print('— §5 · SVD and PPMI —')
U, s, Vt = np.linalg.svd(CO4)
chk('σ ≈ (9.528, 8.528, 1.143, 1.087)', list(np.round(s, 3)) == [9.528, 8.528, 1.143, 1.087])
chk('energy 166 = Σσ²; top two ≈ 163.5 → 98.5%', CO4.sum() * 0 + (CO4 ** 2).sum() == 166 and close((s ** 2).sum(), 166) and r((s[:2] ** 2).sum(), 1) == 163.5 and r(100 * (s[:2] ** 2).sum() / 166, 1) == 98.5)
C2 = (U[:, :2] * s[:2]) @ Vt[:2]
chk('rank-2 error ≈ 1.578 = √(σ₃² + σ₄²); 1 − 2.49/166 ≈ 98.5%', r(np.linalg.norm(CO4 - C2), 3) == 1.578 and close(np.linalg.norm(CO4 - C2), math.sqrt(s[2] ** 2 + s[3] ** 2)) and r((s[2] ** 2 + s[3] ** 2), 2) == 2.49)
X2 = U[:, :2] * s[:2]; X2 = X2 * np.sign(X2[np.argmax(np.abs(X2), axis=0), range(2)])   # the page's sign choice: biggest coordinate positive
want = [[5.009, -4.032], [4.530, -4.452], [4.450, 4.540], [5.037, 4.004]]
chk('2-D coordinates (page signs): ' + ', '.join('(%.3f, %.3f)' % tuple(x) for x in X2), np.allclose(np.round(X2, 3), want) or np.allclose(np.round(-X2, 3), want))
chk('2-D cos(chai, coffee) ≈ 0.995, cos(chai, cricket) ≈ 0.097', r(cos(X2[0], X2[1]), 3) == .995 and r(cos(X2[0], X2[2]), 3) == .097)
chk('PMI(chai, drink): 5·166/(42·9) ≈ 2.196 → 1.135 bits', r(5 * 166 / (42 * 9), 3) == 2.196 and r(L2(5 * 166 / (42 * 9)), 3) == 1.135)
chk('c9: 9/14 ≈ 64.3% · c10: √(0.16 + 0.09) = 0.5', r(100 * 9 / 14, 1) == 64.3 and close(math.sqrt(.4 ** 2 + .3 ** 2), .5))
SVM = np.array(jsarr('SV_M'), float); SVW = jsarr('SV_W')
def ppmi(M):
    Pm = M / M.sum(); pw = Pm.sum(1, keepdims=True); pc = Pm.sum(0, keepdims=True)
    with np.errstate(divide='ignore'): X = np.log2(Pm / (pw * pc))
    X[~np.isfinite(X)] = 0; return np.maximum(X, 0)
def kcos(M, a, b, k):
    U_, s_, _ = np.linalg.svd(M); Y = U_[:, :k] * s_[:k]; return cos(Y[SVW.index(a)], Y[SVW.index(b)])
chk('w-svd-words raw, k = 3: cos(chai, cricket) ≈ 0.525 (Try line)', r(kcos(SVM, 'chai', 'cricket', 3), 3) == .525)
chk('w-svd-words PPMI, k = 3: cos(chai, cricket) ≈ 0 (%.4f)' % kcos(ppmi(SVM), 'chai', 'cricket', 3), abs(kcos(ppmi(SVM), 'chai', 'cricket', 3)) < .01)
chk('raw first direction: every word on the same side (68.1% of the energy)', r(100 * np.linalg.svd(SVM)[1][0] ** 2 / (np.linalg.svd(SVM)[1] ** 2).sum(), 1) == 68.1 and (np.sign(np.linalg.svd(SVM)[0][:, 0]) == np.sign(np.linalg.svd(SVM)[0][0, 0])).all())
A = np.array([[3, 1], [1, 3.]]); sA = np.linalg.svd(A)[1]
chk('P6: σ(A) = (4, 2), 16 + 4 = 20; energies 63.2%, 91.2%; k = 2; √5 ≈ 2.236', np.allclose(sA, [4, 2]) and (A ** 2).sum() == 20 and r(100 * 36 / 57, 1) == 63.2 and r(100 * 52 / 57, 1) == 91.2 and r(math.sqrt(5), 3) == 2.236)
u1 = np.array([1, 1]) / math.sqrt(2); A1 = 4 * np.outer(u1, u1)
chk('P7: A₁ = [[2,2],[2,2]], A − A₁ size 2 = σ₂, U₁Σ₁ ≈ 2.828', np.allclose(A1, 2) and close(np.linalg.norm(A - A1), 2) and r(4 / math.sqrt(2), 3) == 2.828)

print('— §6 · skip-gram —')
v, up, un = np.array([1, 0.]), np.array([.5, .5]), np.array([-.5, 1.])
Lsg = lambda v, up, un: -math.log(sig(up @ v)) - math.log(sig(-(un @ v)))
chk('σ(0.5) ≈ 0.622; loss ≈ 0.948; 1 − 0.622 ≈ 0.378', r(sig(.5), 3) == .622 and r(Lsg(v, up, un), 3) == .948 and r(1 - sig(.5), 3) == .378)
gp, gn = 1 - sig(up @ v), sig(un @ v)
v2, up2, un2 = v + (gp * up - gn * un), up + gp * v, un - gn * v
chk('u_hot → (0.878, 0.5), u_football → (−0.878, 1), v → (1.378, −0.189)', np.allclose(np.round(up2, 3), [.878, .5]) and np.allclose(np.round(un2, 3), [-.878, 1]) and np.allclose(np.round(v2, 3), [1.378, -.189]))
chk('after one step: σ(1.114) ≈ 0.753, σ(1.398) ≈ 0.802, loss ≈ 0.505', r(up2 @ v2, 3) == 1.114 and r(sig(up2 @ v2), 3) == .753 and r(-(un2 @ v2), 3) == 1.398 and r(sig(-(un2 @ v2)), 3) == .802 and r(Lsg(v2, up2, un2), 3) == .505)
chk('c11: σ(0) = 0.5 · c12: football score −0.5 → −1.398', sig(0) == .5 and r(un2 @ v2, 3) == -1.398)
v, up, n1, n2 = np.array([1, 1.]), np.array([1, 0.]), np.array([0, -1.]), np.array([-1, -1.])
chk('P8: scores 1, −1, −2; 0.7311, 0.7311, 0.8808; loss ≈ 0.7535', [up @ v, n1 @ v, n2 @ v] == [1, -1, -2] and r(sig(1), 4) == .7311 and r(sig(2), 4) == .8808 and r(-2 * math.log(sig(1)) - math.log(sig(2)), 4) == .7535 and r(-math.log(sig(1)), 4) == .3133 and r(-math.log(sig(2)), 4) == .1269)
v, up, un, eta = np.array([0, 1.]), np.array([1, 1.]), np.array([1, -1.]), .5
gp, gn = 1 - sig(up @ v), sig(un @ v)
up2, un2, v2 = up + eta * gp * v, un - eta * gn * v, v + eta * (gp * up - gn * un)
chk('P9: g± ≈ 0.2689; u₊ = (1, 1.1345), u₋ = (1, −1.1345), v = (0, 1.2689)', r(gp, 4) == .2689 and r(gn, 4) == .2689 and np.allclose(np.round(up2, 4), [1, 1.1345]) and np.allclose(np.round(un2, 4), [1, -1.1345]) and np.allclose(np.round(v2, 4), [0, 1.2689]) and r(eta * (gp * 2), 4) == .2689 and r(2 * gp, 4) == .5379)
chk('P9: scores ±1.4396; loss 0.6265 → 0.4254', r(up2 @ v2, 4) == 1.4396 and r(un2 @ v2, 4) == -1.4396 and r(-2 * math.log(sig(1)), 4) == .6265 and r(-2 * math.log(sig(up2 @ v2)), 4) == .4254)

print('— §7 · the cost of a softmax —')
chk('50 000 / 6 ≈ 8 333; 100 000 / 11 ≈ 9 091 (c13)', round(50000 / 6) == 8333 and round(100000 / 11) == 9091)
chk('100^0.75 ≈ 31.6; shares 99%/1% → 97%/3%', r(100 ** .75, 1) == 31.6 and round(100 * 100 / 101) == 99 and round(100 * 31.62 / 32.62) == 97)
chk('P10: 9 000 000, 1 800, 5 000, 9e15 and 1.8e12', 30000 * 300 == 9_000_000 and 6 * 300 == 1800 and 9_000_000 / 1800 == 5000 and 9e6 * 1e9 == 9e15 and 1800 * 1e9 == 1.8e12)

print('— §8 · lookup and the tiny neural language model —')
E = np.array([[1, 2], [3, 4], [5, 6]])
chk('(0,1,0)·E = (3, 4)', (np.array([0, 1, 0]) @ E == [3, 4]).all())
Ec = np.array([[1, 0, 2], [0, 1, 1], [3, 1, 0], [2, 2, 2]])
chk('c14: (0,0,1,0)·E = (3, 1, 0); distractors: column 3 = (2,1,0,2), column sums (6,4,5)', (np.array([0, 0, 1, 0]) @ Ec == [3, 1, 0]).all() and list(Ec[:, 2]) == [2, 1, 0, 2] and list(Ec.sum(0)) == [6, 4, 5])
NV = jsarr('NLM_V'); Wn = {k: np.array(v) for k, v in NLM.items()}
nparam = sum(a.size for a in Wn.values())
chk('the tiny model has 150 numbers: 20 + (32 + 8) + (80 + 10)', nparam == 150 and Wn['E'].shape == (10, 2) and Wn['W'].shape == (8, 4) and Wn['U'].shape == (10, 8))
def nlm(a, b):
    x = np.concatenate([Wn['E'][NV.index(a)], Wn['E'][NV.index(b)]]); h = np.tanh(Wn['W'] @ x + Wn['b']); z = Wn['U'] @ h + Wn['c']; q = np.exp(z - z.max()); return q / q.sum()
q1, q2, q3 = nlm('I', 'play'), nlm('we', 'play'), nlm('drink', 'hot')
chk('"I play": football ≈ 0.256 (never seen), cricket first (%.3f)' % q1[NV.index('cricket')], r(q1[NV.index('football')], 3) == .256 and q1.argmax() == NV.index('cricket'))
chk('"we play": football ≈ 0.258', r(q2[NV.index('football')], 3) == .258)
chk('"drink hot": chai and coffee share the top (%.3f, %.3f)' % (q3[NV.index('chai')], q3[NV.index('coffee')]), set(np.argsort(-q3)[:2]) == {NV.index('chai'), NV.index('coffee')} and abs(q3[NV.index('chai')] - q3[NV.index('coffee')]) < .02)
chk('"I" and "we" learned almost the same row (cos %.3f)' % cos(Wn['E'][0], Wn['E'][1]), cos(Wn['E'][0], Wn['E'][1]) > .99)
chk('P12: e₃E = (1,1); x = (0,3,4,0); new rows (−0.1, 3.2), (3.7, −0.5)', True if (np.array([0, 0, 1, 0]) @ np.array([[2, 1], [0, 3], [1, 1], [4, 0]]) == [1, 1]).all() and np.allclose(np.array([0, 3]) - [.1, -.2], [-.1, 3.2]) and np.allclose(np.array([4, 0]) - [.3, .5], [3.7, -.5]) else False)
chk('P13: 1 000 000 + 150 500 + 5 010 000 = 6 160 500', 10000 * 100 == 1_000_000 and 500 * 300 + 500 == 150500 and 10000 * 500 + 10000 == 5_010_000 and 1_000_000 + 150_500 + 5_010_000 == 6_160_500)

print('— §9 · analogies —')
K, M, W, Q = map(np.array, ([3, 2], [1, 2], [1, -2], [3, -2]))
chk('king − man + woman = (3, −2) = queen; woman − man = queen − king = (0, −4)', (K - M + W == Q).all() and (W - M == [0, -4]).all() and (Q - K == [0, -4]).all())
chk('cosines of (3,−2): queen 1, woman 0.868, king 0.385, man −0.124', r(cos(Q, Q), 3) == 1 and r(cos(Q, W), 3) == .868 and r(cos(Q, K), 3) == .385 and r(cos(Q, M), 3) == -.124)
FIXp = {'queen': [3, -2], 'prince': [2.2, 3.3], 'princess': [2.4, -3.3], 'boy': [.5, 2.8], 'girl': [.4, -2.9]}
chk('w-para readout: princess 0.938, girl 0.663, prince 0', r(cos(Q, FIXp['princess']), 3) == .938 and r(cos(Q, FIXp['girl']), 3) == .663 and close(cos(Q, FIXp['prince']), 0))
chk('c16: Delhi − India + Japan = (3, 1, 1)', (np.array([1, 1, 3]) - [1, 0, 3] + [3, 0, 1] == [3, 1, 1]).all())
q = np.array([1, 1.2, 3]) - [1, 0, 3] + [3, 0, 1]
chk('P11: q = (3, 1.2, 1); Tokyo 0.9984, Kyoto 0.9640, Japan 0.9349, Delhi 0.6503', np.allclose(q, [3, 1.2, 1]) and r(cos(q, [3, 1, 1]), 4) == .9984 and r(cos(q, [3, 1, 2]), 4) == .964 and r(cos(q, [3, 0, 1]), 4) == .9349 and r(cos(q, [1, 1.2, 3]), 4) == .6503 and r(np.linalg.norm(q), 3) == 3.382)
XV = np.array(EX['v']); XW = EX['w']; IX = {w: i for i, w in enumerate(XW)}
chk('explorer: 60 words × 13 numbers', XV.shape == (60, 13))
def ana(a, b, c, inc=False):
    qq = XV[IX[a]] - XV[IX[b]] + XV[IX[c]]
    sc = sorted(((cos(qq, XV[i]), w) for i, w in enumerate(XW) if inc or w not in (a, b, c)), reverse=True); return sc
for (a, b, c), want in [(('king', 'man', 'woman'), 'queen'), (('prince', 'boy', 'girl'), 'princess'), (('Delhi', 'India', 'Japan'), 'Tokyo'), (('puppy', 'dog', 'cat'), 'kitten'), (('king', 'man', 'boy'), 'prince'), (('Paris', 'France', 'Italy'), 'Rome')]:
    chk(f'explorer: {a} − {b} + {c} ≈ {want} (cos {ana(a, b, c)[0][0]:.3f})', ana(a, b, c)[0][1] == want)
chk('explorer, include inputs: king − man + boy → prince, then king (the input wins second place)', [w for _, w in ana('king', 'man', 'boy', True)[:2]] == ['prince', 'king'])
P3 = XV @ EX_P.T
chk('a projection keeps parallelograms: shadow(A − B + C) = shadow(A) − shadow(B) + shadow(C)', np.allclose((XV[IX['king']] - XV[IX['man']] + XV[IX['woman']]) @ EX_P.T, P3[IX['king']] - P3[IX['man']] + P3[IX['woman']]))

print('— §10 · one vector, two meanings —')
b8 = np.array([.8, .2])
chk('0.8(1,0) + 0.2(0,1): cos 0.970 and 0.243', r(cos(b8, [1, 0]), 3) == .97 and r(cos(b8, [0, 1]), 3) == .243)
chk('c18: (0.5, 0.5) has cos ≈ 0.707 with each meaning', r(cos([.5, .5], [1, 0]), 3) == .707)
grp = []
for i, w in enumerate(XW):
    v = XV[i]; f = [v[0], v[4], v[5], v[6], v[7]]; grp.append('bat' if w == 'bat' else ['people', 'tea', 'cricket', 'animal', 'place'][int(np.argmax(f))])
CM = XV[[i for i, g in enumerate(grp) if g == 'cricket']].mean(0); AM = XV[[i for i, g in enumerate(grp) if g == 'animal']].mean(0)
def bat(s_): return s_ * CM + (1 - s_) * AM
near = lambda s_: [w for _, w in sorted(((cos(bat(s_), XV[i]), w) for i, w in enumerate(XW) if w != 'bat'), reverse=True)[:3]]
chk('w-polysemy: at 100%% bat sits with cricket words (%s), at 0%% with animals (%s)' % (near(1)[0], near(0)[0]), grp[IX[near(1)[0]]] == 'cricket' and grp[IX[near(0)[0]]] == 'animal')
chk('w-polysemy at 50%%: weaker neighbours (best %.2f < 0.8)' % cos(bat(.5), XV[IX[near(.5)[0]]]), cos(bat(.5), XV[IX[near(.5)[0]]]) < .8)

print('— §11 · three rulers —')
a, b, c = np.array([2, 1.]), np.array([4, 2.]), np.array([1, 2.])
chk('dot 10 and 4; distances √5 ≈ 2.236 and √2 ≈ 1.414; cos 1 and 0.8', a @ b == 10 and a @ c == 4 and r(np.linalg.norm(a - b), 3) == 2.236 and r(np.linalg.norm(a - c), 3) == 1.414 and close(cos(a, b), 1) and close(cos(a, c), .8))
chk('office order (20, 10): distance ≈ 20.12', r(np.linalg.norm(a - [20, 10]), 2) == 20.12)
chk('c19: unit vectors at cos 0.5 are 1 apart; √2 at a right angle', close(math.sqrt(2 - 2 * .5), 1) and close(math.sqrt(2), np.linalg.norm(np.array([1, 0]) - [0, 1])))
chk('c20: (3,4), (6,8): dot 50, cos 1, distance 5', np.array([3, 4]) @ [6, 8] == 50 and close(cos([3, 4], [6, 8]), 1) and close(np.linalg.norm(np.array([3, 4]) - [6, 8]), 5))
chk('P5: cos 1 and 0.48; distances 5 and √26 ≈ 5.099', close(cos([3, 4, 0], [6, 8, 0]), 1) and close(cos([3, 4, 0], [0, 3, 4]), .48) and close(np.linalg.norm(np.array([3, 4, 0]) - [6, 8, 0]), 5) and r(math.sqrt(26), 3) == 5.099)

print('— practice 14 · diagnose two models —')
chk('log₂ 210 ≈ 7.714, log₂ 95 ≈ 6.570, difference 1.144 bits, ×1000 ≈ 1144', r(L2(210), 3) == 7.714 and r(L2(95), 3) == 6.57 and r(L2(210 / 95), 3) == 1.144 and round(1000 * L2(210 / 95)) == 1144)
chk('gaps: A log₂(210/45) ≈ 2.222, B log₂(95/80) ≈ 0.248', r(L2(210 / 45), 3) == 2.222 and r(L2(95 / 80), 3) == .248)

print(f'\n✓ {ok} checks — every number of Unit 16 reproduced')
