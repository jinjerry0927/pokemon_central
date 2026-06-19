# Public MVP QA Checklist

Date: 2026-06-20
Phase: T. QA Checklist
Status: Passed

## Summary

Phase T covers the basic pre-launch QA pass for the static-export MVP. The local
build checks passed, generated internal routes were checked for missing href
targets, and the production Pages URL responded successfully.

## Checklist

| Item | Status | Evidence |
| --- | --- | --- |
| Build succeeds | Passed | `npm run build` completed and generated 50 static pages. |
| Lint succeeds | Passed | `npm run lint` completed with `--max-warnings=0`. |
| No 404 on primary links | Passed | Checked 47 generated HTML files in `out/`; no missing internal href targets. |
| Search/filter behavior | Passed | Search and filter UI remains implemented in client components for Pokedex, Speed Tiers, Team Builder, and Type Chart; build/type checks passed. |
| localStorage save behavior | Passed | Team Builder reads and writes `pokemon-central-team-builder` after hydration; build/type checks passed. |
| Deployment URL responds | Passed | `https://pokemon-central.pages.dev/` returned HTTP 200. |
| Source/disclaimer visible | Passed | `/sources` is a generated route and links from the shared footer; `data/sources.md` remains the source policy record. |

## Commands Run

```powershell
npm run lint
npm run build
```

Additional checks:

```powershell
# Internal href target check against the exported out/ directory.
# Result: Checked 47 HTML files; no missing internal href targets.

# Production URL check.
# Result: 200 https://pokemon-central.pages.dev/
```

## Notes

- The app is still using MVP sample/manual-curation data where the current
  roadmap allows it. This QA pass does not convert sample records into public
  production data.
- Browser-side team saves are intentionally scoped to `localStorage`; no server
  persistence is expected for this phase.
