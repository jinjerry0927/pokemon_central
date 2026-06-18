# GitHub Setup

## Current Status

- Local Git can be initialized in this workspace.
- GitHub CLI `gh` is not currently available in this environment.
- Remote GitHub connection requires either an existing repository URL or GitHub CLI/browser authentication outside this environment.

## Recommended Repository Name

```text
pokemon-champions-guide
```

Alternative:

```text
pokemon-champions-korean-guide
```

## Local Git Setup

Run from the workspace root:

```powershell
git init
git add .
git commit -m "Initial Pokemon Champions guide planning setup"
```

## Connect Existing GitHub Repository

After creating a repository on GitHub, run:

```powershell
git remote add origin https://github.com/<owner>/<repo>.git
git branch -M main
git push -u origin main
```

## Verify Remote

```powershell
git remote -v
git status
```

## Notes

- Do not commit `.env` files.
- Prefer private repository until asset/source licensing and public copy are reviewed.
- Add a fan-made disclaimer before public launch.
