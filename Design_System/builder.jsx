/* global React, Icons, SCHEMA, OPS, evaluateRule */
const { useState: useStateB, useMemo: useMemoB, useRef: useRefB, useEffect: useEffectB } = React;

// ===== Field picker =====
function FieldPicker({ value, onChange, focus, onFocus, onBlur }) {
  const [open, setOpen] = useStateB(false);
  const [q, setQ] = useStateB("");
  const ref = useRefB(null);
  useEffectB(() => {
    function handle(e){ if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);
  const field = SCHEMA.find(f => f.id === value);
  const Ic = field ? Icons[field.icon] : Icons.Hash;
  const filtered = SCHEMA.filter(f => f.label.toLowerCase().includes(q.toLowerCase()));
  const groups = filtered.reduce((acc, f) => ({...acc, [f.group]: [...(acc[f.group]||[]), f]}), {});
  return (
    <div ref={ref} style={{position:"relative"}}>
      <button className={`field-select ${open?'focus':''}`} onClick={()=>setOpen(o=>!o)}>
        <Ic className="field-icon"/>
        <span className="field-name mono">{field?.label || "Choose field…"}</span>
        <span className="dim">{field?.type}</span>
      </button>
      {open && (
        <div className="dropdown">
          <div className="dropdown-search">
            <input autoFocus placeholder="Search 12 fields…" value={q} onChange={e=>setQ(e.target.value)}/>
          </div>
          <div className="dropdown-list">
            {Object.entries(groups).map(([g, items]) => (
              <div key={g}>
                <div className="dropdown-section-label">{g}</div>
                {items.map(f => {
                  const FIc = Icons[f.icon];
                  return (
                    <div
                      key={f.id}
                      className={`dropdown-item ${value===f.id?'focus':''}`}
                      onClick={()=>{ onChange(f.id); setOpen(false); setQ(""); }}
                    >
                      <FIc size={14} className="muted"/>
                      <span className="mono">{f.label}</span>
                      <span className="di-type">{f.type}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Value input (typed) =====
function ValueInput({ field, op, value, onChange }) {
  const f = SCHEMA.find(x => x.id === field);
  if (!f) return <input className="value-input" placeholder="value" value={value ?? ""} onChange={e=>onChange(e.target.value)}/>;
  if (op === "between") {
    const [a,b] = String(value ?? "").split(",");
    return (
      <div className="row" style={{gap:6}}>
        <input className="value-input" type="number" placeholder="min" value={a||""} onChange={e=>onChange(`${e.target.value},${b||""}`)}/>
        <span className="muted" style={{fontSize:11}}>and</span>
        <input className="value-input" type="number" placeholder="max" value={b||""} onChange={e=>onChange(`${a||""},${e.target.value}`)}/>
      </div>
    );
  }
  if (f.type === "boolean") {
    return (
      <select className="value-input" value={String(value)} onChange={e=>onChange(e.target.value === "true")}>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }
  if (f.type === "enum") {
    return (
      <select className="value-input" value={value ?? ""} onChange={e=>onChange(e.target.value)}>
        <option value="">Select…</option>
        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (f.type === "number") {
    return <input className="value-input" type="number" placeholder="0" value={value ?? ""} onChange={e=>onChange(Number(e.target.value))}/>;
  }
  if (f.type === "date") {
    if (op === "withinDays") return <input className="value-input" type="number" placeholder="days" value={value ?? ""} onChange={e=>onChange(Number(e.target.value))}/>;
    return <input className="value-input" type="date" value={value ?? ""} onChange={e=>onChange(e.target.value)}/>;
  }
  return <input className="value-input" placeholder="value" value={value ?? ""} onChange={e=>onChange(e.target.value)}/>;
}

// ===== Rule Builder (form-based primary) =====
function FormBuilder({ rule, onChange }) {
  const update = patch => onChange({...rule, ...patch});
  const setCond = (idx, patch) => {
    const conds = rule.conditions.map((c,i)=> i===idx ? {...c, ...patch} : c);
    update({conditions: conds});
  };
  const removeCond = idx => update({conditions: rule.conditions.filter((_,i)=>i!==idx)});
  const addCond = () => update({conditions: [...rule.conditions, {id: `c${Date.now()}`, field: SCHEMA[0].id, op: "==", value: ""}]});

  const setAct = (idx, patch) => {
    const acts = rule.actions.map((a,i)=> i===idx ? {...a, ...patch} : a);
    update({actions: acts});
  };
  const removeAct = idx => update({actions: rule.actions.filter((_,i)=>i!==idx)});
  const addAct = () => update({actions: [...rule.actions, {id:`a${Date.now()}`, type:"set", target:"", value:""}]});

  return (
    <div>
      <div className="rule-meta">
        <div>
          <input className="title-input" value={rule.name} onChange={e=>update({name: e.target.value})}/>
          <textarea className="rule-meta-desc" rows={1} value={rule.description} onChange={e=>update({description: e.target.value})} placeholder="Describe what this rule does…"/>
        </div>
        <div className="col" style={{alignItems:"flex-end"}}>
          <span className="muted" style={{fontSize:11}}>v{rule.version} · {rule.lastEdited}</span>
        </div>
      </div>

      <div className="builder-section">
        <div className="section-label">
          <span className="section-label-pill pill-when">WHEN</span>
          <span className="section-label-text">All these conditions are met</span>
        </div>
        <div className="condition-group">
          <div className="combinator-bar">
            <span>Match</span>
            <div className="combinator-toggle">
              <button className={rule.combinator==="AND"?"active":""} onClick={()=>update({combinator:"AND"})}>AND</button>
              <button className={rule.combinator==="OR"?"active":""} onClick={()=>update({combinator:"OR"})}>OR</button>
            </div>
            <span className="muted">· {rule.conditions.length} {rule.conditions.length === 1 ? "condition" : "conditions"}</span>
          </div>
          {rule.conditions.map((c, i) => {
            const f = SCHEMA.find(x=>x.id===c.field);
            const ops = OPS[f?.type] || OPS.string;
            return (
              <div key={c.id} className="cond-row">
                <div className="cond-num">{String(i+1).padStart(2,"0")}</div>
                <div className="cond-fields">
                  <FieldPicker value={c.field} onChange={v=>setCond(i,{field:v, op: (OPS[SCHEMA.find(x=>x.id===v)?.type]||OPS.string)[0].id, value:""})}/>
                  <select className="op-select" value={c.op} onChange={e=>setCond(i,{op:e.target.value})}>
                    {ops.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                  <ValueInput field={c.field} op={c.op} value={c.value} onChange={v=>setCond(i,{value:v})}/>
                </div>
                <div className="cond-actions">
                  <button className="icon-btn" onClick={()=>removeCond(i)} title="Remove"><Icons.Trash size={13}/></button>
                </div>
              </div>
            );
          })}
          <div className="add-cond-row">
            <button className="add-cond-btn" onClick={addCond}><Icons.Plus/> Add condition</button>
            <button className="add-cond-btn"><Icons.Layers size={12}/> Add nested group</button>
          </div>
        </div>
      </div>

      <div className="builder-section">
        <div className="section-label">
          <span className="section-label-pill pill-then">THEN</span>
          <span className="section-label-text">Perform these actions</span>
        </div>
        <div className="condition-group">
          {rule.actions.map((a, i) => (
            <div key={a.id} className="action-row">
              <div className="action-icon"><Icons.Zap/></div>
              <div className="action-fields">
                <select className="op-select" value={a.type} onChange={e=>setAct(i,{type:e.target.value})}>
                  <option value="set">set value</option>
                  <option value="tag">add tag</option>
                  <option value="trigger">trigger event</option>
                  <option value="reject">reject</option>
                </select>
                <input className="value-input" placeholder="target field" value={a.target} onChange={e=>setAct(i,{target:e.target.value})}/>
                <input className="value-input" placeholder="value" value={a.value} onChange={e=>setAct(i,{value:e.target.value})}/>
              </div>
              <div className="cond-actions">
                <button className="icon-btn" onClick={()=>removeAct(i)} title="Remove"><Icons.Trash size={13}/></button>
              </div>
            </div>
          ))}
          <div className="add-cond-row">
            <button className="add-cond-btn" onClick={addAct}><Icons.Plus/> Add action</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Code view (alt) =====
function CodeBuilder({ rule }) {
  const ops = rule.combinator === "OR" ? " ||" : " &&";
  return (
    <div className="code-block">
      <div><span className="cm">// {rule.description}</span></div>
      <div><span className="kw">rule</span> <span className="fn">"{rule.name}"</span> <span className="op">{`{`}</span></div>
      <div>  <span className="kw">when</span> <span className="op">(</span></div>
      {rule.conditions.map((c,i) => {
        const v = typeof c.value === "string" ? `"${c.value}"` : String(c.value);
        return (
          <div key={c.id}>    {c.field} <span className="op">{c.op}</span> <span className="num">{v}</span>{i < rule.conditions.length-1 ? <span className="op">{ops}</span> : ""}</div>
        );
      })}
      <div>  <span className="op">)</span></div>
      <div>  <span className="kw">then</span> <span className="op">{`{`}</span></div>
      {rule.actions.map(a => (
        <div key={a.id}>    <span className="fn">{a.type}</span>(<span className="str">"{a.target}"</span>, <span className="str">"{a.value}"</span>)</div>
      ))}
      <div>  <span className="op">{`}`}</span></div>
      <div><span className="op">{`}`}</span></div>
    </div>
  );
}

// ===== Graph view (alt) =====
function GraphBuilder({ rule }) {
  return (
    <div className="graph-canvas">
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)"/>
          </marker>
        </defs>
        <path d="M 130 70 L 230 70" stroke="var(--text-muted)" strokeWidth="1.5" markerEnd="url(#arr)" fill="none"/>
        {rule.conditions.map((_, i) => {
          const y = 70 + i*70;
          return <path key={i} d={`M 410 ${y} L 510 ${y}`} stroke="var(--green)" strokeWidth="1.5" markerEnd="url(#arr)" fill="none"/>;
        })}
        {rule.conditions.length > 1 && (
          <path d={`M 320 110 L 320 ${70 + (rule.conditions.length-1)*70}`} stroke="var(--text-muted)" strokeWidth="1.5" fill="none" strokeDasharray="3 3"/>
        )}
      </svg>
      <div className="graph-node start" style={{left:20, top:50}}>
        <div className="graph-node-title">▶ Input</div>
        <div className="graph-node-sub">payload</div>
      </div>
      {rule.conditions.map((c, i) => {
        const f = SCHEMA.find(x=>x.id===c.field);
        return (
          <div key={c.id} className="graph-node cond" style={{left:240, top:50 + i*70}}>
            <div className="graph-node-title">{i === 0 ? "if" : rule.combinator.toLowerCase()} condition {i+1}</div>
            <div className="graph-node-sub">{f?.label} {c.op} {String(c.value)}</div>
          </div>
        );
      })}
      {rule.actions.map((a, i) => (
        <div key={a.id} className="graph-node act" style={{left:520, top:50 + i*70}}>
          <div className="graph-node-title">{a.type}</div>
          <div className="graph-node-sub">{a.target} = {String(a.value)}</div>
        </div>
      ))}
    </div>
  );
}

// ===== Test panel (right side) =====
function TestPanel({ rule, ctx, setCtx }) {
  const sample = (preset) => {
    const presets = {
      match: { user:{age:34, country:"FR", tier:"pro", verified:true, signupDate:"2025-12-01"}, order:{amount:1500, currency:"EUR", itemCount:2, region:"EU", isFirst:false}, session:{deviceType:"desktop", riskScore:18}},
      fail:  { user:{age:34, country:"US", tier:"free", verified:true, signupDate:"2025-12-01"}, order:{amount:200, currency:"USD", itemCount:1, region:"NA", isFirst:false}, session:{deviceType:"mobile", riskScore:12}},
    };
    setCtx(presets[preset]);
  };
  const setField = (path, val) => {
    const [a,b] = path.split(".");
    setCtx({...ctx, [a]: {...(ctx[a]||{}), [b]: val}});
  };
  const result = evaluateRule(rule, ctx);

  return (
    <div className="test-panel">
      <div style={{padding:"12px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:13,fontWeight:600}}>Test inputs</div>
        <div className="row" style={{gap:6}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>sample("match")}>Sample: matches</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>sample("fail")}>Sample: fails</button>
        </div>
      </div>
      <div className="test-input-grid">
        {SCHEMA.filter(f => rule.conditions.some(c => c.field === f.id)).map(f => {
          const v = ctx[f.id.split(".")[0]]?.[f.id.split(".")[1]];
          return (
            <div key={f.id} className="field-block">
              <label className="mono">{f.label}</label>
              {f.type === "enum" ? (
                <select value={v ?? ""} onChange={e=>setField(f.id, e.target.value)}>
                  <option value="">—</option>
                  {f.options.map(o=><option key={o}>{o}</option>)}
                </select>
              ) : f.type === "boolean" ? (
                <select value={String(v)} onChange={e=>setField(f.id, e.target.value === "true")}>
                  <option value="true">true</option><option value="false">false</option>
                </select>
              ) : f.type === "number" ? (
                <input type="number" value={v ?? ""} onChange={e=>setField(f.id, Number(e.target.value))}/>
              ) : f.type === "date" ? (
                <input type="date" value={v ?? ""} onChange={e=>setField(f.id, e.target.value)}/>
              ) : (
                <input value={v ?? ""} onChange={e=>setField(f.id, e.target.value)}/>
              )}
            </div>
          );
        })}
      </div>
      <div className={`test-result ${result.matched?'matched':'unmatched'}`}>
        <div className="row" style={{justifyContent:"space-between",marginBottom:8}}>
          <div className="row" style={{gap:8}}>
            <span style={{
              width:22,height:22,borderRadius:"50%",
              background: result.matched?"var(--green)":"var(--red)",
              color:"white", display:"grid", placeItems:"center"
            }}>{result.matched ? <Icons.Check size={13}/> : <Icons.X size={12}/>}</span>
            <strong>{result.matched ? "Rule matched" : "Rule did not match"}</strong>
          </div>
          <span className="muted" style={{fontSize:12}}>evaluated in 0.3ms</span>
        </div>
        {result.matched && (
          <div style={{fontSize:12,color:"var(--text-muted)"}}>
            Would apply: {rule.actions.map(a => <span key={a.id} className="tag green" style={{marginRight:4}}>{a.type} {a.target}={String(a.value)}</span>)}
          </div>
        )}
        <div className="eval-trace">
          {result.results.map((r, i) => (
            <div key={i} className="trace-row">
              <span className={`trace-icon ${r.pass?'pass':'fail'}`}>{r.pass?'✓':'✗'}</span>
              <span className="expr">{r.cond.field} {r.cond.op} {JSON.stringify(r.cond.value)}</span>
              <span className="res">{String(r.pass)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.FormBuilder = FormBuilder;
window.CodeBuilder = CodeBuilder;
window.GraphBuilder = GraphBuilder;
window.TestPanel = TestPanel;
