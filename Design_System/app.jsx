/* global React, ReactDOM, Sidebar, Topbar, Dashboard, RulesList, Builder, DecisionTablesScreen, PoliciesScreen, TestScreen, HistoryScreen, seedRules, seedPolicies, TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakColor, TweakToggle, TweakSelect, PolicyDetail, NewPolicyWizard, NewTableWizard */
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "#5B5BD6",
  "sidebar": "default",
  "builderStyle": "form"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [rules, setRules] = useState(() => seedRules());
  const [policies, setPolicies] = useState(() => seedPolicies());
  const [route, setRoute] = useState("dashboard");
  const [currentRuleId, setCurrentRuleId] = useState(null);
  const [currentPolicyId, setCurrentPolicyId] = useState(null);
  const [toast, setToast] = useState(null);

  // Apply theme + accent at the document level
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tweaks.theme);
    // parse hex → hsl-ish via temporary element
    const tmp = document.createElement("div");
    tmp.style.color = tweaks.accent;
    document.body.appendChild(tmp);
    const rgb = getComputedStyle(tmp).color.match(/\d+/g).map(Number);
    document.body.removeChild(tmp);
    const [r,g,b] = rgb.map(v=>v/255);
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h=0, s=0, l=(max+min)/2;
    if (max !== min) {
      const d = max-min;
      s = l > 0.5 ? d/(2-max-min) : d/(max+min);
      switch(max){
        case r: h = (g-b)/d + (g<b?6:0); break;
        case g: h = (b-r)/d + 2; break;
        case b: h = (r-g)/d + 4; break;
      }
      h *= 60;
    }
    document.documentElement.style.setProperty("--accent-h", String(Math.round(h)));
    document.documentElement.style.setProperty("--accent-s", `${Math.round(s*100)}%`);
    document.documentElement.style.setProperty("--accent-l", `${Math.round(l*100)}%`);
  }, [tweaks.theme, tweaks.accent]);

  const currentRule = currentRuleId ? rules.find(r=>r.id===currentRuleId) : null;

  const onOpenRule = (r) => {
    setCurrentRuleId(r.id);
    setRoute("builder");
  };
  const onNew = () => {
    const r = {
      id: "r_new_" + Date.now(),
      name: "Untitled rule",
      description: "",
      status: "draft",
      priority: "medium",
      tags: [],
      folder: "Drafts",
      version: 1,
      lastEdited: "just now",
      editor: "You",
      runs: 0,
      matchRate: 0,
      combinator: "AND",
      conditions: [{id:"c1", field:"user.age", op:">=", value: 18}],
      actions: [{id:"a1", type:"set", target:"", value:""}],
    };
    setRules(rs => [r, ...rs]);
    setCurrentRuleId(r.id);
    setRoute("builder");
  };
  const onChangeRule = (next) => {
    setRules(rs => rs.map(r => r.id === next.id ? next : r));
  };
  const onSave = () => {
    setToast("Draft saved");
    setTimeout(()=>setToast(null), 1800);
  };

  return (
    <div className="app" data-sidebar={tweaks.sidebar === "compact" ? "compact" : tweaks.sidebar === "floating" ? "floating" : "default"}>
      <Sidebar
        route={
          route === "builder" ? "rules" :
          route === "new-table" ? "tables" :
          route === "policy-detail" || route === "new-policy" ? "policies" :
          route
        }
        setRoute={(r)=>{ setRoute(r); setCurrentRuleId(null); }}
        density="comfortable"
        counts={{ rules: rules.length, tables: 4, policies: policies.length }}
      />
      <main className="main">
        <Topbar
          route={route}
          current={currentRule}
          onNew={onNew}
          theme={tweaks.theme}
          onTheme={()=>setTweak("theme", tweaks.theme === "dark" ? "light" : "dark")}
        />
        {route === "dashboard" && <Dashboard rules={rules} policies={policies} onOpenRule={onOpenRule} onNew={onNew}/>}
        {route === "rules" && <RulesList rules={rules} onOpen={onOpenRule} onNew={onNew}/>}
        {route === "builder" && currentRule && (
          <Builder
            rule={currentRule}
            onChange={onChangeRule}
            onBack={()=>{ setRoute("rules"); setCurrentRuleId(null); }}
            onSave={onSave}
            builderStyle={tweaks.builderStyle}
          />
        )}
        {route === "tables" && <DecisionTablesScreen onNewTable={()=>setRoute("new-table")}/>}
        {route === "new-table" && (
          <NewTableWizard
            onCancel={()=>setRoute("tables")}
            onCreate={(t)=>{ setToast(`Table "${t.name}" created`); setTimeout(()=>setToast(null),1800); setRoute("tables"); }}
          />
        )}
        {route === "policies" && (
          <PoliciesScreen
            policies={policies}
            onOpenPolicy={(p)=>{ setCurrentPolicyId(p.id); setRoute("policy-detail"); }}
            onNewPolicy={()=>setRoute("new-policy")}
          />
        )}
        {route === "policy-detail" && currentPolicyId && (
          <PolicyDetail
            policy={policies.find(p=>p.id===currentPolicyId)}
            allRules={rules}
            onBack={()=>{ setRoute("policies"); setCurrentPolicyId(null); }}
            onSave={(next)=>{ setPolicies(ps=>ps.map(p=>p.id===next.id?next:p)); setToast("Policy saved"); setTimeout(()=>setToast(null),1800); }}
          />
        )}
        {route === "new-policy" && (
          <NewPolicyWizard
            allRules={rules}
            onCancel={()=>setRoute("policies")}
            onCreate={(p)=>{
              const newP = { id:"p_"+Date.now(), runs:0, matchRate:0, status:"draft", rules:p.members.length, ...p };
              setPolicies(ps=>[newP,...ps]);
              setCurrentPolicyId(newP.id);
              setToast(`Policy "${p.name}" created`);
              setTimeout(()=>setToast(null),1800);
              setRoute("policy-detail");
            }}
          />
        )}
        {route === "test" && <TestScreen rules={rules}/>}
        {route === "history" && <HistoryScreen rules={rules}/>}
        {route === "deployments" && <ComingSoon title="Deployments"/>}
        {route === "settings" && <ComingSoon title="Settings"/>}
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Appearance">
          <TweakRadio label="Theme" value={tweaks.theme} onChange={v=>setTweak("theme",v)}
            options={[{value:"light",label:"Light"},{value:"dark",label:"Dark"}]}/>
          <TweakColor label="Accent" value={tweaks.accent} onChange={v=>setTweak("accent",v)}
            presets={["#5B5BD6","#0F62FE","#16A34A","#DC2626","#D97706","#7C3AED","#0EA5E9","#18181B"]}/>
        </TweakSection>
        <TweakSection title="Layout">
          <TweakRadio label="Sidebar" value={tweaks.sidebar} onChange={v=>setTweak("sidebar",v)}
            options={[{value:"default",label:"Default"},{value:"compact",label:"Compact"},{value:"floating",label:"Floating"}]}/>
        </TweakSection>
        <TweakSection title="Rule builder paradigm" description="Default view when opening a rule">
          <TweakRadio label="Style" value={tweaks.builderStyle} onChange={v=>setTweak("builderStyle",v)}
            options={[{value:"form",label:"Form"},{value:"graph",label:"Graph"},{value:"code",label:"Code"}]}/>
        </TweakSection>
      </TweaksPanel>

      {toast && <div className="toast"><span style={{width:6,height:6,borderRadius:"50%",background:"#4ade80"}}/>{toast}</div>}
    </div>
  );
}

function ComingSoon({ title }) {
  return (
    <div className="content">
      <div className="page-head">
        <h1 className="page-title">{title}</h1>
        <div className="page-sub">This area is part of the broader prototype shell.</div>
      </div>
      <div className="empty">
        <div style={{fontSize:14}}>This screen isn't part of this exploration.</div>
        <div style={{fontSize:12,marginTop:6}}>Use the sidebar to jump back to Rules, Decision Tables, Policies, Test, or Audit Log.</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
