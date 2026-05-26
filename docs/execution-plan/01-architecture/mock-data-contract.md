# Mock Data Contract — UI Studio

## Entities (8 mock entity definitions)

| Entity | ID | Role |
|---|---|---|
| Customer | entity-customer | Master/list/detail/lookup |
| Product | entity-product | Lookup source for line grid |
| SaleOrder | entity-saleorder | Header entity for transaction workspace |
| SaleOrderLine | entity-saleorderline | Line entity for transaction workspace |
| Branch | entity-branch | Cascading lookup/context filter |
| Salesperson | entity-salesperson | Header lookup |
| Financer | entity-financer | Conditional field visibility |
| TaxCharge | entity-taxcharge | Dynamic totals conceptual demo |

Source: src/mocks/ui-studio/mockEntityMetadata.ts

## View Artifacts (5 seeded views)

| View | ID | Surface | Status |
|---|---|---|---|
| Customer List | view-customer-list | list | published |
| Customer Detail | view-customer-detail | record_detail | published |
| Product Master | view-product-master | list | draft |
| Sale Order Entry | view-sale-order-entry | transaction_workspace | draft |
| Sale Order Dashboard | view-sale-dashboard | dashboard_summary | needs_attention |

Source: src/mocks/ui-studio/mockViewRepository.ts (SEED_VIEWS)

## Storage

- Default: in-memory (resets on page reload)
- Optional: localStorage key `ui-studio-mock-views` for demo continuity
- Test reset: call resetMockViewRepository() in beforeEach

## Rules

- Never import from real API or real service files
- Never use real database connections
- All mock functions simulate 120ms async delay
- Repository interface (UIStudioViewRepository) is the only public contract
