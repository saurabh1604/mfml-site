# Unit 12 · Principal Component Analysis — machine verification of every number
# printed in the sections, checks, derivations and practice arena (tpl/u12-*.html),
# and of the numbers the widgets' "Try" lines promise.  Run:  python3 verify-math12.py
import math
import numpy as np

ok = 0
def chk(name, cond):
    global ok
    assert cond, "FAIL: " + name
    ok += 1
    print("  ok    " + name)

def close(a, b, tol=1e-9):
    return abs(a - b) < tol

def r(x, d):            # round half away from zero, as printed
    return float(f"{x:.{d}f}")

def eig_desc(C):
    l, V = np.linalg.eigh(np.array(C, float))
    i = np.argsort(l)[::-1]
    return l[i], V[:, i]

def cov(P):             # divide by N
    P = np.array(P, float); X = P - P.mean(0); return X.T @ X / len(P), X, P.mean(0)

FIVE = [(1, 2), (4, 5), (7, 8), (8, 4), (10, 6)]
C5, X5, mu5 = cov(FIVE)
w1 = np.array([2, 1]) / math.sqrt(5); w2 = np.array([1, -2]) / math.sqrt(5)

print("— §1 pick the better line —")
x = np.array([1, 4, 7, 8, 10.]); y = np.array([2, 5, 8, 4, 6.])
chk("first numbers: mean 6, distances -5,-2,1,2,4, squares 25+4+1+4+16 = 50, spread 10",
    x.mean() == 6 and list(x - 6) == [-5, -2, 1, 2, 4] and sum((x - 6) ** 2) == 50 and close(np.var(x), 10))
chk("second numbers 2,5,8,4,6: spread 4", close(np.var(y), 4))
land = (np.array(FIVE) @ w1)
chk("slanted line 2 right per 1 up: landing spread 12 (beats 10 and 4)", close(np.var(land), 12))
th = np.radians(np.arange(0, 180, 0.01)); q = C5[0, 0] * np.cos(th) ** 2 + 2 * C5[0, 1] * np.cos(th) * np.sin(th) + C5[1, 1] * np.sin(th) ** 2
chk("hump: best 12 at 26.57°, worst 2 exactly 90° later (116.57°)",
    close(q.max(), 12, 1e-6) and close(q.min(), 2, 1e-6) and close(np.degrees(th[q.argmax()]), 26.57, .01) and close(np.degrees(th[q.argmin()]), 116.57, .01))
l90 = eig_desc([[5.45, 0], [0, .41]])[0]
chk("90-point cloud is built with eigenvalues 5.45 and 0.41 (lines A and B)", close(l90[0], 5.45) and close(l90[1], .41))

print("— §2 why spread is the information —")
Ct = np.array([[64, 48], [48, 41.]]); lt = eig_desc(Ct)[0]
chk("twins: correlation 48/sqrt(64*41) = 0.94", r(48 / math.sqrt(64 * 41), 2) == 0.94)
chk("twins: new direction carries 101.86 of 105 (97.0 %), the other 3.14",
    r(lt[0], 2) == 101.86 and r(lt[1], 2) == 3.14 and close(lt.sum(), 105) and r(lt[0] / 105 * 100, 1) == 97.0)
chk("a constant column has variance 0", np.var([1] * 40) == 0)

print("— §3 centre first —")
h = np.array([142, 150, 138, 146.])
chk("heights 142,150,138,146 → from the average 144: -2,+6,-6,+2", h.mean() == 144 and list(h - 144) == [-2, 6, -6, 2])
chk("mean (6,5) from 30/5 and 25/5", list(mu5) == [6, 5] and sum(x) == 30 and sum(y) == 25)
chk("centred X rows (-5,-3),(-2,0),(1,3),(2,-1),(4,1); columns add to 0",
    np.array_equal(X5, [[-5, -3], [-2, 0], [1, 3], [2, -1], [4, 1]]) and np.allclose(X5.sum(0), 0))
S = X5.T @ X5
chk("sums 50 (25+4+1+4+16), 20 (9+0+9+1+1), 20 (15+0+3-2+4); C = [[10,4],[4,4]]",
    S[0, 0] == 50 and S[1, 1] == 20 and S[0, 1] == 20 and 15 + 0 + 3 - 2 + 4 == 20 and np.allclose(C5, [[10, 4], [4, 4]]))
chk("dividing by N-1 = 4 would give [[12.5,5],[5,5]]", np.allclose(S / 4, [[12.5, 5], [5, 5]]))
Raw = np.array(FIVE, float).T @ np.array(FIVE, float) / 5
chk("forgot to centre: (1/5) XᵀX raw = [[46,34],[34,29]] = C + μμᵀ = C + [[36,30],[30,25]]",
    np.allclose(Raw, [[46, 34], [34, 29]]) and np.allclose(Raw, C5 + np.outer(mu5, mu5)))
lr, Vr = eig_desc(Raw); ang_raw = math.degrees(math.atan2(Vr[1, 0], Vr[0, 0])) % 180
chk("raw matrix's top direction (%.1f°) swings from 26.6° toward the mean direction 39.8°" % ang_raw,
    26.57 < ang_raw <= 39.81 and r(math.degrees(math.atan2(5, 6)), 1) == 39.8)

print("— §4 one score per direction —")
f = lambda w: float(np.array(w) @ C5 @ np.array(w))
chk("wᵀCw: (1,0) → 10, (0,1) → 4, (2,1)/√5 → (40+8+8+4)/5 = 12", f([1, 0]) == 10 and f([0, 1]) == 4 and close(f(w1), 12) and (40 + 8 + 8 + 4) / 5 == 12)
chk("check c6: (1,1)/√2 → (10+4+4+4)/2 = 11 (sum 22, trace 14 are the distractors)", close(f(np.array([1, 1]) / math.sqrt(2)), 11) and 10 + 4 + 4 + 4 == 22)
chk("spread along w equals the variance of the projected data", close(np.var(X5 @ w1), f(w1)))

print("— §5 the leash —")
chk("doubling w: spread 48; tripling: 108", close(f(2 * w1), 48) and close(f(3 * w1), 108))

print("— §6 the multiplier is the spread —")
Cb = np.array([[5, 4], [4, 5.]]); u = np.array([1, 1]) / math.sqrt(2)
chk("C=[[5,4],[4,5]]: Cw = (9,9)/√2 = 9w, wᵀCw = (5+4+4+5)/2 = 9; the other eigenvalue 1",
    np.allclose(Cb @ u, 9 * u) and close(u @ Cb @ u, 9) and np.allclose(eig_desc(Cb)[0], [9, 1]))
Cc = np.array([[5, 2], [2, 8.]]); lc = eig_desc(Cc)[0]
chk("c10: [[5,2],[2,8]] top eigenvalue 9 along (1,2); unnormalised spread 5+8+32 = 45 = 5 × 9",
    np.allclose(lc, [9, 4]) and np.allclose(Cc @ [1, 2], [9, 18]) and np.array([1, 2]) @ Cc @ np.array([1, 2]) == 45 and 5 + 8 + 32 == 45)

print("— §7 the second direction —")
rng = np.random.default_rng(3); Q, _ = np.linalg.qr(rng.normal(size=(3, 3)))
C3 = Q @ np.diag([9, 4, 1]) @ Q.T; B = np.outer(Q[:, 0], Q[:, 0]); Ch = (np.eye(3) - B) @ C3 @ (np.eye(3) - B)
chk("c11: peeling PC1 off λ = 9,4,1 leaves 0,4,1 (same eigenvectors)",
    np.allclose(sorted(np.linalg.eigvalsh(Ch))[::-1], [4, 1, 0]) and np.allclose(Ch @ Q[:, 0], 0) and np.allclose(Ch @ Q[:, 1], 4 * Q[:, 1]))
chk("expansion (I-B)C(I-B) = C - CB - BC + BCB", np.allclose(Ch, C3 - C3 @ B - B @ C3 + B @ C3 @ B))

print("— §8 the budget —")
chk("tr C = 10+4 = 14 = 12+2; one component keeps 12/14 = 85.71 %", close(np.trace(C5), 14) and np.allclose(eig_desc(C5)[0], [12, 2]) and r(12 / 14 * 100, 2) == 85.71)
L6 = np.array([4.5, 2.1, 0.9, 0.4, 0.1]); cum = np.cumsum(L6) / L6.sum() * 100
chk("c12/c13: total 8.0, first two 6.6/8.0 = 82.5 %, running 56.25, 82.5, 93.75, 98.75, 100 → M = 3 for 90 %",
    close(L6.sum(), 8) and np.allclose(cum, [56.25, 82.5, 93.75, 98.75, 100]) and int(np.argmax(cum >= 90)) + 1 == 3)
chk("shares 56.25, 26.25, 11.25, 5.00, 1.25 %", np.allclose(L6 / 8 * 100, [56.25, 26.25, 11.25, 5, 1.25]))
def rules(l, t=90):
    l = np.array(l, float); n = len(l); cum = np.cumsum(l) / l.sum() * 100
    xn = np.arange(n) / (n - 1); yn = (l - l.min()) / (l.max() - l.min()); knee = int(np.argmax((1 - xn) - yn)) + 1
    return int(np.argmax(cum >= t - 1e-9)) + 1, max(1, knee - 1), int((l > 1).sum()), cum
sets = {'five': [4.5, 2.1, 0.9, 0.4, 0.1], 'svd': [4, 1, .25, .01], 'noisy': [6.0, 3.1, 0.62, 0.55, 0.5, 0.47, 0.43, 0.4, 0.38, 0.35], 'std': [2.9, 1.5, 0.8, 0.4, 0.25, 0.15]}
R = {k: rules(v) for k, v in sets.items()}
chk("scree widget, target 90 % / elbow / Kaiser: five (3, 2, (2)), svd (2, 1, (1)), noisy (7, 2, (2)), std (4, 2, 2)",
    [R[k][:3] for k in sets] == [(3, 2, 2), (2, 1, 1), (7, 2, 2), (4, 2, 2)])
chk("six standardised features add to 6 (each column contributes exactly 1)", close(sum(sets['std']), 6))

print("— §9 the rebuild error —")
xs = np.array([12, 9.]) - mu5; z = xs @ w1; xt = z * w1 + mu5; err = np.sum((xs - z * w1) ** 2); z2 = xs @ w2
chk("(12,9) → centred (6,4); z = 16/√5 = 7.155; rebuilt (6.4,3.2) + mean = (12.4, 8.2)",
    np.allclose(xs, [6, 4]) and close(z, 16 / math.sqrt(5)) and r(z, 3) == 7.155 and np.allclose(z * w1, [6.4, 3.2]) and np.allclose(xt, [12.4, 8.2]))
chk("error (6-6.4)² + (4-3.2)² = 0.16 + 0.64 = 0.80 = z₂² with z₂ = (6-8)/√5", close(err, .8) and close(z2 ** 2, .8) and close(z2, -2 / math.sqrt(5)))
s2 = (X5 @ w2) ** 2
chk("c15: squared scores along w₂ are 1/5, 4/5, 25/5, 16/5, 4/5 and average λ₂ = 2", np.allclose(s2 * 5, [1, 4, 25, 16, 4]) and close(s2.mean(), 2))
th_ = np.radians(35); C2r = np.array([[math.cos(th_), -math.sin(th_)], [math.sin(th_), math.cos(th_)]]) @ np.diag([4.2, .8]) @ np.array([[math.cos(th_), math.sin(th_)], [-math.sin(th_), math.cos(th_)]])
chk("seesaw widget cloud: total 5.0, best line at 35° keeps 4.20, loses 0.80", close(np.trace(C2r), 5) and np.allclose(eig_desc(C2r)[0], [4.2, .8]))
chk("3-D plane: total 9 = 6 + 2.5 + 0.5; best plane keeps 8.5, loses 0.5", 6 + 2.5 + .5 == 9)

print("— §10 uncorrelated columns —")
a = np.array([6, 3, 2]) / 7; b = np.array([-1, 2, 0]) / math.sqrt(5)
chk("loadings (6,3,2)/7 ≈ (0.86, 0.43, 0.29) and (-1,2,0)/√5 ≈ (-0.45, 0.89, 0)",
    np.allclose(np.round(a, 2), [.86, .43, .29]) and np.allclose(np.round(b, 2), [-.45, .89, 0]))
chk("both length 1: (36+9+4)/49 = 1 and (1+4+0)/5 = 1; dot (-6+6+0)/(7√5) = 0", close(a @ a, 1) and close(b @ b, 1) and close(a @ b, 0))
cvec = np.array([-4, -2, 15]) / (7 * math.sqrt(5))
chk("the third direction (-4,-2,15)/(7√5) completes the basis (widget cloud)", close(cvec @ cvec, 1) and close(cvec @ a, 0) and close(cvec @ b, 0))
chk("c16: (0.6,0.8)&(-0.8,0.6) valid; (0.6,0.8)&(0.8,0.6) dot 0.96; (1,1)&(1,-1) lengths √2",
    close(.36 + .64, 1) and close(.6 * -.8 + .8 * .6, 0) and close(.6 * .8 + .8 * .6, .96) and close(math.hypot(1, 1), math.sqrt(2)))
Cd = np.array([[4, 3.12], [3.12, 4]])
chk("decorrelation widget: correlation 3.12/4 = 0.78 → rotated covariance diag(7.12, 0.88)", close(3.12 / 4, .78) and np.allclose(eig_desc(Cd)[0], [7.12, .88]))
Xr = rng.normal(size=(50, 3)); Xr -= Xr.mean(0); Cr = Xr.T @ Xr / 50; lr_, Vr_ = eig_desc(Cr); Z = Xr @ Vr_
chk("Cov(Z) = WᵀCW = Λ (numerical check on random data)", np.allclose(Z.T @ Z / 50, np.diag(lr_)))

print("— §11 the SVD route —")
Xs = rng.normal(size=(40, 4)); Xs -= Xs.mean(0); U, sg, Vt = np.linalg.svd(Xs, full_matrices=False); lC, VC = eig_desc(Xs.T @ Xs / 40)
chk("C = V Σ²/N Vᵀ: λ = σ²/N and W = V up to sign (numerical)", np.allclose(lC, sg ** 2 / 40) and np.allclose(np.abs(VC.T @ Vt.T), np.eye(4), atol=1e-9))
sig = np.array([20, 10, 5, 1.]); lam = sig ** 2 / 100
chk("c17: σ = 20,10,5,1, N = 100 → λ = 4, 1, 0.25, 0.01; total 5.26; first two 95.06 %; first alone 76.05 %",
    np.allclose(lam, [4, 1, .25, .01]) and close(lam.sum(), 5.26) and r(5 / 5.26 * 100, 2) == 95.06 and r(4 / 5.26 * 100, 2) == 76.05)
chk("c18: best rank-2 error: spectral 5, Frobenius √26 = 5.10", math.sqrt(25 + 1) == math.sqrt(26) and r(math.sqrt(26), 2) == 5.10)
Um, Sm, Vm = np.linalg.svd(rng.normal(size=(6, 5)))
A = Um[:, :4] @ np.diag(sig) @ Vm[:4, :]; A2 = Um[:, :2] @ np.diag(sig[:2]) @ Vm[:2, :]
chk("Eckart–Young errors on a real matrix with σ = 20,10,5,1: ‖·‖₂ = 5, ‖·‖F = √26", close(np.linalg.norm(A - A2, 2), 5) and close(np.linalg.norm(A - A2, 'fro'), math.sqrt(26)))

print("— §12 power iteration —")
x1 = Cb @ [1, 0] / np.linalg.norm(Cb @ [1, 0]); x2v = Cb @ (Cb @ [1, 0]); x2 = x2v / np.linalg.norm(x2v)
chk("x₁ = (5,4)/√41 ≈ (0.781, 0.625); x₂ from (41,40) ≈ (0.716, 0.698); limit (0.707, 0.707)",
    np.allclose(np.round(x1, 3), [.781, .625]) and np.allclose(x2v, [41, 40]) and np.allclose(np.round(x2, 3), [.716, .698]) and r(1 / math.sqrt(2), 3) == .707)
chk("λ₂/λ₁ = 1/9; angles 45° → atan(1/9) = 6.34° → atan(1/81) = 0.71°",
    r(math.degrees(math.atan(1 / 9)), 2) == 6.34 and r(math.degrees(math.atan(1 / 81)), 2) == 0.71 and close(math.degrees(math.acos(x1 @ u)), math.degrees(math.atan(1 / 9)), 1e-9))
chk("close eigenvalues 5.0 and 4.9: ratio 0.98 (only 2 % per pass)", close(4.9 / 5.0, .98))
chk("'lands in two or three passes' at 1/9: 0.71° after two, 0.079° after three", r(math.degrees(math.atan(1 / 729)), 3) == 0.079)

print("— §13 the Gram trick —")
chk("12,000² = 1.44 × 10⁸ entries × 8 bytes = 1.152 × 10⁹ bytes (1.152 GB); D³ = 1.728 × 10¹² ≈ 1.7 × 10¹²",
    12000 ** 2 == 1.44e8 and 12000 ** 2 * 8 == 1.152e9 and 12000 ** 3 == 1.728e12)
chk("c20 distractor: the data itself is 40 × 12,000 × 8 = 3.84 MB; nonzero ≤ N-1 = 39; 12,000 - 39 = 11,961 zeros",
    40 * 12000 * 8 == 3.84e6 and 12000 - 39 == 11961)
chk("K for N = 40 is 40 × 40 = 1,600 entries (12.8 KB)", 40 * 40 == 1600 and 1600 * 8 == 12800)
chk("wide widget: D = 100,000 → 80 GB > 16 GB; D = 45,000 already 16.2 GB", 1e5 ** 2 * 8 == 8e10 and 45000 ** 2 * 8 > 16e9)
Xw = rng.normal(size=(3, 5)); Xw -= Xw.mean(0); lCw = np.sort(np.linalg.eigvalsh(Xw.T @ Xw / 3))[::-1]; lKw, UK = eig_desc(Xw @ Xw.T / 3)
w_rec = Xw.T @ UK[:, 0]; nr = np.linalg.norm(w_rec)
chk("tiny wide demo: C (5×5) and K (3×3) share their two non-zero eigenvalues; ‖Xᵀu‖ = √(Nλ)",
    np.allclose(lCw[:2], lKw[:2]) and np.allclose(lCw[2:], 0, atol=1e-12) and close(lKw[2], 0, 1e-12) and close(nr, math.sqrt(3 * lKw[0])))

print("— §14 the recipe —")
mu = np.array([4, 10.]); sd = np.array([2, 5.]); a1 = np.array([.6, .8]); a2 = np.array([-.8, .6])
xs_ = (np.array([6, 20.]) - mu) / sd; zz = xs_ @ a1; xr = zz * a1; e_ = np.sum((xs_ - xr) ** 2)
chk("(6,20) → (1,2); z = 0.6 + 1.6 = 2.2; rebuild (1.32, 1.76); error 0.1024 + 0.0576 = 0.16 = z₂², z₂ = 0.4",
    np.allclose(xs_, [1, 2]) and close(zz, 2.2) and np.allclose(xr, [1.32, 1.76]) and close(e_, .16) and close(xs_ @ a2, .4) and close(.32 ** 2, .1024) and close(.24 ** 2, .0576))
chk("c21: (8,5) → (2,-1), z = 1.2 - 0.8 = 0.4; raw distractor 0.6·8 + 0.8·5 = 8.8",
    np.allclose((np.array([8, 5.]) - mu) / sd, [2, -1]) and close(((np.array([8, 5.]) - mu) / sd) @ a1, .4) and close(.6 * 8 + .8 * 5, 8.8))
VH, VW, RH = .006695, 57.34, .7
Chw = np.array([[VH, RH * math.sqrt(VH * VW)], [RH * math.sqrt(VH * VW), VW]]); lh, Vh = eig_desc(Chw)
Zh = np.array([[1, RH], [RH, 1]]); lz, Vz = eig_desc(Zh)
chk("unit trap: weight's spread is 57.34/0.006695 = 8,565 times height's ('about 8,600')", r(VW / VH, 0) == 8565 and round(VW / VH, -2) == 8600)
chk("raw PC1 loadings: height 0.01, weight 1.00; standardised: 0.71 and 0.71",
    r(abs(Vh[0, 0]), 2) == 0.01 and r(abs(Vh[1, 0]), 2) == 1.00 and r(abs(Vz[0, 0]), 2) == .71 and r(abs(Vz[1, 0]), 2) == .71)

print("— §15 one example start to finish —")
l5, V5 = eig_desc(C5)
chk("λ² - 14λ + 24 = 0: disc 196 - 96 = 100 → (14 ± 10)/2 = 12, 2; sum 14 = tr, product 24 = det",
    196 - 96 == 100 and np.allclose(l5, [12, 2]) and close(l5.sum(), 14) and close(np.linalg.det(C5), 24))
chk("w₁ = (2,1)/√5 ≈ (0.894, 0.447); w₂ = (1,-2)/√5; perpendicular, unit",
    np.allclose(np.abs(V5[:, 0]), w1) and np.allclose(np.round(w1, 3), [.894, .447]) and close(w1 @ w2, 0) and close(w2 @ w2, 1))
sc = X5 @ w1
chk("scores (-13,-4,5,3,9)/√5 ≈ -5.814, -1.789, 2.236, 1.342, 4.025; add to 0",
    np.allclose(sc * math.sqrt(5), [-13, -4, 5, 3, 9]) and np.allclose(np.round(sc, 3), [-5.814, -1.789, 2.236, 1.342, 4.025]) and close(sc.sum(), 0))
chk("spread of scores (169+16+25+9+81)/25 = 300/25 = 12; dropped scores (1,-2,-5,4,2)/√5, spread 50/25 = 2",
    169 + 16 + 25 + 9 + 81 == 300 and close(np.var(sc), 12) and np.allclose((X5 @ w2) * math.sqrt(5), [1, -2, -5, 4, 2]) and close(np.var(X5 @ w2), 2))
chk("shares 85.71 % and 14.29 %", r(12 / 14 * 100, 2) == 85.71 and r(2 / 14 * 100, 2) == 14.29)
chk("c22: 13 + 1 = 14 passes the trace check but 13 × 1 = 13 ≠ 24", 13 + 1 == 14 and 13 * 1 != 24)

print("— derivations —")
chk("gradient of wᵀAw is 2Aw for symmetric A (finite differences)",
    np.allclose([(lambda e: ((w1 + 1e-6 * e) @ C5 @ (w1 + 1e-6 * e) - (w1 - 1e-6 * e) @ C5 @ (w1 - 1e-6 * e)) / 2e-6)(np.eye(2)[i]) for i in range(2)], 2 * C5 @ w1, atol=1e-6))
ww = rng.normal(size=4); ww /= np.linalg.norm(ww)
chk("Rayleigh bounds λ_min ≤ wᵀCw ≤ λ_max", lC[-1] - 1e-12 <= ww @ (Xs.T @ Xs / 40) @ ww <= lC[0] + 1e-12)
Wk = VC[:, :2]; err2 = np.mean(np.sum((Xs - Xs @ Wk @ Wk.T) ** 2, 1))
chk("average rebuild error = sum of dropped eigenvalues (random 4-D data, keep 2)", close(err2, lC[2:].sum()))

print("— practice —")
P1 = [(2, 3), (4, 7), (6, 5), (8, 9)]; C1, X1, m1 = cov(P1); l1_, V1_ = eig_desc(C1); z1 = X1 @ (np.array([1, 1]) / math.sqrt(2))
chk("P1: mean (5,6); X rows (-3,-3),(-1,1),(1,-1),(3,3); sums 20,20,16; C = [[5,4],[4,5]]",
    list(m1) == [5, 6] and np.array_equal(X1, [[-3, -3], [-1, 1], [1, -1], [3, 3]]) and np.allclose(X1.T @ X1, [[20, 16], [16, 20]]) and np.allclose(C1, [[5, 4], [4, 5]]))
chk("P1: λ = 9, 1 (sum 10, product 9 = 25-16); scores -4.243, 0, 0, 4.243; spread 36/4 = 9; share 90 %",
    np.allclose(l1_, [9, 1]) and np.allclose(np.round(z1, 3), [-4.243, 0, 0, 4.243]) and close(np.var(z1), 9) and close(9 / 10, .9) and close(3 * math.sqrt(2), 4.2426, 1e-4))
chk("P2: (5-λ)(8-λ)-4 = λ²-13λ+36 → 9, 4; w₂ = (-2,1)/√5; 9/13 = 69.2 %; Var(x₁+2x₂) = 5+32+8 = 45",
    np.allclose(np.poly(Cc), [1, -13, 36]) and np.allclose(Cc @ [-2, 1], [-8, 4]) and r(9 / 13 * 100, 1) == 69.2 and 5 + 4 * 8 + 4 * 2 == 45)
xo = xr * sd + mu
chk("P3 (d): back to original units (6.64, 18.8); raw squared error 0.4096 + 1.44 = 1.8496 (≠ 0.16)",
    np.allclose(xo, [6.64, 18.8]) and close(np.sum((np.array([6, 20]) - xo) ** 2), 1.8496) and close(.64 ** 2, .4096) and close(1.2 ** 2, 1.44))
C4 = np.array([[4, 2, 0], [2, 4, 0], [0, 0, 3.]]); l4, V4 = eig_desc(C4)
WW = np.column_stack([[1 / math.sqrt(2), 1 / math.sqrt(2), 0], [0, 0, 1]])
chk("P4: λ = 6, 3, 2; trace 11; det 36 = 3·(16-4); WWᵀ = [[.5,.5,0],[.5,.5,0],[0,0,1]]; lost (x₁-x₂)/√2 has variance (4+4-4)/2 = 2",
    np.allclose(l4, [6, 3, 2]) and close(np.trace(C4), 11) and close(np.linalg.det(C4), 36) and np.allclose(WW @ WW.T, [[.5, .5, 0], [.5, .5, 0], [0, 0, 1]])
    and close(np.array([1, -1, 0]) / math.sqrt(2) @ C4 @ np.array([1, -1, 0]) / math.sqrt(2), 2) and np.allclose(C4 @ [1, 1, 0], [6, 6, 0]))
chk("P5: 1.44e8 entries, 1.152e9 bytes, D³ = 1.728e12, K 40×40 = 1,600 entries, at most 39 non-zero", 12000 ** 2 * 8 == 1.152e9 and 12000 ** 3 == 1.728e12)
chk("P6: diag(4.5, 2.1, 0.9, 0.4, 0.1); 82.5 %; M = 3 (93.75 %)", R['five'][0] == 3 and close(cum[1], 82.5))
chk("P7: λ = 4,1,0.25,0.01; 76.05 % then 95.06 %, M = 2 for 95 %; errors 5 and √26 ≈ 5.10",
    int(np.argmax(np.cumsum(lam) / lam.sum() >= .95)) + 1 == 2 and r(math.sqrt(26), 2) == 5.1)
x1s = np.array([1.11, 1.21, 1.36, 1.49, 1.63, 1.68, 1.83, 1.88, 1.95]); x2s = np.array([10, 12, 13, 15, 16, 17, 18, 19, 20.])
C8, X8, m8 = cov(np.column_stack([x1s, x2s])); l8, V8 = eig_desc(C8); b8 = V8[:, 0] * np.sign(V8[1, 0]); z8 = X8 @ b8
chk("P8: means 14.14/9 = 1.571111 and 140/9 = 15.555556; C = [[0.0794988, 0.8882716],[0.8882716, 10.0246914]]",
    close(x1s.sum(), 14.14) and close(m8[0], 1.571111, 5e-7) and close(m8[1], 15.555556, 5e-7) and np.allclose(C8, [[.0794988, .8882716], [.8882716, 10.0246914]], atol=5e-8))
chk("P8: tr 10.1041901, det 0.0079241, λ₁ = 10.103406, λ₂ = 0.000784, share 99.99 %",
    close(np.trace(C8), 10.1041901, 5e-8) and close(np.linalg.det(C8), .0079241, 5e-8) and close(l8[0], 10.103406, 5e-7) and close(l8[1], .000784, 5e-7) and r(l8[0] / l8.sum() * 100, 2) == 99.99)
bb = (l8[0] - C8[0, 0]) / C8[0, 1]
chk("P8: b = 11.284a (length 11.3289) → w₁ ≈ (0.08827, 0.99610) (slides: 0.088269, 0.996097)",
    close(bb, 11.2847, 5e-4) and close(math.hypot(1, bb), 11.3289, 5e-4) and np.allclose(np.round(b8, 5), [.08827, .99610]) and np.allclose(b8, [.088269, .996097], atol=1e-6))
chk("P8: scores -5.5746, -3.5736, -2.5642 (slides -5.57, -3.57, -2.56); item 1 rebuilt (1.0790, 10.0027)",
    np.allclose(np.round(z8[:3], 4), [-5.5746, -3.5736, -2.5642]) and np.allclose(np.round(z8[:3], 2), [-5.57, -3.57, -2.56])
    and np.allclose(np.round(m8 + z8[0] * b8, 4), [1.0790, 10.0027]) and np.allclose(np.round(z8[0] * b8, 4), [-.4921, -5.5528]))
chk("P8: slides' nine scores -5.57 … 4.46 reproduced", np.allclose(np.round(z8, 2), [-5.57, -3.57, -2.56, -.56, .45, 1.45, 2.46, 3.46, 4.46]))
rho8 = C8[0, 1] / math.sqrt(C8[0, 0] * C8[1, 1])
chk("P8 (d): spread ratio 126; correlation 0.9950; standardised λ₁ = 1.9950 along (1,1)/√2",
    r(C8[1, 1] / C8[0, 0], 0) == 126 and r(rho8, 4) == .995 and r(1 + rho8, 4) == 1.995)
xk = [np.array([1, 0.])]
for _ in range(8): v = Cc @ xk[-1]; xk.append(v / np.linalg.norm(v))
tg = [math.tan(math.atan2(2, 1) - math.atan2(v[1], v[0])) for v in xk]
chk("P9: x₁ = (5,2)/√29 = (0.92848, 0.37139); C(5,2) = (29,26), √1517 = 38.9487 → x₂ = (0.74457, 0.66755)",
    np.allclose(np.round(xk[1], 5), [.92848, .37139]) and np.allclose(Cc @ [5, 2], [29, 26]) and close(math.sqrt(1517), 38.9487, 5e-5) and np.allclose(np.round(xk[2], 5), [.74457, .66755]) and close(math.sqrt(29), 5.3852, 5e-5))
chk("P9: angles 0°, 21.80°, 41.88°; to w₁ (63.43°): 41.63°, 21.56°; tangents 2, 0.8889, 0.3951 = 2(4/9)^k",
    r(math.degrees(math.atan2(2, 5)), 2) == 21.80 and r(math.degrees(math.atan2(xk[2][1], xk[2][0])), 2) == 41.88 and r(math.degrees(math.atan2(2, 1)), 2) == 63.43
    and np.allclose(tg[:3], [2, 2 * 4 / 9, 2 * 16 / 81]) and r(tg[1], 4) == .8889 and r(tg[2], 4) == .3951
    and r(math.degrees(math.atan(tg[1])), 2) == 41.63 and r(math.degrees(math.atan(tg[2])), 2) == 21.56)
chk("P9: Rayleigh estimate x₂ᵀCx₂ = 8.3250, 7.5 % below 9; error 5 sin²21.56° = 0.675; ratio of errors (4/9)² per pass",
    r(xk[2] @ Cc @ xk[2], 4) == 8.3250 and r((9 - xk[2] @ Cc @ xk[2]) / 9 * 100, 1) == 7.5 and r(5 * math.sin(math.radians(21.557)) ** 2, 3) == .675
    and close((9 - xk[3] @ Cc @ xk[3]) / (9 - xk[2] @ Cc @ xk[2]), (4 / 9) ** 2 * (1 + (4 / 9) ** 4 * 4) / (1 + (4 / 9) ** 6 * 4), 1e-9))
kk = math.log(math.tan(math.radians(1)) / 2) / math.log(4 / 9)
chk("P9: 2(4/9)^k < tan 1° = 0.017455 ⇒ k > 5.85 ⇒ 6 passes (0.88° after six, 1.99° after five)",
    r(math.tan(math.radians(1)), 6) == .017455 and r(kk, 2) == 5.85 and r(math.degrees(math.atan(tg[6])), 2) == .88 and r(math.degrees(math.atan(tg[5])), 2) == 1.99)
chk("P10: λ₃ = 1, λ₂ = 4-1 = 3, λ₁ = 10-4 = 6; shares 60/30/10 %; two keep 90 % → M = 3 for 95 %; point errors 1.25 and 0.25 (‖x‖² = 5.25)",
    10 - 4 == 6 and 4 - 1 == 3 and (6 + 3) / 10 == .9 and 1 + .25 == 1.25 and 4 + 1 + .25 == 5.25)
Aa, Ab = np.array([2, 1, 2]) / 3, np.array([1, -2, 0]) / math.sqrt(5)
cr = np.cross([2, 1, 2], [1, -2, 0]); xp = np.array([3, 0, 3.])
chk("P11: pair A valid; B dot 0.48; C's b has length 3 (dot 0); cross (4,2,-5), length √45 = 3√5",
    close(Aa @ Aa, 1) and close(Ab @ Ab, 1) and close(Aa @ Ab, 0) and close(np.dot([.6, .8, 0], [0, .6, .8]), .48)
    and close(np.linalg.norm([2, 1, -2]), 3) and close(np.dot([1, 2, 2], [2, 1, -2]), 0) and list(cr) == [4, 2, -5] and close(np.linalg.norm(cr), 3 * math.sqrt(5)))
chk("P11 (d): (3,0,3): z₁ = 4, z₂ = 3/√5 = 1.3416; error 18 - 16 - 1.8 = 0.2 = z₃² (z₃ = -1/√5)",
    close(Aa @ xp, 4) and r(Ab @ xp, 4) == 1.3416 and close(xp @ xp - 16 - 1.8, .2) and close((cr / np.linalg.norm(cr)) @ xp, -1 / math.sqrt(5)))
X12 = np.array([[1, 2, 0, 1], [0, -1, 1, -2], [-1, -1, -1, 1.]]); K12 = X12 @ X12.T / 3; lK, UK12 = eig_desc(K12)
chk("P12: centred; XXᵀ = [[6,-4,-2],[-4,6,-2],[-2,-2,4]]; K eigenvalues 10/3, 2, 0",
    np.allclose(X12.sum(0), 0) and np.allclose(X12 @ X12.T, [[6, -4, -2], [-4, 6, -2], [-2, -2, 4]]) and np.allclose(lK, [10 / 3, 2, 0]) and close(np.trace(K12), 16 / 3))
chk("P12: XXᵀ(1,-1,0) = (10,-10,0), XXᵀ(1,1,-2) = (6,6,-12), XXᵀ(1,1,1) = 0",
    np.allclose(X12 @ X12.T @ [1, -1, 0], [10, -10, 0]) and np.allclose(X12 @ X12.T @ [1, 1, -2], [6, 6, -12]) and np.allclose(X12 @ X12.T @ [1, 1, 1], 0))
wr = X12.T @ np.array([1, -1, 0]); XtX = X12.T @ X12
chk("P12: Xᵀ(1,-1,0) = (1,3,-1,3), length √20; with unit u: √10 = √(3·10/3); w₁ ≈ (0.2236, 0.6708, -0.2236, 0.6708)",
    np.allclose(wr, [1, 3, -1, 3]) and close(np.linalg.norm(wr), math.sqrt(20)) and close(np.linalg.norm(wr / math.sqrt(2)), math.sqrt(10))
    and np.allclose(np.round(wr / np.linalg.norm(wr), 4), [.2236, .6708, -.2236, .6708]))
chk("P12: XᵀX = [[2,3,1,0],[3,6,0,3],[1,0,2,-3],[0,3,-3,6]], XᵀX(1,3,-1,3) = (10,30,-10,30)",
    np.allclose(XtX, [[2, 3, 1, 0], [3, 6, 0, 3], [1, 0, 2, -3], [0, 3, -3, 6]]) and np.allclose(XtX @ wr, 10 * wr))
w2r = X12.T @ np.array([1, 1, -2])
chk("P12: Xᵀ(1,1,-2) = (3,3,3,-3), length 6, w₂ = (1,1,1,-1)/2 with λ₂ = 2; w₁·w₂ = 0; tr C = 16/3; only 2 non-zero",
    np.allclose(w2r, [3, 3, 3, -3]) and close(np.linalg.norm(w2r), 6) and np.allclose(XtX / 3 @ (w2r / 6), 2 * w2r / 6) and close(wr @ w2r, 0)
    and close(np.trace(XtX / 3), 16 / 3) and np.sum(np.linalg.eigvalsh(XtX / 3) > 1e-9) == 2)

print("— the opening shot —")
chk("hero cloud spreads 3 : 1.2 : 0.45 → λ = 9, 1.44, 0.2025; the PC1–PC2 plane keeps 10.44/10.6425 = 98.1 %", r(10.44 / (9 + 1.44 + .2025) * 100, 1) == 98.1)

print("— the companion-12 erratum (reported to the lead, not on the page) —")
Ce = np.array([[2.5, 2.25, 1.75], [2.25, 2.5, 2.0], [1.75, 2.0, 1.7]]); le, Ve = eig_desc(Ce)
chk("its C has eigenvalues 6.285, 0.366, 0.049 (not 6.43, 0.22, 0.05)", np.allclose(np.round(le, 3), [6.285, .366, .049]))

print(f"\nALL {ok} CHECKS PASS")
