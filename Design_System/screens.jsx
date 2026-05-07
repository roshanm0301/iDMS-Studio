/* global React, Icons, StatusTag, fmtNum, FormBuilder, CodeBuilder, GraphBuilder, TestPanel, seedHistory */
const { useState: useStateE, useEffect: useEffectE } = React;

function Builder({ rule, onChange, onBack, onSave, builderStyle }) {
  const [tab, setTab] = useStateE("test"); // test | versions | settings
  const [ctx, setCtx] = useStateE({
    user:{age:34,country:"FR",tier:"pro",verified:true,signupDate:"2025-12-01"},
    order:{amount:1500,currency:"EUR",itemCount:2,region:"EU",isFirst:false},
    session:{deviceType:"desktop",riskScore:18},
  });
  const [view, setView] = useStateE(builderStyle || "form"); // form | graph | code
  useEffectE(()=>{ if (builderStyle) setView(builderStyle); }, [builderStyle]);

  return (
    <div className="content" style={{padding:0,display:"flex",flexDirection:"column",height:"100%"}}>
      <div className="page-head" style={{padding:"16px 24px",display:"flex",alignItems:"center",gap:12}}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}><Icons.ChevronRight size={14} style={{transform:"rotate(180deg)"}}/> All rules</button>
        <div style={{flex:1}}/>
        <StatusTag status={rule.status}/>
        <div className="row" style={{gap:4,padding:2,background:"var(--bg-sunken)",borderRadius:8,border:"1px solid var(--border)"}}>
          {[["form","Form"],["graph","Graph"],["code","Code"]].map(([k,lbl])=>(
            <button key={k} className="btn btn-sm" style={{
              background: view===k?"var(--bg-elev)":"transparent",
              color: view===k?"var(--text)":"var(--text-muted)",
              boxShadow: view===k?"var(--shadow-sm)":"none",
              borderRadius:6, height:26, padding:"0 10px"
            }} onClick={()=>setView(k)}>{lbl}</button>
          ))}
        </div>
        <button className="btn btn-secondary btn-sm"><Icons.Eye size={13}/> Preview</button>
        <button className="btn btn-secondary btn-sm" onClick={onSave}><Icons.Save size={13}/> Save draft</button>
        <button className="btn btn-primary btn-sm"><Icons.Globe size={13}/> Publish</button>
      </div>

      <div className="builder-wrap">
        <div className="builder-canvas">
          {view === "form" && <FormBuilder rule={rule} onChange={onChange}/>}
          {view === "graph" && (
            <>
              <div className="rule-meta">
                <div>
                  <div className="title-input" style={{padding:"4px 0"}}>{rule.name}</div>
                  <div style={{color:"var(--text-muted)",fontSize:13.5}}>{rule.description}</div>
                </div>
              </div>
              <GraphBuilder rule={rule}/>
              <div className="muted" style={{fontSize:12,marginTop:12}}>Read-only flow visualization. Switch to Form to edit.</div>
            </>
          )}
          {view === "code" && (
            <>
              <div className="rule-meta">
                <div>
                  <div className="title-input" style={{padding:"4px 0"}}>{rule.name}</div>
                  <div style={{color:"var(--text-muted)",fontSize:13.5}}>{rule.description}</div>
                </div>
              </div>
              <CodeBuilder rule={rule}/>
              <div className="muted" style={{fontSize:12,marginTop:12}}>Generated DSL. Read-only preview — Form view is canonical.</div>
            </>
          )}
        </div>

        <aside className="builder-side">
          <div className="side-tabs">
            {[["test","Test"],["versions","History"],["settings","Settings"]].map(([k,l])=>(
              <button key={k} className={`side-tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>
          {tab === "test" && (
            <div style={{padding:16}}>
              <TestPanel rule={rule} ctx={ctx} setCtx={setCtx}/>
              <div className="side-section" style={{borderBottom:0,padding:"16px 0 0",borderTop:"1px solid var(--border)",marginTop:16}}>
                <h4>Bulk simulation</h4>
                <div className="muted" style={{fontSize:12.5,marginBottom:10}}>
                  Run this rule across the last 1,000 production payloads to estimate impact.
                </div>
                <button className="btn btn-secondary btn-sm" style={{width:"100%",justifyContent:"center"}}><Icons.Play size={13}/> Run simulation</button>
                <div style={{marginTop:14,padding:12,background:"var(--bg-sunken)",borderRadius:8,fontSize:12}}>
                  <div className="kv-row"><span className="k">Estimated matches</span><span className="v tabular">34 / 1,000</span></div>
                  <div className="kv-row"><span className="k">Match rate</span><span className="v tabular">3.4%</span></div>
                  <div className="kv-row"><span className="k">Δ vs current</span><span className="v" style={{color:"var(--accent)"}}>+0.7pp</span></div>
                </div>
              </div>
            </div>
          )}
          {tab === "versions" && (
            <div style={{padding:"4px 0"}}>
              {seedHistory(rule).map((h,i)=>(
                <div key={i} style={{padding:"14px 20px",borderBottom:"1px solid var(--border)"}}>
                  <div className="row" style={{justifyContent:"space-between"}}>
                    <strong style={{fontSize:13}}>v{h.v} {i===0 && <span className="tag accent" style={{marginLeft:6}}>current</span>}</strong>
                    <span className="muted" style={{fontSize:12}}>{h.at}</span>
                  </div>
                  <div className="muted" style={{fontSize:12,marginTop:2}}>{h.kind} by {h.by}</div>
                  <div style={{fontSize:13,marginTop:6}}>{h.note}</div>
                  {h.diff && (
                    <div className="tl-diff">
                      {h.diff.rem.map((d,k)=><div key={k} className="rem">- {d}</div>)}
                      {h.diff.add.map((d,k)=><div key={k} className="add">+ {d}</div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {tab === "settings" && (
            <div style={{padding:"4px 0"}}>
              <div className="side-section">
                <h4>Metadata</h4>
                <div className="kv-row"><span className="k">ID</span><span className="v mono" style={{fontSize:11}}>{rule.id}</span></div>
                <div className="kv-row"><span className="k">Folder</span><span className="v">{rule.folder}</span></div>
                <div className="kv-row"><span className="k">Priority</span><span className="v" style={{textTransform:"capitalize"}}>{rule.priority}</span></div>
                <div className="kv-row"><span className="k">Version</span><span className="v">v{rule.version}</span></div>
                <div className="kv-row"><span className="k">Tags</span><span className="v">
                  <div className="row" style={{gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                    {rule.tags.map(t=><span key={t} className="tag">{t}</span>)}
                  </div>
                </span></div>
              </div>
              <div className="side-section">
                <h4>Behavior</h4>
                <div className="kv-row"><span className="k">Stop on match</span><span className="v"><span className="switch on"/></span></div>
                <div className="kv-row"><span className="k">Log all evaluations</span><span className="v"><span className="switch on"/></span></div>
                <div className="kv-row"><span className="k">Shadow mode</span><span className="v"><span className="switch"/></span></div>
              </div>
              <div className="side-section">
                <h4>Owners</h4>
                <div className="row" style={{gap:6,flexWrap:"wrap"}}>
                  <span className="tag">Mira K.</span>
                  <span className="tag">Adel N.</span>
                  <button className="btn btn-ghost btn-sm" style={{padding:"2px 6px",height:22}}><Icons.Plus size={11}/></button>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ===== Decision Tables =====
function DecisionTablesScreen({ onNewTable }) {
  const [rows, setRows] = useStateE([
    { region:"NA", amount:"< 500",  tier:"any",        review:"no",  discount:"0%" },
    { region:"NA", amount:">= 500", tier:"free",       review:"no",  discount:"5%" },
    { region:"NA", amount:">= 500", tier:"pro",        review:"no",  discount:"10%" },
    { region:"EU", amount:">= 1000",tier:"any",        review:"yes", discount:"0%" },
    { region:"APAC", amount:">= 750",tier:"enterprise",review:"no",  discount:"15%" },
    { region:"any", amount:">= 5000",tier:"any",       review:"yes", discount:"0%" },
  ]);
  return (
    <div className="content">
      <div className="page-head">
        <div className="page-head-row">
          <div>
            <h1 className="page-title">Decision Tables</h1>
            <div className="page-sub">Spreadsheet-style rule matrices for high-density logic</div>
          </div>
          <div className="row">
            <button className="btn btn-secondary btn-sm"><Icons.Copy size={13}/> Duplicate</button>
            <button className="btn btn-primary btn-sm" onClick={onNewTable}><Icons.Plus size={14}/> New table</button>
          </div>
        </div>
      </div>

      <div className="dtable-wrap">
        <div className="card" style={{marginBottom:16,padding:"14px 18px"}}>
          <div className="row" style={{gap:16,flexWrap:"wrap"}}>
            <div>
              <div className="muted" style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.04em"}}>Table name</div>
              <div style={{fontSize:15,fontWeight:600,marginTop:2}}>Pricing & review matrix</div>
            </div>
            <div>
              <div className="muted" style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.04em"}}>Hit policy</div>
              <div className="row" style={{gap:6,marginTop:2}}>
                <span className="tag accent">First match</span>
                <Icons.ChevronDown size={12} className="muted"/>
              </div>
            </div>
            <div>
              <div className="muted" style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.04em"}}>Status</div>
              <div style={{marginTop:2}}><StatusTag status="active"/></div>
            </div>
            <div style={{marginLeft:"auto"}}>
              <div className="muted" style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.04em"}}>Last 30d</div>
              <div className="tabular" style={{fontSize:15,fontWeight:600,marginTop:2}}>1,284,200 evals</div>
            </div>
          </div>
        </div>

        <table className="dtable">
          <thead>
            <tr>
              <th rowSpan={2} style={{width:40}}>#</th>
              <th colSpan={3} className="cond-col">Conditions (when)</th>
              <th colSpan={2} className="act-col">Actions (then)</th>
              <th rowSpan={2} style={{width:40}}></th>
            </tr>
            <tr>
              <th className="cond-col">order.region<div className="col-sub">enum</div></th>
              <th className="cond-col">order.amount<div className="col-sub">number</div></th>
              <th className="cond-col">user.tier<div className="col-sub">enum</div></th>
              <th className="act-col">review_required<div className="col-sub">boolean</div></th>
              <th className="act-col">discount_pct<div className="col-sub">string</div></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>
                <td className="row-num">{i+1}</td>
                <td><input value={r.region} onChange={e=>setRows(rs=>rs.map((x,j)=>j===i?{...x,region:e.target.value}:x))}/></td>
                <td><input value={r.amount} onChange={e=>setRows(rs=>rs.map((x,j)=>j===i?{...x,amount:e.target.value}:x))}/></td>
                <td><input value={r.tier} onChange={e=>setRows(rs=>rs.map((x,j)=>j===i?{...x,tier:e.target.value}:x))}/></td>
                <td className={r.review==="yes"?"match":""}><input value={r.review} onChange={e=>setRows(rs=>rs.map((x,j)=>j===i?{...x,review:e.target.value}:x))}/></td>
                <td><input value={r.discount} onChange={e=>setRows(rs=>rs.map((x,j)=>j===i?{...x,discount:e.target.value}:x))}/></td>
                <td style={{textAlign:"center"}}><button className="icon-btn"><Icons.Trash size={13}/></button></td>
              </tr>
            ))}
            <tr>
              <td className="row-num">+</td>
              <td colSpan={6} style={{padding:6}}>
                <button className="add-cond-btn" onClick={()=>setRows(rs=>[...rs,{region:"any",amount:"any",tier:"any",review:"no",discount:"0%"}])}>
                  <Icons.Plus/> Add row
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== Policies =====
function PoliciesScreen({ policies, onOpenPolicy, onNewPolicy }) {
  return (
    <div className="content">
      <div className="page-head">
        <div className="page-head-row">
          <div>
            <h1 className="page-title">Policies</h1>
            <div className="page-sub">Group rules into evaluation chains with a shared hit policy</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onNewPolicy}><Icons.Plus size={14}/> New policy</button>
        </div>
      </div>
      <div className="policy-grid">
        {policies.map(p=>(
          <div key={p.id} className="policy-card" onClick={()=>onOpenPolicy && onOpenPolicy(p)}>
            <div className="row" style={{justifyContent:"space-between",marginBottom:10}}>
              <div style={{width:32,height:32,borderRadius:8,background:"var(--accent-soft)",display:"grid",placeItems:"center",color:"var(--accent)"}}>
                <Icons.Layers size={16}/>
              </div>
              <StatusTag status={p.status}/>
            </div>
            <div className="pc-title">{p.name}</div>
            <div className="pc-sub">{p.description}</div>
            <div className="row" style={{gap:6,marginTop:10,flexWrap:"wrap"}}>
              <span className="tag accent">{p.strategy}</span>
              <span className="tag">{p.env}</span>
            </div>
            <div className="pc-stat-row">
              <div className="pc-stat">
                <div className="pc-stat-label">Rules</div>
                <div className="pc-stat-val">{p.rules}</div>
              </div>
              <div className="pc-stat">
                <div className="pc-stat-label">Evals 30d</div>
                <div className="pc-stat-val">{fmtNum(p.runs)}</div>
              </div>
              <div className="pc-stat">
                <div className="pc-stat-label">Match</div>
                <div className="pc-stat-val">{(p.matchRate*100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Test & Simulate (standalone) =====
function TestScreen({ rules }) {
  const [selectedId, setSelectedId] = useStateE(rules[0].id);
  const rule = rules.find(r=>r.id===selectedId);
  const [ctx, setCtx] = useStateE({
    user:{age:34,country:"FR",tier:"pro",verified:true,signupDate:"2025-12-01"},
    order:{amount:1500,currency:"EUR",itemCount:2,region:"EU",isFirst:false},
    session:{deviceType:"desktop",riskScore:18},
  });
  return (
    <div className="content">
      <div className="page-head">
        <h1 className="page-title">Test & Simulate</h1>
        <div className="page-sub">Run any rule against synthetic or replayed payloads</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:16,padding:24}}>
        <div className="card" style={{padding:0,height:"fit-content"}}>
          <div style={{padding:"10px 12px",borderBottom:"1px solid var(--border)",fontSize:12,fontWeight:600,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.04em"}}>Rules</div>
          {rules.map(r=>(
            <div key={r.id} onClick={()=>setSelectedId(r.id)} style={{
              padding:"10px 12px",fontSize:13,cursor:"pointer",borderBottom:"1px solid var(--border)",
              background: r.id===selectedId?"var(--selected)":"transparent",
              color: r.id===selectedId?"var(--accent)":"var(--text)"
            }}>
              <div style={{fontWeight:500}}>{r.name}</div>
              <div className="muted" style={{fontSize:11,marginTop:2}}>{r.folder}</div>
            </div>
          ))}
        </div>
        <div>
          <TestPanel rule={rule} ctx={ctx} setCtx={setCtx}/>
        </div>
      </div>
    </div>
  );
}

// ===== Audit history =====
function HistoryScreen({ rules }) {
  const events = rules.flatMap(r => [
    { rule:r, kind:"edit", who:r.editor, when:r.lastEdited, note:"Updated condition threshold" },
    { rule:r, kind:"publish", who:r.editor, when:"yesterday", note:"Published v"+r.version },
  ]).slice(0, 10);
  return (
    <div className="content">
      <div className="page-head">
        <h1 className="page-title">Audit Log</h1>
        <div className="page-sub">Every rule change, with diffs, attribution, and rollback</div>
      </div>
      <div className="timeline">
        {events.map((e,i)=>(
          <div key={i} className="tl-item">
            <div className="tl-icon" style={{
              background: e.kind==="publish"?"var(--green-soft)":"var(--accent-soft)",
              borderColor:"transparent",
              color: e.kind==="publish"?"var(--green)":"var(--accent)"
            }}>
              {e.kind==="publish" ? <Icons.Globe size={14}/> : <Icons.Edit size={13}/>}
            </div>
            <div className="tl-card">
              <div className="tl-meta">
                <strong style={{color:"var(--text)"}}>{e.who}</strong>
                <span>·</span>
                <span>{e.when}</span>
                <span>·</span>
                <span className="tag" style={{textTransform:"capitalize"}}>{e.kind}</span>
              </div>
              <div className="tl-action">{e.note} on <strong>{e.rule.name}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.Builder = Builder;
window.DecisionTablesScreen = DecisionTablesScreen;
window.PoliciesScreen = PoliciesScreen;
window.TestScreen = TestScreen;
window.HistoryScreen = HistoryScreen;
