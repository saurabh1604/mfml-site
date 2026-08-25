# Unit 7 · Backpropagation & Automatic Differentiation — machine verification
# of every number printed on the page and in the practice arena.
import sympy as sp
import numpy as np

ok = 0
def chk(name, cond):
    global ok
    assert cond, f"FAIL: {name}"
    ok += 1
    print(f"  ok    {name}")

x = sp.Symbol('x')
u = x**2 + sp.exp(x**2)
f = sp.sqrt(u) + sp.cos(u)
df = sp.diff(f, x)

# --- §1/§2/P8: the monster function and its backward pass ---
for xv, want in [(1, 5.98308), (2, -182.86981)]:
    a = xv**2; b = float(sp.exp(a)); c = a + b
    d = float(sp.sqrt(c)); e = float(sp.cos(c)); fv = d + e
    cbar = 1/(2*d) - float(sp.sin(c)); bbar = cbar
    abar = bbar*b + cbar; xbar = abar*2*xv
    chk(f"graph backward pass at x={xv} matches sympy",
        abs(xbar - float(df.subs(x, xv))) < 1e-9 and abs(xbar - want) < 1e-4)
a=1; b=float(sp.exp(1)); c=1+b; d=float(sp.sqrt(c)); e=float(sp.cos(c))
chk("P8 forward values", abs(b-2.7183)<1e-4 and abs(c-3.7183)<1e-4 and
    abs(d-1.9283)<1e-4 and abs(e+0.8383)<1e-4 and abs(d+e-1.0900)<1e-4)
cbar=1/(2*d)-float(sp.sin(c))
chk("P8 cbar = 0.8045 (0.2593 + 0.5452)", abs(cbar-0.8045)<2e-4 and abs(1/(2*d)-0.2593)<1e-4
    and abs(float(sp.sin(c))+0.5452)<1e-4)
abar=cbar*b+cbar; chk("P8 abar = 2.9915", abs(abar-2.9915)<2e-4)
chk("P8 xbar = 5.9831", abs(abar*2-5.9831)<3e-4)
chk("errata: companion's cos(58.6)=0.83 is wrong; radians give -0.46",
    abs(float(sp.cos(sp.Float('58.5982'))) + 0.46) < 0.01)
chk("closed-form factor 2x+2xe^{x^2} at 1 = 7.4366", abs(2+2*float(sp.exp(1))-7.4366)<1e-3)

# --- §3/P3: f = uv, u = x^2+y, v = x-y ---
X, Y = sp.symbols('X Y')
u3 = X**2 + Y; v3 = X - Y; f3 = u3*v3
chk("paths: df/dx(1,1) = 2", sp.diff(f3, X).subs({X:1, Y:1}) == 2)
chk("paths: df/dy(1,1) = -2", sp.diff(f3, Y).subs({X:1, Y:1}) == -2)
chk("paths: expansion x^3-x^2y+xy-y^2", sp.expand(f3) == X**3 - X**2*Y + X*Y - Y**2)

# --- §5/P2: the neuron ---
w, xx, bb, y = sp.symbols('w x b y')
z = w*xx + bb; aa = sp.tanh(z); L = sp.Rational(1,2)*(aa - y)**2
S = {w: 0.5, xx: 1, bb: 0, y: 1}
av = float(aa.subs(S))
chk("neuron forward z=0.5, a=0.4621, L=0.1447",
    abs(float(z.subs(S))-0.5)<1e-12 and abs(av-0.4621)<1e-4 and abs(float(L.subs(S))-0.1447)<1e-4)
delta = (av-1)*(1-av**2)
chk("neuron delta = -0.4230", abs(delta+0.4230)<1e-4)
chk("neuron dL/dw = dL/db = -0.4230, dL/dx = -0.2115",
    abs(float(sp.diff(L,w).subs(S))+0.4230)<1e-4 and abs(float(sp.diff(L,bb).subs(S))+0.4230)<1e-4
    and abs(float(sp.diff(L,xx).subs(S))+0.2115)<1e-4)

# --- §6 widget: the 2x2 layer ---
sig = lambda t: 1/(1+np.exp(-t))
A = np.array([[1,-1],[2,0]]); bv = np.array([0,1]); xv2 = np.array([1,0.5]); da = np.array([0.6,-0.4])
Z = A@xv2 + bv; av2 = sig(Z); s = av2*(1-av2); dz = da*s
chk("layer forward Z=(0.5,3), a=(0.622,0.953)",
    np.allclose(Z,[0.5,3]) and np.allclose(np.round(av2,3),[0.622,0.953]))
chk("layer a(1-a)=(0.235,0.045)", np.allclose(np.round(s,3),[0.235,0.045]))
chk("layer dz=(0.141,-0.018)", np.allclose(np.round(dz,3),[0.141,-0.018]))
chk("layer dA outer product", np.allclose(np.round(np.outer(dz,xv2),3),[[0.141,0.071],[-0.018,-0.009]]))
chk("layer dx = A^T dz = (0.105,-0.141)", np.allclose(np.round(A.T@dz,3),[0.105,-0.141]))

# --- §7/P7/c9: cookbook identities ---
x1, x2 = sp.symbols('x1 x2'); B = sp.Matrix([[1,2],[3,4]]); xs = sp.Matrix([x1,x2])
q = (xs.T*B*xs)[0]
chk("c9: grad x^TBx = [2x1+5x2, 5x1+8x2]",
    sp.expand(sp.diff(q,x1)) == 2*x1+5*x2 and sp.expand(sp.diff(q,x2)) == 5*x1+8*x2)
chk("P7a expansion x1^2+5x1x2+4x2^2", sp.expand(q) == x1**2+5*x1*x2+4*x2**2)
X11,X12,X21,X22 = sp.symbols('X11 X12 X21 X22')
Xm = sp.Matrix([[X11,X12],[X21,X22]])
aXb = (sp.Matrix([[1,2]])*Xm*sp.Matrix([3,1]))[0]
chk("P7b a^TXb = 3X11+X12+6X21+2X22 with grad ab^T=[[3,1],[6,2]]",
    sp.expand(aXb) == 3*X11+X12+6*X21+2*X22 and
    [sp.diff(aXb,v) for v in (X11,X12,X21,X22)] == [3,1,6,2])
# least-squares identity (symbolic, random symmetric W)
s1,s2 = sp.symbols('s1 s2')
Am = sp.Matrix([[1,0],[2,1],[0,3]]); Wm = sp.Matrix([[2,0,1],[0,1,0],[1,0,3]])
xv3 = sp.Matrix([1,2,0]); sv = sp.Matrix([s1,s2])
E = ((xv3-Am*sv).T*Wm*(xv3-Am*sv))[0]
grE = sp.Matrix([[sp.diff(E,s1), sp.diff(E,s2)]])
chk("cookbook: d/ds (x-As)^T W (x-As) = -2(x-As)^T W A",
    sp.simplify(grE - (-2*(xv3-Am*sv).T*Wm*Am)) == sp.zeros(1,2))

# --- P1: linear layer + squared loss ---
W1 = np.array([[1,2],[0,1],[-1,1]]); xp = np.array([1,1]); t = np.array([1,0,2])
zp = W1@xp; r = zp - t
chk("P1 forward z=(3,1,0), r=(2,1,-2), g=4.5",
    np.allclose(zp,[3,1,0]) and np.allclose(r,[2,1,-2]) and abs(0.5*r@r-4.5)<1e-12)
chk("P1 grad_x = W^T r = (4,3)", np.allclose(W1.T@r,[4,3]))

# --- P5: log(1+x^Tx) ---
xa, xb = sp.symbols('xa xb')
fa = sp.log(1+xa**2+xb**2)
chk("P5 grad = 2x^T/(1+x^Tx); at (1,2) = (1/3,2/3)",
    sp.simplify(sp.diff(fa,xa)-2*xa/(1+xa**2+xb**2)) == 0 and
    sp.diff(fa,xa).subs({xa:1,xb:2}) == sp.Rational(1,3) and
    sp.diff(fa,xb).subs({xa:1,xb:2}) == sp.Rational(2,3))

# --- P6: sin(Ax+b) Jacobian ---
A6 = sp.Matrix([[1,2],[0,1]]); b6 = sp.Matrix([0,1]); x6 = sp.Matrix([xa,xb])
f6 = (A6*x6+b6).applyfunc(sp.sin)
chk("P6 J = diag(cos(Ax+b)) A",
    sp.simplify(f6.jacobian(x6) - sp.diag(*[sp.cos(v) for v in (A6*x6+b6)])*A6) == sp.zeros(2,2))

# --- §9/c11: linearization ---
g1 = sp.sqrt(x**2+9)
chk("lin: f(-4)=5, f'(-4)=-4/5", g1.subs(x,-4) == 5 and sp.diff(g1,x).subs(x,-4) == sp.Rational(-4,5))
chk("lin: L(-3.5)=4.6 vs true 4.6098",
    abs((5-sp.Rational(4,5)*(-3.5+4))-4.6) < 1e-12 and abs(float(g1.subs(x,-3.5))-4.6098) < 1e-4)
ex, ey = sp.symbols('ex ey'); g2 = sp.exp(ex)*sp.cos(ey)
chk("c11: e^x cos y at (0,0): value 1, grad (1,0), L=1+x",
    g2.subs({ex:0,ey:0}) == 1 and sp.diff(g2,ex).subs({ex:0,ey:0}) == 1 and sp.diff(g2,ey).subs({ex:0,ey:0}) == 0)

# --- §10: gradient-checker facts ---
fn = lambda t: np.sqrt(t*t+np.exp(t*t)) + np.cos(t*t+np.exp(t*t))
EX = float(df.subs(x,1))
h = 1e-5; est = (fn(1+h)-fn(1-h))/(2*h)
chk("checker: at h=1e-5 error < 1e-8", abs(est-EX) < 1e-8)
h = 1e-11; est2 = (fn(1+h)-fn(1-h))/(2*h)
chk("checker: at h=1e-11 error worse than at 1e-5", abs(est2-EX) > abs(est-EX))

# --- §8: reuse counts ---
K = 8
chk("reuse: naive = sum(i+2) = 44, backprop = 2K = 16 at K=8",
    sum(i+2 for i in range(K)) == 44 and 2*K == 16)

print("=" * 60)
print(f"ALL {ok} UNIT-7 MATH CHECKS PASS ✓")
