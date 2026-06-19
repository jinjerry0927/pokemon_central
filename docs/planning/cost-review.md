# Cost Review

Phase Y의 무료 운영 가능 여부를 판단하기 위한 검토 기록이다.

검토일: 2026-06-20

## 현재 결론

로컬 구조는 무료 운영 유지 기준을 충족한다. Cloudflare Pages의 실제 빌드
횟수와 트래픽은 대시보드 수치를 확인한 뒤 최종 판정한다.

## 검토 결과

| 항목 | 상태 | 근거 |
| --- | --- | --- |
| 서버 | 통과 | `next.config.ts`가 `output: "export"`를 사용하며 정적 파일을 `out/`에 생성한다. |
| DB | 통과 | 런타임 DB 클라이언트와 DB 의존성이 없고 콘텐츠는 저장소의 JSON/Markdown으로 관리한다. |
| 외부 API | 통과 | 앱 코드에 런타임 `fetch` 또는 외부 API 클라이언트가 없다. Cloudflare Web Analytics 비콘만 선택적으로 로드한다. |
| 도메인 | 통과 | 운영 URL은 무료 `pokemon-central.pages.dev`이며 커스텀 도메인을 사용하지 않는다. |
| 저장소 크기 | 통과 | 현재 버전관리 대상 파일은 66개이며 전체 크기는 약 0.40 MiB다. |
| Pages 빌드 횟수 | 확인 필요 | Cloudflare 대시보드의 최근 30일 빌드 횟수와 현재 플랜 한도를 비교한다. |
| 트래픽 | 확인 필요 | Cloudflare Pages 및 Web Analytics의 최근 30일 요청/방문 수와 현재 플랜 한도를 비교한다. |

저장소 수치는 검토일의 로컬 `main` 작업 트리를 기준으로 아래 명령으로
측정했다.

```powershell
$files = @(git ls-files --cached --others --exclude-standard)
$bytes = ($files | Get-Item | Measure-Object -Property Length -Sum).Sum
$files.Count
[math]::Round($bytes / 1MB, 2)
```

## Cloudflare 대시보드 확인 절차

1. Workers & Pages에서 `pokemon-central` 프로젝트를 연다.
2. 최근 30일의 성공 및 실패 배포 횟수를 기록한다.
3. Analytics에서 최근 30일 요청 수와 대역폭을 기록한다.
4. Web Analytics에서 최근 30일 방문 수를 기록한다.
5. 확인 시점의 Cloudflare 무료 플랜 한도와 비교해 여유 여부를 판정한다.

| 측정 기간 | 전체 빌드 | 실패 빌드 | 요청 수 | 대역폭 | 방문 수 | 판정 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 최근 30일 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 대시보드 확인 필요 |

## 완료 조건

- 위 대시보드 표에 실제 수치를 기록한다.
- 확인 시점의 무료 플랜 한도 대비 여유가 있음을 확인한다.
- 한도에 근접하면 자동 배포를 줄이거나 정적 자산 크기를 줄이는 대응을
  `docs/planning/backlog.md`에 등록한다.
