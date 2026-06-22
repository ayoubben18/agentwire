# Contributing to agentwire

Thanks for your interest! This is a pnpm + Turborepo monorepo that publishes four
packages under the `@kovenlabs` scope, plus a docs site and an example app.

## Prerequisites

- **Node** ≥ 18
- **pnpm** (the repo pins a version via `packageManager`; run `corepack enable` to match it)

## Setup

```bash
pnpm install      # link the workspace
pnpm build        # tsup → ESM + CJS + d.ts for every package
pnpm test         # vitest (unit + type tests)
pnpm typecheck    # tsc across all packages
pnpm lint         # biome
```

## Repository layout

| Path | What |
| --- | --- |
| `packages/core` | `@kovenlabs/agentwire` — the bus, channels, interactive primitives |
| `packages/tools` | `@kovenlabs/agentwire-tools` — the `defineTool` factory + registry |
| `packages/react` | `@kovenlabs/agentwire-react` — generic bus hooks |
| `packages/ai-sdk` | `@kovenlabs/agentwire-ai-sdk` — the Vercel AI SDK adapter |
| `packages/typetest` | type-level tests (private) |
| `apps/docs` | the Fumadocs documentation site |
| `examples/atlas` | a runnable flight-booking example |

## Architecture rules of thumb

- **The core stays dependency-free.** Anything React- or AI-SDK-specific lives in
  its own package, behind an adapter.
- **One deep primitive, thin adapters.** `useSubscribe` owns the subscription
  mechanism; the other hooks build on it. Prefer extending the primitive over
  copying its logic.
- **The interface is the test surface.** Pure, bus-level logic should be testable
  without a React/AI-SDK harness — add a unit or type test for it.

## Commit messages — Conventional Commits (required)

Releases are automated with **semantic-release**, which reads commit messages to
decide the next version. Use [Conventional Commits](https://www.conventionalcommits.org):

| Type | Effect | Use for |
| --- | --- | --- |
| `feat:` | **minor** (`0.x.0`) | a new capability |
| `fix:` | **patch** (`0.0.x`) | a bug fix |
| `perf:` / `refactor:` | patch | perf, internal package cleanup |
| `docs:` / `chore:` / `test:` / `style:` | **no release** | docs site, README, tooling, tests, formatting |
| `feat!:` or a `BREAKING CHANGE:` footer | **major** | an incompatible change |

```
feat(ai-sdk): add useToolResultState

Returns the latest server-tool result as state, dropping the useState boilerplate.
```

All four packages are versioned **together** (one shared version line).

## Pull requests

1. Branch off `main`.
2. Make your change with a test (`packages/*/src/*.test.ts` or a type test in `packages/typetest`).
3. Ensure `pnpm build && pnpm typecheck && pnpm test && pnpm lint` are green.
4. Use Conventional Commit messages.
5. Open the PR — CI runs the same checks. Merging to `main` triggers a release if
   there are releasable commits.

## Releasing

Maintainers don't run a manual release. Pushing releasable commits to `main` makes
the **Release** workflow cut the version, changelog, GitHub release, and npm
publish automatically.

By contributing, you agree your contributions are licensed under the project's
[MIT License](./LICENSE).
