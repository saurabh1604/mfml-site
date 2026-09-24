/* ================= UNIT 13 · the solver: a small, exact, deterministic SVM =================
   SMO with second-order working-set selection (the LIBSVM rule), a box constraint C (hard margin = C left out, or C ≥ 1e6),
   a linear / (xᵀz)^d / (xᵀz+1)^d / RBF kernel, capped iterations, and an exact "polish" step:
   once SMO has found which points are free, bounded or idle, it solves that KKT system by Gaussian
   elimination, so the answers print as 0.03125 rather than 0.0312499. No randomness anywhere. */
const SVM=(function(){
  const HARD=1e6, TAU=1e-12;
  const dot=(a,b)=>{ let s=0; for(let k=0;k<a.length;k++) s+=a[k]*b[k]; return s; };
  function kfun(spec){ spec=spec||{}; const t=spec.type||'lin', d=spec.d==null?2:spec.d, g=spec.gamma==null?1:spec.gamma;
    if(t==='lin') return (a,b)=>dot(a,b);
    if(t==='poly') return (a,b)=>Math.pow(dot(a,b),d);
    if(t==='polyc') return (a,b)=>Math.pow(dot(a,b)+1,d);
    if(t==='rbf') return (a,b)=>{ let s=0; for(let k=0;k<a.length;k++){ const e=a[k]-b[k]; s+=e*e; } return Math.exp(-g*s); };
    throw new Error('unknown kernel '+t); }
  /* X: array of points (arrays), y: ±1 labels, o: {kernel:{type,d,gamma}, C, eps, maxIter} */
  function solve(X,y,o){ o=o||{}; const n=X.length, hard=o.C==null||o.C>=HARD, C=hard?(o.hardCap||1e3):o.C, eps=o.eps==null?1e-10:o.eps, maxIter=o.maxIter==null?(hard?Math.max(4000,100*n):Math.max(20000,200*n)):o.maxIter;
    const K=kfun(o.kernel), t0=(typeof performance!=='undefined'?performance.now():Date.now());
    const out={n,alpha:new Array(n).fill(0),b:0,iter:0,ok:true,msg:'',C,kernel:o.kernel||{type:'lin'},X:X.map(p=>p.slice()),y:y.slice()};
    if(n<2||!y.some(v=>v>0)||!y.some(v=>v<0)){ out.ok=false; out.msg='needs at least one point of each class'; out.f=()=>0; return out; }
    /* the kernel matrix and Q = y_i y_j K_ij */
    const KM=[]; for(let i=0;i<n;i++){ KM.push(new Float64Array(n)); } for(let i=0;i<n;i++) for(let j=i;j<n;j++){ const v=K(X[i],X[j]); KM[i][j]=v; KM[j][i]=v; }
    const QD=new Float64Array(n); for(let i=0;i<n;i++) QD[i]=KM[i][i];
    const a=new Float64Array(n), G=new Float64Array(n).fill(-1);
    const up=t=>a[t]>=C, lo=t=>a[t]<=0;
    let it=0;
    for(;it<maxIter;it++){
      /* select i: the most violating index from I_up */
      let Gmax=-Infinity, Gmax2=-Infinity, ii=-1, jj=-1, omin=Infinity;
      for(let t=0;t<n;t++){ if(y[t]>0){ if(!up(t)&&-G[t]>=Gmax){ Gmax=-G[t]; ii=t; } } else { if(!lo(t)&&G[t]>=Gmax){ Gmax=G[t]; ii=t; } } }
      if(ii<0) break;
      for(let j=0;j<n;j++){
        if(y[j]>0){ if(!lo(j)){ const gd=Gmax+G[j]; if(G[j]>=Gmax2) Gmax2=G[j];
            if(gd>0){ const q=QD[ii]+QD[j]-2*y[ii]*y[ii]*y[j]*KM[ii][j]; const ob=-(gd*gd)/(q>0?q:TAU); if(ob<=omin){ jj=j; omin=ob; } } } }
        else { if(!up(j)){ const gd=Gmax-G[j]; if(-G[j]>=Gmax2) Gmax2=-G[j];
            if(gd>0){ const q=QD[ii]+QD[j]+2*y[ii]*y[ii]*y[j]*KM[ii][j]; const ob=-(gd*gd)/(q>0?q:TAU); if(ob<=omin){ jj=j; omin=ob; } } } } }
      if(Gmax+Gmax2<eps||jj<0) break;
      const i=ii, j=jj, Qij=y[i]*y[j]*KM[i][j], oi=a[i], oj=a[j];
      if(y[i]!==y[j]){ let q=QD[i]+QD[j]+2*Qij; if(q<=0) q=TAU; const d=(-G[i]-G[j])/q, diff=a[i]-a[j]; a[i]+=d; a[j]+=d;
        if(diff>0){ if(a[j]<0){ a[j]=0; a[i]=diff; } } else { if(a[i]<0){ a[i]=0; a[j]=-diff; } }
        if(diff>0){ if(a[i]>C){ a[i]=C; a[j]=C-diff; } } else { if(a[j]>C){ a[j]=C; a[i]=C+diff; } } }
      else { let q=QD[i]+QD[j]-2*Qij; if(q<=0) q=TAU; const d=(G[i]-G[j])/q, sum=a[i]+a[j]; a[i]-=d; a[j]+=d;
        if(sum>C){ if(a[i]>C){ a[i]=C; a[j]=sum-C; } } else { if(a[j]<0){ a[j]=0; a[i]=sum; } }
        if(sum>C){ if(a[j]>C){ a[j]=C; a[i]=sum-C; } } else { if(a[i]<0){ a[i]=0; a[j]=sum; } } }
      const di=a[i]-oi, dj=a[j]-oj;
      for(let k=0;k<n;k++) G[k]+=y[i]*y[k]*KM[i][k]*di+y[j]*y[k]*KM[j][k]*dj;
    }
    out.iter=it; if(it>=maxIter){ out.ok=false; out.msg='the solver stopped after '+maxIter+' steps without settling'; }
    /* b from the free points (LIBSVM's rho), else the middle of the allowed interval */
    let ub=Infinity, lb=-Infinity, nf=0, sf=0;
    for(let i=0;i<n;i++){ const yG=y[i]*G[i];
      if(a[i]>=C){ if(y[i]<0) ub=Math.min(ub,yG); else lb=Math.max(lb,yG); }
      else if(a[i]<=0){ if(y[i]>0) ub=Math.min(ub,yG); else lb=Math.max(lb,yG); }
      else { nf++; sf+=yG; } }
    let b=-(nf>0?sf/nf:(ub+lb)/2);
    let al=Array.from(a);
    /* polish, stage 1: an exact b from the KKT system on the free set (skipped when that system is singular) */
    const mx=Math.max(...al), tol=Math.max(1e-9,1e-7*mx), atC=v=>v>=C-Math.max(tol,1e-9*C);
    const F=[], B=[]; for(let i=0;i<n;i++){ if(atC(al[i])) B.push(i); else if(al[i]>tol) F.push(i); }
    if(F.length){ const m=F.length+1, M=[]; for(let r=0;r<m;r++) M.push(new Float64Array(m+1));
      F.forEach((i,r)=>{ F.forEach((j,c)=>{ M[r][c]=y[i]*y[j]*KM[i][j]; }); M[r][m-1]=y[i]; let rhs=1; B.forEach(j=>{ rhs-=y[i]*y[j]*KM[i][j]*C; }); M[r][m]=rhs; });
      F.forEach((j,c)=>{ M[m-1][c]=y[j]; }); M[m-1][m-1]=0; let r2=0; B.forEach(j=>{ r2-=y[j]*C; }); M[m-1][m]=r2;
      const sol=gauss(M);
      if(sol&&F.every((i,r)=>sol[r]>=-1e-10&&sol[r]<=C+1e-10)){ F.forEach((i,r)=>{ al[i]=Math.max(0,sol[r]); }); b=sol[m-1]; out.polished=true; }
      else { let s=0; F.forEach(i=>{ let v=y[i]; for(let j=0;j<n;j++) v-=al[j]*y[j]*KM[j][i]; s+=v; }); b=s/F.length; } }
    /* polish, stage 2: when several multiplier sets give the same machine (two points that look identical to the kernel,
       or a symmetric data set), report the one with the smallest total size — the symmetric answer a person writes down */
    const clean0=v=>{ const r=Math.round(v*1e10)/1e10; return Math.abs(r-v)<1e-11?r:v; }; b=clean0(b);
    { const zs=[]; for(let i=0;i<n;i++){ let s=b; for(let j=0;j<n;j++) s+=al[j]*y[j]*KM[j][i]; zs.push(y[i]*s); }
      const T=[]; for(let i=0;i<n;i++) if(!atC(al[i])&&Math.abs(zs[i]-1)<1e-7) T.push(i);
      if(T.length>=2){ const A=[], r=[];
        T.forEach(i=>{ const row=T.map(j=>y[i]*y[j]*KM[i][j]); let rhs=1-y[i]*b; B.forEach(j=>{ rhs-=y[i]*y[j]*KM[i][j]*C; }); A.push(row); r.push(rhs); });
        A.push(T.map(j=>y[j])); let r2=0; B.forEach(j=>{ r2-=y[j]*C; }); r.push(r2);
        const mn=minNorm(A,r);
        if(mn&&mn.every(v=>v>=-1e-10&&v<=C+1e-10)){ const cand=al.slice(); T.forEach((i,k)=>{ cand[i]=Math.max(0,mn[k]); });
          let good=true; for(let i=0;i<n;i++){ let s=b; for(let j=0;j<n;j++) s+=cand[j]*y[j]*KM[j][i]; const z=y[i]*s; if(cand[i]<=1e-12&&z<1-1e-7) good=false; if(cand[i]>1e-12&&!atC(cand[i])&&Math.abs(z-1)>1e-7) good=false; }
          if(good){ al=cand; out.minnorm=true; } } } }
    const clean=v=>{ const r=Math.round(v*1e10)/1e10; return Math.abs(r-v)<1e-11?r:v; };
    out.alpha=al.map(v=>v<1e-12?0:clean(v)); out.b=clean(b);
    out.K=K; out.KM=KM;
    out.f=x=>{ let s=out.b; for(let i=0;i<n;i++) if(out.alpha[i]>0) s+=out.alpha[i]*y[i]*K(X[i],x); return s; };
    out.score=out.X.map((x,i)=>y[i]*out.f(x));
    out.sv=out.alpha.map(v=>v>1e-9);
    out.nsv=out.sv.filter(Boolean).length;
    out.bounded=out.alpha.map(v=>!hard&&v>=C-1e-9); out.hard=hard; out.C=hard?Infinity:C;
    if(!o.kernel||o.kernel.type==='lin'||!o.kernel.type){ const d=X[0].length, w=new Array(d).fill(0); for(let i=0;i<n;i++) for(let k=0;k<d;k++) w[k]+=out.alpha[i]*y[i]*X[i][k]; out.w=w.map(clean); out.wn=Math.hypot(...out.w); out.width=out.wn>0?2/out.wn:Infinity; }
    let Q=0, S=0; for(let i=0;i<n;i++){ S+=out.alpha[i]; for(let j=0;j<n;j++) Q+=out.alpha[i]*out.alpha[j]*y[i]*y[j]*KM[i][j]; }
    out.dual=S-Q/2; out.wsq=Q; out.slack=out.score.map(z=>Math.max(0,1-z)); out.slackSum=out.slack.reduce((p,q)=>p+q,0);
    out.primal=Q/2+(hard?0:C*out.slackSum);
    /* hard margin is solved as a soft margin with a huge fine (1 000 per unit). If even that fine leaves a point inside
       the street, no street at all exists (or it would be under about 0.06 wide): the classes overlap. */
    out.infeasible=hard&&(!out.ok||out.slackSum>1e-7||out.alpha.some(v=>v>=C*(1-1e-9)));
    if(out.infeasible){ out.ok=false; out.msg='no street exists: the classes overlap, so no line clears every point'; }
    out.ms=(typeof performance!=='undefined'?performance.now():Date.now())-t0;
    return out; }
  /* the smallest-norm solution of A x = r (rows may be dependent): reduce to independent rows, then x = Aᵀ (A Aᵀ)⁻¹ r */
  function minNorm(A,r){ const R=A.map((row,i)=>row.concat([r[i]])), m=R.length, c=A[0].length, keep=[]; let row=0;
    const sc=Math.max(1,...A.map(rw=>Math.max(...rw.map(Math.abs))));
    for(let col=0;col<c&&row<m;col++){ let p=row; for(let k=row+1;k<m;k++) if(Math.abs(R[k][col])>Math.abs(R[p][col])) p=k;
      if(Math.abs(R[p][col])<1e-9*sc) continue; const t=R[p]; R[p]=R[row]; R[row]=t;
      for(let k=row+1;k<m;k++){ const f=R[k][col]/R[row][col]; if(!f) continue; for(let q=col;q<=c;q++) R[k][q]-=f*R[row][q]; } row++; }
    for(let k=row;k<m;k++) if(Math.abs(R[k][c])>1e-7*sc) return null;   /* inconsistent */
    const Ar=R.slice(0,row).map(rw=>rw.slice(0,c)), rr=R.slice(0,row).map(rw=>rw[c]);
    const M=Ar.map(u=>Ar.map(v=>u.reduce((s,x,k)=>s+x*v[k],0)).concat([0])); M.forEach((rw,i)=>{ rw[row]=rr[i]; });
    const lam=gauss(M); if(!lam) return null;
    const x=new Array(c).fill(0); Ar.forEach((rw,i)=>{ for(let k=0;k<c;k++) x[k]+=rw[k]*lam[i]; }); return x; }
  function gauss(M){ const m=M.length; for(let c=0;c<m;c++){ let p=c; for(let r=c+1;r<m;r++) if(Math.abs(M[r][c])>Math.abs(M[p][c])) p=r;
      if(Math.abs(M[p][c])<1e-11) return null; if(p!==c){ const t=M[p]; M[p]=M[c]; M[c]=t; }
      for(let r=0;r<m;r++){ if(r===c) continue; const f=M[r][c]/M[c][c]; if(!f) continue; for(let k=c;k<=m;k++) M[r][k]-=f*M[c][k]; } }
    return M.map((row,r)=>row[m]/row[r]); }
  return {solve,kfun,HARD,dot}; })();
if(typeof module!=='undefined'&&module.exports) module.exports=SVM;
