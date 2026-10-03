## What changed and why

Renames the `spacing.md` design token to `spacing.medium` for clarity ahead
of the multi-brand theming work in a later lesson. This is a shared package,
so every consuming team needs to sign off before it merges.

## Blast Radius

- packages/design-system

## Approvals

- @pulse/platform-team
- @pulse/billing-team
- @pulse/analytics-team
- @pulse/admin-team

## How to verify

`pnpm --filter @pulse/design-system test` and confirm no consuming app's
snapshot tests broke.
