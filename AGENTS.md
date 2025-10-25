# Agent Guidelines for Cline Development

## Build, Lint & Test Commands
- **Build**: `npm run compile` (extension) or `npm run build:webview` (UI)
- **Lint**: `npm run lint` (biome + buf)
- **Format**: `npm run format:fix` (auto-fix formatting)
- **Type check**: `npm run check-types` (TypeScript + webview)
- **Test all**: `npm test` (runs unit + integration tests)
- **Test unit**: `npm run test:unit` (mocha tests in `src/**/__tests__/*.ts`)
- **Test single file**: `npx mocha -r ts-node/register -r source-map-support/register -r ./src/test/requires.ts <path/to/test.test.ts>`
- **Watch mode**: `npm run watch` (runs esbuild + tsc watchers)

## Code Style & Conventions
- **Formatter**: Biome with tabs (width 4), semicolons as-needed, 130 line width
- **Imports**: Use path aliases (`@core/*`, `@services/*`, `@integrations/*`, `@shared/*`, `@utils/*`)
- **Types**: Strict TypeScript - always provide explicit types, avoid `any`
- **Naming**: camelCase for vars/functions, PascalCase for classes/types
- **Error handling**: Use try-catch, throw typed errors, clean up resources properly
- **Comments**: Minimal - code should be self-documenting (only add when truly necessary)
- **File placement**: Core logic in `src/core/`, integrations in `src/integrations/`, services in `src/services/`
