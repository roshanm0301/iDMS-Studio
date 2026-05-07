/* global React, Icons */
const { useState: useStateD, useMemo: useMemoD } = React;

// ===== Dashboard =====
function Dashboard({ rules, policies, onOpenRule, onNew }) {
  const totals = {
    runs: rules.reduce((s,r)=>s+r.runs,0),
    matches: rules.reduce((s,r)=>s+Math.round(r.runs*r.matchRate),0),
    active: rules.filter(r=>r.status==="active").length,
    drafts: rules.filter(r=>r.status==="draft").length,
  };
  const series = useMemoD(()=> Array.from({length:24},(_,i)=>{
    const base = 60 + Math.sin(i/3)*22 + (i>16?20:0);
    return Math.round(base + (Math.random()*16-8));
  }),[]);
  const max = Math.max(...series);

  const recent = [...rules].sort((a,b)=>b.runs-a.runs).slice(0,5);

  return (
    <div className="content">
      <div className="page-head">
        <div className="page-head-row">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <div className="page-sub">Activity across all rules in <strong>Production</strong> · last 24 hours</div>
          </div>
          <div className="row">
            <button className="btn btn-secondary btn-sm"><Icons.Globe size={13}/> prod</button>
            <button className="btn btn-primary btn-sm" onClick={onNew}><Icons.Plus size={14}/> New rule</button>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <Kpi label="Evaluations" value={fmt(totals.runs)} delta="+12.4%" up spark={series}/>
        <Kpi label="Matches" value={fmt(totals.matches)} delta="+3.1%" up spark={series.map(v=>v*0.18)} />
        <Kpi label="Active rules" value={String(totals.active)} delta="+2" up spark={null} flat={`${rules.length} total`} />
        <Kpi label="P95 latency" value="3.4ms" delta="-0.2ms" up spark={null} flat="Edge runtime"/>
      </div>

      <div className="dash-row">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Throughput · last 24h</div>
            <div className="row" style={{gap:12}}>
              <span className="muted" style={{fontSize:12}}><span className="dot" style={{background:"var(--accent)",marginRight:6}}/>Evaluations</span>
              <span className="muted" style={{fontSize:12}}><span className="dot" style={{background:"var(--border-strong)",marginRight:6}}/>Avg</span>
            </div>
          </div>
          <div style={{padding:"20px 24px"}}>
            <div className="bar-chart">
              {series.map((v,i)=>(
                <div key={i} className="bar" style={{height:`${(v/max)*100}%`}} title={`${i}:00 — ${v} evals/s`}/>
              ))}
            </div>
            <div className="row" style={{justifyContent:"space-between",marginTop:8,fontSize:11,color:"var(--text-subtle)"}}>
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>now</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Top rules by traffic</div>
            <button className="btn btn-ghost btn-sm">View all</button>
          </div>
          <div style={{padding:"4px 0"}}>
            {recent.map(r=>(
              <div key={r.id} onClick={()=>onOpenRule(r)} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:12,padding:"10px 20px",cursor:"pointer",borderBottom:"1px solid var(--border)"}} className="hover-row">
                <div style={{minWidth:0}}>
                  <div className="rule-name" style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div>
                  <div className="rule-desc">{fmt(r.runs)} evals · {(r.matchRate*100).toFixed(1)}% match</div>
                </div>
                <StatusTag status={r.status}/>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-row-3">
        <div className="card">
          <div className="card-head"><div className="card-title">Policy health</div></div>
          <div style={{padding:"4px 0"}}>
            {policies.slice(0,4).map(p=>(
              <div key={p.id} style={{padding:"10px 20px",borderBottom:"1px solid var(--border)"}}>
                <div className="row" style={{justifyContent:"space-between"}}>
                  <div className="rule-name">{p.name}</div>
                  <span className="muted tabular" style={{fontSize:12}}>{p.rules} rules</span>
                </div>
                <div style={{height:6,background:"var(--bg-sunken)",borderRadius:999,marginTop:8,overflow:"hidden"}}>
                  <div style={{width:`${Math.round(p.matchRate*100)}%`,height:"100%",background:"var(--accent)",borderRadius:999}}/>
                </div>
                <div className="row" style={{justifyContent:"space-between",marginTop:6,fontSize:11,color:"var(--text-muted)"}}>
                  <span>{(p.matchRate*100).toFixed(1)}% match rate</span>
                  <span className="tabular">{fmt(p.runs)} runs</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Recent changes</div></div>
          <div style={{padding:"4px 0"}}>
            {[
              {who:"Mira K.", what:"updated", target:"Flag high-value international orders", when:"2h ago"},
              {who:"You", what:"created", target:"Block high-risk sessions", when:"12m ago"},
              {who:"Adel N.", what:"published", target:"First-order discount eligibility", when:"yesterday"},
              {who:"Kai R.", what:"paused", target:"Inactive user re-engagement", when:"2 days ago"},
            ].map((e,i)=>(
              <div key={i} style={{padding:"10px 20px",borderBottom:"1px solid var(--border)",display:"flex",gap:10,alignItems:"flex-start"}}>
                <div className="ws-avatar" style={{width:24,height:24,fontSize:10,borderRadius:6}}>{e.who.slice(0,2)}</div>
                <div style={{flex:1,minWidth:0,fontSize:13}}>
                  <div><strong>{e.who}</strong> <span className="muted">{e.what}</span> {e.target}</div>
                  <div className="muted" style={{fontSize:11,marginTop:2}}>{e.when}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Errors & warnings</div></div>
          <div style={{padding:"4px 0"}}>
            {[
              {kind:"warn", msg:"Field user.signupDate referenced but missing in 0.2% of payloads", target:"Inactive user re-engagement"},
              {kind:"err", msg:"Type mismatch: expected number, got string", target:"Flag high-value international orders"},
              {kind:"warn", msg:"Rule never matched in last 7 days", target:"APAC currency"},
            ].map((e,i)=>(
              <div key={i} style={{padding:"10px 20px",borderBottom:"1px solid var(--border)",display:"flex",gap:10,alignItems:"flex-start"}}>
                <span className={`tag ${e.kind==='err'?'red':'amber'}`} style={{textTransform:"uppercase",fontSize:10}}>{e.kind}</span>
                <div style={{flex:1,minWidth:0,fontSize:13}}>
                  <div>{e.msg}</div>
                  <div className="muted" style={{fontSize:11,marginTop:2}}>{e.target}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({label, value, delta, up, spark, flat}) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className={`kpi-delta ${up?'up':'down'}`}>
        {up ? <Icons.ArrowUp size={12}/> : <Icons.ArrowDown size={12}/>}
        {delta}
        {flat && <span className="muted" style={{marginLeft:8,fontWeight:400}}>· {flat}</span>}
      </div>
      {spark && (
        <svg className="kpi-spark" viewBox={`0 0 ${spark.length*4} 36`} preserveAspectRatio="none">
          <path
            d={spark.map((v,i)=>`${i===0?'M':'L'} ${i*4} ${36 - (v/Math.max(...spark))*32}`).join(' ')}
            fill="none" stroke="var(--accent)" strokeWidth="1.5"
          />
          <path
            d={`${spark.map((v,i)=>`${i===0?'M':'L'} ${i*4} ${36 - (v/Math.max(...spark))*32}`).join(' ')} L ${(spark.length-1)*4} 36 L 0 36 Z`}
            fill="var(--accent)" opacity="0.08"
          />
        </svg>
      )}
    </div>
  );
}

function StatusTag({status}) {
  const map = {
    active:    { cls:"green",  label:"Active" },
    draft:     { cls:"amber",  label:"Draft" },
    paused:    { cls:"red",    label:"Paused" },
    archived:  { cls:"",       label:"Archived" },
  };
  const m = map[status] || map.draft;
  return <span className={`tag ${m.cls}`}><span className="dot"/>{m.label}</span>;
}

function fmt(n) {
  if (n >= 1e6) return (n/1e6).toFixed(2)+"M";
  if (n >= 1e3) return (n/1e3).toFixed(1)+"K";
  return String(n);
}

window.Dashboard = Dashboard;
window.StatusTag = StatusTag;
window.fmtNum = fmt;
