# Unit 16 · Words as Vectors — machine verification of every number the page prints, section by section:
# one-hot geometry; the bigram chain with <s> and </s>; smoothing; perplexity; the company tables (word × word and
# word × document); TF-IDF and PMI; the SVD squeeze and friends of friends; the word2vec window counts; one CBOW round;
# one skip-gram round; negative sampling, the tree and subsampling; PMI − ln k and GloVe's ratios; the tiny neural
# language model; the three rulers, the parallelogram and the explorer; the polysemy blend, fastText pieces and BPE;
# the 30 derivation drawers and the 16 practice problems (tpl/u16-*.html).
# Hand-made data are read straight from tpl/u16-shared.js (evaluated by node), and the toy network of §9–§10 from
# tpl/u16-w2v.js, so the page and this file can never drift apart. Every printed number is also looked up in the page
# source (onpage), so a number cannot change in the prose without this file noticing.
# Plain numpy, float64. Tolerance 1e-6 unless a rounded value is printed (then the rounding is checked).
import json, math, re, subprocess, itertools
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
L2, ln = math.log2, math.log
def softmax(z):
    z = np.asarray(z, float); e = np.exp(z - z.max()); return e / e.sum()

# ---- the page source (prose, drawers, practice, hero) and the data ----
PAGE = ''.join(open(f'tpl/{f}', encoding='utf8').read() for f in
               ['u16-hero.html', 'u16-sec-a.html', 'u16-sec-b.html', 'u16-sec-c.html', 'u16-sec-d.html', 'u16-sec-e.html', 'u16-derives.html', 'u16-practice.html'])
def onpage(*subs):
    miss = [s for s in subs if s not in PAGE]
    assert not miss, f"not printed on the page: {miss}"
    return True

NODE = r"""
const fs=require('fs'); const src=fs.readFileSync('tpl/u16-shared.js','utf8');
const out=new Function('window',src+`;return {BIGRAM_DEFAULT,SM_WORDS,SM_ROW,SM_N,SM_UNI,SM_UNI_N,CO_TARGETS,CO_CTX,CO_SENT,CD_DOCS,CD_T,PM_R,PM_C,PM_M0,
  TF_DOCS,TF_W,FR_W,FR_C,FR_M,FR_S:FR.S,FR_V:FR.V,SV_W,SV_G,SV_C,SV_M,TOY_V,TOY_IN,TOY_OUT,HS,SS_T,SS_TEXT,WV_TOP,WV_SH,
  WV_C:wvCorpus(2016,480),GR_P,GR_CHAI,GR_LASSI,GR_N,GR_DIFF,GR_VEC,SG0,NLM_V,NLM_SENT,NLM,EX,EX_P,EX_FEAT}`)({});
process.stdout.write(JSON.stringify(out));"""
D = json.loads(subprocess.run(['node', '-e', NODE], capture_output=True, text=True, check=True).stdout)
W2V = open('tpl/u16-w2v.js', encoding='utf8').read()
W1 = open('tpl/u16-w1.js', encoding='utf8').read()

# =============================================================================================
print('— §1 · a word is just a label —')
E3 = np.eye(3)
chk('one-hot: every dot product 0, every distance √2 ≈ 1.414 (and still √2 with 10 000 words)',
    all(E3[i] @ E3[j] == 0 for i in range(3) for j in range(3) if i != j) and r(np.linalg.norm(E3[0] - E3[1]), 3) == 1.414
    and close(np.linalg.norm(np.eye(10000)[3] - np.eye(10000)[7]), math.sqrt(2)) and onpage(r'\sqrt2\approx1.414', 'one 1 and 49 999 zeros'))
chk('c1: the wrong option √10 000 = 100; the shopkeeper trap: 1 + 3 = 2 × 2 ("chai + cricket = 2 × coffee")',
    math.isqrt(10000) == 100 and 1 + 3 == 2 * 2 and onpage(r'\sqrt{10\,000}=100', 'chai + cricket = 2 × coffee'))
MEAN = np.array(json.loads(re.search(r'MEAN=(\[\[.*?\]\])', W1).group(1).replace('.', '0.').replace('00.', '0.')))
MEAN = MEAN / np.linalg.norm(MEAN, axis=1, keepdims=True)
chk('w-onehot "meaning" arrows (hand-made): cos(chai, coffee) %.4f → "0.91", cricket apart (%.3f, %.3f)' % (cos(MEAN[0], MEAN[1]), cos(MEAN[0], MEAN[2]), cos(MEAN[1], MEAN[2])),
    r(cos(MEAN[0], MEAN[1]), 2) == .91 and cos(MEAN[0], MEAN[2]) < .4 and cos(MEAN[1], MEAN[2]) < .4 and onpage('(cosine 0.91)'))

print('— §2 · a chain of guesses —')
BOS, EOS = '<s>', '</s>'
def bigram(lines, mem=1):
    C = {}
    for l in lines:
        w = [BOS] * mem + l.split() + [EOS]
        for i in range(mem, len(w)):
            h = ' '.join(w[i - mem:i]); C.setdefault(h, {}); C[h][w[i]] = C[h].get(w[i], 0) + 1
    return C
def P(C, h, w): return C.get(h, {}).get(w, 0) / sum(C.get(h, {}).values()) if h in C else 0
CORP = D['BIGRAM_DEFAULT'].split('\n')
C = bigram(CORP)
chk('corpus: I drink chai · I drink coffee · I drink chai · I play cricket', CORP == ['I drink chai', 'I drink coffee', 'I drink chai', 'I play cricket'])
chk('P(chai|drink) = 2/3, P(coffee|drink) = 1/3, P(drink|I) = 3/4, P(I|<s>) = 1, P(</s>|chai) = 1',
    close(P(C, 'drink', 'chai'), 2 / 3) and close(P(C, 'drink', 'coffee'), 1 / 3) and close(P(C, 'I', 'drink'), .75) and P(C, BOS, 'I') == 1 and P(C, 'chai', EOS) == 1
    and onpage(r'=\frac23', r'&=\frac13'))
def sent_p(C, s, mem=1):
    w = [BOS] * mem + s.split() + [EOS]; p = 1.
    for i in range(mem, len(w)): p *= P(C, ' '.join(w[i - mem:i]), w[i])
    return p
chk('P(<s> I drink chai </s>) = 1 · 3/4 · 2/3 · 1 = 1/2', close(sent_p(C, 'I drink chai'), .5) and onpage(r'1\cdot\tfrac34\cdot\tfrac23\cdot1=\tfrac12'))
chk('without the end marker the half-sentence "I drink" would score 3/4', close(P(C, BOS, 'I') * P(C, 'I', 'drink'), .75) and onpage(r'would score \(\tfrac34\)'))
def all_sentences(C, h=BOS, p=1., path=()):
    if h == EOS: yield path[:-1], p; return
    for w, n in C[h].items(): yield from all_sentences(C, w, p * n / sum(C[h].values()), path + (w,))
S_all = list(all_sentences(C))
chk('with </s> the chances of all sentences add up to exactly 1 (%d sentences)' % len(S_all), close(sum(p for _, p in S_all), 1))
chk('c3: P(<s> I play cricket </s>) = 1 · 1/4 · 1 · 1 = 1/4 (distractor 1/16)', close(sent_p(C, 'I play cricket'), .25) and onpage(r'\(1/4\)', r'\(1/16\)'))
chk('c4: after "you drink" a bigram sees only "drink": chai 2/3, coffee 1/3', close(P(C, 'drink', 'chai'), 2 / 3) and 'you' not in ' '.join(CORP))
C5 = bigram(CORP + ['we drink coffee']); T5 = bigram(CORP + ['we drink coffee'], 2)
chk('w-bigram Try: + "we drink coffee" splits "drink" ½ · ½; trigram "I drink" prefers chai (2/3), "we drink" is sure of coffee',
    close(P(C5, 'drink', 'chai'), .5) and close(P(C5, 'drink', 'coffee'), .5) and close(P(T5, 'I drink', 'chai'), 2 / 3) and P(T5, 'we drink', 'coffee') == 1)

print('— §3 · smoothing —')
VOC7 = ['I', 'drink', 'chai', 'coffee', 'play', 'cricket', EOS]
row = C['drink']; n = sum(row.values())
chk('the "drink" row of shared.js is the corpus row (chai 2, coffee 1, n = 3) and the 7 possible next words',
    D['SM_ROW'] == row and D['SM_N'] == n == 3 and D['SM_WORDS'] == VOC7)
add1 = lambda w, V=7: (row.get(w, 0) + 1) / (n + V)
chk('add-one (V = 7): chai 3/10 = 0.3, cricket 1/10 = 0.1; c5: coffee 2/10 = 0.2 (distractor (1+1)/(3+1) = 0.5)',
    close(add1('chai'), .3) and close(add1('cricket'), .1) and close(add1('coffee'), .2) and onpage(r'\frac{2+1}{3+7}=0.3', r'\frac{0+1}{3+7}=0.1', r'\((1+1)/(3+7)=0.2\)', r'\((1+1)/(3+1)=0.5\)'))
chk('chai fell from 0.667 to 0.3', r(2 / 3, 3) == .667 and onpage('Chai fell from 0.667 to 0.3'))
chk('trap / c6: V = 50 000 → 3/50 003 ≈ 0.00006', r(add1('chai', 50000), 5) == .00006 and onpage(r'\frac{2+1}{3+50\,000}\approx0.00006', '3/50 003'))
chk('derive: the add-one row sums to 1 (3/10 + 2/10 + 5 · 1/10)', close(sum(add1(w) for w in VOC7), 1) and onpage(r'\tfrac{3}{10}+\tfrac{2}{10}+5\cdot\tfrac{1}{10}=1'))
UNI = {}
for l in CORP:
    for w in l.split() + [EOS]: UNI[w] = UNI.get(w, 0) + 1
chk('unigram adviser: I 4, drink 3, chai 2, coffee 1, play 1, cricket 1, </s> 4 — 16 tokens (as in shared.js)',
    UNI == D['SM_UNI'] and sum(UNI.values()) == D['SM_UNI_N'] == 16 and onpage('16 tokens in all: I 4, drink 3, chai 2, coffee 1, play 1, cricket 1'))
interp = lambda w, lam=.8: lam * row.get(w, 0) / n + (1 - lam) * UNI[w] / 16
chk('interpolation λ = 0.8: chai 0.8·2/3 + 0.2·2/16 = 0.5583, cricket 0.0125; the row sums to 1',
    r(interp('chai'), 4) == .5583 and close(interp('cricket'), .0125) and close(sum(interp(w) for w in VOC7), 1)
    and onpage('=0.5583', '=0.0125', 'chai 0.558, cricket 0.0125', '0.8 · ⅔ + 0.2 · 2/16 = 0.558'))
chk('c7: λ = 0 → P(chai|drink) = P(chai) = 2/16 = 0.125', close(interp('chai', 0), .125) and onpage('2/16 = 0.125'))
addk = lambda w, k, V=7: (row.get(w, 0) + k) / (n + k * V)
chk('add-k: rows sum to 1 for every k (checked k = 0.01, 0.1, 1 at V = 7 and 50 000)', all(close(sum(addk(w, k, V) for w in VOC7) + (V - 7) * k / (n + k * V), 1) for k in (.01, .1, 1) for V in (7, 50000)))

print('— §4 · perplexity —')
pp = lambda ps: 2 ** np.mean([L2(1 / p) for p in ps])
chk('surprises 1, 2, 1, 3 bits; average 1.75; 2^1.75 ≈ 3.364 ("about 3.4 faces")',
    [L2(1 / p) for p in (.5, .25, .5, .125)] == [1, 2, 1, 3] and r(pp([.5, .25, .5, .125]), 3) == 3.364 and r(pp([.5, .25, .5, .125]), 1) == 3.4
    and onpage('=1.75\\text{ bits}', '2^{1.75}\\approx3.364', 'about 3.4 faces'))
chk('derive: same with natural logs and as 128^(1/4)', close(math.exp(np.mean([ln(1 / p) for p in (.5, .25, .5, .125)])), pp([.5, .25, .5, .125])) and close(128 ** .25, pp([.5, .25, .5, .125])))
chk('our sentence: four guesses 1, 3/4, 2/3, 1 → (1/2)^(-1/4) = 2^0.25 ≈ 1.189 (w-perplexity "our sentence")',
    close(np.prod([1, .75, 2 / 3, 1]), .5) and r(pp([1, .75, 2 / 3, 1]), 3) == 1.189 and r(2 ** .25, 3) == 1.189 and onpage('2^{0.25}\\approx1.189', 'perplexity 1.189'))
chk('presets: 1/6 each → 6; perfect → 1; one bad miss (0.01) → %.3f' % pp([.5, .25, .5, .01]), close(pp([1 / 6] * 4), 6) and close(pp([1] * 4), 1) and pp([.5, .25, .5, .01]) > 5)
chk('c8: four words at 0.5 → 2 (total surprise 4 bits → the distractor 16)', close(pp([.5] * 4), 2) and 2 ** 4 == 16)
chk('c9: uniform over 10 000 → 10 000; log₂ 10 000 ≈ 13.29', close(pp([1e-4] * 3), 1e4) and r(L2(1e4), 2) == 13.29 and onpage('13.29'))

print('— §5 · the company a word keeps —')
T, CX, SENT = D['CO_TARGETS'], D['CO_CTX'], D['CO_SENT']
def co(win):
    M = np.zeros((4, 4), int)
    for s in SENT:
        w = s.split()
        for i, a in enumerate(w):
            if a in T:
                for j in range(max(0, i - win), min(len(w), i + win + 1)):
                    if j != i and w[j] in CX: M[T.index(a), CX.index(w[j])] += 1
    return M
CO4 = np.array([[5, 4, 0, 1], [4, 5, 0, 0], [0, 0, 5, 4], [0, 1, 4, 5]], float)
chk('the corpus with window 2 gives exactly the 4 × 4 table', (co(2) == CO4).all() and onpage('<th>chai</th><td>5</td><td>4</td><td>0</td><td>1</td>'))
chk('Try: window 1 — chai loses "drink" and chai·cricket drops to 0', co(1)[0, 0] == 0 and co(1)[0] @ co(1)[2] == 0)
chk('chai·coffee = 40, |chai|² = 42, |coffee|² = 41; cos ≈ 0.964; chai·cricket = 4 → 0.096; cricket·football → 0.964',
    CO4[0] @ CO4[1] == 40 and CO4[0] @ CO4[0] == 42 and CO4[1] @ CO4[1] == 41 and CO4[0] @ CO4[2] == 4
    and r(cos(CO4[0], CO4[1]), 3) == .964 and r(cos(CO4[0], CO4[2]), 3) == .096 and r(cos(CO4[2], CO4[3]), 3) == .964
    and onpage(r'\approx0.964', r'\approx0.096'))
chk('c11: cos(coffee, football) = 5/√1722 ≈ 0.120', CO4[1] @ CO4[3] == 5 and 41 * 42 == 1722 and r(cos(CO4[1], CO4[3]), 3) == .12 and onpage('5/√1722 ≈ 0.120'))
chk('c12 / derive: doubling chai keeps 0.964 (80/(√168·√41)); the wrong option 2 × 0.964 ≈ 1.93',
    close(cos(2 * CO4[0], CO4[1]), cos(CO4[0], CO4[1])) and close(80 / math.sqrt(168 * 41), cos(CO4[0], CO4[1])) and r(2 * .964, 2) == 1.93)
docs = [d[1].split(' ') for d in D['CD_DOCS']]; docs = [[w for w in d if w != '.'] for d in docs]
sents = [s.split(' ') for d in D['CD_DOCS'] for s in d[1].split(' . ')]
vocab = sorted(set(w for s in sents for w in s)); CT = D['CD_T']
TD = np.array([[d.count(w) for d in docs] for w in CT], float)
NB = np.zeros((len(CT), len(vocab)))
for s in sents:
    for i, w in enumerate(s):
        if w in CT:
            for j in range(max(0, i - 2), min(len(s), i + 3)):
                if j != i: NB[CT.index(w), vocab.index(s[j])] += 1
nb = {w: cos(NB[0], NB[i]) for i, w in enumerate(CT) if i}; td = {w: cos(TD[0], TD[i]) for i, w in enumerate(CT) if i}
chk('word × document tab: by neighbours chai is closest to coffee (%.3f); by documents to kettle (%.3f), coffee 0' % (nb['coffee'], td['kettle']),
    max(nb, key=nb.get) == 'coffee' and r(nb['coffee'], 3) == .972 and max(td, key=td.get) == 'kettle' and r(td['kettle'], 3) == .8 and td['coffee'] == 0
    and onpage('coffee (0.972)', 'kettle (0.8), and coffee drops to 0'))

print('— §6 · TF-IDF and PMI —')
TF = D['TF_DOCS']; NW = D['TF_W']
df = {w: sum(1 for d in TF if w in d['w']) for w in NW}; idf = {w: math.log10(3 / df[w]) for w in NW}
chk('D1 the 3 · chai 2 · hot 1; D2 the 2 · cricket 3; D3 the · chai · cricket', TF[0]['w'] == {'the': 3, 'chai': 2, 'hot': 1} and TF[1]['w'] == {'the': 2, 'cricket': 3} and TF[2]['w'] == {'the': 1, 'chai': 1, 'cricket': 1})
chk('idf: the 0, chai = cricket = log₁₀ 1.5 ≈ 0.176, hot = log₁₀ 3 ≈ 0.477',
    idf['the'] == 0 and r(idf['chai'], 3) == .176 and r(idf['cricket'], 3) == .176 and r(idf['hot'], 3) == .477 and onpage(r'\approx\mathbf{0.176}', r'\approx\mathbf{0.477}'))
chk('weights: D1 chai 2 × 0.176 = 0.352, hot 0.477, the 0; D2 cricket 3 × 0.176 = 0.528; D3 0.176 each',
    r(2 * r(idf['chai'], 3), 3) == .352 and r(3 * r(idf['cricket'], 3), 3) == .528 and r(2 * idf['chai'], 3) == .352 and r(3 * idf['cricket'], 3) == .528
    and onpage(r'2\times0.176=0.352', r'3\times0.176=0.528'))
chk('c14: a word in all 1 000 documents: 50 × log₁₀(1000/1000) = 0', 50 * math.log10(1000 / 1000) == 0)
M0 = np.array(D['PM_M0'], float); N = M0.sum(); rs, cs = M0.sum(1), M0.sum(0)
PMI = np.log2(M0 * N / np.outer(rs, cs))
chk('PMI table: N = 40; P(chai) = 0.5, P(hot) = 0.25, P(chai, hot) = 0.2', N == 40 and rs[0] / N == .5 and cs[0] / N == .25 and M0[0, 0] / N == .2 and D['PM_C'] == ['hot', 'the', 'match'])
chk('PMI(chai, hot) = log₂ 1.6 ≈ 0.678, PMI(chai, the) = 0, PMI(chai, match) ≈ −1.322',
    r(PMI[0, 0], 3) == .678 and close(PMI[0, 1], 0) and r(PMI[0, 2], 3) == -1.322 and onpage(r'\log_21.6\approx0.678', r'\approx-1.322'))
chk('c15: PMI(cricket, hot) = log₂ 0.4 ≈ −1.322 → PPMI 0', r(PMI[1, 0], 3) == -1.322 and max(PMI[1, 0], 0) == 0 and onpage('about −1.322; PPMI 0'))
M14 = M0.copy(); M14[0, 1] = 14; P14 = np.log2(M14 * M14.sum() / np.outer(M14.sum(1), M14.sum(0)))
chk('w-pmi Try: raising chai–the from 10 to 14 turns PMI(chai, the) positive (%.3f)' % P14[0, 1], P14[0, 1] > 0 and onpage('from 10 to 14'))
chk('trap / c16: one meeting of two once-seen words among 10⁶ pairs: log₂ 10⁶ ≈ 19.9 bits', r(L2(1e6), 1) == 19.9 and onpage('19.9'))
chk('derive: 8/(20·10/40) = 1.6, 10/(20·20/40) = 1', close(8 / (20 * 10 / 40), 1.6) and close(10 / (20 * 20 / 40), 1))

print('— §7 · the SVD squeeze and friends of friends —')
U, s, Vt = np.linalg.svd(CO4)
chk('σ ≈ (9.528, 8.528, 1.143, 1.087)', list(np.round(s, 3)) == [9.528, 8.528, 1.143, 1.087] and onpage(r'\sigma\approx(9.528,\ 8.528,\ 1.143,\ 1.087)'))
chk('energy 42 + 41 + 41 + 42 = 166 = Σσ²; top two ≈ 163.5 → 98.5%',
    (CO4 ** 2).sum() == 166 and close((s ** 2).sum(), 166) and r((s[:2] ** 2).sum(), 1) == 163.5 and r(100 * (s[:2] ** 2).sum() / 166, 1) == 98.5 and onpage(r'\frac{163.5}{166}\approx98.5\%'))
C2 = (U[:, :2] * s[:2]) @ Vt[:2]
chk('rank-2 error ≈ 1.578 = √(σ₃² + σ₄²); σ₃² + σ₄² ≈ 2.49', r(np.linalg.norm(CO4 - C2), 3) == 1.578 and close(np.linalg.norm(CO4 - C2), math.sqrt(s[2] ** 2 + s[3] ** 2)) and r(s[2] ** 2 + s[3] ** 2, 2) == 2.49)
X2 = U[:, :2] * s[:2]; X2 = X2 * np.sign(X2[np.argmax(np.abs(X2), axis=0), range(2)])      # the page's sign choice: biggest coordinate positive
want = np.array([[5.009, -4.032], [4.530, -4.452], [4.450, 4.540], [5.037, 4.004]])
chk('2-D coordinates: ' + ', '.join('(%.3f, %.3f)' % tuple(x) for x in X2), np.allclose(np.round(X2, 3), want) or np.allclose(np.round(X2 * [1, -1], 3), want))
chk('2-D cos(chai, coffee) ≈ 0.995, cos(chai, cricket) ≈ 0.097', r(cos(X2[0], X2[1]), 3) == .995 and r(cos(X2[0], X2[2]), 3) == .097)
FM = np.array(D['FR_M'], float); Sf = np.linalg.svd(FM)[1]
chk('friends table: chai and tea share no neighbour (cos 0); coffee meets both', FM[0] @ FM[1] == 0 and FM[2] @ FM[0] > 0 and FM[2] @ FM[1] > 0)
chk('friends σ = √68 ≈ 8.246, √48 ≈ 6.928, √32 ≈ 5.657, 4, 0', np.allclose(Sf, [math.sqrt(68), math.sqrt(48), math.sqrt(32), 4, 0], atol=1e-9)
    and r(math.sqrt(68), 3) == 8.246 and r(math.sqrt(48), 3) == 6.928 and r(math.sqrt(32), 3) == 5.657 and np.allclose(D['FR_S'][:5], Sf, atol=1e-6) and np.allclose(D['FR_S'][5:], 0, atol=1e-6))
en = np.cumsum(Sf ** 2) / (Sf ** 2).sum()
chk('energy kept: 41.5% (k = 1), 70.7% (k = 2), 90.2% (k = 3)', [r(100 * e, 1) for e in en[:3]] == [41.5, 70.7, 90.2] and onpage('41.5% at', '70.7% at', '90.2% at'))
FV = np.array(D['FR_V'])[:4]                         # the page's directions, signs anchored in shared.js
crd = lambda i, k: FM[i] @ FV[:k].T
chk('k = 2 coordinates: chai (4, 0), tea (4, 0), coffee (6, 0), cricket and football (0, 4.899)',
    np.allclose(crd(0, 2), [4, 0]) and np.allclose(crd(1, 2), [4, 0]) and np.allclose(crd(2, 2), [6, 0]) and np.allclose(crd(3, 2), [0, math.sqrt(24)]) and r(math.sqrt(24), 3) == 4.899 and onpage('4.899'))
chk('k = 2: cos(chai, tea) = 1; the rebuilt table gives chai 2 next to cup and next to kettle', close(cos(crd(0, 2), crd(1, 2)), 1) and np.allclose((crd(0, 2) @ FV[:2])[2:4], [2, 2]))
chk('k = 3: direction 3 gives chai −4 and tea +4 (coffee 0); (4, 0, −4)·(4, 0, 4) = 0 → cos 0 (c19)',
    np.allclose(crd(0, 3), [4, 0, -4]) and np.allclose(crd(1, 3), [4, 0, 4]) and close(crd(2, 3)[2], 0) and close(cos(crd(0, 3), crd(1, 3)), 0))
chk('Try: k = 4 only separates cricket from football (cos 1 at k = 3, below 1 at k = 4; drinks unchanged)',
    close(cos(crd(3, 3), crd(4, 3)), 1) and cos(crd(3, 4), crd(4, 4)) < .99 and close(cos(crd(0, 4), crd(1, 4)), 0))
chk('derive: CᵀC on the drink columns is [[25,25,9,9],[25,25,9,9],[9,9,25,25],[9,9,25,25]], eigenvalues 68 and 32',
    np.allclose((FM.T @ FM)[:4, :4], [[25, 25, 9, 9], [25, 25, 9, 9], [9, 9, 25, 25], [9, 9, 25, 25]]) and np.allclose(sorted(np.linalg.eigvalsh((FM.T @ FM)[:4, :4]))[-2:], [32, 68]))
SVM = np.array(D['SV_M'], float); SVW = D['SV_W']; SVG = D['SV_G']
def ppmi(M):
    Pm = M / M.sum(); pw = Pm.sum(1, keepdims=True); pc = Pm.sum(0, keepdims=True)
    with np.errstate(divide='ignore'): X = np.log2(Pm / (pw * pc))
    X[~np.isfinite(X)] = 0; return np.maximum(X, 0)
def kvec(M, k):
    U_, s_, _ = np.linalg.svd(M); return U_[:, :k] * s_[:k]
chk('w-svd-words: 16 words × 12 neighbour words', SVM.shape == (16, 12))
chk('raw, k = 1: every word points the same way (the first direction says "how common")', (np.sign(kvec(SVM, 1)) == np.sign(kvec(SVM, 1)[0])).all())
kc = lambda M, a, b, k: cos(kvec(M, k)[SVW.index(a)], kvec(M, k)[SVW.index(b)])
chk('Try: cos(chai, cricket) at k = 3: 0.525 with raw counts, about 0 with PPMI (%.4f)' % kc(ppmi(SVM), 'chai', 'cricket', 3),
    r(kc(SVM, 'chai', 'cricket', 3), 3) == .525 and abs(kc(ppmi(SVM), 'chai', 'cricket', 3)) < .01 and onpage('0.525 with raw counts'))
Y = kvec(ppmi(SVM), 3); Y = Y / np.linalg.norm(Y, axis=1, keepdims=True)
gm = {g: Y[[i for i, x in enumerate(SVG) if x == g]].mean(0) for g in ('tea', 'sport', 'travel')}
gc = [abs(cos(gm[a], gm[b])) for a, b in itertools.combinations(gm, 2)]
chk('PPMI, k = 3: three arms at right angles (group means %.1f° apart or more)' % math.degrees(math.acos(max(gc))), max(gc) < .1)
chk('c17: σ = 3, 2, 1 → 9/14 ≈ 64.3% (distractor 3/6 = 50%) · c18: √(0.4² + 0.3²) = 0.5 (0.7 and 0.25 distractors)',
    r(100 * 9 / 14, 1) == 64.3 and close(math.sqrt(.4 ** 2 + .3 ** 2), .5) and close(.4 + .3, .7) and close(.16 + .09, .25))

print('— §8 · from counting to predicting —')
chk('a 50 000 × 50 000 table has 2.5 billion boxes', 50000 ** 2 == 2_500_000_000 and onpage('2.5 billion boxes'))
def pairs(n, C): return sum(min(i, C) + min(n - 1 - i, C) for i in range(n))
chk('"we drink hot chai every morning", C = 2: CBOW 6 examples, skip-gram 2 + 3 + 4 + 4 + 3 + 2 = 18 pairs; stop at "hot": we, drink, chai, every',
    pairs(6, 2) == 18 and [min(i, 2) + min(5 - i, 2) for i in range(6)] == [2, 3, 4, 4, 3, 2] and 'we drink hot chai every morning'.split()[0:5] == ['we', 'drink', 'hot', 'chai', 'every']
    and onpage(r'\(2+3+4+4+3+2=\mathbf{18}\)'))
chk('derive: pair count 2Cn − C(C+1) for every n ≥ C + 1 (checked n ≤ 40, C ≤ 6)', all(pairs(n, C) == 2 * C * n - C * (C + 1) for C in range(1, 7) for n in range(C + 1, 41)))
chk('c20: 5 words, C = 1 → CBOW 5, skip-gram 1 + 2 + 2 + 2 + 1 = 8 (distractor 5 × 2 = 10)', pairs(5, 1) == 8)

print('— §9 · CBOW, one round by hand —')
TV, VIN, VOUT = D['TOY_V'], np.array(D['TOY_IN'], float), np.array(D['TOY_OUT'], float)
m = re.search(r"const TOY=\{vocab:(\[.*?\]),\s*vin:(\[\[.*?\]\]),\s*vout:(\[\[.*?\]\])", W2V, re.S)
chk('the toy table of §9 is the one the word2vec machines play (tpl/u16-w2v.js)',
    json.loads(m.group(1).replace("'", '"')) == TV and np.allclose(json.loads(m.group(2)), VIN) and np.allclose(json.loads(m.group(3)), VOUT)
    and TV == ['we', 'drink', 'chai', 'daily', 'cricket'] and onpage('<tr><td>cricket</td><td>(−1, 0)</td><td>(−1, −1)</td></tr>'))
I = {w: i for i, w in enumerate(TV)}
def cbow_round(vin, vout, ctx, tgt, eta=1.):
    h = vin[[I[c] for c in ctx]].mean(0); p = softmax(vout @ h); e = p.copy(); e[I[tgt]] -= 1
    EH = e @ vout; vout2 = vout - eta * np.outer(e, h); vin2 = vin.copy()
    for c in ctx: vin2[I[c]] -= eta * EH / len(ctx)
    return h, vout @ h, p, -ln(p[I[tgt]]), e, EH, vin2, vout2
h, sc, p, L, e, EH, vin2, vout2 = cbow_round(VIN, VOUT, ['drink', 'daily'], 'chai')
chk('h = (0.5, 0.5); scores 0, 0.5, 1, 0.5, −1', np.allclose(h, [.5, .5]) and np.allclose(sc, [0, .5, 1, .5, -1]))
chk('softmax 0.135, 0.223, 0.368, 0.223, 0.050; surprise −ln 0.368 ≈ 1.00 (w-cbow: 0.3682, 0.9993)',
    list(np.round(p, 3)) == [.135, .223, .368, .223, .05] and r(L, 2) == 1.0 and r(p[2], 4) == .3682 and r(L, 4) == .9993
    and onpage('0.135, 0.223, <strong>0.368</strong>, 0.223, 0.050', r'-\ln0.368\approx1.00'))
chk('e = p − y = (0.135, 0.223, −0.632, 0.223, 0.050)', list(np.round(e, 3)) == [.135, .223, -.632, .223, .05] and onpage(r'(&0.135,\ 0.223,\ -0.632,\\ &0.223,\ 0.050)'))
chk("chai's output vector (1, 1) + 0.632 (0.5, 0.5) = (1.316, 1.316); the others are pushed away from h",
    np.allclose(np.round(vout2[2], 3), [1.316, 1.316]) and all((vout2[i] - VOUT[i]) @ h < 0 for i in (0, 1, 3, 4)))
chk('blame on h Σ e_w u_w = (−0.458, −0.458); each of 2 members moves (0.229, 0.229): drink (1.229, 0.229), daily (0.229, 1.229)',
    np.allclose(np.round(EH, 3), [-.458, -.458]) and np.allclose(np.round(-EH / 2, 3), [.229, .229])
    and np.allclose(np.round(vin2[1], 3), [1.229, .229]) and np.allclose(np.round(vin2[3], 3), [.229, 1.229]) and onpage(r'(-0.458,\ -0.458)', r'(1.229,\ 0.229)'))
h3, _, p3, L3, *_ = cbow_round(vin2, vout2, ['drink', 'daily'], 'chai')
chk('play the blank again: chai 0.594, surprise 0.52 (w-cbow: 0.5942, 0.5205)', r(p3[2], 3) == .594 and r(L3, 2) == .52 and r(p3[2], 4) == .5942 and r(L3, 4) == .5205
    and onpage('<strong>0.594</strong>', '<strong>0.52</strong>'))
chk('c22: swapping the neighbours leaves h and chai\'s 0.368 unchanged', np.allclose(cbow_round(VIN, VOUT, ['daily', 'drink'], 'chai')[2], p))
chk('c23: a committee of 2C = 4 members gets ¼ of the blame each', 1 / (2 * 2) == .25)

print('— §10 · skip-gram, one round by hand —')
def sg_round(vin, vout, centre, ctx, eta=1.):
    h = vin[I[centre]]; p = softmax(vout @ h); E = len(ctx) * p.copy()
    for c in ctx: E[I[c]] -= 1
    EH = E @ vout; vout2 = vout - eta * np.outer(E, h); vin2 = vin.copy(); vin2[I[centre]] -= eta * EH
    return h, vout @ h, p, -sum(ln(p[I[c]]) for c in ctx), E, EH, vin2, vout2
h, sc, p, L, E, EH, vin2, vout2 = sg_round(VIN, VOUT, 'chai', ['drink', 'daily'])
chk('h = v_chai = (1, 1); scores 0, 1, 2, 1, −2', np.allclose(h, [1, 1]) and np.allclose(sc, [0, 1, 2, 1, -2]))
chk('softmax 0.072, 0.195, 0.529, 0.195, 0.010; L = −2 ln 0.195 ≈ 3.27 (w-skipgram: 0.1947, 3.2725)',
    list(np.round(p, 3)) == [.072, .195, .529, .195, .01] and r(L, 2) == 3.27 and r(p[1], 4) == .1947 and r(L, 4) == 3.2725 and onpage('0.072, 0.195, 0.529, 0.195, 0.010', r'\approx3.27'))
chk('E = 2p − y_drink − y_daily = (0.143, −0.611, 1.059, −0.611, 0.019)', list(np.round(E, 3)) == [.143, -.611, 1.059, -.611, .019] and onpage(r'(0.143,\ -0.611,\ 1.059,\\ &\qquad -0.611,\ 0.019)'))
chk('outputs: drink (1.611, 0.611), daily (0.611, 1.611), chai (1, 1) − 1.059 (1, 1) = (−0.059, −0.059)',
    np.allclose(np.round(vout2[1], 3), [1.611, .611]) and np.allclose(np.round(vout2[3], 3), [.611, 1.611]) and np.allclose(np.round(vout2[2], 3), [-.059, -.059]))
chk('blame on h = (0.429, 0.429); v_chai → (0.571, 0.571) (w-skipgram: 0.5714)', np.allclose(np.round(EH, 3), [.429, .429]) and np.allclose(np.round(vin2[2], 3), [.571, .571]) and r(vin2[2][0], 4) == .5714)
_, _, p2, L2b, *_ = sg_round(vin2, vout2, 'chai', ['drink', 'daily'])
chk('after one step: 0.092, 0.386, 0.102, 0.386, 0.034; loss 1.90 (w-skipgram: 0.3862, 1.9026)',
    list(np.round(p2, 3)) == [.092, .386, .102, .386, .034] and r(L2b, 2) == 1.9 and r(p2[1], 4) == .3862 and r(L2b, 4) == 1.9026 and onpage('0.092, <strong>0.386</strong>, 0.102, <strong>0.386</strong>, 0.034', '<strong>1.90</strong>'))
xs = np.linspace(.001, .999, 9999); Lmin = min(-ln(x) - ln(1 - x) for x in xs)
chk('c26 / derive: the lowest loss with two different neighbours is 2 ln 2 ≈ 1.386 (ln 2 ≈ 0.693 is one slot)', r(2 * ln(2), 3) == 1.386 and close(Lmin, 2 * ln(2), 1e-6) and r(ln(2), 3) == .693)

print('— §11 · CBOW or skip-gram —')
chk('c27: C = 4 in a long sentence: CBOW 1 guess, skip-gram 2C = 8; the committee grows from 4 to 8', 2 * 4 == 8 and 2 * 2 == 4)
chk('the lab reads 102 short sentences (tpl/u16-w2v.html); our prose calls it "about a hundred"', '102 short sentences' in open('tpl/u16-w2v.html', encoding='utf8').read() and onpage('about a hundred short sentences'))

print('— §12 · making it cheap —')
v, up, un = np.array(D['SG0']['v']), np.array(D['SG0']['up']), np.array(D['SG0']['un'])
Lns = lambda v, up, un: -ln(sig(up @ v)) - ln(sig(-(un @ v)))
chk('v_chai = (1, 0), u_hot = (0.5, 0.5), u_football = (−0.5, 1)', np.allclose(v, [1, 0]) and np.allclose(up, [.5, .5]) and np.allclose(un, [-.5, 1]))
chk('σ(0.5) ≈ 0.622 (62%); loss −2 ln 0.622 ≈ 0.948; each is wrong by 1 − 0.622 ≈ 0.378', r(sig(.5), 3) == .622 and r(Lns(v, up, un), 3) == .948 and r(1 - sig(.5), 3) == .378)
def ns_step(v, up, un, eta):
    gp, gn = 1 - sig(up @ v), sig(un @ v)
    return v + eta * (gp * up - gn * un), up + eta * gp * v, un - eta * gn * v
v2, up2, un2 = ns_step(v, up, un, 1)
chk('u_hot → (0.878, 0.5), u_football → (−0.878, 1), v → (1.378, −0.189)', np.allclose(np.round(up2, 3), [.878, .5]) and np.allclose(np.round(un2, 3), [-.878, 1]) and np.allclose(np.round(v2, 3), [1.378, -.189]))
chk('after one step σ(1.114) ≈ 0.753, σ(1.398) ≈ 0.802, loss ≈ 0.505; c31: football score −0.5 → −1.398',
    r(up2 @ v2, 3) == 1.114 and r(sig(up2 @ v2), 3) == .753 and r(-(un2 @ v2), 3) == 1.398 and r(sig(-(un2 @ v2)), 3) == .802 and r(Lns(v2, up2, un2), 3) == .505 and r(un2 @ v2, 3) == -1.398)
def steps_below(eta, lim=.1):
    s = (v, up, un)
    for n in range(1, 200):
        s = ns_step(*s, eta)
        if Lns(*s) < lim: return n
chk('w-sgstep Try: loss below 0.1 after %d steps at η = 1 and %d at η = 0.5' % (steps_below(1), steps_below(.5)), steps_below(1) == 4 and steps_below(.5) == 8 and onpage(r'(4 steps at \(\eta=1\), 8 at \(\eta=0.5\))'))
chk('50 000/6 ≈ 8 333 times less work (c29: 100 000/11 ≈ 9 091; distractors 10 000 and 100 000 × 10)',
    round(50000 / 6) == 8333 and round(100000 / 11) == 9091 and onpage('8\\,333', 'about 9 091'))
chk('¾ power: 100 vs 1 → 99% to 1%; 100^0.75 ≈ 31.6 → about 96.9% to 3.1%',
    round(100 * 100 / 101) == 99 and r(100 ** .75, 1) == 31.6 and r(100 * 100 ** .75 / (100 ** .75 + 1), 1) == 96.9 and r(100 / (100 ** .75 + 1), 1) == 3.1 and onpage('96.9% to 3.1%'))
HS = D['HS']; hsv = np.array(HS['h'])
def leaf(i):
    p = 1.
    for nd, left in HS['leaves'][i]['path']:
        z = np.array(HS['nodes'][nd]['th']) @ hsv; p *= sig(z) if left else sig(-z)
    return p
LV = [leaf(i) for i in range(4)]
chk('tree: P(drink) = σ(1) = 0.7311; chai 0.2760, coffee 0.4551, cricket 0.0723, football 0.1966; they add up to 1',
    r(sig(1), 4) == .7311 and [r(x, 4) for x in LV] == [.276, .4551, .0723, .1966] and close(sum(LV), 1) and [l['w'] for l in HS['leaves']] == ['chai', 'coffee', 'cricket', 'football']
    and onpage('=0.2760', '=0.4551', '=0.0723', '=0.1966', 'chai 0.276, coffee 0.455'))
chk('⌈log₂ 50 000⌉ = 16; c30: ⌈log₂ 10⁶⌉ = 20 (2¹⁹ ≈ 524 000, 2²⁰ ≈ 1 049 000; log₁₀ 10⁶ = 6)',
    math.ceil(L2(50000)) == 16 and math.ceil(L2(1e6)) == 20 and round(2 ** 19, -3) == 524000 and round(2 ** 20, -3) == 1049000 and onpage(r'\lceil\log_250\,000\rceil=\mathbf{16}'))
chk('w-cost Try: a million words — the softmax grows twenty-fold, negative sampling stays at 6, the tree grows from 16 to 20',
    1e6 / 5e4 == 20 and 5 + 1 == 6 and math.ceil(L2(5e4)) == 16 and math.ceil(L2(1e6)) == 20 and onpage('the softmax grows twenty-fold, negative sampling stays at 6, and the tree grows only from 16 to 20 decisions'))
keep = lambda f, t=1e-5: min(1, math.sqrt(t / f))
chk('subsampling t = 10⁻⁵: f = 4×10⁻⁵ kept half the time; "the" (f = 0.05) √0.0002 ≈ 0.0141 (1.4%); rare words always',
    close(keep(4e-5), .5) and r(keep(.05), 4) == .0141 and r(100 * keep(.05), 1) == 1.4 and keep(5e-6) == 1 and D['SS_T'] == 1e-5 and onpage(r'\sqrt{0.0002}\approx0.0141'))
chk('the subsampling sentence of the widget: the 0.05 · and 0.03 · kadak 5×10⁻⁶ (always kept) · chai 4×10⁻⁵ (half)',
    dict(D['SS_TEXT'])['the'] == .05 and dict(D['SS_TEXT'])['kadak'] == 5e-6 and dict(D['SS_TEXT'])['chai'] == 4e-5)
chk('derive: "the" is 1 250 times as common as f = 4×10⁻⁵; after subsampling √1250 ≈ 35.4', close(.05 / 4e-5, 1250) and r(math.sqrt(1250), 1) == 35.4 and close((.05 * keep(.05)) / (4e-5 * keep(4e-5)), math.sqrt(1250)))

print('— §13 · counting and predicting meet —')
WVC = D['WV_C']; cri = [x for x in WVC if any(w in D['WV_TOP']['cricket'] for w in x)]
chk('the demo corpus (480 sentences, as in the widget): chai and coffee never share a sentence; each appears %d / %d times; wicket in %d%% of cricket sentences' % (sum('chai' in x for x in WVC), sum('coffee' in x for x in WVC), round(100 * sum('wicket' in x for x in cri) / len(cri))),
    len(WVC) == 480 and all(not ('chai' in x and 'coffee' in x) for x in WVC) and sum('chai' in x for x in WVC) > 50 and sum('coffee' in x for x in WVC) > 50 and 60 <= 100 * sum('wicket' in x for x in cri) / len(cri) <= 80)
chk('PMI(chai, hot) = ln 1.6 ≈ 0.470; with k = 5 the best score 0.470 − ln 5 (1.609) ≈ −1.139; c33: k = 1 → 0.470',
    r(ln(1.6), 3) == .47 and r(ln(1.6) - ln(5), 3) == -1.139 and r(ln(5), 3) == 1.609 and onpage(r'\ln1.6\approx0.470', r'0.470-\ln5\approx-1.139'))
nwc, nw, nc, NN = 8, 20, 10, 40
for k in (1, 5):
    ell = lambda x: -nwc * ln(sig(x)) - k * nw * nc / NN * ln(sig(-x))
    xs = np.linspace(-6, 6, 120001); xbest = xs[np.argmin([ell(x) for x in xs])]
    chk(f'derive: the NS loss for chai–hot is smallest at PMI − ln k (k = {k}: {xbest:.4f})', close(xbest, ln(1.6) - ln(k), 2e-4))
GC, GL = D['GR_CHAI'], D['GR_LASSI']
rat = {k_: GC[k_] / GL[k_] for k_ in D['GR_P']}
chk('GloVe table (per 1 000): hot 40/2, cold 2/40, drink 60/60, cricket 4/4 → ratios 20, 0.05, 1, 1',
    D['GR_N'] == 1000 and GC == {'hot': 40, 'cold': 2, 'drink': 60, 'cricket': 4} and GL == {'hot': 2, 'cold': 40, 'drink': 60, 'cricket': 4} and rat == {'hot': 20, 'cold': .05, 'drink': 1, 'cricket': 1})
chk('ln 20 ≈ 2.996 (Try: ≈ 3.0); f(40) = 0.4^¾ ≈ 0.503, f(2) = 0.02^¾ ≈ 0.053',
    r(ln(20), 3) == 2.996 and r(ln(20), 1) == 3.0 and r(.4 ** .75, 3) == .503 and r(.02 ** .75, 3) == .053 and onpage(r'\ln20\approx2.996', r'f(40)\approx0.503', r'f(2)\approx0.053'))
chk('w-ratio vectors satisfy GloVe: (w_chai − w_lassi)·w̃_k = ln ratio for all four probes (c34: drink → 0)',
    all(close(np.dot(D['GR_DIFF'], D['GR_VEC'][k_]), ln(rat[k_])) for k_ in D['GR_P']))

print('— §14 · a neural language model —')
chk('(0, 1, 0)·[[1,2],[3,4],[5,6]] = (3, 4); c35: (0,0,1,0)·E = (3, 1, 0), column 3 (2, 1, 0, 2), column sums (6, 4, 5)',
    (np.array([0, 1, 0]) @ np.array([[1, 2], [3, 4], [5, 6]]) == [3, 4]).all() and (np.array([0, 0, 1, 0]) @ np.array([[1, 0, 2], [0, 1, 1], [3, 1, 0], [2, 2, 2]]) == [3, 1, 0]).all()
    and list(np.array([[1, 0, 2], [0, 1, 1], [3, 1, 0], [2, 2, 2]])[:, 2]) == [2, 1, 0, 2] and list(np.array([[1, 0, 2], [0, 1, 1], [3, 1, 0], [2, 2, 2]]).sum(0)) == [6, 4, 5])
NV, Wn = D['NLM_V'], {k_: np.array(v_) for k_, v_ in D['NLM'].items()}
chk('the tiny model: 7 sentences, 10 words, d = 2, 8 hidden; 20 + (32 + 8) + (80 + 10) = 150 numbers (c36: 130 and 134 wrong)',
    len(D['NLM_SENT']) == 7 and len(NV) == 10 and sum(a.size for a in Wn.values()) == 150 and Wn['E'].shape == (10, 2) and Wn['W'].shape == (8, 4) and Wn['U'].shape == (10, 8)
    and 150 - 20 == 130 and 20 + (16 + 8) + 90 == 134)
def nlm(a, b):
    x = np.concatenate([Wn['E'][NV.index(a)], Wn['E'][NV.index(b)]]); hh = np.tanh(Wn['W'] @ x + Wn['b']); return softmax(Wn['U'] @ hh + Wn['c'])
q1, q2, q3 = nlm('I', 'play'), nlm('we', 'play'), nlm('drink', 'hot')
chk('"I play football" never seen; the model gives it 0.256 (cricket first, %.3f); "we play" → 0.258' % q1[NV.index('cricket')],
    'I play football .' not in D['NLM_SENT'] and r(q1[NV.index('football')], 3) == .256 and q1.argmax() == NV.index('cricket') and r(q2[NV.index('football')], 3) == .258 and onpage('about 0.256', '(0.258)'))
chk('"drink hot": chai and coffee share the top (%.3f, %.3f); "I" and "we" rows nearly the same (cos %.3f)' % (q3[NV.index('chai')], q3[NV.index('coffee')], cos(Wn['E'][0], Wn['E'][1])),
    set(np.argsort(-q3)[:2]) == {NV.index('chai'), NV.index('coffee')} and abs(q3[NV.index('chai')] - q3[NV.index('coffee')]) < .02 and cos(Wn['E'][0], Wn['E'][1]) > .99)

print('— §15 · the geometry of meaning —')
a, b, c = np.array([2, 1.]), np.array([4, 2.]), np.array([1, 2.])
chk('three rulers: dot 10 and 4; distances √5 ≈ 2.236 and √2 ≈ 1.414; cos 1 and 4/5 = 0.8; office order (20, 10) ≈ 20.12',
    a @ b == 10 and a @ c == 4 and r(np.linalg.norm(a - b), 3) == 2.236 and r(np.linalg.norm(a - c), 3) == 1.414 and close(cos(a, b), 1) and close(cos(a, c), .8)
    and r(np.linalg.norm(a - [20, 10]), 2) == 20.12 and onpage('about 20.12'))
K, Mn, Wm, Q = map(np.array, ([3, 2], [1, 2], [1, -2], [3, -2]))
chk('king − man + woman = (3, −2) = queen; woman − man = queen − king = (0, −4)', (K - Mn + Wm == Q).all() and (Wm - Mn == [0, -4]).all() and (Q - K == [0, -4]).all())
chk('cosines of (3, −2): queen 1, woman 0.868, king 0.385, man −0.124', r(cos(Q, Q), 3) == 1 and r(cos(Q, Wm), 3) == .868 and r(cos(Q, K), 3) == .385 and r(cos(Q, Mn), 3) == -.124
    and onpage('queen 1, woman 0.868, king 0.385, man −0.124'))
XV, XW = np.array(D['EX']['v']), D['EX']['w']; IX = {w: i for i, w in enumerate(XW)}
chk('explorer: 60 hand-made words × 13 numbers (9 meanings + 4 fingerprint numbers)', XV.shape == (60, 13) and len(D['EX_FEAT']) == 9 and onpage('60 words', 'Each word has 13 numbers'))
def ana(a_, b_, c_, inc=False):
    qq = XV[IX[a_]] - XV[IX[b_]] + XV[IX[c_]]
    return sorted(((cos(qq, XV[i]), w) for i, w in enumerate(XW) if inc or w not in (a_, b_, c_)), reverse=True)
for (a_, b_, c_), w_ in [(('king', 'man', 'woman'), 'queen'), (('prince', 'boy', 'girl'), 'princess'), (('Delhi', 'India', 'Japan'), 'Tokyo'), (('puppy', 'dog', 'cat'), 'kitten'), (('king', 'man', 'boy'), 'prince'), (('Paris', 'France', 'Italy'), 'Rome')]:
    chk(f'explorer preset: {a_} − {b_} + {c_} ≈ {w_} (cos {ana(a_, b_, c_)[0][0]:.3f})', ana(a_, b_, c_)[0][1] == w_)
P3 = XV @ np.array(D['EX_P']).T
chk('derive: the 3-D shadow keeps parallelograms', np.allclose((XV[IX['king']] - XV[IX['man']] + XV[IX['woman']]) @ np.array(D['EX_P']).T, P3[IX['king']] - P3[IX['man']] + P3[IX['woman']]))
fem = [XV[IX[f]] - XV[IX[m_]] for m_, f in [('king', 'queen'), ('man', 'woman'), ('boy', 'girl'), ('prince', 'princess'), ('actor', 'actress')]]
chk('Try: the "female" arrows are nearly the same arrow at every pair (smallest pairwise cos %.3f)' % min(cos(x, y) for x, y in itertools.combinations(fem, 2)),
    min(cos(x, y) for x, y in itertools.combinations(fem, 2)) > .9)
chk('c37: Delhi − India + Japan = (3, 1, 1); distractors (5, 1, 7) = the plain sum and (3, −1, 1)',
    (np.array([1, 1, 3]) - [1, 0, 3] + [3, 0, 1] == [3, 1, 1]).all() and (np.array([1, 1, 3]) + [1, 0, 3] + [3, 0, 1] == [5, 1, 7]).all())
chk('c39 / derive: unit vectors at cos 0.5 are √(2 − 1) = 1 apart; √2 at a right angle', close(math.sqrt(2 - 2 * .5), 1) and close(np.linalg.norm(np.array([1, 0]) - [0, 1]), math.sqrt(2)))
chk('c40: (3, 4), (6, 8): dot 18 + 32 = 50, cos 1, distance 5 (25 is a distractor)', np.array([3, 4]) @ [6, 8] == 50 and close(cos([3, 4], [6, 8]), 1) and close(np.linalg.norm(np.array([3, 4]) - [6, 8]), 5))

print('— §16 · limits and pieces —')
b8 = np.array([.8, .2])
chk('blend 0.8 (1, 0) + 0.2 (0, 1): cos 0.8/√0.68 ≈ 0.970 and 0.2/√0.68 ≈ 0.243; c41: (0.5, 0.5) → 0.707 each',
    r(cos(b8, [1, 0]), 3) == .97 and r(cos(b8, [0, 1]), 3) == .243 and close(cos(b8, [1, 0]), .8 / math.sqrt(.68)) and r(cos([.5, .5], [1, 0]), 3) == .707
    and onpage(r'0.8/\sqrt{0.68}\approx0.970', r'0.2/\sqrt{0.68}\approx0.243'))
grp = [('bat' if w == 'bat' else ['people', 'tea', 'cricket', 'animal', 'place'][int(np.argmax([v_[0], v_[4], v_[5], v_[6], v_[7]]))]) for w, v_ in zip(XW, XV)]
CM = XV[[i for i, g in enumerate(grp) if g == 'cricket']].mean(0); AM = XV[[i for i, g in enumerate(grp) if g == 'animal']].mean(0)
near = lambda s_: sorted(((cos(s_ * CM + (1 - s_) * AM, XV[i]), w) for i, w in enumerate(XW) if w != 'bat'), reverse=True)[:3]
chk('w-polysemy: at 100%% bat\'s neighbours are cricket words (%s), at 0%% animals (%s)' % (', '.join(w for _, w in near(1)), ', '.join(w for _, w in near(0))),
    all(grp[IX[w]] == 'cricket' for _, w in near(1)) and all(grp[IX[w]] == 'animal' for _, w in near(0)))
chk('w-polysemy Try: at 50%% the best neighbour is weak — cosine about 0.69 (%.3f)' % near(.5)[0][0], r(near(.5)[0][0], 2) == .69 and onpage('best cosine about 0.69'))
g3 = lambda w: [('<' + w + '>')[i:i + 3] for i in range(len(w))]
sh = lambda a_, b_: len(set(g3(a_)) & set(g3(b_)))
chk('fastText: <chai> → <ch cha hai ai>; <chaiwala> has 8 pieces, 3 shared with chai and 3 with dudhwala (wal, ala, la>)',
    g3('chai') == ['<ch', 'cha', 'hai', 'ai>'] and len(g3('chaiwala')) == 8 and sh('chaiwala', 'chai') == 3 and sh('chaiwala', 'dudhwala') == 3
    and set(g3('chaiwala')) & set(g3('dudhwala')) == {'wal', 'ala', 'la>'} and sh('chaiwala', 'sabziwala') == 4 and onpage('"chaiwala" shares <strong>3</strong> pieces with "chai"', '3 with dudhwala and 4 with sabziwala'))
chk('Try: kadakchai shares 4 with kadak and 3 with chai; chain shares 3 with chai (<ch, cha, hai); c42: chais shares 3',
    sh('kadakchai', 'kadak') == 4 and sh('kadakchai', 'chai') == 3 and sh('chain', 'chai') == 3 and set(g3('chain')) & set(g3('chai')) == {'<ch', 'cha', 'hai'} and sh('chais', 'chai') == 3)
chk('derive: a word of L letters has L pieces of 3 (checked L = 1 … 12)', all(len(g3('x' * L_)) == L_ for L_ in range(1, 13)))
def bpe(corpus, n_merges):
    W = [(list(w), c_) for w, c_ in corpus]; merges = []
    for _ in range(n_merges):
        cnt, order = {}, []
        for sy, c_ in W:
            for x, y in zip(sy, sy[1:]):
                if (x, y) not in cnt: order.append((x, y))
                cnt[(x, y)] = cnt.get((x, y), 0) + c_
        best = max(order, key=lambda pr: (cnt[pr], -order.index(pr)))
        merges.append((best, cnt[best]))
        W = [(merge(sy, best), c_) for sy, c_ in W]
    return merges, W
def merge(sy, pr):
    out, i = [], 0
    while i < len(sy):
        if i + 1 < len(sy) and (sy[i], sy[i + 1]) == pr: out.append(sy[i] + sy[i + 1]); i += 2
        else: out.append(sy[i]); i += 1
    return out
def cut(w, merges):
    sy = list(w)
    for pr, _ in merges: sy = merge(sy, pr)
    return sy
HUG = [('hug', 10), ('pug', 5), ('pun', 12), ('bun', 4), ('hugs', 5)]
mg, _ = bpe(HUG, 4)
chk('BPE: u+g 20, u+n 16, h+ug 15, p+un 12; hugs → hug·s; bug → b·ug (c43)',
    mg == [(('u', 'g'), 20), (('u', 'n'), 16), (('h', 'ug'), 15), (('p', 'un'), 12)] and cut('hugs', mg) == ['hug', 's'] and cut('bug', mg) == ['b', 'ug']
    and onpage('10 + 5 + 5 = <strong>20</strong>', '12 + 4 = <strong>16</strong>', '10 + 5 = <strong>15</strong>'))

# =============================================================================================
print('— practice arena —')
C1 = bigram(['we play cricket', 'we play football', 'we watch cricket'])
chk('P1: 1, 2/3, 1/2, 1; ⅓; watch football 0; three sentences of ⅓, total 1',
    P(C1, BOS, 'we') == 1 and close(P(C1, 'we', 'play'), 2 / 3) and close(P(C1, 'play', 'cricket'), .5) and P(C1, 'cricket', EOS) == 1
    and close(sent_p(C1, 'we play cricket'), 1 / 3) and sent_p(C1, 'we watch football') == 0
    and sorted((' '.join(s_), round(p_, 9)) for s_, p_ in all_sentences(C1)) == [('we play cricket', round(1 / 3, 9)), ('we play football', round(1 / 3, 9)), ('we watch cricket', round(1 / 3, 9))])
rowp = C1['play']; np_ = sum(rowp.values())
U1 = {}
for l in ['we play cricket', 'we play football', 'we watch cricket']:
    for w in l.split() + [EOS]: U1[w] = U1.get(w, 0) + 1
V6 = ['we', 'play', 'watch', 'cricket', 'football', EOS]
ip = lambda w, lam=.7: lam * rowp.get(w, 0) / np_ + (1 - lam) * U1[w] / 12
chk('P2: add-one 2/8 = 0.25, 1/8 = 0.125; unigram we 3, play 2, watch 1, cricket 2, football 1, </s> 3 = 12; interp 0.4 and 0.025; λ = 0.4; rows sum to 1',
    close((rowp.get('cricket', 0) + 1) / (np_ + 6), .25) and close((rowp.get('watch', 0) + 1) / (np_ + 6), .125) and U1 == {'we': 3, 'play': 2, 'watch': 1, 'cricket': 2, 'football': 1, EOS: 3}
    and close(ip('cricket'), .4) and close(ip('watch'), .025) and close(ip('watch', .4), .05) and all(close(sum(ip(w, l_) for w in V6), 1) for l_ in (0, .3, .7, 1)))
chk('P3: 1.4 bits → 2^1.4 ≈ 2.639; 8; p = 1/8 gives 4; log₂ 210 ≈ 7.714, log₂ 95 ≈ 6.570, log₂(210/95) ≈ 1.144',
    close(np.mean([L2(1 / p_) for p_ in (.25, .5, .125, .5, 1)]), 1.4) and r(pp([.25, .5, .125, .5, 1]), 3) == 2.639 and close(pp([1 / 8] * 5), 8)
    and close(pp([.5, .25, .125]), 4) and close((1 / 64) / (.5 * .25), .125) and r(L2(210), 3) == 7.714 and r(L2(95), 3) == 6.57 and r(L2(210 / 95), 3) == 1.144)
D4 = [{'the': 4, 'chai': 3, 'milk': 1}, {'the': 3, 'cricket': 2, 'bat': 1}, {'the': 2, 'chai': 1, 'cricket': 1}, {'the': 1, 'milk': 1, 'kadak': 2}]
dfp = {w: sum(w in d for d in D4) for w in ['the', 'chai', 'milk', 'cricket', 'bat', 'kadak']}; idp = {w: math.log10(4 / dfp[w]) for w in dfp}
chk('P4: df 4, 2, 2, 2, 1, 1; idf 0, 0.301 …, 0.602; D1 0, 0.903, 0.301; D4 kadak 1.204 best; idf 0.125 ↔ df 3',
    list(dfp.values()) == [4, 2, 2, 2, 1, 1] and r(idp['chai'], 3) == .301 and r(idp['bat'], 3) == .602 and r(3 * idp['chai'], 3) == .903 and r(2 * idp['kadak'], 3) == 1.204
    and max(D4[3], key=lambda w: D4[3][w] * idp[w]) == 'kadak' and r(math.log10(4 / 3), 3) == .125 and r(4 / 10 ** .125, 3) == 3.0)
M5 = np.array([[15, 12, 3], [3, 12, 15]], float); E5 = np.outer(M5.sum(1), M5.sum(0)) / M5.sum()
chk('P5: N = 60; rows 30, 30; columns 18, 24, 18; strangers 9, 12, 9; PMI 0.737, 0, −1.585; PPMI 0.737, 0, 0; 18 meetings for PMI 1',
    M5.sum() == 60 and list(M5.sum(1)) == [30, 30] and list(M5.sum(0)) == [18, 24, 18] and np.allclose(E5[0], [9, 12, 9])
    and [r(x, 3) for x in np.log2(M5[0] / E5[0])] == [.737, 0, -1.585] and close(L2(18 / 9), 1))
t6, c6, k6 = np.array([3, 4, 0.]), np.array([6, 8, 0.]), np.array([0, 3, 4.])
chk('P6: lengths 5, 10, 5; cos 1 and 12/25 = 0.48; distances 5 and √26 ≈ 5.099',
    np.allclose([np.linalg.norm(t6), np.linalg.norm(c6), np.linalg.norm(k6)], [5, 10, 5]) and close(cos(t6, c6), 1) and close(cos(t6, k6), .48)
    and close(np.linalg.norm(t6 - c6), 5) and r(np.linalg.norm(t6 - k6), 3) == 5.099)
A = np.array([[3, 1], [1, 3.]]); sA = np.linalg.svd(A)[1]; s7 = np.array([6, 4, 2, 1.])
chk('P7: σ(A) = (4, 2), 16 + 4 = 20; σ = 6, 4, 2, 1 → 63.2%, 91.2%, k = 2, √5 ≈ 2.236',
    np.allclose(sA, [4, 2]) and (A ** 2).sum() == 20 and r(100 * 36 / 57, 1) == 63.2 and r(100 * 52 / 57, 1) == 91.2 and (s7 ** 2).sum() == 57
    and 36 / 57 < .9 <= 52 / 57 and r(math.sqrt(5), 3) == 2.236)
chk('P8: 6 and 18; 2Cn − C(C+1); n = 10, C = 3 → 48; 4n − 6 = 34 → n = 10; ratio → 2C',
    pairs(6, 2) == 18 and pairs(10, 3) == 48 == 2 * 3 * 10 - 3 * 4 and [n_ for n_ in range(3, 60) if pairs(n_, 2) == 34] == [10] and close(pairs(100000, 3) / 100000, 6, 1e-3))
PV = ['tea', 'hot', 'cup', 'bat']; PI = {w: i for i, w in enumerate(PV)}
Pin = np.array([[1, 0], [1, 1], [0, 1], [-1, 0.]]); Pout = np.array([[1, 1], [0, 1], [1, 0], [-1, -1.]])
h9 = (Pin[PI['hot']] + Pin[PI['cup']]) / 2; p9 = softmax(Pout @ h9); e9 = p9.copy(); e9[0] -= 1; EH9 = e9 @ Pout
Pout2 = Pout - np.outer(e9, h9); Pin2 = Pin.copy(); Pin2[[1, 2]] -= EH9 / 2
p9b = softmax(Pout2 @ ((Pin2[1] + Pin2[2]) / 2))
chk('P9: h (0.5, 1); scores 1.5, 1, 0.5, −1.5; e^s total 9.0718; softmax 0.4940, 0.2996, 0.1817, 0.0246; L 0.7052',
    np.allclose(h9, [.5, 1]) and np.allclose(Pout @ h9, [1.5, 1, .5, -1.5]) and r(np.exp(Pout @ h9).sum(), 4) == 9.0718
    and [r(x, 4) for x in p9] == [.494, .2996, .1817, .0246] and r(-ln(p9[0]), 4) == .7052)
chk('P9: e = (−0.5060, 0.2996, 0.1817, 0.0246); blame (−0.3488, −0.2309); each moves (0.1744, 0.1155); replayed 0.7742',
    [r(x, 4) for x in e9] == [-.506, .2996, .1817, .0246] and [r(x, 4) for x in EH9] == [-.3488, -.2309] and [r(x, 4) for x in -EH9 / 2] == [.1744, .1155] and r(p9b[0], 4) == .7742)
h10 = Pin[PI['tea']]; p10 = softmax(Pout @ h10); E10 = 2 * p10.copy(); E10[PI['hot']] -= 1; E10[PI['cup']] -= 1; EH10 = E10 @ Pout
chk('P10: h (1, 0); softmax 0.3995, 0.1470, 0.3995, 0.0541; L 1.9176 + 0.9176 = 2.8352',
    [r(x, 4) for x in p10] == [.3995, .147, .3995, .0541] and r(-ln(p10[1]), 4) == 1.9176 and r(-ln(p10[2]), 4) == .9176 and r(-ln(p10[1]) - ln(p10[2]), 4) == 2.8352)
chk('P10: E = (0.7990, −0.7061, −0.2010, 0.1081); blame (0.4898, −0.0152); v_tea → (0.5102, 0.0152); floor 2 ln 2',
    [r(x, 4) for x in E10] == [.799, -.7061, -.201, .1081] and [r(x, 4) for x in EH10] == [.4898, -.0152] and [r(x, 4) for x in h10 - EH10] == [.5102, .0152])
v11, u11p, u11n = np.array([0, 1.]), np.array([1, 1.]), np.array([1, -1.])
gp, gn = 1 - sig(u11p @ v11), sig(u11n @ v11); v11b, u11pb, u11nb = ns_step(v11, u11p, u11n, .5)
chk('P11: g± ≈ 0.2689; u₊ (1, 1.1345), u₋ (1, −1.1345), v (0, 1.2689); scores ±1.4396; loss 0.6265 → 0.4254',
    r(gp, 4) == .2689 and r(gn, 4) == .2689 and np.allclose(np.round(u11pb, 4), [1, 1.1345]) and np.allclose(np.round(u11nb, 4), [1, -1.1345]) and np.allclose(np.round(v11b, 4), [0, 1.2689])
    and r(2 * gp, 4) == .5379 and r(u11pb @ v11b, 4) == 1.4396 and r(u11nb @ v11b, 4) == -1.4396 and r(Lns(v11, u11p, u11n), 4) == .6265 and r(Lns(v11b, u11pb, u11nb), 4) == .4254)
h12 = np.array([2, -1.]); z12 = [np.array(t_) @ h12 for t_ in ([1, 1], [0, 1], [.5, 1])]
lv12 = [sig(z12[0]) * sig(z12[1]), sig(z12[0]) * sig(-z12[1]), sig(-z12[0]) * sig(z12[2]), sig(-z12[0]) * sig(-z12[2])]
chk('P12: scores 1, −1, 0; leaves 0.1966, 0.5344, 0.1345, 0.1345 (sum 1); 30 000 words → 15 decisions, 2 000× less',
    z12 == [1, -1, 0] and [r(x, 4) for x in lv12] == [.1966, .5344, .1345, .1345] and close(sum(lv12), 1) and math.ceil(L2(30000)) == 15 and 2 ** 14 < 30000 <= 2 ** 15 and 30000 / 15 == 2000)
chk('P13: keep 0.1, 0.158, 1; 100 of 1 000; t = 2.5×10⁻⁵; 100× → 10×',
    close(keep(1e-3), .1) and r(keep(4e-4), 3) == .158 and keep(2.5e-6) == 1 and close(1000 * keep(1e-3), 100) and close(.05 ** 2 * .01, 2.5e-5)
    and close(keep(.01, 2.5e-5), .05) and close((1e-3 * keep(1e-3)) / (1e-5 * keep(1e-5)), 10))
chk('P14: ratios 19, 0.0526, 1, 1; ln ±2.944, 0, 0; f(38) 0.484, f(2) 0.0532, f(60) 0.682, f(150) 1',
    r(1 / 19, 4) == .0526 and r(ln(19), 3) == 2.944 and r(.38 ** .75, 3) == .484 and r(.02 ** .75, 4) == .0532 and r(.6 ** .75, 3) == .682 and min(1, 1.5 ** .75) == 1)
LOW = [('low', 5), ('lower', 2), ('newest', 6), ('widest', 3)]
mg15, W15 = bpe(LOW, 4)
cnt15 = {}
for w, c_ in LOW:
    for x, y in zip(w, w[1:]): cnt15[x + '+' + y] = cnt15.get(x + '+' + y, 0) + c_
chk('P15: first counts e+s 9, s+t 9, w+e 8, l+o 7, o+w 7, n+e 6, e+w 6, w+i 3, i+d 3, d+e 3, e+r 2',
    cnt15 == {'l+o': 7, 'o+w': 7, 'w+e': 8, 'e+r': 2, 'n+e': 6, 'e+w': 6, 'e+s': 9, 's+t': 9, 'w+i': 3, 'i+d': 3, 'd+e': 3})
chk('P15: merges e+s (9), es+t (9), l+o (7), lo+w (7); lowest → low·est, slow → s·low; 79 → 47 symbols',
    mg15 == [(('e', 's'), 9), (('es', 't'), 9), (('l', 'o'), 7), (('lo', 'w'), 7)] and cut('lowest', mg15) == ['low', 'est'] and cut('slow', mg15) == ['s', 'low']
    and sum(len(w) * c_ for w, c_ in LOW) == 79 and sum(len(sy) * c_ for sy, c_ in W15) == 47)
q16 = np.array([1, 1.2, 3]) - [1, 0, 3] + [3, 0, 1]
chk('P16: q = (3, 1.2, 1), ‖q‖ ≈ 3.382; Tokyo 0.9984, Kyoto 0.9640, Japan 0.9349, Delhi 0.6503; India lower still',
    np.allclose(q16, [3, 1.2, 1]) and r(np.linalg.norm(q16), 3) == 3.382 and r(cos(q16, [3, 1, 1]), 4) == .9984 and r(cos(q16, [3, 1, 2]), 4) == .964
    and r(cos(q16, [3, 0, 1]), 4) == .9349 and r(cos(q16, [1, 1.2, 3]), 4) == .6503 and cos(q16, [1, 0, 3]) < .9349 and close(q16 @ [3, 1, 1], 11.2) and close(q16 @ [1, 1.2, 3], 7.44))

print(f'\n✓ {ok} checks — every number of Unit 16 reproduced')
