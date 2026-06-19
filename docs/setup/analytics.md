# Analytics Setup

Phase P의 무료 분석 설정을 위한 체크리스트다.

Status: Complete. Cloudflare Web Analytics shows live page views and visits.

## Primary Tool

- Cloudflare Web Analytics
- Production URL: `https://pokemon-central.pages.dev/`
- App environment variable: `NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN`

## Cloudflare Web Analytics 설정

1. Cloudflare dashboard에서 Analytics & Logs > Web Analytics로 이동한다.
2. `pokemon-central.pages.dev` 사이트를 추가한다.
3. Cloudflare가 제공하는 site token 값을 확인한다.
4. Workers & Pages > `pokemon-central` > Settings > Environment variables에 아래 값을 추가한다.

```text
NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN=<Cloudflare Web Analytics site token>
```

5. `main` 브랜치에 새 배포를 실행한다.
6. 배포된 페이지의 HTML에 `static.cloudflareinsights.com/beacon.min.js` 스크립트가 포함되는지 확인한다.
7. Cloudflare Web Analytics 대시보드에서 방문자 수와 상위 페이지가 집계되는지 확인한다.

## 같이 확인할 지표

- Search Console: 인기 검색어와 검색 노출
- Cloudflare Web Analytics: 많이 보는 페이지와 이탈이 많은 페이지
- 앱 흐름: 계산기, 팀빌더, 도감, 빌드 페이지 진입 흐름

## 로컬에서 확인할 것

토큰 없이 빌드하면 분석 스크립트가 렌더링되지 않는다. 토큰을 포함한 정적 빌드를 확인하려면 로컬 PowerShell에서 아래처럼 실행한다.

```powershell
$env:NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN="test-token"; npm.cmd run build
```

빌드 후 `out/index.html`에서 `static.cloudflareinsights.com/beacon.min.js`가 포함되는지 확인한다.
