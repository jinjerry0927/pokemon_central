# Google Search Console Setup

Phase O의 계정 연동 작업을 위한 체크리스트다.

## Site

- Production URL: `https://pokemon-central.pages.dev/`
- Sitemap URL: `https://pokemon-central.pages.dev/sitemap.xml`
- Robots URL: `https://pokemon-central.pages.dev/robots.txt`

## 제출 절차

1. Google Search Console에서 URL prefix 속성으로 `https://pokemon-central.pages.dev/`를 등록한다.
2. 소유권 확인은 Cloudflare Pages에서 제공되는 배포 페이지 접근 가능 상태를 기준으로 진행한다.
3. `Sitemaps` 메뉴에서 `https://pokemon-central.pages.dev/sitemap.xml`을 제출한다.
4. 제출 후 `Success` 상태가 보이면 Phase O의 외부 계정 작업을 완료로 판단한다.

## 로컬에서 확인할 것

```powershell
npm run lint
npm run build
```

빌드 결과의 `out/sitemap.xml`, `out/robots.txt`, `out/og-image.svg`가 생성되어야 한다.
