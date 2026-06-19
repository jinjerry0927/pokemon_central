# Google Search Console Setup

Phase O의 계정 연동 작업을 위한 체크리스트다.

## Site

- Production URL: `https://pokemon-central.pages.dev/`
- Sitemap URL: `https://pokemon-central.pages.dev/sitemap.xml`
- Robots URL: `https://pokemon-central.pages.dev/robots.txt`

## 제출 절차

1. Google Search Console에서 URL prefix 속성으로 `https://pokemon-central.pages.dev/`를 등록한다.
2. HTML file 인증 방식을 선택하고, 제공된 `google*.html` 파일을 `public/`에 저장한다.
3. 파일을 커밋하고 `main`에 푸시한 뒤 Cloudflare Pages 배포가 끝날 때까지 기다린다.
4. `https://pokemon-central.pages.dev/google*.html`이 브라우저에서 열리는지 확인한다.
5. Search Console에서 `Verify`를 누른다.
6. `Sitemaps` 메뉴에서 `https://pokemon-central.pages.dev/sitemap.xml`을 제출한다.
7. 제출 후 `Success` 상태가 보이면 Phase O의 외부 계정 작업을 완료로 판단한다.

## 로컬에서 확인할 것

```powershell
npm run lint
npm run build
```

빌드 결과의 `out/sitemap.xml`, `out/robots.txt`, `out/og-image.svg`가 생성되어야 한다.
HTML 인증 파일을 추가했다면 `out/google*.html`도 생성되어야 한다.
