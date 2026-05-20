# Branch Policy — WL Ops

## Branch Structure

| Branch | Purpose | Who pushes |
|--------|---------|------------|
| `main` | Production-ready code | CI merge only |
| `develop` | Integration branch | Feature merges |
| `feature/*` | New features | Developer |
| `fix/*` | Bug fixes | Developer |
| `hotfix/*` | Urgent production patches | Lead only |

## Rules

- **Never commit directly to `main`** — always PR through `develop`
- **Branch naming**: `feature/fleet-readiness-chart`, `fix/login-token-expiry`
- **PR requires**: at least 1 approval, CI must pass
- **Squash merge** preferred for feature branches to keep main history clean
- **Delete branches** after merge

## Commit Message Format

```
type(scope): short description

feat(fleet): add readiness chart to dashboard
fix(auth): correct JWT expiry calculation
refactor(api): extract db pool into separate module
docs(readme): update PostgreSQL setup steps
```

Types: `feat` | `fix` | `refactor` | `docs` | `test` | `chore`
