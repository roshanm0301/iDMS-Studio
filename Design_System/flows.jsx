/* global React, Icons, StatusTag, fmtNum, SCHEMA, OPS */
const { useState: useStateP, useMemo: useMemoP } = React;

/* ============================================================
   POLICY VIEW / EDIT MODE
   ============================================================ */
function PolicyDetail({ policy, allRules, onBack, onSave }) {
  const [mode, setMode] = useStateP("view"); // view | edit
  const [draft, setDraft] = useStateP({
    ...policy,
    members: policy.members || [
      { ruleId: allRules[0]?.id, weight: 100, enabled: true },
      { ruleId: allRules[1]?.id, weight: 80, enabled: true },
      { ruleId: allRules[2]?.id, weight: 60, enabled: false },
      { ruleId: allRules[3]?.id, weight: 40, enabled: true },
    ].filter(m => m.ruleId),
  });

  const update = (patch) => setDraft(d => ({ ...d, ...patch }));
  const isEdit = mode === "edit";

  const moveMember = (idx, dir) => {
    setDraft(d => {
      const m = [...d.members];
      const j = idx + dir;
      if (j < 0 || j >= m.length) return d;
      [m[idx], m[j]] = [m[j], m[idx]];
      return { ...d, members: m };
    });
  };
  const removeMember = (idx) => {
    setDraft(d => ({ ...d, members: d.members.filter((_, i) => i !== idx) }));
  };
  const toggleMember = (idx) => {
    setDraft(d => ({ ...d, members: d.members.map((m, i) => i === idx ? { ...m, enabled: !m.enabled } : m) }));
  };
  const addMember = (ruleId) => {
    setDraft(d => ({ ...d, members: [...d.members, { ruleId, weight: 50, enabled: true }] }));
  };

  const usedIds = new Set(draft.members.map(m => m.ruleId));
  const available = allRules.filter(r => !usedIds.has(r.id));

  return (
    <div className="content">
      <div className="page-head" style={{paddingBottom:18}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            <Icons.ChevronRight size={14} style={{transform:"rotate(180deg)"}}/> Policies
          </button>
          <span className="muted">/</span>
          <span style={{fontSize:13,fontWeight:500}}>{draft.name}</span>
        </div>
        <div className="page-head-row">
          <div style={{flex:1, minWidth:0}}>
            {isEdit ? (
              <input className="title-input" value={draft.name} onChange={e=>update({name:e.target.value})}/>
            ) : (
              <h1 className="page-title" style={{margin:0}}>{draft.name}</h1>
            )}
            {isEdit ? (
              <textarea className="rule-meta-desc" rows={1} value={draft.description} onChange={e=>update({description:e.target.value})}/>
            ) : (
              <div className="page-sub">{draft.description}</div>
            )}
            <div className="row" style={{gap:8,marginTop:10}}>
              <StatusTag status={draft.status}/>
              <span className="tag accent">{draft.strategy}</span>
              <span className="tag"><Icons.Globe size={11}/> {draft.env}</span>
              <span className="muted" style={{fontSize:12}}>· {draft.members.length} rules · {fmtNum(draft.runs)} evals last 30d</span>
            </div>
          </div>
          <div className="row" style={{gap:8}}>
            {isEdit ? (
              <>
                <button className="btn btn-secondary btn-sm" onClick={()=>{setDraft({...policy, members:draft.members}); setMode("view");}}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={()=>{onSave(draft); setMode("view");}}><Icons.Save size={13}/> Save changes</button>
              </>
            ) : (
              <>
                <button className="btn btn-secondary btn-sm"><Icons.Play size={13}/> Run simulation</button>
                <button className="btn btn-secondary btn-sm"><Icons.Copy size={13}/> Duplicate</button>
                <button className="btn btn-primary btn-sm" onClick={()=>setMode("edit")}><Icons.Edit size={13}/> Edit policy</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20,padding:"24px 32px"}}>
        <div className="col" style={{gap:20}}>
          {/* Configuration card */}
          <div className="card">
            <div className="card-head"><div className="card-title">Configuration</div></div>
            <div style={{padding:"16px 20px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
              <FieldDisplay
                label="Hit policy"
                editing={isEdit}
                value={draft.strategy}
                onChange={v=>update({strategy:v})}
                options={[
                  {value:"first-match", label:"First match", hint:"Stop on first matching rule"},
                  {value:"all-match", label:"All matches", hint:"Collect every match"},
                  {value:"priority", label:"Priority", hint:"Highest-weighted match wins"},
                  {value:"unique", label:"Unique", hint:"Exactly one rule must match"},
                ]}
              />
              <FieldDisplay
                label="Environment"
                editing={isEdit}
                value={draft.env}
                onChange={v=>update({env:v})}
                options={[
                  {value:"dev", label:"Development"},
                  {value:"staging", label:"Staging"},
                  {value:"prod", label:"Production"},
                ]}
              />
              <FieldDisplay
                label="Status"
                editing={isEdit}
                value={draft.status}
                onChange={v=>update({status:v})}
                options={[
                  {value:"active", label:"Active"},
                  {value:"draft", label:"Draft"},
                  {value:"paused", label:"Paused"},
                ]}
              />
              <FieldDisplay
                label="Trigger"
                editing={isEdit}
                value={draft.trigger || "on-event"}
                onChange={v=>update({trigger:v})}
                options={[
                  {value:"on-event", label:"On event"},
                  {value:"on-schedule", label:"Scheduled"},
                  {value:"on-api", label:"API call"},
                ]}
              />
            </div>
          </div>

          {/* Rules chain */}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Rule evaluation chain</div>
                <div className="muted" style={{fontSize:12,marginTop:2}}>
                  {draft.strategy === "first-match" ? "Evaluated top-to-bottom, stops on first match" :
                   draft.strategy === "priority" ? "All evaluated, highest weight wins" :
                   "All evaluated in order"}
                </div>
              </div>
              {isEdit && <button className="btn btn-ghost btn-sm"><Icons.Sort size={13}/> Auto-sort by weight</button>}
            </div>
            <div>
              {draft.members.map((m, i) => {
                const rule = allRules.find(r => r.id === m.ruleId);
                if (!rule) return null;
                return (
                  <div key={m.ruleId} style={{
                    display:"grid",
                    gridTemplateColumns: isEdit ? "32px 28px 1fr 100px 80px 32px" : "32px 1fr auto auto",
                    gap:12, alignItems:"center",
                    padding:"12px 20px", borderBottom:"1px solid var(--border)",
                    opacity: m.enabled ? 1 : 0.45,
                  }}>
                    <span className="mono muted" style={{fontSize:11, textAlign:"center"}}>{String(i+1).padStart(2,"0")}</span>
                    {isEdit && (
                      <span className="switch" data-on={m.enabled} onClick={()=>toggleMember(i)} style={{cursor:"pointer"}}>
                        <span className={`switch ${m.enabled?'on':''}`}/>
                      </span>
                    )}
                    <div style={{minWidth:0}}>
                      <div className="rule-name">{rule.name}</div>
                      <div className="rule-desc">{rule.description}</div>
                    </div>
                    {isEdit ? (
                      <div className="row" style={{gap:6}}>
                        <input
                          type="range" min="0" max="100" value={m.weight}
                          onChange={e=>setDraft(d=>({...d,members:d.members.map((x,j)=>j===i?{...x,weight:Number(e.target.value)}:x)}))}
                          style={{width:80}}
                        />
                        <span className="mono tabular" style={{fontSize:12,width:28,textAlign:"right"}}>{m.weight}</span>
                      </div>
                    ) : (
                      <div className="row" style={{gap:8}}>
                        <StatusTag status={rule.status}/>
                        <span className="muted tabular" style={{fontSize:12, minWidth:60, textAlign:"right"}}>w {m.weight}</span>
                      </div>
                    )}
                    {!isEdit && (
                      <span className="muted tabular" style={{fontSize:12}}>{(rule.matchRate*100).toFixed(1)}% match</span>
                    )}
                    {isEdit && (
                      <div className="row" style={{gap:0}}>
                        <button className="icon-btn" onClick={()=>moveMember(i,-1)} disabled={i===0}><Icons.ArrowUp size={13}/></button>
                        <button className="icon-btn" onClick={()=>moveMember(i,1)} disabled={i===draft.members.length-1}><Icons.ArrowDown size={13}/></button>
                        <button className="icon-btn" onClick={()=>removeMember(i)}><Icons.Trash size={13}/></button>
                      </div>
                    )}
                  </div>
                );
              })}
              {isEdit && available.length > 0 && (
                <div style={{padding:"12px 20px", background:"var(--bg-sunken)"}}>
                  <div className="muted" style={{fontSize:11, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:8}}>Add a rule</div>
                  <div className="row" style={{gap:6, flexWrap:"wrap"}}>
                    {available.slice(0,4).map(r => (
                      <button key={r.id} className="filter-chip" onClick={()=>addMember(r.id)}>
                        <Icons.Plus size={11}/> {r.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="col" style={{gap:16}}>
          <div className="card">
            <div className="card-head"><div className="card-title">Performance · 30d</div></div>
            <div style={{padding:"14px 18px"}}>
              <div className="kv-row"><span className="k">Evaluations</span><span className="v tabular">{fmtNum(draft.runs)}</span></div>
              <div className="kv-row"><span className="k">Match rate</span><span className="v tabular">{(draft.matchRate*100).toFixed(1)}%</span></div>
              <div className="kv-row"><span className="k">Avg latency</span><span className="v tabular">3.1 ms</span></div>
              <div className="kv-row"><span className="k">P99 latency</span><span className="v tabular">8.4 ms</span></div>
              <div className="kv-row"><span className="k">Errors</span><span className="v" style={{color:"var(--green)"}}>0</span></div>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title">Owners</div></div>
            <div style={{padding:"12px 18px"}}>
              <div className="row" style={{gap:8, flexWrap:"wrap"}}>
                <span className="tag"><span className="ws-avatar" style={{width:16,height:16,fontSize:9,borderRadius:4,marginRight:4}}>MK</span>Mira K.</span>
                <span className="tag"><span className="ws-avatar" style={{width:16,height:16,fontSize:9,borderRadius:4,marginRight:4,background:"linear-gradient(135deg,#06b6d4,#3b82f6)"}}>AN</span>Adel N.</span>
                {isEdit && <button className="filter-chip"><Icons.Plus size={11}/> Add</button>}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title">Recent activity</div></div>
            <div>
              {[
                {who:"You",  when:"just now",   what:"opened policy"},
                {who:"Mira K.", when:"2h ago",  what:"updated rule weights"},
                {who:"Adel N.", when:"yesterday", what:"published v3 to prod"},
              ].map((e,i)=>(
                <div key={i} style={{padding:"10px 18px", borderTop: i?"1px solid var(--border)":"0", fontSize:12.5}}>
                  <div><strong>{e.who}</strong> <span className="muted">{e.what}</span></div>
                  <div className="muted" style={{fontSize:11,marginTop:2}}>{e.when}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldDisplay({ label, editing, value, onChange, options }) {
  const opt = options.find(o => o.value === value);
  return (
    <div>
      <div className="muted" style={{fontSize:11, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:6}}>{label}</div>
      {editing ? (
        <select className="value-input" value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%"}}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <div>
          <div style={{fontSize:14, fontWeight:500}}>{opt?.label || value}</div>
          {opt?.hint && <div className="muted" style={{fontSize:12, marginTop:2}}>{opt.hint}</div>}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   NEW POLICY WIZARD
   ============================================================ */
function NewPolicyWizard({ allRules, onCancel, onCreate }) {
  const [step, setStep] = useStateP(1);
  const [draft, setDraft] = useStateP({
    name: "",
    description: "",
    strategy: "first-match",
    env: "staging",
    trigger: "on-event",
    members: [],
  });
  const update = patch => setDraft(d => ({...d, ...patch}));

  const canNext = step === 1 ? draft.name.trim().length > 0 : true;
  const steps = [
    { n: 1, label: "Basics" },
    { n: 2, label: "Strategy" },
    { n: 3, label: "Add rules" },
    { n: 4, label: "Review" },
  ];

  return (
    <div className="content">
      <div className="page-head" style={{paddingBottom:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>
            <Icons.X size={13}/> Cancel
          </button>
          <span className="muted">/</span>
          <span style={{fontSize:13,fontWeight:500}}>New policy</span>
        </div>
        <h1 className="page-title">Create a new policy</h1>
        <div className="page-sub">Group related rules into an evaluation chain with a shared hit strategy.</div>

        {/* Stepper */}
        <div style={{display:"flex", gap:0, marginTop:24, borderBottom:"1px solid var(--border)", marginLeft:-32, marginRight:-32, paddingLeft:32, paddingRight:32}}>
          {steps.map(s => (
            <button
              key={s.n}
              onClick={()=>{ if (s.n < step) setStep(s.n); }}
              style={{
                padding:"10px 18px",
                fontSize:13,
                color: step===s.n?"var(--text)":"var(--text-muted)",
                fontWeight: step===s.n?600:500,
                borderBottom: step===s.n?"2px solid var(--accent)":"2px solid transparent",
                marginBottom:-1,
                cursor: s.n <= step ? "pointer" : "default",
                display:"flex",alignItems:"center",gap:8,
              }}
            >
              <span style={{
                width:20, height:20, borderRadius:"50%",
                background: s.n < step ? "var(--accent)" : s.n === step ? "var(--accent)" : "var(--bg-sunken)",
                color: s.n <= step ? "white" : "var(--text-muted)",
                display:"grid", placeItems:"center",
                fontSize:11, fontWeight:600,
              }}>{s.n < step ? <Icons.Check size={11}/> : s.n}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"32px 32px 80px", maxWidth:880, margin:"0 auto", width:"100%"}}>
        {step === 1 && (
          <div className="col" style={{gap:24}}>
            <div>
              <label style={{fontSize:13, fontWeight:500, display:"block", marginBottom:6}}>Policy name</label>
              <input
                className="value-input"
                style={{width:"100%", height:40, fontSize:15}}
                placeholder="e.g. Fraud Defense"
                value={draft.name}
                onChange={e=>update({name:e.target.value})}
                autoFocus
              />
              <div className="muted" style={{fontSize:12, marginTop:6}}>Human-readable name shown in lists and audit logs.</div>
            </div>
            <div>
              <label style={{fontSize:13, fontWeight:500, display:"block", marginBottom:6}}>Description</label>
              <textarea
                className="value-input"
                style={{width:"100%", minHeight:80, padding:"10px 12px", fontFamily:"inherit", resize:"vertical"}}
                placeholder="What does this policy decide? When does it run?"
                value={draft.description}
                onChange={e=>update({description:e.target.value})}
              />
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
              <div>
                <label style={{fontSize:13, fontWeight:500, display:"block", marginBottom:6}}>Folder</label>
                <select className="value-input" style={{width:"100%", height:36}} defaultValue="Risk">
                  <option>Risk</option><option>Pricing</option><option>Compliance</option><option>Operations</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:13, fontWeight:500, display:"block", marginBottom:6}}>Tags</label>
                <input className="value-input" style={{width:"100%", height:36}} placeholder="comma,separated"/>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="col" style={{gap:24}}>
            <div>
              <label style={{fontSize:13, fontWeight:500, display:"block", marginBottom:10}}>Hit policy</label>
              <div className="col" style={{gap:8}}>
                {[
                  {v:"first-match", t:"First match", d:"Evaluate rules in order, stop on the first match. Fastest, deterministic."},
                  {v:"all-match", t:"All matches", d:"Evaluate every rule and collect all matching outcomes. Useful for tagging or scoring."},
                  {v:"priority", t:"Priority", d:"Evaluate all rules, highest-weighted match wins. Useful when overlap is expected."},
                  {v:"unique", t:"Unique", d:"Exactly one rule must match — raise an error otherwise. Strict policy enforcement."},
                ].map(o => (
                  <label key={o.v} style={{
                    display:"flex", gap:12, padding:"12px 14px",
                    border:`1px solid ${draft.strategy===o.v?"var(--accent)":"var(--border)"}`,
                    borderRadius:"var(--radius)",
                    cursor:"pointer",
                    background: draft.strategy===o.v?"var(--accent-soft)":"var(--bg-elev)",
                  }}>
                    <input type="radio" checked={draft.strategy===o.v} onChange={()=>update({strategy:o.v})} style={{marginTop:2}}/>
                    <div>
                      <div style={{fontWeight:500, fontSize:13.5}}>{o.t}</div>
                      <div className="muted" style={{fontSize:12.5, marginTop:2}}>{o.d}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
              <div>
                <label style={{fontSize:13, fontWeight:500, display:"block", marginBottom:6}}>Trigger</label>
                <select className="value-input" style={{width:"100%", height:36}} value={draft.trigger} onChange={e=>update({trigger:e.target.value})}>
                  <option value="on-event">On event</option>
                  <option value="on-schedule">Scheduled</option>
                  <option value="on-api">API call</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:13, fontWeight:500, display:"block", marginBottom:6}}>Initial environment</label>
                <select className="value-input" style={{width:"100%", height:36}} value={draft.env} onChange={e=>update({env:e.target.value})}>
                  <option value="dev">Development</option>
                  <option value="staging">Staging</option>
                  <option value="prod">Production</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="col" style={{gap:16}}>
            <div className="muted" style={{fontSize:13}}>
              Pick rules to include. You can re-order and weight them after creation.
            </div>
            <div className="card">
              {allRules.map(r => {
                const checked = draft.members.some(m => m.ruleId === r.id);
                return (
                  <label key={r.id} style={{
                    display:"grid", gridTemplateColumns:"24px 1fr auto", gap:12, alignItems:"center",
                    padding:"12px 16px", borderBottom:"1px solid var(--border)", cursor:"pointer",
                    background: checked ? "var(--accent-soft)" : "transparent",
                  }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={()=>{
                        if (checked) update({members: draft.members.filter(m=>m.ruleId!==r.id)});
                        else update({members: [...draft.members, {ruleId:r.id, weight:50, enabled:true}]});
                      }}
                    />
                    <div>
                      <div className="rule-name">{r.name}</div>
                      <div className="rule-desc">{r.description}</div>
                    </div>
                    <div className="row" style={{gap:8}}>
                      <span className="tag">{r.folder}</span>
                      <StatusTag status={r.status}/>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="muted" style={{fontSize:12}}>{draft.members.length} selected</div>
          </div>
        )}

        {step === 4 && (
          <div className="col" style={{gap:16}}>
            <div className="card card-pad">
              <div style={{fontSize:18, fontWeight:600, marginBottom:4}}>{draft.name}</div>
              <div className="muted" style={{fontSize:13.5}}>{draft.description || <em>No description</em>}</div>
              <div className="row" style={{gap:8, marginTop:12}}>
                <span className="tag accent">{draft.strategy}</span>
                <span className="tag">{draft.env}</span>
                <span className="tag">{draft.trigger}</span>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><div className="card-title">{draft.members.length} rules in chain</div></div>
              {draft.members.map((m,i)=>{
                const r = allRules.find(x => x.id === m.ruleId);
                if (!r) return null;
                return (
                  <div key={m.ruleId} style={{padding:"10px 18px", borderTop: i?"1px solid var(--border)":"0", display:"grid", gridTemplateColumns:"32px 1fr auto", gap:12, alignItems:"center"}}>
                    <span className="mono muted" style={{fontSize:11}}>{String(i+1).padStart(2,"0")}</span>
                    <div className="rule-name">{r.name}</div>
                    <StatusTag status={r.status}/>
                  </div>
                );
              })}
              {draft.members.length === 0 && (
                <div className="empty" style={{padding:24}}>No rules selected. You can add them later.</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{
        position:"sticky", bottom:0,
        background:"var(--bg-elev)", borderTop:"1px solid var(--border)",
        padding:"12px 32px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <span className="muted" style={{fontSize:12}}>Step {step} of {steps.length}</span>
        <div className="row" style={{gap:8}}>
          {step > 1 && <button className="btn btn-secondary btn-sm" onClick={()=>setStep(step-1)}>Back</button>}
          {step < 4 && <button className="btn btn-primary btn-sm" disabled={!canNext} onClick={()=>setStep(step+1)}>Continue <Icons.ChevronRight size={13}/></button>}
          {step === 4 && <button className="btn btn-primary btn-sm" onClick={()=>onCreate(draft)}><Icons.Check size={13}/> Create policy</button>}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   NEW DECISION TABLE WIZARD
   ============================================================ */
function NewTableWizard({ onCancel, onCreate }) {
  const [step, setStep] = useStateP(1);
  const [draft, setDraft] = useStateP({
    name: "",
    description: "",
    hitPolicy: "first",
    inputs: [
      { id:"i1", field:"order.region", op:"==", label:"Region" },
    ],
    outputs: [
      { id:"o1", target:"discount_pct", type:"number", label:"Discount %" },
    ],
    rows: [],
  });

  const update = patch => setDraft(d => ({...d, ...patch}));
  const canNext = step === 1 ? draft.name.trim().length > 0 : step === 2 ? draft.inputs.length>0 && draft.outputs.length>0 : true;

  const steps = [
    { n: 1, label: "Basics" },
    { n: 2, label: "Columns" },
    { n: 3, label: "Initial rows" },
    { n: 4, label: "Review" },
  ];

  return (
    <div className="content">
      <div className="page-head" style={{paddingBottom:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>
            <Icons.X size={13}/> Cancel
          </button>
          <span className="muted">/</span>
          <span style={{fontSize:13,fontWeight:500}}>New decision table</span>
        </div>
        <h1 className="page-title">Create a new decision table</h1>
        <div className="page-sub">Define inputs, outputs, and a hit policy. Add rows now or later.</div>

        <div style={{display:"flex", gap:0, marginTop:24, borderBottom:"1px solid var(--border)", marginLeft:-32, marginRight:-32, paddingLeft:32, paddingRight:32}}>
          {steps.map(s => (
            <button
              key={s.n}
              onClick={()=>{ if (s.n < step) setStep(s.n); }}
              style={{
                padding:"10px 18px", fontSize:13,
                color: step===s.n?"var(--text)":"var(--text-muted)",
                fontWeight: step===s.n?600:500,
                borderBottom: step===s.n?"2px solid var(--accent)":"2px solid transparent",
                marginBottom:-1, cursor: s.n <= step?"pointer":"default",
                display:"flex",alignItems:"center",gap:8,
              }}
            >
              <span style={{
                width:20, height:20, borderRadius:"50%",
                background: s.n <= step ? "var(--accent)" : "var(--bg-sunken)",
                color: s.n <= step ? "white" : "var(--text-muted)",
                display:"grid", placeItems:"center", fontSize:11, fontWeight:600,
              }}>{s.n < step ? <Icons.Check size={11}/> : s.n}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"32px 32px 80px", maxWidth: step===3?1100:880, margin:"0 auto", width:"100%"}}>
        {step === 1 && (
          <div className="col" style={{gap:24}}>
            <div>
              <label style={{fontSize:13, fontWeight:500, display:"block", marginBottom:6}}>Table name</label>
              <input
                className="value-input"
                style={{width:"100%", height:40, fontSize:15}}
                placeholder="e.g. Pricing & review matrix"
                value={draft.name}
                onChange={e=>update({name:e.target.value})}
                autoFocus
              />
            </div>
            <div>
              <label style={{fontSize:13, fontWeight:500, display:"block", marginBottom:6}}>Description</label>
              <textarea
                className="value-input"
                style={{width:"100%", minHeight:80, padding:"10px 12px", fontFamily:"inherit", resize:"vertical"}}
                placeholder="Explain what this table decides."
                value={draft.description}
                onChange={e=>update({description:e.target.value})}
              />
            </div>
            <div>
              <label style={{fontSize:13, fontWeight:500, display:"block", marginBottom:10}}>Hit policy</label>
              <div className="row" style={{gap:8, flexWrap:"wrap"}}>
                {[
                  {v:"first", t:"First", d:"First matching row wins"},
                  {v:"unique", t:"Unique", d:"Exactly one row must match"},
                  {v:"any", t:"Any", d:"All matches must agree"},
                  {v:"collect", t:"Collect", d:"Aggregate all matches"},
                  {v:"priority", t:"Priority", d:"Highest-priority match wins"},
                ].map(o=>(
                  <button
                    key={o.v}
                    onClick={()=>update({hitPolicy:o.v})}
                    className="filter-chip"
                    style={{
                      padding:"8px 14px", height:"auto",
                      borderStyle:"solid", borderRadius:"var(--radius)",
                      flexDirection:"column", alignItems:"flex-start",
                      borderColor: draft.hitPolicy===o.v?"var(--accent)":"var(--border)",
                      background: draft.hitPolicy===o.v?"var(--accent-soft)":"var(--bg-elev)",
                      color: draft.hitPolicy===o.v?"var(--accent)":"var(--text)",
                      minWidth:140,
                    }}
                  >
                    <span style={{fontWeight:600, fontSize:13}}>{o.t}</span>
                    <span style={{fontSize:11, color:"var(--text-muted)", marginTop:2}}>{o.d}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="col" style={{gap:24}}>
            {/* Inputs */}
            <div>
              <div className="row" style={{justifyContent:"space-between", marginBottom:10}}>
                <div>
                  <div style={{fontSize:14, fontWeight:600}}>Input columns (When)</div>
                  <div className="muted" style={{fontSize:12, marginTop:2}}>Fields the table evaluates against.</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={()=>update({inputs:[...draft.inputs,{id:`i${Date.now()}`,field:SCHEMA[0].id,op:"==",label:""}]})}>
                  <Icons.Plus size={13}/> Add input
                </button>
              </div>
              <div className="card">
                {draft.inputs.map((c, i)=>(
                  <div key={c.id} style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr 32px", gap:8, padding:"10px 14px", borderBottom: i<draft.inputs.length-1?"1px solid var(--border)":"0", alignItems:"center"}}>
                    <select className="value-input" value={c.field} onChange={e=>update({inputs:draft.inputs.map(x=>x.id===c.id?{...x,field:e.target.value}:x)})}>
                      {SCHEMA.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                    <select className="value-input" value={c.op} onChange={e=>update({inputs:draft.inputs.map(x=>x.id===c.id?{...x,op:e.target.value}:x)})}>
                      {(OPS[SCHEMA.find(f=>f.id===c.field)?.type] || OPS.string).map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                    <input className="value-input" placeholder="Display label" value={c.label} onChange={e=>update({inputs:draft.inputs.map(x=>x.id===c.id?{...x,label:e.target.value}:x)})}/>
                    <button className="icon-btn" onClick={()=>update({inputs:draft.inputs.filter(x=>x.id!==c.id)})}><Icons.Trash size={13}/></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Outputs */}
            <div>
              <div className="row" style={{justifyContent:"space-between", marginBottom:10}}>
                <div>
                  <div style={{fontSize:14, fontWeight:600}}>Output columns (Then)</div>
                  <div className="muted" style={{fontSize:12, marginTop:2}}>Values the table produces on a match.</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={()=>update({outputs:[...draft.outputs,{id:`o${Date.now()}`,target:"",type:"string",label:""}]})}>
                  <Icons.Plus size={13}/> Add output
                </button>
              </div>
              <div className="card">
                {draft.outputs.map((c, i)=>(
                  <div key={c.id} style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr 32px", gap:8, padding:"10px 14px", borderBottom: i<draft.outputs.length-1?"1px solid var(--border)":"0", alignItems:"center"}}>
                    <input className="value-input" placeholder="target_field" value={c.target} onChange={e=>update({outputs:draft.outputs.map(x=>x.id===c.id?{...x,target:e.target.value}:x)})}/>
                    <select className="value-input" value={c.type} onChange={e=>update({outputs:draft.outputs.map(x=>x.id===c.id?{...x,type:e.target.value}:x)})}>
                      <option value="string">string</option><option value="number">number</option><option value="boolean">boolean</option>
                    </select>
                    <input className="value-input" placeholder="Display label" value={c.label} onChange={e=>update({outputs:draft.outputs.map(x=>x.id===c.id?{...x,label:e.target.value}:x)})}/>
                    <button className="icon-btn" onClick={()=>update({outputs:draft.outputs.filter(x=>x.id!==c.id)})}><Icons.Trash size={13}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="col" style={{gap:12}}>
            <div className="muted" style={{fontSize:13}}>
              Optional — add a few rows now to validate the schema. You can fill the rest later.
            </div>
            <table className="dtable">
              <thead>
                <tr>
                  <th rowSpan={2} style={{width:40}}>#</th>
                  <th colSpan={draft.inputs.length} className="cond-col">Inputs (when)</th>
                  <th colSpan={draft.outputs.length} className="act-col">Outputs (then)</th>
                  <th rowSpan={2} style={{width:40}}></th>
                </tr>
                <tr>
                  {draft.inputs.map(c => (
                    <th key={c.id} className="cond-col">{c.label || c.field}<div className="col-sub mono">{c.op}</div></th>
                  ))}
                  {draft.outputs.map(c => (
                    <th key={c.id} className="act-col">{c.label || c.target}<div className="col-sub mono">{c.type}</div></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {draft.rows.map((row, ri)=>(
                  <tr key={ri}>
                    <td className="row-num">{ri+1}</td>
                    {draft.inputs.map(c => (
                      <td key={c.id}><input value={row[c.id] ?? ""} onChange={e=>update({rows:draft.rows.map((r,j)=>j===ri?{...r,[c.id]:e.target.value}:r)})}/></td>
                    ))}
                    {draft.outputs.map(c => (
                      <td key={c.id}><input value={row[c.id] ?? ""} onChange={e=>update({rows:draft.rows.map((r,j)=>j===ri?{...r,[c.id]:e.target.value}:r)})}/></td>
                    ))}
                    <td style={{textAlign:"center"}}><button className="icon-btn" onClick={()=>update({rows:draft.rows.filter((_,j)=>j!==ri)})}><Icons.Trash size={13}/></button></td>
                  </tr>
                ))}
                <tr>
                  <td className="row-num">+</td>
                  <td colSpan={draft.inputs.length+draft.outputs.length+1} style={{padding:6}}>
                    <button className="add-cond-btn" onClick={()=>update({rows:[...draft.rows, {}]})}>
                      <Icons.Plus/> Add row
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {step === 4 && (
          <div className="col" style={{gap:16}}>
            <div className="card card-pad">
              <div style={{fontSize:18, fontWeight:600}}>{draft.name}</div>
              <div className="muted" style={{fontSize:13.5, marginTop:4}}>{draft.description || <em>No description</em>}</div>
              <div className="row" style={{gap:8, marginTop:12}}>
                <span className="tag accent">{draft.hitPolicy} match</span>
                <span className="tag">{draft.inputs.length} inputs</span>
                <span className="tag">{draft.outputs.length} outputs</span>
                <span className="tag">{draft.rows.length} rows</span>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><div className="card-title">Preview</div></div>
              <div style={{padding:16, overflowX:"auto"}}>
                <table className="dtable">
                  <thead>
                    <tr>
                      <th rowSpan={2} style={{width:40}}>#</th>
                      <th colSpan={draft.inputs.length} className="cond-col">When</th>
                      <th colSpan={draft.outputs.length} className="act-col">Then</th>
                    </tr>
                    <tr>
                      {draft.inputs.map(c => <th key={c.id} className="cond-col">{c.label || c.field}</th>)}
                      {draft.outputs.map(c => <th key={c.id} className="act-col">{c.label || c.target}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {draft.rows.length === 0 && (
                      <tr><td colSpan={draft.inputs.length+draft.outputs.length+1} className="empty" style={{padding:24}}>No rows yet. The table will start empty.</td></tr>
                    )}
                    {draft.rows.map((row, ri)=>(
                      <tr key={ri}>
                        <td className="row-num">{ri+1}</td>
                        {draft.inputs.map(c=><td key={c.id}>{row[c.id] || <span className="subtle">—</span>}</td>)}
                        {draft.outputs.map(c=><td key={c.id}>{row[c.id] || <span className="subtle">—</span>}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{
        position:"sticky", bottom:0,
        background:"var(--bg-elev)", borderTop:"1px solid var(--border)",
        padding:"12px 32px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <span className="muted" style={{fontSize:12}}>Step {step} of {steps.length}</span>
        <div className="row" style={{gap:8}}>
          {step > 1 && <button className="btn btn-secondary btn-sm" onClick={()=>setStep(step-1)}>Back</button>}
          {step < 4 && <button className="btn btn-primary btn-sm" disabled={!canNext} onClick={()=>setStep(step+1)}>Continue <Icons.ChevronRight size={13}/></button>}
          {step === 4 && <button className="btn btn-primary btn-sm" onClick={()=>onCreate(draft)}><Icons.Check size={13}/> Create table</button>}
        </div>
      </div>
    </div>
  );
}

window.PolicyDetail = PolicyDetail;
window.NewPolicyWizard = NewPolicyWizard;
window.NewTableWizard = NewTableWizard;
