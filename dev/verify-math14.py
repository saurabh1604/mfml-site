# Unit 14 · Thinking in Probabilities — machine verification of every number the
# page prints: the sections, the checks, the widgets' fixed readouts, the derivation
# drawers, the hero and the fourteen practice problems (tpl/u14-*.html, tpl/u14-*.js).
# numpy / scipy, tolerance 1e-6 for exact quantities; printed roundings are checked
# against the exact value (a printed 0.665 must be the exact value rounded to 3 places).
import math
from itertools import combinations
import numpy as np
from scipy import stats, integrate, optimize
from scipy.special import comb

ok = 0
def chk(name, cond):
    global ok
    assert cond, f"FAIL: {name}"
    ok += 1
    print(f"  ok    {name}")

TOL = 1e-6
close = lambda a, b, t=TOL: abs(a - b) < t
vclose = lambda a, b, t=TOL: np.allclose(np.asarray(a, float), np.asarray(b, float), atol=t)
def rnd(v, d, printed):
    """the exact value v, rounded to d places, is what the page prints"""
    return abs(round(v, d) - printed) < 10 ** (-d) / 2 + 1e-12
def softmax(z, T=1.0):
    z = np.asarray(z, float) / T; e = np.exp(z - z.max()); return e / e.sum()
H2 = lambda p: -sum(a * math.log2(a) for a in p if a > 0)
CE2 = lambda p, q: -sum(a * math.log2(b) for a, b in zip(p, q) if a > 0)
KL2 = lambda p, q: sum(a * math.log2(a / b) for a, b in zip(p, q) if a > 0)
sig = lambda t: 1 / (1 + math.exp(-t))

print("— §1 · the Galton board —")
chk("12 rows: one route to slot 0, C(12,6) = 924 routes to slot 6, 2^12 = 4096 routes", comb(12, 0) == 1 and comb(12, 6) == 924 and 2 ** 12 == 4096)
chk("about 23% land in the middle: 924/4096 = 0.2256 (the widget prints 22.6%)", rnd(924 / 4096 * 100, 1, 22.6) and 0.22 < 924 / 4096 < 0.24)
chk("centre n·p = 6 and spread √(np(1−p)) = √3 ≈ 1.73 for 12 rows at bias 0.5", 12 * .5 == 6 and rnd(math.sqrt(3), 2, 1.73))
chk("c1: a calibrated 70% forecaster is right on about 70 of 100 days", 0.7 * 100 == 70)

print("— §2 · distributions —")
two = np.zeros(13)
for a in range(1, 7):
    for b in range(1, 7): two[a + b] += 1
chk("two dice: ways 1,2,3,4,5,6,5,4,3,2,1 for totals 2..12 (36 pairs)", list(two[2:]) == [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1] and two.sum() == 36)
p2 = two / 36; x = np.arange(13)
E2 = (x * p2).sum(); V2 = ((x - E2) ** 2 * p2).sum()
chk("E[two dice] = 7, Var = 35/6 ≈ 5.833, σ ≈ 2.415 (printed 2.42)", close(E2, 7) and close(V2, 35 / 6) and rnd(35 / 6, 3, 5.833) and rnd(math.sqrt(35 / 6), 3, 2.415) and rnd(math.sqrt(35 / 6), 2, 2.42))
f = np.arange(1, 7)
E1 = f.mean(); V1 = ((f - E1) ** 2).mean()
chk("one die: E = 3.5, Var = 35/12 ≈ 2.917, squared distances add to 17.5", close(E1, 3.5) and close(V1, 35 / 12) and rnd(35 / 12, 3, 2.917) and close(((f - 3.5) ** 2).sum(), 17.5))
chk("drawer: E[X²] = 91/6 and 91/6 − 49/4 = 35/12", close((f ** 2).mean(), 91 / 6) and close(91 / 6 - 49 / 4, 35 / 12))
chk("drawer: Σ(x−7)² p(x) = 2(25·1+16·2+9·3+4·4+1·5)/36 = 210/36 = 35/6", close(((x - 7) ** 2 * p2).sum(), 210 / 36) and 2 * (25 + 32 + 27 + 16 + 5) == 210)
three = np.zeros(19)
for a in range(1, 7):
    for b in range(1, 7):
        for c in range(1, 7): three[a + b + c] += 1 / 216
x3 = np.arange(19)
chk("three dice: E = 10.5, Var = 35/4 = 3·35/12 (the widget's '35·k/12')", close((x3 * three).sum(), 10.5) and close(((x3 - 10.5) ** 2 * three).sum(), 35 / 4))
chk("c2: ₹7 on average, variance 35/6 ≈ 5.83 (and not 35/12 ≈ 2.92)", close(E2, 7) and rnd(35 / 6, 2, 5.83) and rnd(35 / 12, 2, 2.92))
chk("density: N(5, 0.1²) peaks at 1/(0.1√2π) ≈ 3.989 (c3: ≈ 3.99)", rnd(stats.norm.pdf(5, 5, .1), 3, 3.989) and rnd(stats.norm.pdf(0, 0, .1), 2, 3.99))
chk("density σ = 1: peak 0.399, P(4 ≤ X ≤ 6) = 0.683", rnd(stats.norm.pdf(0), 3, .399) and rnd(stats.norm.cdf(1) - stats.norm.cdf(-1), 3, .683))
chk("density σ = 0.1: P(4 ≤ X ≤ 6) prints 1.000; the total area is 1", rnd(stats.norm.cdf(10) - stats.norm.cdf(-10), 3, 1.000) and close(integrate.quad(lambda t: stats.norm.pdf(t, 5, .1), -50, 60, points=[5])[0], 1))
chk("trap: height 3.99 over a window 0.01 wide ≈ 0.04 chance", rnd(3.99 * .01, 2, .04) and rnd(stats.norm.cdf(.005, 0, .1) - stats.norm.cdf(-.005, 0, .1), 2, .04))

print("— §3 · Bayes —")
sick, healthy = 100, 9900
chk("10 000 people: 100 sick → 99 flagged; 9 900 healthy → 495 flagged; 594 positives", sick * .99 == 99 and close(healthy * .05, 495) and 99 + 495 == 594)
post = .99 * .01 / (.99 * .01 + .05 * .99)
chk("P(sick | +) = 0.0099/(0.0099 + 0.0495) = 99/594 = 1/6 ≈ 0.167", close(post, 1 / 6) and close(99 / 594, 1 / 6) and close(.99 * .01, .0099) and close(.05 * .99, .0495) and rnd(post, 3, .167))
post2 = .99 * post / (.99 * post + .05 * (1 - post))
chk("a second positive: ≈ 0.798 (c5: about 0.80)", rnd(post2, 3, .798) and rnd(post2, 2, .80))
chk("'about 17%' and '1% to about 80%'", round(post * 100) == 17 and round(post2 * 100) == 80)
chk("the healthy crowd is 99 times the sick crowd", healthy / sick == 99)
chk("drawer: likelihood ratio 0.99/0.05 = 19.8; odds 1:99 → 1:5 → 3.96:1 → 3.96/4.96 ≈ 0.798", close(.99 / .05, 19.8) and close(19.8 / 99, 1 / 5) and close(19.8 / 5, 3.96) and rnd(3.96 / 4.96, 3, .798))
# the widget after 'test again': prior 1/6 → 1667 sick, 1650 flagged; 8333 healthy, 417 flagged
s2 = round(1e4 / 6); tp2 = round(s2 * .99); fp2 = round((1e4 - s2) * .05)
chk("widget round 2: 1 667 sick → 1 650 flagged, 8 333 healthy → 417 flagged, 2 067 positives, 0.798", (s2, tp2, int(1e4 - s2), fp2, tp2 + fp2) == (1667, 1650, 8333, 417, 2067) and rnd(post2, 3, .798) and rnd(tp2 / (tp2 + fp2), 3, .798))

print("— §4 · the bell —")
a1, a2, a3 = [stats.norm.cdf(k) - stats.norm.cdf(-k) for k in (1, 2, 3)]
chk("68–95–99.7: 68.3%, 95.4% (95.5 is not printed), 99.7%", rnd(a1 * 100, 1, 68.3) and rnd(a2 * 100, 1, 95.4) and rnd(a3 * 100, 1, 99.7))
chk("heights μ = 160, σ = 8: 172 cm has z = 1.5; 95% band 144–176; density 0.0162", (172 - 160) / 8 == 1.5 and 160 - 16 == 144 and 160 + 16 == 176 and rnd(stats.norm.pdf(172, 160, 8), 4, .0162))
chk("c6: marks N(60,10²), 40..80 is ±2σ → about 95% (95.4%)", (80 - 60) / 10 == 2 and rnd(a2 * 100, 1, 95.4))
pd = np.array([.4, .1, .05, .05, .1, .3]); m = (pd * f).sum(); v = (pd * f * f).sum() - m * m
chk("lopsided die: pmf adds to 1, mean 3.25, σ = √4.7875 ≈ 2.188 (2.19)", close(pd.sum(), 1) and close(m, 3.25) and close(v, 4.7875) and rnd(math.sqrt(v), 3, 2.188) and rnd(math.sqrt(v), 2, 2.19))
chk("c7: σ/√30 = 2.19/5.48 ≈ 0.40; widget n = 10: σ/√10 ≈ 0.692", rnd(math.sqrt(v) / math.sqrt(30), 2, .40) and rnd(math.sqrt(30), 2, 5.48) and rnd(math.sqrt(v / 10), 3, .692))
# the exact distribution of the average converges to the bell (the widget's 'gap to the bell')
def conv(n):
    d = np.array([1.0])
    for _ in range(n): d = np.convolve(d, np.r_[0, pd])
    return d
g10 = conv(10); s10 = np.arange(len(g10)); tv = .5 * np.abs(g10[10:] - stats.norm.pdf(s10[10:] / 10, 3.25, math.sqrt(v / 10)) / 10).sum()
chk("n = 10: the exact average's pmf is within 0.02 (total variation) of the bell — the widget prints 0.019", rnd(tv, 3, .019))

print("— §5 · the 2-D Gaussian —")
S = np.array([[2., 1.], [1., 2.]]); w, V = np.linalg.eigh(S)
chk("Σ = [[2,1],[1,2]]: eigenvalues 1 and 3; axes (1,−1)/√2 and (1,1)/√2", vclose(w, [1, 3]) and vclose(np.abs(V[:, 1]), [1 / math.sqrt(2)] * 2) and close(V[0, 0] * V[1, 0], -.5))
chk("det 3; long axis √3 ≈ 1.73 times the short; peak 1/(2π√3) ≈ 0.0919", close(np.linalg.det(S), 3) and rnd(math.sqrt(3), 2, 1.73) and rnd(1 / (2 * math.pi * math.sqrt(3)), 4, .0919) and close(stats.multivariate_normal([0, 0], S).pdf([0, 0]), 1 / (2 * math.pi * math.sqrt(3))))
Si = np.linalg.inv(S)
chk("Σ⁻¹ = ⅓[[2,−1],[−1,2]]", vclose(Si, np.array([[2, -1], [-1, 2]]) / 3))
d11 = np.array([1, 1]) @ Si @ np.array([1, 1]); d1m = np.array([1, -1]) @ Si @ np.array([1, -1])
chk("(1,1): d² = 2/3, d ≈ 0.816; (1,−1): d² = 2, d ≈ 1.414; both plain distances √2 ≈ 1.414", close(d11, 2 / 3) and rnd(math.sqrt(d11), 3, .816) and close(d1m, 2) and rnd(math.sqrt(d1m), 3, 1.414) and rnd(math.sqrt(2), 3, 1.414))
chk("the widget's σ₁ = σ₂ = √2 (1.41), ρ = 0.5 is exactly Σ = [[2,1],[1,2]]", vclose([[2, .5 * 2], [.5 * 2, 2]], S) and rnd(math.sqrt(2), 2, 1.41))
chk("c9: ρ = 0, σ₁ = 2, σ₂ = 1 → axis-aligned, twice as long along x₁", vclose(np.linalg.eigh(np.diag([4., 1.]))[0], [1, 4]) and math.sqrt(4) / math.sqrt(1) == 2)
S9 = np.array([[1.6 ** 2, .9 * 1.6 * 1.1], [.9 * 1.6 * 1.1, 1.1 ** 2]])
chk("widget 'stretched': Σ = [[2.56, 1.58],[1.58, 1.21]]", vclose(np.round(S9, 2), [[2.56, 1.58], [1.58, 1.21]], 1e-9))
chk("drawer: in eigen-coordinates the density factors; λ₁λ₂ = det", close(np.prod(w), np.linalg.det(S)))

print("— §6 · sampling by stretching —")
Sg = np.array([[4., 2.], [2., 2.]]); L = np.linalg.cholesky(Sg)
chk("Σ = [[4,2],[2,2]] → L = [[2,0],[1,1]] and LLᵀ = Σ", vclose(L, [[2, 0], [1, 1]]) and vclose(L @ L.T, Sg))
chk("c10: Σ = [[9,3],[3,2]] → L = [[3,0],[1,1]]; the wrong options give [[9,3√3],[3√3,5]] and Σ²", vclose(np.linalg.cholesky(np.array([[9., 3], [3, 2]])), [[3, 0], [1, 1]]) and vclose(np.array([[3, 0], [math.sqrt(3), math.sqrt(2)]]) @ np.array([[3, 0], [math.sqrt(3), math.sqrt(2)]]).T, [[9, 3 * math.sqrt(3)], [3 * math.sqrt(3), 5]]))
rng = np.random.default_rng(0); Zs = rng.standard_normal((200000, 2)); Xs = Zs @ L.T
chk("simulation: 200 000 stretched round samples have covariance ≈ LLᵀ", vclose(np.cov(Xs.T), Sg, 0.05))

print("— §7 · likelihood —")
Lc = lambda p, h=7, n=10: p ** h * (1 - p) ** (n - h)
chk("L(0.3) = 0.0000750, L(0.5) = 0.000977, L(0.7) = 0.00222, L(0.9) = 0.000478", rnd(Lc(.3), 7, .0000750) and rnd(Lc(.5), 6, .000977) and rnd(Lc(.7), 5, .00222) and rnd(Lc(.9), 6, .000478))
chk("the fair coin explains 7/10 less than half as well as p = 0.7 (ratio 0.439)", Lc(.5) / Lc(.7) < .5 and rnd(Lc(.5) / Lc(.7), 3, .439))
chk("the peak of p⁷(1−p)³ is at 0.7", close(optimize.minimize_scalar(lambda p: -Lc(p), bounds=(0, 1), method='bounded', options={'xatol': 1e-10}).x, .7, 1e-6))
chk("log L(0.7) = −6.109 nats; widget readout L(p̂) = 2.224e−3, log L(0.5) = −6.931", rnd(math.log(Lc(.7)), 3, -6.109) and rnd(Lc(.7) * 1e3, 3, 2.224) and rnd(math.log(Lc(.5)), 3, -6.931))
chk("1000 tosses, 700 heads: L(0.7) ≈ 10^−265", round(700 * math.log10(.7) + 300 * math.log10(.3)) == -265)
chk("c11: 3 of 12 → p̂ = 0.25", close(optimize.minimize_scalar(lambda p: -(3 * math.log(p) + 9 * math.log(1 - p)), bounds=(1e-6, 1 - 1e-6), method='bounded', options={'xatol': 1e-10}).x, .25, 1e-6))
chk("drawer: curvature at p̂ is −n/(p̂(1−p̂)) (7/10: −47.62)", close(-7 / .49 - 3 / .09, -10 / (.7 * .3)))

print("— §8 · the Gaussian by maximum likelihood —")
X = np.array([2, 4, 4, 4, 5, 5, 7, 9.])
chk("chai data: μ̂ = 40/8 = 5; squared distances 9,1,1,1,0,0,4,16 sum 32", X.sum() == 40 and X.mean() == 5 and list((X - 5) ** 2) == [9, 1, 1, 1, 0, 0, 4, 16] and ((X - 5) ** 2).sum() == 32)
chk("σ̂² = 32/8 = 4, σ̂ = 2; the N − 1 version 32/7 ≈ 4.571", X.var() == 4 and math.sqrt(X.var()) == 2 and rnd(X.var(ddof=1), 3, 4.571))
ell = lambda m, s: stats.norm.logpdf(X, m, s).sum()
r = optimize.minimize(lambda t: -ell(t[0], math.exp(t[1])), [3, 1], method='Nelder-Mead', options={'xatol': 1e-10, 'fatol': 1e-12, 'maxiter': 5000})
chk("the likelihood landscape peaks at (5, 2) with ℓ = −16.897 (hud −16.90)", vclose([r.x[0], math.exp(r.x[1])], [5, 2], 1e-5) and rnd(ell(5, 2), 3, -16.897) and rnd(ell(5, 2), 2, -16.90))
chk("widget presets: too narrow (5,1) ℓ = −23.352, product 7.221e−11; start (3,4) ℓ = −20.442; peak product 4.591e−8", rnd(ell(5, 1), 3, -23.352) and rnd(math.exp(ell(5, 1)) * 1e11, 3, 7.221) and rnd(ell(3, 4), 3, -20.442) and rnd(math.exp(ell(5, 2)) * 1e8, 3, 4.591))
chk("all three bad bells sit below the peak: narrow (5,1), wide (5,4.5), off-centre (3,2)", all(ell(*b) < ell(5, 2) for b in [(5, 1), (5, 4.5), (3, 2)]))
chk("c12: 1,3,4,6,6 → μ̂ = 4, σ̂² = 18/5 = 3.6 (N − 1: 4.5)", np.mean([1, 3, 4, 6, 6]) == 4 and np.var([1, 3, 4, 6, 6]) == 3.6 and np.var([1, 3, 4, 6, 6], ddof=1) == 4.5)

print("— §9 · least squares falls out —")
x9 = np.array([0, 1, 2, 3.]); y9 = np.array([1, 3, 2, 5.])
wls, bls = np.polyfit(x9, y9, 1)
chk("x̄ = 1.5, ȳ = 2.75, Σ(x−x̄)(y−ȳ) = 5.5, Σ(x−x̄)² = 5 → w = 1.1, b = 2.75 − 1.65 = 1.1", x9.mean() == 1.5 and y9.mean() == 2.75 and close(((x9 - 1.5) * (y9 - 2.75)).sum(), 5.5) and close(((x9 - 1.5) ** 2).sum(), 5) and close(wls, 1.1) and close(bls, 1.1) and close(1.1 * 1.5, 1.65))
res = y9 - (1.1 * x9 + 1.1)
chk("predictions 1.1, 2.2, 3.3, 4.4; errors −0.1, 0.8, −1.3, 0.6; squares 0.01+0.64+1.69+0.36 = 2.70", vclose(1.1 * x9 + 1.1, [1.1, 2.2, 3.3, 4.4]) and vclose(res, [-.1, .8, -1.3, .6]) and close((res ** 2).sum(), 2.70))
chk("maximising the bell likelihood (σ = 1) lands on the least-squares line; ℓ = −1.35 − 2 ln 2π = −5.026", vclose(optimize.minimize(lambda t: -stats.norm.logpdf(y9, t[0] * x9 + t[1], 1).sum(), [0, 0]).x, [1.1, 1.1], 1e-5) and rnd(-1.35 - 2 * math.log(2 * math.pi), 3, -5.026))
def lad(xx, yy):
    best = None
    for i, j in combinations(range(len(xx)), 2):
        if xx[i] == xx[j]: continue
        W = (yy[j] - yy[i]) / (xx[j] - xx[i]); B = yy[i] - W * xx[i]; s = np.abs(yy - W * xx - B).sum()
        if best is None or s < best[0] - 1e-12: best = (s, W, B)
    return best
def lad_lp(xx, yy):   # certify the LAD line with a linear program: min Σt s.t. −t ≤ y − wx − b ≤ t
    n = len(xx); c = np.r_[0, 0, np.ones(n)]
    A = np.block([[-xx[:, None], -np.ones((n, 1)), -np.eye(n)], [xx[:, None], np.ones((n, 1)), -np.eye(n)]]); bb = np.r_[-yy, yy]
    r = optimize.linprog(c, A_ub=A, b_ub=bb, bounds=[(None, None)] * 2 + [(0, None)] * n); return r.fun, r.x[0], r.x[1]
s0, W0, B0 = lad(x9, y9)
chk("Laplace (absolute-error) fit without the outlier: w = 4/3, b = 1, total 7/3 (LP agrees)", close(W0, 4 / 3) and close(B0, 1) and close(s0, 7 / 3) and close(lad_lp(x9, y9)[0], 7 / 3))
xo = np.r_[x9, 1]; yo = np.r_[y9, 8]
wo, bo = np.polyfit(xo, yo, 1); so, Wo, Bo = lad(xo, yo)
chk("with the outlier (1, 8): least squares tilts to w ≈ 0.654, b ≈ 2.885; Laplace stays w = 4/3, b = 1 (total 8, LP agrees)", rnd(wo, 3, .654) and rnd(bo, 3, 2.885) and close(Wo, 4 / 3) and close(Bo, 1) and close(so, 8) and close(lad_lp(xo, yo)[0], 8))
chk("widget: Laplace fit with the outlier — squared error 35.333, ℓ = −8 − 5 ln 2 = −11.466, product 1.048e−5", rnd(((yo - 4 / 3 * xo - 1) ** 2).sum(), 3, 35.333) and rnd(-8 - 5 * math.log(2), 3, -11.466) and rnd(math.exp(-8 - 5 * math.log(2)) * 1e5, 3, 1.048))
chk("widget start line y = 0.5x + 2: squared error 4.5, absolute 4, ℓ = −5.926, product 2.670e−3", close(((y9 - .5 * x9 - 2) ** 2).sum(), 4.5) and close(np.abs(y9 - .5 * x9 - 2).sum(), 4) and rnd(-2.25 - 2 * math.log(2 * math.pi), 3, -5.926) and rnd(math.exp(-2.25 - 2 * math.log(2 * math.pi)) * 1e3, 3, 2.670))
chk("c13: the wrong option y = x + 1.25 passes through (x̄, ȳ) but has larger squared error", close(1.5 + 1.25, 2.75) and ((y9 - x9 - 1.25) ** 2).sum() > 2.7)
chk("squares punish an error of 10 by 100, absolute by 10", 10 ** 2 == 100)

print("— §10 · softmax —")
q = softmax([2, 1, 0])
chk("e² = 7.389, e = 2.718, total 11.107 → 0.665, 0.245, 0.090 (they add to 1.000)", rnd(math.e ** 2, 3, 7.389) and rnd(math.e, 3, 2.718) and rnd(math.e ** 2 + math.e + 1, 3, 11.107) and vclose(np.round(q, 3), [.665, .245, .090], 1e-12) and rnd(q.sum(), 3, 1))
chk("hero: 0.665 + 0.245 + 0.090 = 1.000 exactly as printed", close(.665 + .245 + .090, 1))
chk("T = 0.5 → 0.867, 0.117, 0.016; T = 2 → 0.506, 0.307, 0.186", vclose(np.round(softmax([2, 1, 0], .5), 3), [.867, .117, .016], 1e-12) and vclose(np.round(softmax([2, 1, 0], 2), 3), [.506, .307, .186], 1e-12))
chk("T → 0 → (1,0,0); T → ∞ → ⅓ each", vclose(softmax([2, 1, 0], 1e-3), [1, 0, 0]) and vclose(softmax([2, 1, 0], 1e6), [1 / 3] * 3, 1e-5))
chk("c15: (12, 11, 10) gives exactly the same probabilities (and not 12/33 …)", vclose(softmax([12, 11, 10]), q, 1e-12) and not vclose(q, [12 / 33, 11 / 33, 10 / 33], 1e-3))
chk("two classes: softmax(z₁,z₂)₁ = σ(z₁ − z₂); σ(1.5) ≈ 0.818, σ(0) = 0.5", close(softmax([3.7, 2.2])[0], sig(1.5)) and rnd(sig(1.5), 3, .818) and sig(0) == .5)
chk("simplex widget: distance of (0.665,0.245,0.090) to the centre 0.421; at T = 0.2 q = (0.993, 0.007, 0.000)", rnd(np.linalg.norm(q - 1 / 3), 3, .421) and vclose(np.round(softmax([2, 1, 0], .2), 3), [.993, .007, 0], 1e-12))

print("— §11 · surprise and entropy —")
chk("surprise: p = 1 → 0, ½ → 1, ¼ → 2, 1/1024 → 10 bits; 1 nat = 1.443 bits", -math.log2(1) == 0 and -math.log2(.5) == 1 and -math.log2(.25) == 2 and -math.log2(1 / 1024) == 10 and rnd(1 / math.log(2), 3, 1.443))
chk("fair coin 1 bit; 0.9/0.1 coin: 0.9·0.152 + 0.1·3.32 ≈ 0.469 bits; uniform 4 → 2 bits", H2([.5, .5]) == 1 and rnd(-math.log2(.9), 3, .152) and rnd(-math.log2(.1), 2, 3.32) and rnd(H2([.9, .1]), 3, .469) and H2([.25] * 4) == 2)
chk("widget: 0.469 bits = 0.325 nats; three equal: log₂3 ≈ 1.585 bits; surprises 0.15 and 3.32", rnd(H2([.9, .1]) * math.log(2), 3, .325) and rnd(math.log2(3), 3, 1.585) and rnd(-math.log2(.9), 2, .15))
chk("c17: the fair coin (1 bit) beats the 90/10 coin (0.469)", H2([.5, .5]) > H2([.9, .1]))

print("— §12 · cross-entropy and KL —")
p = [.5, .5]; qq = [.9, .1]
chk("H(p,q) ≈ 1.737 bits, KL(p‖q) ≈ 0.737, KL(q‖p) ≈ 0.531 (0.763 − 0.232)", rnd(CE2(p, qq), 3, 1.737) and rnd(KL2(p, qq), 3, .737) and rnd(KL2(qq, p), 3, .531) and rnd(.9 * math.log2(.9 / .5), 3, .763) and rnd(-.1 * math.log2(.1 / .5), 3, .232))
chk("Mumbai as (rain, dry): p = (0.5, 0.5), q = (0.1, 0.9): same numbers; 0.5·3.32 + 0.5·0.152 ≈ 1.737", rnd(CE2([.5, .5], [.1, .9]), 3, 1.737) and rnd(KL2([.5, .5], [.1, .9]), 3, .737))
chk("identity H(p,q) = H(p) + KL(p‖q) (1.737 = 1 + 0.737)", close(CE2(p, qq), H2(p) + KL2(p, qq)))
rng = np.random.default_rng(1)
chk("KL ≥ 0 with equality only at q = p (10 000 random pairs)", all(KL2(a, b) >= -1e-12 for a, b in (rng.dirichlet([1] * 4, 2) for _ in range(10000))) and close(KL2(p, p), 0))
xs = np.linspace(-9, 9, 36001); dx = xs[1] - xs[0]
P = .5 * stats.norm.pdf(xs, -2, .6) + .5 * stats.norm.pdf(xs, 2, .6)
def kls(m, s):
    Q = stats.norm.pdf(xs, m, s); a = np.maximum(P, 1e-300); b = np.maximum(Q, 1e-300)
    return (a * np.log(a / b)).sum() * dx, (b * np.log(b / a)).sum() * dx
fw = optimize.minimize(lambda t: kls(t[0], math.exp(t[1]))[0], [.3, .3], method='Nelder-Mead', options={'xatol': 1e-9, 'fatol': 1e-12})
rv = optimize.minimize(lambda t: kls(t[0], math.exp(t[1]))[1], [1.5, -.3], method='Nelder-Mead', options={'xatol': 1e-9, 'fatol': 1e-12})
chk("fit by KL(p‖q): middle 0.00, spread √(4 + 0.36) ≈ 2.09 (moment matching)", abs(fw.x[0]) < 1e-4 and rnd(math.exp(fw.x[1]), 2, 2.09) and close(math.exp(fw.x[1]), math.sqrt(4.36), 1e-4))
chk("fit by KL(q‖p): middle ≈ ±2.00, spread ≈ 0.60 (0.605)", rnd(abs(rv.x[0]), 2, 2.00) and rnd(math.exp(rv.x[1]), 2, .60))
chk("widget readout at the reverse fit: KL(p‖q) = 10.226, KL(q‖p) = 0.692 nats", rnd(kls(rv.x[0], math.exp(rv.x[1]))[0], 1, 10.2) and rnd(kls(rv.x[0], math.exp(rv.x[1]))[1], 3, .692))

print("— §13 · the classifier's likelihood —")
chk("loss −ln 0.665 ≈ 0.408 nats; gradient q − y = (−0.335, 0.245, 0.090)", rnd(-math.log(q[0]), 3, .408) and vclose(np.round(q - [1, 0, 0], 3), [-.335, .245, .090], 1e-12))
chk("c19: −ln 0.9 ≈ 0.105, −ln 0.1 ≈ 2.303 (about 22 times more)", rnd(-math.log(.9), 3, .105) and rnd(-math.log(.1), 3, 2.303) and round(math.log(.1) / math.log(.9)) == 22)
chk("c20: true class second → q − y = (0.665, −0.755, 0.090)", vclose(np.round(q - [0, 1, 0], 3), [.665, -.755, .090], 1e-12))
zz = np.array([.3, -1.2, 2.0]); yv = np.array([0, 0, 1.])
num = np.array([(-math.log(softmax(zz + h * np.eye(3)[k])[2]) + math.log(softmax(zz - h * np.eye(3)[k])[2])) / (2 * h) for k, h in [(0, 1e-6), (1, 1e-6), (2, 1e-6)]])
chk("drawer: ∂(−log softmax)/∂z = q − y checked by finite differences; the entries add to 0", vclose(num, softmax(zz) - yv, 1e-6) and close((softmax(zz) - yv).sum(), 0))
chk("an untrained classifier (all scores 0) has loss ln 3 ≈ 1.099", rnd(math.log(3), 3, 1.099))

print("— practice —")
pl = np.array([.1] * 5 + [.5]); E = (pl * f).sum(); E2p = (pl * f * f).sum()
chk("P1: E = 1.5 + 3 = 4.5; E[X²] = 5.5 + 18 = 23.5; Var = 3.25; σ ≈ 1.803", close(pl.sum(), 1) and close(E, 4.5) and close(E2p, 23.5) and close(E2p - E * E, 3.25) and rnd(math.sqrt(3.25), 3, 1.803))
tp, fp = 200 * .9, 9800 * .1; pp = tp / (tp + fp)
chk("P2: 180 + 980 = 1160 positives (11.6%); P(sick|+) ≈ 0.155; again ≈ 0.623 (162/260); negative: 20/8840 ≈ 0.0023", close(tp, 180) and close(fp, 980) and close(tp + fp, 1160) and rnd(pp, 3, .155) and rnd(.9 * pp / (.9 * pp + .1 * (1 - pp)), 3, .623) and close(162 / 260, .9 * pp / (.9 * pp + .1 * (1 - pp))) and rnd(20 / 8840, 4, .0023) and close(8820, 9800 * .9) and round(1160 / 180, 1) == 6.4)
chk("P3: 68.3%, 95.4%; tail above 80 ≈ 2.3%; z = 1.5; friend z = 2", rnd(a1 * 100, 1, 68.3) and rnd(a2 * 100, 1, 95.4) and rnd((1 - stats.norm.cdf(2)) * 100, 1, 2.3) and rnd((1 - a2) * 100, 1, 4.6))
S4 = np.array([[5., 2], [2, 2]]); w4, V4 = np.linalg.eigh(S4); S4i = np.linalg.inv(S4)
chk("P4: eigenvalues 1 and 6, axes (1,−2)/√5 and (2,1)/√5, det 6, peak ≈ 0.0650", vclose(w4, [1, 6]) and vclose(np.abs(V4[:, 1]) * math.sqrt(5), [2, 1]) and vclose(np.abs(V4[:, 0]) * math.sqrt(5), [1, 2]) and close(np.linalg.det(S4), 6) and rnd(1 / (2 * math.pi * math.sqrt(6)), 4, .0650))
chk("P4: Σ⁻¹ = ⅙[[2,−2],[−2,5]]; (2,1): d² = 5/6, d ≈ 0.913; (1,−2): d² = 5, d ≈ 2.236; √6 ≈ 2.45", vclose(S4i, np.array([[2, -2], [-2, 5]]) / 6) and close(np.array([2, 1]) @ S4i @ np.array([2, 1]), 5 / 6) and rnd(math.sqrt(5 / 6), 3, .913) and close(np.array([1, -2]) @ S4i @ np.array([1, -2]), 5) and rnd(math.sqrt(5), 3, 2.236) and rnd(math.sqrt(6), 2, 2.45))
L5 = np.linalg.cholesky(np.array([[9., 6], [6, 5]]))
chk("P5: L = [[3,0],[2,1]]; z = (1,−1) → x = (4,2); ρ = 2/√5 ≈ 0.894", vclose(L5, [[3, 0], [2, 1]]) and vclose(np.array([1, 1]) + L5 @ np.array([1, -1]), [4, 2]) and rnd(6 / (3 * math.sqrt(5)), 3, .894))
l6 = 3 * math.log(.25) + 9 * math.log(.75); l6f = 12 * math.log(.5)
chk("P6: p̂ = 0.25; log L = −4.159 − 2.589 = −6.748; fair −8.318; ratio e^1.570 ≈ 4.81", rnd(3 * math.log(.25), 3, -4.159) and rnd(9 * math.log(.75), 3, -2.589) and rnd(l6, 3, -6.748) and rnd(l6f, 3, -8.318) and rnd(l6 - l6f, 3, 1.570) and rnd(math.exp(l6 - l6f), 2, 4.81))
chk("P7: μ̂ = 4, squared distances 9,1,0,4,4 = 18, σ̂² = 3.6, σ̂ ≈ 1.897, N − 1: 4.5", np.var([1, 3, 4, 6, 6]) == 3.6 and rnd(math.sqrt(3.6), 3, 1.897))
x8 = np.array([1, 2, 3.]); y8 = np.array([2, 3, 5.]); w8, b8 = np.polyfit(x8, y8, 1); r8 = y8 - w8 * x8 - b8
chk("P8: w = 3/2, b = 1/3; predictions 11/6, 10/3, 29/6; errors 1/6, −1/3, 1/6; SSE 1/6; σ̂² = 1/18 ≈ 0.0556", close(w8, 1.5) and close(b8, 1 / 3) and vclose(w8 * x8 + b8, [11 / 6, 10 / 3, 29 / 6]) and vclose(r8, [1 / 6, -1 / 3, 1 / 6]) and close((r8 ** 2).sum(), 1 / 6) and rnd((r8 ** 2).sum() / 3, 4, .0556))
chk("P9: T = 1: e³ = 20.086, total 25.522 → (0.787, 0.107, 0.107); T = 2 → total 7.779, (0.576, 0.212, 0.212); +100 unchanged", rnd(math.exp(3), 3, 20.086) and rnd(math.exp(3) + 2 * math.e, 3, 25.522) and vclose(np.round(softmax([3, 1, 1]), 3), [.787, .107, .107], 1e-12) and rnd(math.exp(1.5), 3, 4.482) and rnd(math.exp(.5), 3, 1.649) and rnd(math.exp(1.5) + 2 * math.exp(.5), 3, 7.779) and vclose(np.round(softmax([3, 1, 1], 2), 3), [.576, .212, .212], 1e-12) and vclose(softmax([103, 101, 101]), softmax([3, 1, 1])))
chk("P10: e^2.5 = 12.182, total 14.901, q₁ ≈ 0.818 = σ(1.5); e^−1.5 = 0.223; σ(−1.5) ≈ 0.182", rnd(math.exp(2.5), 3, 12.182) and rnd(math.exp(2.5) + math.e, 3, 14.901) and rnd(softmax([2.5, 1])[0], 3, .818) and rnd(math.exp(-1.5), 3, .223) and rnd(sig(-1.5), 3, .182))
chk("P11: surprises 1,2,3,3; H = 1.75 bits ≈ 1.213 nats; uniform 2 bits; the question game averages 1.75", H2([.5, .25, .125, .125]) == 1.75 and rnd(1.75 * math.log(2), 3, 1.213) and .5 * 1 + .25 * 2 + .25 * 3 == 1.75)
p12, q12 = [.25, .75], [.5, .5]
chk("P12: H(p) = 0.5 + 0.311 = 0.811, H(p,q) = 1, KL(p‖q) = −0.25 + 0.439 = 0.189, KL(q‖p) = 0.5 − 0.292 = 0.208", rnd(.75 * math.log2(4 / 3), 3, .311) and rnd(H2(p12), 3, .811) and close(CE2(p12, q12), 1) and rnd(.75 * math.log2(1.5), 3, .439) and rnd(KL2(p12, q12), 3, .189) and rnd(.5 * math.log2(1.5), 3, .292) and rnd(KL2(q12, p12), 3, .208))
q13 = softmax([0, 1, 3]); z13 = np.array([0, 1, 3.]) - (q13 - [0, 1, 0]); q13b = softmax(z13)
chk("P13: total 23.804 → q = (0.042, 0.114, 0.844), loss 2.170; q − y = (0.042, −0.886, 0.844)", rnd(1 + math.e + math.exp(3), 3, 23.804) and vclose(np.round(q13, 3), [.042, .114, .844], 1e-12) and rnd(-math.log(q13[1]), 3, 2.170) and vclose(np.round(q13 - [0, 1, 0], 3), [.042, -.886, .844], 1e-12))
chk("P13: after one step z = (−0.042, 1.886, 2.156), q = (0.059, 0.407, 0.534), loss ≈ 0.899", vclose(np.round(z13, 3), [-.042, 1.886, 2.156], 1e-12) and vclose(np.round(q13b, 3), [.059, .407, .534], 1e-12) and rnd(-math.log(q13b[1]), 3, .899))
y14 = np.array([1, 2, 3, 4, 100.])
chk("P14: bell noise → mean 22 (minimises Σ(y−c)²); Laplace → median 3 (minimises Σ|y−c|)", y14.mean() == 22 and np.median(y14) == 3 and close(optimize.minimize_scalar(lambda c: ((y14 - c) ** 2).sum()).x, 22, 1e-6) and close(optimize.minimize_scalar(lambda c: np.abs(y14 - c).sum(), bounds=(0, 100), method='bounded', options={'xatol': 1e-10}).x, 3, 1e-5))

print(f"\n✓ {ok} checks passed — every number on the Unit 14 page reproduced")
