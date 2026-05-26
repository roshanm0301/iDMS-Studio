# Frontend-Only Scope — UI Studio

## In Scope (current stage)

- All UI Studio pages, components, hooks, stores, types, mocks
- Mock entity metadata (simulates Entity Designer output)
- Mock view repository (in-memory + localStorage)
- Mock sample records for preview
- Zustand editor state
- TanStack Query hooks wrapping mock repository
- Placeholder routes and navigation
- Design audit of Entity Designer
- Vitest + React Testing Library test suite

## Out of Scope (do not build)

- Real backend API services
- Database schema or migrations
- Real authentication/authorization (use mock roles/personas)
- Real workflow engine (use mock workflow states)
- Real rules engine (use lightweight frontend evaluator)
- Production audit log persistence
- Theme Builder
- Print Builder
- Navigation/Menu Builder
- AI view generation
- Custom Component SDK
- External URL View (P1, not P0)
- Portal or mobile-specific builders
