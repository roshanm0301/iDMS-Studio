# Design System Rules — UI Studio

## Hard Rules

- UI Studio must visually feel like a native extension of Entity Designer.
- Reuse existing CSS classes from src/styles/globals.css and tokens from src/styles/tokens.css.
- Do NOT introduce new CSS frameworks, CSS-in-JS libraries, or Tailwind.
- Use the same icon library: lucide-react (14-16px sizing).
- Use the same button classes: .btn, .btn-primary, .btn-secondary, .btn-ghost, .btn-sm, .btn-icon.
- Use the same card pattern: .card class with consistent border-radius and padding.
- Use the same table pattern: native HTML <table> with .data-table class where applicable.
- Use the same empty state pattern: .empty, .empty-icon, .empty-title, .empty-desc classes.
- Use the same page header pattern: .page-head, .page-title, .page-sub classes.
- Use the same status badge pattern: .tag, .tag.green, .tag.amber, .tag.red, .tag.violet.
- Reuse Radix UI primitives already installed: Dialog, Select, Tabs, Accordion, Popover, Tooltip, DropdownMenu.

## New Components

If UI Studio needs a visual pattern not in Entity Designer, create it under src/components/ui-studio/common/ and ensure it uses the existing CSS variables. Document the new pattern in the design audit.

## Reference Files

- src/styles/tokens.css — all design tokens
- src/styles/globals.css — all utility classes
- src/components/shell/AppShell.tsx — page shell
- src/pages/EntityListPage.tsx — list page with cards pattern
- src/pages/SchemaBuilderPage.tsx — three-panel editor pattern
