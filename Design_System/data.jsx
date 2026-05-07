/* global React */

// ===== Schema: available fields a rule can reference =====
const SCHEMA = [
  { id: "user.age", label: "user.age", type: "number", icon: "Hash", group: "User" },
  { id: "user.country", label: "user.country", type: "string", icon: "Type", group: "User" },
  { id: "user.tier", label: "user.tier", type: "enum", options: ["free","pro","enterprise"], icon: "Tag", group: "User" },
  { id: "user.verified", label: "user.verified", type: "boolean", icon: "Bool", group: "User" },
  { id: "user.signupDate", label: "user.signupDate", type: "date", icon: "Calendar", group: "User" },
  { id: "order.amount", label: "order.amount", type: "number", icon: "Hash", group: "Order" },
  { id: "order.currency", label: "order.currency", type: "string", icon: "Type", group: "Order" },
  { id: "order.itemCount", label: "order.itemCount", type: "number", icon: "Hash", group: "Order" },
  { id: "order.region", label: "order.region", type: "enum", options: ["NA","EU","APAC","LATAM"], icon: "Tag", group: "Order" },
  { id: "order.isFirst", label: "order.isFirst", type: "boolean", icon: "Bool", group: "Order" },
  { id: "session.deviceType", label: "session.deviceType", type: "enum", options: ["desktop","mobile","tablet"], icon: "Tag", group: "Session" },
  { id: "session.riskScore", label: "session.riskScore", type: "number", icon: "Hash", group: "Session" },
];

// ===== Operators =====
const OPS = {
  number: [
    { id: "==", label: "= equals" },
    { id: "!=", label: "≠ not equals" },
    { id: ">", label: "> greater than" },
    { id: ">=", label: "≥ at least" },
    { id: "<", label: "< less than" },
    { id: "<=", label: "≤ at most" },
    { id: "between", label: "between" },
  ],
  string: [
    { id: "==", label: "= equals" },
    { id: "!=", label: "≠ not equals" },
    { id: "contains", label: "contains" },
    { id: "startsWith", label: "starts with" },
    { id: "in", label: "is one of" },
  ],
  enum: [
    { id: "==", label: "= is" },
    { id: "!=", label: "≠ is not" },
    { id: "in", label: "in" },
    { id: "notIn", label: "not in" },
  ],
  boolean: [
    { id: "==", label: "is" },
  ],
  date: [
    { id: "before", label: "before" },
    { id: "after", label: "after" },
    { id: "withinDays", label: "within last (days)" },
  ],
};

// ===== Sample rules =====
const seedRules = () => [
  {
    id: "r_high_value_intl",
    name: "Flag high-value international orders",
    description: "Route orders over $1,000 from non-NA regions to manual review",
    status: "active",
    priority: "high",
    tags: ["fraud","payments"],
    folder: "Risk",
    version: 7,
    lastEdited: "2 hours ago",
    editor: "Mira K.",
    runs: 12480,
    matchRate: 0.034,
    combinator: "AND",
    conditions: [
      { id: "c1", field: "order.amount", op: ">=", value: 1000 },
      { id: "c2", field: "order.region", op: "!=", value: "NA" },
    ],
    actions: [
      { id: "a1", type: "set", target: "review_required", value: true },
      { id: "a2", type: "tag", target: "tags", value: "manual_review" },
    ],
  },
  {
    id: "r_first_order_promo",
    name: "First-order discount eligibility",
    description: "Apply 15% off when a verified user places their first order",
    status: "active",
    priority: "medium",
    tags: ["promotion","onboarding"],
    folder: "Pricing",
    version: 3,
    lastEdited: "yesterday",
    editor: "Adel N.",
    runs: 5821,
    matchRate: 0.182,
    combinator: "AND",
    conditions: [
      { id: "c1", field: "order.isFirst", op: "==", value: true },
      { id: "c2", field: "user.verified", op: "==", value: true },
    ],
    actions: [
      { id: "a1", type: "set", target: "discount_pct", value: 15 },
      { id: "a2", type: "set", target: "promo_code", value: "WELCOME15" },
    ],
  },
  {
    id: "r_block_underage",
    name: "Block underage signups",
    description: "Refuse account creation when reported age is below 16",
    status: "active",
    priority: "critical",
    tags: ["compliance"],
    folder: "Compliance",
    version: 2,
    lastEdited: "3 days ago",
    editor: "Kai R.",
    runs: 91200,
    matchRate: 0.008,
    combinator: "AND",
    conditions: [
      { id: "c1", field: "user.age", op: "<", value: 16 },
    ],
    actions: [
      { id: "a1", type: "set", target: "block", value: true },
    ],
  },
  {
    id: "r_enterprise_sla",
    name: "Enterprise priority routing",
    description: "Tag enterprise tier sessions for the priority support queue",
    status: "active",
    priority: "medium",
    tags: ["support"],
    folder: "Operations",
    version: 5,
    lastEdited: "5 days ago",
    editor: "Mira K.",
    runs: 2103,
    matchRate: 0.41,
    combinator: "AND",
    conditions: [
      { id: "c1", field: "user.tier", op: "==", value: "enterprise" },
    ],
    actions: [
      { id: "a1", type: "set", target: "queue", value: "priority" },
      { id: "a2", type: "set", target: "sla_minutes", value: 15 },
    ],
  },
  {
    id: "r_high_risk_block",
    name: "Block high-risk sessions",
    description: "Auto-block when session risk score exceeds 85",
    status: "draft",
    priority: "critical",
    tags: ["fraud","security"],
    folder: "Risk",
    version: 1,
    lastEdited: "12 min ago",
    editor: "You",
    runs: 0,
    matchRate: 0,
    combinator: "AND",
    conditions: [
      { id: "c1", field: "session.riskScore", op: ">", value: 85 },
    ],
    actions: [
      { id: "a1", type: "set", target: "block", value: true },
    ],
  },
  {
    id: "r_apac_currency",
    name: "Default currency for APAC",
    description: "Switch presented currency to local for APAC users",
    status: "active",
    priority: "low",
    tags: ["i18n","pricing"],
    folder: "Pricing",
    version: 11,
    lastEdited: "1 week ago",
    editor: "Lukas S.",
    runs: 88210,
    matchRate: 0.22,
    combinator: "AND",
    conditions: [
      { id: "c1", field: "order.region", op: "==", value: "APAC" },
    ],
    actions: [
      { id: "a1", type: "set", target: "currency", value: "JPY" },
    ],
  },
  {
    id: "r_inactive_warning",
    name: "Inactive user re-engagement",
    description: "Trigger re-engagement email when user signed up over 90 days ago and tier is free",
    status: "paused",
    priority: "low",
    tags: ["lifecycle","email"],
    folder: "Marketing",
    version: 4,
    lastEdited: "2 weeks ago",
    editor: "Adel N.",
    runs: 14302,
    matchRate: 0.067,
    combinator: "AND",
    conditions: [
      { id: "c1", field: "user.signupDate", op: "withinDays", value: 90 },
      { id: "c2", field: "user.tier", op: "==", value: "free" },
    ],
    actions: [
      { id: "a1", type: "trigger", target: "email", value: "reengage_v2" },
    ],
  },
];

// ===== Policies (rule sets) =====
const seedPolicies = () => [
  { id:"p_fraud", name:"Fraud Defense", description:"Pre-checkout risk evaluation chain", rules: 14, status:"active", strategy:"first-match", env:"prod", runs:184230, matchRate: 0.041 },
  { id:"p_pricing", name:"Pricing & Promotions", description:"Discount stack & currency localization", rules: 22, status:"active", strategy:"all-match", env:"prod", runs: 502910, matchRate: 0.31 },
  { id:"p_compliance", name:"Compliance Gate", description:"Age, geo and KYC checks at signup", rules: 8, status:"active", strategy:"first-match", env:"prod", runs: 92410, matchRate: 0.012 },
  { id:"p_routing", name:"Support Routing", description:"Determine queue + SLA at ticket open", rules: 11, status:"active", strategy:"priority", env:"prod", runs: 23120, matchRate: 0.92 },
  { id:"p_marketing", name:"Lifecycle Marketing", description:"Trigger emails and pushes from event signals", rules: 17, status:"draft", strategy:"all-match", env:"staging", runs: 0, matchRate: 0 },
];

// ===== Versions =====
const seedHistory = (rule) => [
  { v: rule.version, at: rule.lastEdited, by: rule.editor, kind: "edit", note: "Updated condition threshold", diff: { add: ["order.amount >= 1000"], rem: ["order.amount >= 750"] } },
  { v: rule.version - 1, at: "yesterday", by: "Adel N.", kind: "publish", note: "Published to production", diff: null },
  { v: rule.version - 2, at: "3 days ago", by: "Kai R.", kind: "edit", note: "Added second condition", diff: { add: ["order.region != NA"], rem: [] } },
  { v: rule.version - 3, at: "1 week ago", by: "Mira K.", kind: "create", note: "Created rule", diff: null },
].filter(x => x.v >= 1);

// ===== Evaluator =====
function evalCondition(cond, ctx) {
  const lhs = getVal(ctx, cond.field);
  const rhs = cond.value;
  switch (cond.op) {
    case "==": return String(lhs) === String(rhs);
    case "!=": return String(lhs) !== String(rhs);
    case ">": return Number(lhs) > Number(rhs);
    case ">=": return Number(lhs) >= Number(rhs);
    case "<": return Number(lhs) < Number(rhs);
    case "<=": return Number(lhs) <= Number(rhs);
    case "contains": return String(lhs ?? "").toLowerCase().includes(String(rhs ?? "").toLowerCase());
    case "startsWith": return String(lhs ?? "").toLowerCase().startsWith(String(rhs ?? "").toLowerCase());
    case "in": return Array.isArray(rhs) ? rhs.includes(lhs) : String(rhs).split(",").map(s=>s.trim()).includes(String(lhs));
    case "notIn": return !(Array.isArray(rhs) ? rhs.includes(lhs) : String(rhs).split(",").map(s=>s.trim()).includes(String(lhs)));
    case "between": {
      const [a,b] = String(rhs).split(",").map(n => Number(n.trim()));
      return Number(lhs) >= a && Number(lhs) <= b;
    }
    case "withinDays": {
      const d = new Date(lhs).getTime();
      const now = Date.now();
      return !isNaN(d) && (now - d) / 86400000 <= Number(rhs);
    }
    case "before": return new Date(lhs).getTime() < new Date(rhs).getTime();
    case "after": return new Date(lhs).getTime() > new Date(rhs).getTime();
    default: return false;
  }
}
function getVal(ctx, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), ctx);
}

function evaluateRule(rule, ctx) {
  const results = rule.conditions.map(c => ({ cond: c, pass: evalCondition(c, ctx) }));
  const matched = rule.combinator === "OR"
    ? results.some(r => r.pass)
    : results.every(r => r.pass);
  return { matched, results };
}

window.SCHEMA = SCHEMA;
window.OPS = OPS;
window.seedRules = seedRules;
window.seedPolicies = seedPolicies;
window.seedHistory = seedHistory;
window.evaluateRule = evaluateRule;
window.evalCondition = evalCondition;
window.getVal = getVal;
