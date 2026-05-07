/* global React, Icons */
const { useState } = React;

// ===== Sidebar =====
function Sidebar({ route, setRoute, density, counts }) {
  const navItems = [
    { id: "dashboard", icon: Icons.Home, label: "Dashboard", shortcut: "G D" },
    { id: "rules", icon: Icons.Rules, label: "Dashboard", shortcut: "G R", badge: counts.rules },
    { id: "tables", icon: Icons.Table, label: "Decision Tables", shortcut: "G T", badge: counts.tables },
    { id: "policies", icon: Icons.Layers, label: "Policies", shortcut: "G P", badge: counts.policies },
    { id: "test", icon: Icons.Beaker, label: "Dashboard", shortcut: "G S" },
    { id: "history", icon: Icons.History, label: "Audit Log" },
  ];
  const sysItems = [
    { id: "deployments", icon: Icons.Globe, label: "Deployments" },
    { id: "settings", icon: Icons.Cog, label: "Settings" },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark"><span>iD</span></div>
        <div className="ws-text">
          <div className="brand-name">iDMS</div>
          <div className="brand-sub">Rule Engine</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          {navItems.map(it => {
            const Ic = it.icon;
            const active = route === it.id;
            return (
              <div
                key={it.id}
                className={`nav-item ${active ? "active" : ""}`}
                onClick={() => setRoute(it.id)}
                title={it.label}
              >
                <Ic />
                <span className="nav-label">{it.label}</span>
                {it.badge != null && <span className="nav-badge">{it.badge}</span>}
                {!it.badge && it.shortcut && <span className="nav-shortcut">{it.shortcut}</span>}
              </div>
            );
          })}
        </div>
        <div className="nav-section">
          <div className="nav-section-label">System</div>
          {sysItems.map(it => {
            const Ic = it.icon;
            const active = route === it.id;
            return (
              <div
                key={it.id}
                className={`nav-item ${active ? "active" : ""}`}
                onClick={() => setRoute(it.id)}
                title={it.label}
              >
                <Ic />
                <span className="nav-label">{it.label}</span>
              </div>
            );
          })}
        </div>
      </nav>
      <div className="sidebar-foot">
        <div className="ws-switcher">
          <div className="ws-avatar">AC</div>
          <div className="ws-text">
            <div className="ws-name">Acme · Production</div>
            <div className="ws-plan">Enterprise plan</div>
          </div>
          <Icons.ChevronDown size={14} className="muted"/>
        </div>
      </div>
    </aside>
  );
}

// ===== Topbar =====
function Topbar({ route, current, onNew, onTheme, theme }) {
  const labels = {
    dashboard: ["Home", "Dashboard"],
    rules: ["Rules", current?.name || "Library"],
    tables: ["Rules", "Decision Tables"],
    policies: ["Rules", "Policies"],
    test: ["Rules", "Test & Simulate"],
    history: ["Rules", "Audit Log"],
    deployments: ["System", "Deployments"],
    settings: ["System", "Settings"],
    builder: ["Rules", current?.name || "New rule"],
  };
  const [a, b] = labels[route] || ["Workspace", "Page"];
  return (
    <header className="topbar">
      <div className="crumbs">
        <span>{a}</span>
        <Icons.ChevronRight size={12} className="sep"/>
        <span className="current">{b}</span>
      </div>
      <div className="topbar-search">
        <Icons.Search />
        <span>Search rules, fields, policies…</span>
        <kbd>⌘K</kbd>
      </div>
      <button className="icon-btn" onClick={onTheme} title="Toggle theme">
        {theme === "dark" ? <Icons.Sun/> : <Icons.Moon/>}
      </button>
      <button className="icon-btn" title="Notifications">
        <Icons.Bell/>
      </button>
      {onNew && (
        <button className="btn btn-primary btn-sm" onClick={onNew}>
          <Icons.Plus size={14}/> New rule
        </button>
      )}
      <div className="avatar">JS</div>
    </header>
  );
}

window.Sidebar = Sidebar;
window.Topbar = Topbar;
