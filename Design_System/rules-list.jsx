/* global React, Icons, StatusTag, fmtNum */
const { useState: useStateL, useMemo: useMemoL } = React;

function RulesList({ rules, onOpen, onNew, onToggleStatus, onDuplicate, onDelete }) {
  const [q, setQ] = useStateL("");
  const [status, setStatus] = useStateL("all");
  const [folder, setFolder] = useStateL("all");
  const [sort, setSort] = useStateL("recent");

  const folders = useMemoL(() => ["all", ...Array.from(new Set(rules.map(r=>r.folder)))], [rules]);

  const filtered = useMemoL(() => {
    let xs = rules.filter(r => {
      if (status !== "all" && r.status !== status) return false;
      if (folder !== "all" && r.folder !== folder) return false;
      if (q && !(`${r.name} ${r.description} ${r.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
    if (sort === "runs") xs = [...xs].sort((a,b)=>b.runs-a.runs);
    if (sort === "match") xs = [...xs].sort((a,b)=>b.matchRate-a.matchRate);
    if (sort === "name") xs = [...xs].sort((a,b)=>a.name.localeCompare(b.name));
    return xs;
  }, [rules, q, status, folder, sort]);

  return (
    <div className="content">
      <div className="page-head">
        <div className="page-head-row">
          <div>
            <h1 className="page-title">Rules</h1>
            <div className="page-sub">{rules.length} total · {rules.filter(r=>r.status==='active').length} active in production</div>
          </div>
          <div className="row">
            <button className="btn btn-secondary btn-sm"><Icons.Folder size={13}/> New folder</button>
            <button className="btn btn-primary btn-sm" onClick={onNew}><Icons.Plus size={14}/> New rule</button>
          </div>
        </div>
      </div>

      <div className="list-toolbar">
        <div className="input" style={{width: 280}}>
          <Icons.Search/>
          <input placeholder="Search rules…" value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <div className="row" style={{gap:6}}>
          {["all","active","draft","paused"].map(s=>(
            <button key={s} className={`filter-chip ${status===s?'active':''}`} onClick={()=>setStatus(s)}>
              {status===s && <Icons.Check size={12}/>}
              {s === "all" ? "All status" : s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
        <div className="row" style={{gap:6,marginLeft:8}}>
          {folders.map(f=>(
            <button key={f} className={`filter-chip ${folder===f?'active':''}`} onClick={()=>setFolder(f)}>
              {folder===f && <Icons.Check size={12}/>}
              {f === "all" ? "All folders" : f}
            </button>
          ))}
        </div>
        <div className="spacer"/>
        <button className="btn btn-ghost btn-sm">
          <Icons.Sort size={13}/>
          Sort: {sort === "recent" ? "Recent" : sort === "runs" ? "Most run" : sort === "match" ? "Match rate" : "Name"}
          <Icons.ChevronDown size={12}/>
        </button>
      </div>

      <div style={{padding:"0 0 40px"}}>
        <table className="rules">
          <thead>
            <tr>
              <th style={{width:"36%"}}>Rule</th>
              <th>Status</th>
              <th>Folder</th>
              <th>Tags</th>
              <th style={{textAlign:"right"}}>Evals (30d)</th>
              <th style={{textAlign:"right"}}>Match</th>
              <th>Last edited</th>
              <th style={{width:40}}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} onClick={()=>onOpen(r)}>
                <td>
                  <div className="rule-name">{r.name}</div>
                  <div className="rule-desc">{r.description}</div>
                </td>
                <td><StatusTag status={r.status}/></td>
                <td className="muted" style={{fontSize:13}}>
                  <Icons.Folder size={13} style={{marginRight:6, verticalAlign:"-2px", opacity:0.6}}/>
                  {r.folder}
                </td>
                <td>
                  <div className="row" style={{gap:4,flexWrap:"wrap"}}>
                    {r.tags.slice(0,2).map(t => <span key={t} className="tag">{t}</span>)}
                    {r.tags.length > 2 && <span className="tag">+{r.tags.length-2}</span>}
                  </div>
                </td>
                <td style={{textAlign:"right"}} className="tabular muted">{fmtNum(r.runs)}</td>
                <td style={{textAlign:"right"}} className="tabular">
                  {r.matchRate > 0
                    ? <span style={{color: r.matchRate > 0.2 ? "var(--accent)" : "var(--text)"}}>{(r.matchRate*100).toFixed(1)}%</span>
                    : <span className="subtle">—</span>}
                </td>
                <td>
                  <div style={{fontSize:13}}>{r.lastEdited}</div>
                  <div className="muted" style={{fontSize:11}}>by {r.editor}</div>
                </td>
                <td onClick={e=>e.stopPropagation()}>
                  <button className="icon-btn" title="More"><Icons.More size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty">No rules match your filters.</div>
        )}
      </div>
    </div>
  );
}

window.RulesList = RulesList;
