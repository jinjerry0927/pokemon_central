# Data Update Checklist

Pokemon Central의 시즌, 룰셋, 포켓몬, 기술, 아이템 데이터를 갱신할 때 사용하는 운영 체크리스트다. MVP의 `data/*.json` 수동 큐레이션 방식을 유지하며, 외부 API를 런타임 의존성으로 추가하지 않는다.

## 1. 변경 범위 확인

- [ ] 변경 대상과 적용 시즌 또는 룰셋을 확인한다.
- [ ] 변경 유형을 `pokemon`, `move`, `item`, `ruleset` 중 하나 이상으로 분류한다.
- [ ] 기존 값과 변경할 값을 비교해 `data/update-log.md`에 기록할 내용을 준비한다.
- [ ] Pokemon Champions 등록 여부가 불확실하면 공개 데이터로 반영하지 않는다.

## 2. 출처 확인

- [ ] 변경 이유를 한 문장으로 기록한다.
- [ ] 외부 출처는 이름, 원문 URL, 확인일을 기록하고 내부 절차 근거는 저장소 경로와 확인일을 기록한다.
- [ ] Pokemon Champions 전용 등록 여부와 룰은 공식 공지 또는 게임 내 확인 근거를 우선한다.
- [ ] 종족값, 기술, 아이템 수치는 `data/sources.md`의 허용 출처로 교차 검증한다.
- [ ] 출처가 충돌하면 변경을 보류하고 `docs/planning/backlog.md`의 데이터 오류 항목에 남긴다.

## 3. 데이터와 공략 수정

- [ ] 영향받는 `data/*.json`만 최소 범위로 수정한다.
- [ ] 변경 항목의 `sources`를 확인하고, 포켓몬 등록 상태를 바꾼 경우 `championsAvailability.evidence`와 `lastChecked`도 수정한다.
- [ ] 변경된 ID와 이름을 `data/guides.json`, `data/builds.json`, `data/teams.json`에서 검색한다.
- [ ] 관련 공략을 수정하거나, 영향이 없다면 그 이유를 `data/update-log.md`에 기록한다.
- [ ] 공개용 데이터와 `schema-sample` 또는 `mvp-sample` 데이터를 구분한다.

## 4. 검증

```powershell
Get-ChildItem data\*.json | ForEach-Object { Get-Content -Raw -Encoding UTF8 $_.FullName | ConvertFrom-Json | Out-Null }
npm run lint
npm run build
```

- [ ] 모든 JSON 파일이 파싱된다.
- [ ] 린트와 정적 빌드가 성공한다.
- [ ] 변경된 상세 페이지, 검색/필터, 계산기 입력값을 확인한다.
- [ ] 제거 또는 비공개 처리된 데이터로 가는 링크가 남지 않았는지 확인한다.

## 5. 변경 이력 완료

- [ ] `data/update-log.md`에 날짜, 범위, 변경 전후, 이유, 출처, 관련 공략, 검증 결과를 남긴다.
- [ ] 실제 운영 데이터 변경이 없으면 임의의 변경을 만들지 않고 `변경 없음`으로 기록한다.
- [ ] 검토가 끝난 변경만 배포 대상으로 포함한다.
