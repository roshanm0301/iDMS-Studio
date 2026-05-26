# Project Command Map — UI Studio

All commands run from: /home/user/iDMS-Studio/studio/

## Milestone Gate Commands (run all before committing)

| Purpose | Command |
|---|---|
| Run tests | `npm run test` |
| UI Studio TypeScript check | `npm run typecheck:ui-studio` |
| UI Studio lint check | `npm run lint:ui-studio` |
| Vite bundle check | `npx vite build` |

## Development Commands

| Purpose | Command |
|---|---|
| Dev server | `npm run dev` |
| Watch tests | `npm run test:watch` |

## Full project commands (will show pre-existing errors)

| Purpose | Command | Note |
|---|---|---|
| Full typecheck | `npm run typecheck` | Shows pre-existing Entity Designer TS errors |
| Full lint | `npm run lint` | Shows pre-existing Entity Designer lint errors |
| Full build | `npm run build` | Fails due to pre-existing TS errors in tsc -b step |

## Pre-existing Issues (NOT introduced by UI Studio)

Entity Designer files have TypeScript and lint errors that existed before M0.
These are documented here and should not block UI Studio milestone gates.
Use the scoped commands (typecheck:ui-studio, lint:ui-studio) for milestone validation.
