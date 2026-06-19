# Pokemon Central Development Loop Roadmap

이 문서는 Pokemon Champions 한국어 공략 웹을 무료 운영 구조로 만들기 위한 A-Z 실행 계획서다.

운영 기본값:

- Desktop-first web
- Static-first hosting
- Cloudflare Pages free plan
- GitHub repository as source of truth
- No paid domain for MVP
- No database for MVP
- Local JSON/Markdown data first
- Browser localStorage for user-side team save

## Loop 원칙

각 단계는 아래 루프를 반복한다.

```text
Plan -> Build -> Verify -> Commit -> Deploy/Document -> Review
```

- Plan: 이번 단계의 산출물과 완료 기준을 정한다.
- Build: 가장 작은 단위로 구현한다.
- Verify: 빌드, 린트, 수동 확인 중 가장 적절한 검증을 한다.
- Commit: 의미 있는 단위로 커밋한다. Phase가 완료되면 커밋 전에 해당 Phase 제목 끝에 `✅`를 붙인다.
- Deploy/Document: 배포하거나 문서를 갱신한다.
- Review: 다음 단계의 리스크와 우선순위를 다시 정한다.

## Phase A. Project Base ✅

목표: 프로젝트가 어디서 운영되는지 명확히 하고, GitHub 기반 작업 루틴을 고정한다.

해야 할 일:

- `C:\Users\James\Documents\GitHub\pokemon_central`를 유일한 작업 루트로 사용한다.
- GitHub 원격 연결 상태를 확인한다.
- `README.md`, `docs/`, `data/`, `src/`, `public/` 구조를 유지한다.
- 문서 변경도 코드처럼 커밋한다.

완료 기준:

- `git status --short --branch`에서 `main...origin/main`이 보인다.
- 로컬 변경사항이 없거나 의도한 변경만 남아 있다.

검증 명령:

```powershell
git status --short --branch
git remote -v
```

현재 확인 결과:

- 원본 저장소 루트: `C:\Users\James\Documents\GitHub\pokemon_central`
- 현재 Codex 작업 루트: `C:\Users\James\.codex\worktrees\ce82\pokemon_central`
- 원격 저장소: `https://github.com/jinjerry0927/pokemon_central.git`
- 기본 브랜치 `main`은 `origin/main`과 같은 커밋을 가리킨다.
- 이 Codex 세션은 임시 worktree의 detached HEAD에서 실행된다.

## Phase B. Product Scope Lock ✅

목표: MVP 범위를 고정해서 기능이 과하게 커지는 것을 막는다.

해야 할 일:

- MVP 대상 사용자를 "한국어 Pokemon Champions 입문/랭크 준비 유저"로 고정한다.
- 1차 기능을 도감, 빌드, 팀빌더, 스피드 티어, 계산기, 공략 글로 제한한다.
- 모바일은 조회/검색 보조로만 정의한다.

완료 기준:

- `docs/planning/product-plan.md`에 MVP 범위가 반영되어 있다.
- 추가 기능은 Backlog로만 기록한다.

## Phase C. Tech Stack Setup ✅

목표: 무료 정적 배포에 맞는 프론트엔드 프로젝트를 만든다.

권장 선택:

- Next.js
- TypeScript
- Tailwind CSS
- Static export 가능 구조

해야 할 일:

- 앱 프레임워크를 `pokemon_central` 루트에 설치한다.
- ESLint와 TypeScript 검증을 켠다.
- 초기 홈 화면을 만든다.

완료 기준:

- 로컬 개발 서버가 실행된다.
- 빌드가 성공한다.

검증 명령:

```powershell
npm run lint
npm run build
```

## Phase D. Hosting Setup ✅

목표: Cloudflare Pages 무료 배포 파이프라인을 만든다.

로컬 준비 문서:

- `docs/setup/cloudflare-pages.md`

해야 할 일:

- GitHub 저장소를 Cloudflare Pages에 연결한다.
- Production branch를 `main`으로 설정한다.
- 기본 도메인은 `*.pages.dev`를 사용한다.
- 커스텀 도메인은 MVP 이후로 미룬다.

완료 기준:

- `main`에 push하면 자동 배포된다.
- 배포 URL로 홈 화면에 접근할 수 있다.

검증:

- Cloudflare Pages 빌드 로그 확인
- 배포 URL 접속 확인

배포 URL:

- https://pokemon-central.pages.dev/

## Phase E. Data Source Policy ✅

목표: 데이터 출처와 저장 방식을 먼저 정한다.

해야 할 일:

- 기본 데이터는 `data/` 아래 JSON으로 관리한다.
- PokeAPI, PokemonDB, Smogon 등 참고 출처를 문서화한다.
- Pokemon Champions 전용 정보는 수동 큐레이션 데이터로 분리한다.
- 출처 불명 데이터는 공개 페이지에 사용하지 않는다.

권장 파일:

```text
data/pokemon.json
data/moves.json
data/abilities.json
data/items.json
data/builds.json
data/teams.json
data/sources.md
```

완료 기준:

- 각 데이터 파일에 최소 샘플이 있다.
- `data/sources.md`에 출처와 사용 범위가 적혀 있다.

## Phase F. Information Architecture ✅

목표: 페이지 구조와 URL을 고정한다.

권장 URL:

```text
/
/pokedex
/pokemon/[slug]
/builds
/builds/[slug]
/teams
/calculator
/speed-tiers
/type-chart
/guides
/guides/[slug]
/about
```

완료 기준:

- 주요 페이지 라우트가 생성되어 있다.
- 빈 페이지라도 목적이 명확하다.

## Phase G. Design System ✅

목표: 데스크탑 정보 밀도에 맞는 UI 기준을 만든다.

해야 할 일:

- 3컬럼 레이아웃 기준을 만든다.
- 테이블, 필터, 탭, 검색창, 카드, 배지 컴포넌트를 만든다.
- 색상은 단일 포켓몬 타입색 남용을 피하고, 타입은 배지/보조 정보로 사용한다.

완료 기준:

- 공통 레이아웃과 기본 컴포넌트가 재사용 가능하다.
- 데스크탑에서 도감/상세/보조 패널이 동시에 보인다.

## Phase H. Pokedex MVP ✅

목표: 유저가 포켓몬을 빠르게 찾고 핵심 정보를 볼 수 있게 한다.

해야 할 일:

- 포켓몬 목록 표시
- 이름 검색
- 타입 필터
- 상세 페이지 연결
- 상세에서 종족값, 타입, 특성, 주요 기술, 추천 빌드 표시

완료 기준:

- 최소 20마리 샘플 데이터로 목록/상세가 동작한다.
- 검색/필터가 브라우저에서 즉시 반응한다.

## Phase I. Build Library ✅

목표: 초보자가 바로 따라 할 수 있는 샘플 빌드를 제공한다.

해야 할 일:

- 빌드 데이터 구조를 만든다.
- 빌드 목록과 상세 페이지를 만든다.
- 성격, 노력치, 기술, 아이템, 역할, 운영법, 카운터를 표시한다.

완료 기준:

- 최소 10개 샘플 빌드가 있다.
- 포켓몬 상세에서 관련 빌드로 이동할 수 있다.

## Phase J. Team Builder MVP ✅

목표: 6마리 팀 구성과 약점 요약을 제공한다.

해야 할 일:

- 6개 슬롯 UI
- 포켓몬 검색 후 슬롯 추가
- 타입 약점 요약
- 역할 태그 요약
- localStorage 저장/불러오기

완료 기준:

- 새로고침 후에도 팀이 유지된다.
- 팀 약점이 시각적으로 표시된다.

## Phase K. Speed Tiers ✅

목표: 실전에서 중요한 스피드 비교를 쉽게 보여준다.

해야 할 일:

- 포켓몬별 스피드 수치 표시
- 성격/노력치 기준 프리셋 제공
- 빠른 검색과 정렬 제공

완료 기준:

- 주요 포켓몬의 스피드 순위를 비교할 수 있다.
- 빌드 상세에서 스피드 티어로 이동할 수 있다.

## Phase L. Type Chart ✅

목표: 상성 확인을 빠르게 한다.

해야 할 일:

- 타입 공격/방어 상성표 구현
- 포켓몬 상세와 팀빌더에서 상성 요약 연결

완료 기준:

- 단일/복합 타입 방어 상성을 표시한다.
- 팀 전체 약점/저항 요약에 재사용된다.

## Phase M. Damage Calculator MVP ✅

목표: 초보자가 결과를 이해할 수 있는 계산기를 만든다.

해야 할 일:

- 공격자/방어자 선택
- 기술 선택
- 레벨, 공격/특공, 방어/특방, 위력, 타입 보정 계산
- 최소/최대 데미지와 확정 타수 표시

완료 기준:

- 포켓몬 상세에서 계산기로 값을 넘길 수 있다.
- 계산 결과가 사람에게 읽히는 문장으로 표시된다.

## Phase N. Guide Content MVP ✅

목표: 검색 유입과 초보자 체류를 만든다.

초기 글:

- Pokemon Champions 시작 가이드
- 첫 랭크 팀 추천
- 타입 상성 빠른 이해
- 스피드 티어 보는 법
- 데미지 계산기 쓰는 법

완료 기준:

- 최소 5개 가이드가 있다.
- 각 글에서 관련 도감/빌드/계산기로 연결된다.

## Phase O. SEO Setup

목표: 검색 노출을 준비한다.

로컬 준비 문서:

- `docs/setup/search-console.md`

해야 할 일:

- 페이지별 title/description 작성
- sitemap 생성
- robots.txt 생성
- Open Graph 기본 이미지 준비
- Google Search Console 등록

완료 기준:

- 주요 페이지가 검색엔진에 색인 가능하다.
- Search Console에서 사이트맵 제출이 완료된다.

## Phase P. Analytics Setup ✅

목표: 무료 분석으로 어떤 콘텐츠가 필요한지 판단한다.

권장:

- Cloudflare Web Analytics
- Google Search Console
- 필요 시 Google Analytics

확인할 지표:

- 인기 검색어
- 많이 보는 포켓몬
- 이탈이 많은 페이지
- 계산기/팀빌더 사용 흐름

진행 상태:

- Cloudflare Web Analytics 토큰 기반 스크립트 연결
- 설정 체크리스트: `docs/setup/analytics.md`

완료 기준:

- 방문자 수와 검색 노출을 확인할 수 있다.

## Phase Q. Attribution / Disclaimer ✅

목표: 팬사이트 운영 리스크를 줄인다.

해야 할 일:

- About 페이지에 팬메이드 고지 추가
- 데이터 출처 페이지 추가
- 공식 사이트가 아님을 명확히 표시
- 이미지/스프라이트 사용 정책 확인 전까지 임시 UI 사용

완료 기준:

- 사이트 하단 또는 About에서 고지를 확인할 수 있다.

## Phase R. Desktop UX Pass ✅

목표: 데스크탑 공략 허브로서 정보 탐색이 편해야 한다.

확인할 것:

- 1440px 이상에서 3컬럼 레이아웃이 자연스러운가
- 검색/필터가 화면 이동 없이 가능한가
- 계산기와 상세 정보가 동시에 보이는가
- 긴 표가 가로 스크롤 없이 읽히는가

완료 기준:

- 주요 작업을 데스크탑에서 3클릭 이내 시작할 수 있다.

## Phase S. Mobile Readability Pass ✅

목표: 모바일에서도 최소 조회는 가능하게 한다.

해야 할 일:

- 공략 글 읽기
- 포켓몬 검색
- 포켓몬 상세 확인
- 팀빌더/계산기는 간소화하거나 안내 처리

완료 기준:

- 모바일에서 내용이 깨지지 않는다.
- 데스크탑 전용 기능은 명확히 안내된다.

## Phase T. QA Checklist ✅

목표: 공개 전 기본 오류를 줄인다.

체크리스트:

- 빌드 성공
- 린트 성공
- 주요 링크 404 없음
- 검색/필터 동작
- localStorage 저장 동작
- 배포 URL 접속
- 출처/고지 표시

검증 명령:

```powershell
npm run lint
npm run build
```

## Phase U. Public MVP Launch

목표: 무료 도메인으로 첫 공개한다.

해야 할 일:

- Cloudflare Pages 배포 URL 확정
- README에 배포 URL 추가
- Search Console 등록
- 지인/커뮤니티 소규모 피드백 수집

진행 상태:

- 공개 URL: https://pokemon-central.pages.dev/
- README 공개 URL 및 피드백 로그 연결 완료
- 피드백 기록 문서: `docs/planning/mvp-feedback.md`
- Search Console 대시보드 등록 상태 확인 필요
- 실제 사용자 피드백 수집 필요

완료 기준:

- 외부 사용자가 접속 가능하다.
- 피드백을 기록할 문서가 있다.

## Phase V. Feedback Loop

목표: 실제 사용자의 불편을 다음 개발 우선순위로 바꾼다.

해야 할 일:

- `docs/planning/backlog.md` 생성
- 피드백을 기능, 데이터 오류, 콘텐츠 요청, UI 불편으로 분류
- 매주 우선순위 3개만 선정

진행 상태:

- `docs/planning/backlog.md` 생성 완료
- 기능, 데이터 오류, 콘텐츠 요청, UI 불편 분류 기준 작성 완료
- 주간 Top 3 선정 규칙 및 기록 형식 작성 완료
- 테스트 피드백으로 기록, UI 분류, Backlog 등록, 주간 우선순위 선정 흐름 검증 완료
- 실제 사용자 피드백 수집 후 첫 우선순위 선정 필요

완료 기준:

- 다음 작업이 감이 아니라 기록 기반으로 결정된다.

## Phase W. Data Update Loop ✅

목표: 시즌/룰 변경에 대응한다.

해야 할 일:

- 데이터 업데이트 체크리스트 작성
- 변경된 포켓몬/기술/아이템/룰셋을 기록
- 변경 데이터와 관련 공략을 함께 수정

완료 기준:

- 데이터 변경 이유와 출처가 남는다.

완료 기록:

- 업데이트 체크리스트: `docs/planning/data-update-checklist.md`
- 데이터 변경 이력: `data/update-log.md`
- 현재 운영 데이터 변경 없음 기준선과 관련 공략 검토 결과 기록 완료

## Phase X. Feature Expansion ✅

목표: MVP 이후 가치가 큰 기능만 확장한다.

후보:

- 고급 데미지 계산 보정
- 팀 공유 링크
- 빌드 즐겨찾기
- 비교 모드
- 사용률 기반 추천
- 커뮤니티 제보 폼

우선순위 기준:

- 반복 사용을 늘리는가
- 초보자 이해를 돕는가
- 무료 운영 범위를 유지하는가

선정 기능:

- 팀 공유 링크
- 선정 이유: 기존 팀빌더의 반복 사용과 팀 피드백 흐름을 늘리면서 서버, 계정, 외부 API 없이 무료 운영 범위를 유지한다.

완료 기준:

- 현재 팀 구성을 URL로 복사할 수 있다.
- 공유 URL을 열면 유효한 포켓몬만 팀 슬롯에 복원된다.
- 기존 브라우저 저장 방식과 함께 동작한다.

## Phase Y. Cost Review

목표: 무료 운영이 계속 가능한지 확인한다.

진행 상태:

- 비용 검토 기록 생성: `docs/planning/cost-review.md`
- 서버, DB, 외부 API, 도메인, 저장소 크기 기준 검토 완료
- Cloudflare Pages 최근 30일 빌드 횟수와 트래픽 대시보드 확인 필요

확인할 것:

- Cloudflare Pages 빌드 횟수
- 트래픽
- 저장소 크기
- 외부 API 호출 여부
- 커스텀 도메인 필요성

무료 운영 유지 기준:

- 서버 없음
- DB 없음
- 유료 도메인 없음
- 외부 API는 빌드 시점 또는 수동 데이터로 제한

## Phase Z. Long-Term Operation ✅

목표: 사이트가 방치되지 않도록 운영 리듬을 만든다.

월간 루틴:

- 인기 페이지 확인
- 검색어 확인
- 데이터 오류 수정
- 신규 공략 1-2개 작성
- 빌드/팀 추천 최신화

릴리즈 루틴:

```text
issue/backlog -> branch -> implement -> lint/build -> commit -> push -> Cloudflare deploy -> check live URL
```

완료 기준:

- 월간 점검 항목, 기록 위치, 릴리즈 절차가 하나의 반복 가능한 운영 런북으로 연결된다.
- 확인할 수 없는 외부 지표를 추정하지 않고 상태와 재확인 시점을 남긴다.

완료 기록:

- 장기 운영 런북: `docs/planning/long-term-operation.md`
- 월간 운영 기록 템플릿: `docs/planning/operation-log.md`

장기 목표:

- "Pokemon Champions 한국어 입문자가 처음 찾는 공략 허브"가 되는 것.
- 대형 사이트와 모든 기능으로 경쟁하지 않고, 설명력과 연결된 도구 경험으로 차별화한다.
