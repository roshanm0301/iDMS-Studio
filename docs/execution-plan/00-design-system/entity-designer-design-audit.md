# Entity Designer Design Audit
> **Purpose:** Capture the existing design patterns from Entity Designer so UI Studio can extend them natively.
> **Source files inspected:** src/styles/tokens.css, src/styles/globals.css, src/components/shell/*, src/pages/EntityListPage.tsx, src/pages/SchemaBuilderPage.tsx, src/components/entity-designer/*, src/components/ui/*

---

## 1. App Shell

### Structure
```
.app                        ← root grid: sidebar | main
  .sidebar                  ← fixed left column (--sidebar-w: 248px, compact: 64px)
  .main
    .topbar                 ← breadcrumbs, search, theme toggle, actions, avatar
    .scopebar               ← tenant/node/role/layer context selectors
    .content                ← scrollable page content area (flex-grow: 1)
```

### CSS classes to reuse
- `.app` — root grid layout
- `.sidebar` — left navigation panel
- `.main` — right content wrapper
- `.topbar` — top bar with breadcrumbs
- `.content` — scrollable content area (use as page root)

### Page container width
No explicit max-width on `.content`. Pages set their own `maxWidth` via inline style (e.g., `maxWidth: '1200px'`).

---

## 2. Sidebar Navigation

### Structure
```tsx
<aside className="sidebar">
  <div className="sidebar-brand">         // logo + toggle button
  <nav className="sidebar-nav">
    <div className="nav-section">         // group of nav items
    <div className="nav-section">         // system nav group
  <div className="sidebar-foot">          // workspace switcher
```

### Nav item classes
- `.nav-item` — default nav item
- `.nav-item.active` — currently active route (orange accent background)
- `.nav-label` — item text label (hidden in compact mode)
- `.nav-badge` — count badge on right
- `.nav-shortcut` — keyboard shortcut hint on right
- `.nav-section-label` — section header label (e.g. "System")

### Active detection
```ts
const isActive = (path: string) => {
  if (path === '/admin/studio') return location.pathname === path
  return location.pathname.startsWith(path)
}
```

---

## 3. Topbar

### Elements (left to right)
1. Breadcrumb trail — `.crumbs` class, ChevronRight separator from lucide-react
2. Search bar — `.topbar-search`, Search icon at left, "⌘K" hint at right
3. Theme toggle — `.icon-btn` with Sun/Moon icon
4. Notifications — `.icon-btn` with Bell icon
5. New button — `.btn .btn-primary` with Plus icon
6. Avatar — `.avatar` with initials

### Key classes
- `.topbar` — outer bar
- `.crumbs` — breadcrumb flex container
- `.topbar-search` — search input wrapper
- `.icon-btn` — square icon button (32×32)
- `.avatar` — circular user avatar

---

## 4. Page Header Pattern

Used at the top of every content page:
```tsx
<div className="page-head">
  <div>
    <h1 className="page-title">Page Title</h1>
    <p className="page-sub">Subtitle or description</p>
  </div>
  <button className="btn btn-primary">Action</button>
</div>
```

### Classes
- `.page-head` — flex row, space-between, align-center
- `.page-title` — large heading (font-size ~20px, font-weight 600)
- `.page-sub` — muted subtitle (color: var(--text-muted))

---

## 5. Cards

### Entity card pattern (EntityListPage.tsx)
```tsx
<div className="card" style={{ padding: '16px', ... }}>
  <div>  // title row
    <span>label</span>
    <StatusTag status="draft" />
  </div>
  <p>description</p>
  <div>  // field type badges
    <span className="tag">Text</span>
  </div>
  <div>  // metadata row
    <span>12 fields</span>
    <span>Jan 10</span>
  </div>
  <button className="btn btn-secondary">Open Schema</button>
</div>
```

### Grid layout for cards
```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
gap: 12px;
```

### Card classes
- `.card` — base card (border, border-radius: var(--radius), background: var(--bg-elev))
- `.card-pad` — adds padding
- `.card-head` — card header section

---

## 6. Tables / Grids

### Pattern (FieldGrid.tsx)
- Native HTML `<table>` with thead/tbody
- Class: `.data-table`
- Sticky headers: `position: sticky; top: 0; zIndex: 10`
- Row selection: store `selectedId` in state, apply background color conditionally
- Cell padding: ~10px 12px

### Toolbar above table
```
[+ Add Field button] [search input] [filter popover] [column picker] [count display]
```

### Empty state inside table
Uses `.empty` pattern centered in tbody cell.

---

## 7. Forms & Inputs

### Field anatomy
```tsx
<label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '13px' }}>
  Label
</label>
<input className="form-input" />
<p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
  Help text
</p>
```

### Classes
- `.form-input` — text input (height: 32px, border: 1px solid var(--border), border-radius: var(--radius-sm))
- `.form-select` — select dropdown
- `.form-textarea` — textarea

### Required marker
`*` inline after label, color: var(--red)

### Error placement
Below input, color: var(--red), font-size: 12px

---

## 8. Tabs

### Pattern (SchemaBuilderPage.tsx)
```tsx
<div className="tabs">
  <button className={`tab ${active === 'fields' ? 'active' : ''}`} onClick={() => setActive('fields')}>
    Fields
    <span className="tab-badge">12</span>
  </button>
</div>
```

### Classes
- `.tabs` — tab strip container
- `.tab` — individual tab button
- `.tab.active` — active tab (orange bottom border)
- `.tab-badge` — count badge on tab

---

## 9. Drawers

### Right drawer pattern (SchemaBuilderPage.tsx)
Custom implementation:
```tsx
// Overlay backdrop
<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50 }} />
// Drawer panel  
<div style={{
  position: 'absolute', right: 0, bottom: 0,
  width: 420, background: 'var(--bg-elev)',
  boxShadow: 'var(--shadow-lg)',
  animation: 'slide-in-right 0.2s ease'
}}>
```

Uses `@keyframes slide-in-right` defined in globals.css.

### Drawer header pattern
```
[Title]  [×close button]
─────────────────────────
[Content area — scrollable]
─────────────────────────
[Footer — action buttons]
```

---

## 10. Buttons

### Variants
```css
.btn           { height: 32px; padding: 0 12px; border-radius: var(--radius-sm); font-size: 13px; }
.btn-primary   { background: var(--accent); color: var(--accent-fg); }        /* orange */
.btn-secondary { background: var(--bg-elev); border: 1px solid var(--border); }
.btn-ghost     { color: var(--text-muted); background: transparent; }
.btn-sm        { height: 28px; padding: 0 10px; font-size: 12px; }
.btn-icon      { width: 32px; padding: 0; }                                    /* square icon button */
```

### With icon
```tsx
<button className="btn btn-primary">
  <Plus size={15} />
  New View
</button>
```
Icon inside button — 14-16px, inline-flex with gap: 6px.

---

## 11. Status Badges / Tags

### Generic tag
```tsx
<span className="tag">Default</span>
<span className="tag green">Active</span>
<span className="tag amber">Draft</span>
<span className="tag red">Error</span>
<span className="tag violet">Platform</span>
```

### StatusTag component (src/components/ui/StatusTag.tsx)
```tsx
<StatusTag status="draft" />   // amber
<StatusTag status="active" />  // green
<StatusTag status="disabled" /> // red
```

### Layer badges (src/components/ui/LayerBadge.tsx)
```tsx
<span className="layer-badge platform">PLT</span>
<span className="layer-badge tenant">TNT</span>
```

---

## 12. Empty States

```tsx
<div className="empty">
  <div className="empty-icon">
    <SomeIcon size={32} />
  </div>
  <p className="empty-title">No views found</p>
  <p className="empty-desc">Create a new view to get started.</p>
  <button className="btn btn-secondary">Create View</button>
</div>
```

The `.empty` class centers all content vertically and horizontally.

---

## 13. Typography

| Use case | Token / Style |
|---|---|
| Page title | `.page-title` — 20px, weight 600 |
| Page subtitle | `.page-sub` — 13px, color: var(--text-muted) |
| Section heading | 14px, weight 600, color: var(--text) |
| Body text | 13px, color: var(--text) |
| Helper/hint text | 12px, color: var(--text-muted) |
| Monospace (IDs, code) | font-family: var(--font-mono), 12px |
| Fonts | var(--font-sans): "Noto Sans"; var(--font-mono): "JetBrains Mono" |

---

## 14. Icons

**Library:** `lucide-react` (^1.12.0)

**Standard sizes:**
- Inline body icon: 14px
- Button icon: 15-16px
- Empty state icon: 32px
- Nav icon: 16px
- Small indicator: 12px

---

## 15. Colors & Design Tokens (tokens.css)

### Key variables
```css
--accent: hsl(22, 100%, 51%)    /* orange — primary action color */
--accent-fg: #fff
--accent-soft: hsl(22, 100%, 96%)  /* light orange background */

--bg: #fafaf9                   /* page background */
--bg-elev: #ffffff              /* elevated surface (cards, panels) */
--bg-sunken: #f4f4f3            /* inset surface */

--text: #18181b                 /* primary text */
--text-muted: #6b6b73           /* secondary text */
--text-subtle: #9a9aa3          /* placeholder, disabled */

--border: #e7e7e4               /* default border */
--border-strong: #d6d6d2        /* stronger border */

--green: #16a34a  --green-soft: #ecfdf5
--red:   #dc2626  --red-soft:   #fef2f2
--amber: #d97706  --amber-soft: #fffbeb

--radius-sm: 6px  --radius: 8px  --radius-lg: 12px
--shadow-sm / --shadow-md / --shadow-lg
```

### Dark theme
All tokens are overridden in `[data-theme="dark"]`. Always use CSS variables — never hardcode colors.

---

## 16. Interaction States

| State | Pattern |
|---|---|
| Hover | background: var(--hover) — #f4f4f3 |
| Selected/active | background: var(--selected) / var(--accent-soft) |
| Focus | outline: 2px solid var(--accent-ring); outline-offset: 2px |
| Disabled | opacity: 0.45; cursor: not-allowed |
| Loading | Spinner or skeleton; use color: var(--text-subtle) |

---

## 17. Three-Panel Editor Layout (SchemaBuilderPage.tsx)

The primary editor layout pattern in Entity Designer:
```
┌──────────────────┬──────────────────┬──────────┐
│  Main content    │                  │  Right   │
│  (fields/views/  │  (tabs + content)│  inspector│
│   actions)       │                  │  panel   │
└──────────────────┴──────────────────┴──────────┘
```

```css
display: grid;
grid-template-columns: 1fr 360px;   /* or 1fr inspector-width */
```

Right panel is `FieldInspector` at 360px fixed width.

Left panel contains tabs (`Fields`, `Views`, `Actions`, `Diff`, `Governance`).

---

## 18. Gaps for UI Studio New Components

These patterns are needed by UI Studio but don't exist in Entity Designer yet.
Create them in `src/components/ui-studio/common/`:

| Component | Purpose |
|---|---|
| `ViewStatusBadge` | Draft/Published/NeedsAttention — extend `.tag` pattern |
| `SurfaceTypeBadge` | list/detail/transaction etc. badge |
| `BuilderCanvas` | Preview canvas for layout/form/grid — new pattern needed |
| `InspectorPanel` | Right-side inspector for selected component — extend FieldInspector pattern |
| `ContextSimulatorPanel` | Role/device/state selector — new panel pattern |
| `ValidationResultPanel` | Errors/warnings list with click-to-navigate — new pattern |

---

## 19. Reusable Components Inventory

These existing components should be REUSED directly in UI Studio:

| Component | Path | Use in UI Studio |
|---|---|---|
| AppShell | src/components/shell/AppShell.tsx | Page shell for all UI Studio pages |
| Sidebar nav item pattern | src/components/shell/Sidebar.tsx | Already extended with UI Studio item |
| StatusTag | src/components/ui/StatusTag.tsx | Status badges |
| LayerBadge | src/components/ui/LayerBadge.tsx | Layer indicators where needed |
| Toast | src/components/ui/Toast.tsx | Notifications |
| Radix Dialog | @radix-ui/react-dialog | Create/edit dialogs |
| Radix Tabs | @radix-ui/react-tabs | Editor panel tabs |
| Radix Accordion | @radix-ui/react-accordion | Layout accordions |
| Radix Popover | @radix-ui/react-popover | Filter popovers, field pickers |
| Radix Select | @radix-ui/react-select | Dropdowns |
| Radix Tooltip | @radix-ui/react-tooltip | Help text, field hints |
| TanStack Table | @tanstack/react-table | Grid/list previews |
| React Hook Form | react-hook-form | All forms in dialogs and config panels |
