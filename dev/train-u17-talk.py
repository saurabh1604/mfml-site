# Unit 17 · w-talk — train the tiny character-level language model shown on the page.
#   python3 train-u17-talk.py            → writes tpl/u17-talk-model.js (the weights the page uses)
# The model is exactly the unit's plain recurrent cell:  h_t = tanh(W h_{t-1} + U x_t + b),  scores_t = V h_t + c,
# x_t a one-hot character. Trained with teacher forcing (the true previous character is fed in), the loss is the sum of
# the surprises −ln p(true next character), backprop through time over 96-character windows, gradients clipped at
# length 5 (§8), W started orthogonal (§8), Adam. Fixed seeds: running this again rebuilds the exact same weights file.
import os
os.environ.setdefault('OMP_NUM_THREADS', '1'); os.environ.setdefault('OPENBLAS_NUM_THREADS', '1'); os.environ.setdefault('MKL_NUM_THREADS', '1')
import json, math, random, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
CHARS = ' .abcdefghijklmnopqrstuvwxyz'
H = 48
STEPS = int(os.environ.get('U17_STEPS', '6000'))
DEC = 4                                   # decimals kept in the embedded weights

# ---------------------------------------------------------------- the corpus: 300 short sentences we wrote
def corpus():
    R = random.Random(17)
    cities = ['delhi', 'mumbai', 'pune', 'chennai', 'jaipur', 'agra', 'patna', 'kochi', 'surat', 'bhopal']
    plats = ['one', 'two', 'three', 'four', 'five', 'six']
    hours = ['six', 'seven', 'eight', 'nine', 'ten']
    mins = ['ten', 'twenty', 'thirty']
    S = set()
    for c in cities:
        S.add(f'the train to {c} is late.')
        S.add(f'the train to {c} is on time.')
        S.add(f'the train to {c} is cancelled today.')
        S.add(f'the bus to {c} is full.')
        S.add(f'my friend lives in {c}.')
        S.add(f'we are going to {c} tomorrow.')
        S.add(f'the express to {c} is late.')
        S.add(f'the train from {c} is on time.')
        S.add(f'tickets to {c} are sold out.')
        S.add(f'my uncle works in {c}.')
        for p in R.sample(plats, 4): S.add(f'the train to {c} will arrive on platform {p}.')
        for p in R.sample(plats, 3): S.add(f'the train to {c} will leave from platform {p}.')
        for p in R.sample(plats, 3): S.add(f'passengers for {c} please go to platform {p}.')
        for m in mins: S.add(f'the train from {c} is late by {m} minutes.')
        for h in R.sample(hours, 3): S.add(f'the next train to {c} leaves at {h}.')
    for h in hours:
        S.add(f'my mother makes chai at {h}.'); S.add(f'the shop opens at {h}.'); S.add(f'the school bus comes at {h}.')
    for s in ['please keep your bags with you.', 'please do not cross the tracks.', 'please stand behind the yellow line.',
              'i drink chai every morning.', 'the chai is hot.', 'the chai is sweet.', 'the chai is ready.', 'we drink chai daily.',
              'we play cricket on sunday.', 'the auto is waiting outside.', 'the market is busy today.', 'the tea stall is open.',
              'the train is late again.', 'the station is very crowded.', 'my train is on time.', 'the rain is heavy today.',
              'the milk is on the table.', 'we eat dinner at nine.', 'the children play cricket.', 'the bus is late today.',
              'the guard waves a green flag.', 'the samosa is very hot.', 'the fan is not working.', 'the platform is very clean.',
              'we wait for the train.', 'the coach is very full.']:
        S.add(s)
    S = sorted(S)
    R.shuffle(S)
    return S[:300]

SENTS = corpus()
assert len(SENTS) == 300, len(SENTS)
assert all(set(s) <= set(CHARS) for s in SENTS)
IX = {ch: i for i, ch in enumerate(CHARS)}
Vn = len(CHARS)

# ---------------------------------------------------------------- the model
def init(rng):
    U = rng.normal(0, 0.3, (H, Vn))
    A = rng.normal(0, 1, (H, H)); Q, _ = np.linalg.qr(A); W = 0.9 * Q          # orthogonal start (every |λ| = 0.9)
    b = np.zeros(H); V = rng.normal(0, 0.1, (Vn, H)); c = np.zeros(Vn)
    return dict(U=U, W=W, b=b, V=V, c=c)

def batch(rng, B, L):
    X = np.zeros((B, L), dtype=np.int64); Y = np.zeros((B, L), dtype=np.int64)
    for k in range(B):
        order = list(range(len(SENTS))); rng.shuffle(order)
        stream = ' '.join(SENTS[i] for i in order[:8])       # 8 random sentences, one after another
        x = ' ' + stream[:L - 1]; y = stream[:L]
        X[k] = [IX[ch] for ch in x]; Y[k] = [IX[ch] for ch in y]
    return X, Y

def loss_grad(P, X, Y):
    B, L = X.shape; U, W, b, V, c = P['U'], P['W'], P['b'], P['V'], P['c']
    hs = [np.zeros((B, H))]; ps = []; loss = 0.0
    for t in range(L):
        h = np.tanh(hs[-1] @ W.T + U[:, X[:, t]].T + b); hs.append(h)
        s = h @ V.T + c; s = s - s.max(1, keepdims=True); e = np.exp(s); p = e / e.sum(1, keepdims=True); ps.append(p)
        loss += -np.log(p[np.arange(B), Y[:, t]]).sum()
    G = {k: np.zeros_like(v) for k, v in P.items()}; dh_next = np.zeros((B, H))
    for t in range(L - 1, -1, -1):
        dy = ps[t].copy(); dy[np.arange(B), Y[:, t]] -= 1                       # prediction − truth (Unit 15)
        G['V'] += dy.T @ hs[t + 1]; G['c'] += dy.sum(0)
        dh = dy @ V + dh_next
        dz = dh * (1 - hs[t + 1] ** 2)                                          # Rule A at the tanh
        G['W'] += dz.T @ hs[t]; G['b'] += dz.sum(0)
        np.add.at(G['U'].T, X[:, t], dz)
        dh_next = dz @ W                                                         # blame to the old note
    n = B * L
    for k in G: G[k] /= n
    return loss / n, G

def train():
    rng = np.random.default_rng(17); pyr = random.Random(5)
    P = init(rng); M = {k: np.zeros_like(v) for k, v in P.items()}; S2 = {k: np.zeros_like(v) for k, v in P.items()}
    b1, b2, eps = 0.9, 0.999, 1e-8
    for it in range(1, STEPS + 1):
        X, Y = batch(pyr, 32, 96)
        loss, G = loss_grad(P, X, Y)
        gn = math.sqrt(sum(float((g * g).sum()) for g in G.values()))
        if gn > 5: G = {k: g * 5 / gn for k, g in G.items()}                   # clip the gradient's length (§8)
        lr = 0.006 * (0.25 ** (it / STEPS))
        for k in P:
            M[k] = b1 * M[k] + (1 - b1) * G[k]; S2[k] = b2 * S2[k] + (1 - b2) * G[k] ** 2
            mh = M[k] / (1 - b1 ** it); sh = S2[k] / (1 - b2 ** it)
            P[k] -= lr * mh / (np.sqrt(sh) + eps)
        if it % 500 == 0 or it == 1:
            print(f'step {it:5d}  loss/char {loss:.4f}  |g| {gn:.3f}', flush=True)
    return {k: np.round(v, DEC) for k, v in P.items()}

# ---------------------------------------------------------------- the same maths as the page (plain loops, same order)
def step(P, h, ch):
    U, W, b = P['U'], P['W'], P['b']; x = IX[ch]; out = []
    for i in range(H):
        z = b[i] + U[i][x]
        for j in range(H): z += W[i][j] * h[j]
        out.append(math.tanh(z))
    return out

def scores(P, h):
    V, c = P['V'], P['c']; s = []
    for i in range(Vn):
        z = c[i]
        for j in range(H): z += V[i][j] * h[j]
        s.append(z)
    return s

def softmaxT(s, T):
    m = max(s); e = [math.exp((v - m) / T) for v in s]; tot = sum(e); return [v / tot for v in e]

def park(seed):
    # the page's dice (u17-w5.js): mulberry32 started from a hash of the dice number, in 32-bit arithmetic
    M = 0xffffffff; st = [((seed * 0x9E3779B1) + 4) & M]; imul = lambda a, b: (a * b) & M
    def rnd():
        st[0] = (st[0] + 0x6D2B79F5) & M; t = st[0]
        t = imul(t ^ (t >> 15), t | 1)
        t = (t ^ ((t + imul(t ^ (t >> 7), t | 61)) & M)) & M
        return ((t ^ (t >> 14)) & M) / 4294967296
    return rnd

def generate(P, seed_text, mode, T=1.0, dice=1, n=60):
    h = [0.0] * H; text = ' ' + seed_text
    for ch in text: h = step(P, h, ch)
    rnd = park(dice); out = ''
    for _ in range(n):
        p = softmaxT(scores(P, h), T if mode == 'sample' else 1.0)
        if mode == 'greedy':
            k = max(range(Vn), key=lambda i: (p[i], -i))
        else:
            r = rnd(); acc = 0.0; k = Vn - 1
            for i in range(Vn):
                acc += p[i]
                if r < acc: k = i; break
        ch = CHARS[k]; out += ch; h = step(P, h, ch)
    return out

def teacher(P, sentence):
    h = [0.0] * H; prev = ' '; tot = 0.0; rows = []
    for ch in sentence:
        h = step(P, h, prev); p = softmaxT(scores(P, h), 1.0)
        tot += -math.log(p[IX[ch]]); rows.append((ch, CHARS[max(range(Vn), key=lambda i: (p[i], -i))], p[IX[ch]])); prev = ch
    return tot, rows

if __name__ == '__main__':
    P = train()
    Pl = {k: v.tolist() for k, v in P.items()}
    def fmt(M):
        if isinstance(M[0], list): return '[' + ','.join(fmt(r) for r in M) + ']'
        return '[' + ','.join(('%.4f' % v).rstrip('0').rstrip('.').replace('-0', '-0') if v != 0 else '0' for v in M) + ']'
    js = ('/* ================= UNIT 17 · w-talk: the tiny language model (generated by dev/train-u17-talk.py — do not edit) =================\n'
          f'   A plain recurrent cell, h = tanh(W h + U x + b), scores = V h + c, with {H} numbers in the note and {Vn} characters,\n'
          f'   trained on {len(SENTS)} short sentences written for this page. Weights rounded to {DEC} decimals. */\n'
          f'const TALK={{chars:{json.dumps(CHARS)},H:{H},U:{fmt(Pl["U"])},W:{fmt(Pl["W"])},b:{fmt(Pl["b"])},V:{fmt(Pl["V"])},c:{fmt(Pl["c"])},\n'
          f'  corpus:{json.dumps(SENTS)}}};\n')
    OUT = os.environ.get('U17_OUT', os.path.join(HERE, 'tpl/u17-talk-model.js'))
    with open(OUT, 'w') as f: f.write(js)
    print('wrote', OUT, len(js), 'bytes')
    # read the weights back exactly as the page will (parsed from the file) and show what the model says
    Q = {k: [[float(x) for x in r] if isinstance(r, list) else float(r) for r in Pl[k]] for k in Pl}
    print('greedy  :', repr(generate(Q, 'the train to', 'greedy', n=80)))
    for T in (0.2, 0.5, 1.0, 2.0):
        for d in (1, 2, 3):
            print(f'T={T} d={d}:', repr(generate(Q, 'the train to ', 'sample', T, d, n=60)))
    tot, rows = teacher(Q, 'the train to pune is late.')
    print('teacher loss', round(tot, 4), 'per char', round(tot / 26, 4))
