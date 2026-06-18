# GitHub Setup

## Current Status

- Local Git is already initialized.
- The canonical local repository path is `C:\Users\James\Documents\GitHub\pokemon_central`.
- This Codex session is running from a temporary worktree at `C:\Users\James\.codex\worktrees\ce82\pokemon_central`.
- The `main` branch tracks `origin/main`.
- Remote GitHub connection is configured:

```text
origin  https://github.com/jinjerry0927/pokemon_central.git
```

## Repository Name

```text
pokemon_central
```

## Local Git Setup

Already complete. Historical setup command:

```powershell
git init
git add .
git commit -m "Initial Pokemon Champions guide planning setup"
```

## Connect Existing GitHub Repository

Already complete. Historical setup command:

```powershell
git remote add origin https://github.com/jinjerry0927/pokemon_central.git
git branch -M main
git push -u origin main
```

## Verify Remote

```powershell
git remote -v
git status --short --branch
```

## Notes

- Do not commit `.env` files.
- Prefer private repository until asset/source licensing and public copy are reviewed.
- Add a fan-made disclaimer before public launch.
