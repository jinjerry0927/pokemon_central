# Long-Term Operation

Pokemon Central을 무료 운영 범위 안에서 꾸준히 유지하기 위한 Phase Z 운영 런북이다. 월간 점검 결과는
[`operation-log.md`](./operation-log.md)에 남기며, 확인할 데이터가 없으면 임의의 수치를 만들지 않고 `확인 불가`와 이유를 기록한다.

## Operating Cadence

- 매월 마지막 주에 월간 점검을 1회 진행한다.
- 데이터 오류처럼 잘못된 정보를 공개하는 문제는 월간 점검일까지 기다리지 않는다.
- 실제 수정이 필요한 항목만 `backlog.md`에 등록하고, 변경이 없으면 변경 없음으로 기록한다.
- 서버, DB, 유료 도메인, 런타임 외부 API를 추가하지 않는 무료 운영 원칙을 유지한다.

## Monthly Routine

### 1. 이용 현황 확인

- [ ] Cloudflare Web Analytics에서 최근 30일 상위 페이지와 방문 흐름을 확인한다.
- [ ] Google Search Console에서 최근 28일 상위 검색어, 노출, 클릭을 확인한다.
- [ ] 이전 달과 비교해 유지할 페이지와 개선 후보를 각각 기록한다.
- [ ] 대시보드에 접근할 수 없거나 데이터가 부족하면 그 상태와 재확인 날짜를 기록한다.

관련 문서:

- [`../setup/analytics.md`](../setup/analytics.md)
- [`../setup/search-console.md`](../setup/search-console.md)

### 2. 오류와 피드백 정리

- [ ] `mvp-feedback.md`의 신규 의견을 분류한다.
- [ ] 반복되거나 영향이 확인된 항목만 `backlog.md`로 이동한다.
- [ ] 데이터 오류는 `data-update-checklist.md`에 따라 출처와 영향받는 공략을 함께 확인한다.
- [ ] 즉시 수정하지 않는 항목에는 보류 이유를 남긴다.

### 3. 콘텐츠 최신화

- [ ] 검색 수요와 초보자 질문을 근거로 신규 공략 1~2개 후보를 정한다.
- [ ] 근거가 충분한 후보만 작성하고, 수요가 없으면 억지로 추가하지 않는다.
- [ ] 현재 룰셋 기준으로 빌드와 팀 추천을 검토한다.
- [ ] 변경된 포켓몬, 기술, 아이템이 기존 공략과 연결된 페이지에 반영됐는지 확인한다.

### 4. 검증과 기록

```powershell
Get-ChildItem data\*.json | ForEach-Object { Get-Content -Raw -Encoding UTF8 $_.FullName | ConvertFrom-Json | Out-Null }
npm run lint
npm run build
```

- [ ] JSON 파싱, 린트, 정적 빌드 결과를 기록한다.
- [ ] 변경한 페이지와 연결된 링크를 로컬 또는 배포 URL에서 확인한다.
- [ ] `operation-log.md`에 지표 요약, 결정, 변경 파일, 검증 결과, 다음 점검일을 남긴다.

## Release Routine

```text
issue/backlog -> branch -> implement -> lint/build -> commit -> push -> Cloudflare deploy -> check live URL
```

1. Backlog ID와 완료 조건을 정한다.
2. 한 릴리즈에서 관련 없는 변경을 섞지 않는다.
3. 데이터 변경은 출처와 `data/update-log.md` 기록을 포함한다.
4. `npm run lint`와 `npm run build`를 통과한 변경만 푸시한다.
5. Cloudflare Pages 배포 후 변경 페이지와 핵심 경로를 확인한다.
6. 확인 결과를 Backlog와 월간 운영 기록에 연결한다.

## Incident Rule

다음 항목은 정기 루틴과 별도로 즉시 확인한다.

- 사이트 또는 핵심 경로가 열리지 않음
- 잘못된 계산 결과 또는 공개 데이터 오류
- 삭제되거나 비공개 처리된 데이터로 가는 링크
- 배포 실패 또는 분석 스크립트의 예기치 않은 누락

즉시 수정할 수 없으면 영향 범위, 임시 대응, 다음 확인 시점을 `backlog.md`에 기록한다.
