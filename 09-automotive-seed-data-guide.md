# 09 — Automotive Seed Data Guide

## 1. Purpose

The seed data file provides a realistic Automotive DMS mock configuration for building the Admin Studio UI without backend dependencies.

File:

```text
seed/idms_admin_studio_automotive_seed.json
```

## 2. Domain Scenario

Tenant: **Bajaj Auto Demo**  
Vertical: **Automotive DMS**  
Node: **Pune Central Branch**  
Primary Artifact: **Vehicle Order**

The scenario demonstrates:

1. Platform fields inherited by all order-like entities
2. Automotive vertical fields such as vehicle model and registration number
3. Bajaj tenant fields such as GSTIN and dealer code
4. Role-level field masking for Sales Executive
5. Rules at Platform, Vertical, Tenant, Node, and Role layers
6. Workflow transition gates
7. Permission matrix with action, field, and row access
8. Overlay deltas and resolved preview
9. Release package with simulations and validation findings

## 3. Main Mock Entities

| Entity | Purpose |
|---|---|
| `vehicle_order` | Main sales/order process for vehicle purchase |
| `vehicle_booking` | Booking before order conversion |
| `service_job` | After-sales service job card |
| `parts_inventory` | Spare parts stock tracking |
| `customer` | Customer master |
| `vehicle_master` | Vehicle catalog/master data |

## 4. Main Roles

| Role | Purpose |
|---|---|
| `OEM_ADMIN` | Full platform and tenant administration |
| `DEALER_PRINCIPAL` | Dealer-level governance and approvals |
| `SALES_MANAGER` | Branch sales approval |
| `SALES_EXECUTIVE` | Creates and submits vehicle orders |
| `SERVICE_MANAGER` | Service job management |
| `PARTS_MANAGER` | Parts inventory management |

## 5. Layers Demonstrated

| Layer | Example |
|---|---|
| Platform | `customer_id`, `total_amount`, minimum line items rule |
| Vertical | `vehicle_model`, `registration_no`, vehicle model required rule |
| Tenant | `gstin`, `bajaj_dealer_code`, Bajaj dealer code rule |
| Node | Pune discount constraint |
| Role | Hide `cost_price` and block high-value approval for Sales Executive |

## 6. Suggested Mock Service Shape

Your frontend mock service can expose:

| Function | Reads From |
|---|---|
| `listArtifacts()` | `artifact_registry` |
| `getEntitySchema(artifactKey)` | `entity_schemas` |
| `listRules(entityType)` | `rules` |
| `getWorkflow(entityType)` | `workflows` |
| `getOverlayTrace(artifactKey)` | `overlay_deltas` |
| `getPermissions(resourceRef)` | `permission_rules` |
| `getReleasePackages()` | `release_packages` |
| `runSimulation(caseId)` | `simulation_cases` and deterministic mock evaluator |

## 7. Recommended Demo Flow

1. Open `/admin/studio`.
2. Select `Vehicle Order`.
3. Preview as `SALES_EXECUTIVE`.
4. Notice `cost_price` hidden by role overlay.
5. Open Rules tab.
6. Inspect `Sales Executive Approval Limit`.
7. Open Workflow tab.
8. Select `SUBMITTED → APPROVED`.
9. Run simulation with order amount ₹650000.
10. See permission/rule outcome.
11. Open Overlay tab.
12. Inspect tenant GSTIN delta.
13. Add changes to release package.
14. Run validation.
15. Review compile readiness.

## 8. Important Mock Limitations

The seed data is not a backend contract. It is a UI-driving dataset.

Do not infer that every property is currently persisted exactly as shown. Use it to design and validate screens, interactions, and data dependencies.
