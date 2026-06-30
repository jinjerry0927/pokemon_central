# Feedback Backlog

공개 MVP 피드백을 다음 개발 작업으로 전환하는 우선순위 문서다. 원본 의견은
[`mvp-feedback.md`](./mvp-feedback.md)에 먼저 기록하고, 반복 확인과 분류를 거친 항목만 이 문서로 옮긴다.

## Operating Rules

1. 피드백 로그의 날짜와 채널을 근거로 남긴다.
2. 같은 문제는 하나의 Backlog ID로 합치고 `Evidence` 횟수를 늘린다.
3. 아래 네 분류 중 하나를 지정한다.
4. 매주 최대 3개만 `Selected`로 변경한다. 근거가 없으면 빈 자리를 억지로 채우지 않는다.
5. `P0`는 주간 선정일까지 기다리지 않고 즉시 확인한다.

## Categories

- `Feature`: 기능 동작, 누락된 기능, 사용 흐름 문제
- `Data`: 포켓몬, 기술, 빌드, 계산 결과 등 데이터 오류
- `Content`: 공략 추가, 설명 보강, 한국어 표현 개선 요청
- `UI`: 가독성, 반응형, 탐색, 조작 불편

## Status Values

- `Candidate`: 분류와 근거 기록을 마친 후보
- `Selected`: 이번 주 우선순위로 선정
- `In Progress`: 수정 작업 진행 중
- `Done`: 수정 및 검증 완료
- `Deferred`: 현재 MVP 범위 또는 비용 때문에 보류

## Backlog

실제 사용자 피드백은 아직 수집되지 않았다. 아래 항목은 분류와 선정 흐름을 검증하기 위한 테스트 데이터다.

| ID | Category | Summary | Evidence | Priority | Status | Source |
| --- | --- | --- | ---: | --- | --- | --- |
| FB-TEST-001 | UI | `[TEST]` 모바일 팀빌더 버튼 터치 영역 개선 | 1 | P2 | Selected | 2026-06-20 / Test |
| FB-DATA-001 | Data | 메가스톤 수집 및 포켓몬별 전용 도구 필터링 | 1 | P2 | Candidate | 2026-06-30 / Planning |

Priority는 `mvp-feedback.md`의 `P0`~`P3` 기준을 사용한다. Source에는 피드백 로그의
날짜와 채널을 적어 원문을 다시 찾을 수 있게 한다.

## Weekly Top 3

### 2026-06-15 ~ 2026-06-21

테스트 피드백 1건으로 선정 흐름을 검증했다. 실제 개발 우선순위로 사용하지 않는다.

| Rank | Backlog ID | Decision Basis | Status |
| ---: | --- | --- | --- |
| 1 | FB-TEST-001 | P2, 테스트 1회, 모바일 팀빌더 조작 흐름에 영향 | Selected |

## Weekly Selection Order

후보가 생기면 아래 순서로 비교한다.

1. 사용자 진행을 막거나 잘못된 결과를 만드는 `P0`, `P1`
2. 같은 문제가 보고된 횟수
3. 도감, 빌드, 팀빌더, 스피드 티어, 계산기, 공략의 핵심 흐름에 미치는 범위
4. 같은 조건이면 더 작고 검증 가능한 작업

선정할 때 `Decision Basis`에 우선순위, 반복 횟수, 영향 범위를 한 문장으로 기록한다.
완료된 항목은 검증 명령 또는 확인 방법을 Backlog의 Source 뒤에 덧붙인 뒤 `Done`으로 바꾼다.
