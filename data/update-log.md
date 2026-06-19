# Data Update Log

Pokemon Central 운영 데이터의 변경 이유와 출처를 보존한다. 새 기록은 위에 추가하고, `docs/planning/data-update-checklist.md`를 완료한 뒤 상태를 `검증 완료`로 바꾼다.

## 기록 형식

```markdown
## YYYY-MM-DD - 변경 제목

- 상태: 검토 중 | 검증 완료 | 보류
- 적용 범위: pokemon | move | item | ruleset
- 대상 ID: 변경된 데이터 ID 또는 `없음`
- 변경 전: 이전 값 또는 `없음`
- 변경 후: 새 값 또는 `변경 없음`
- 변경 이유: 변경이 필요한 이유
- 출처:
  - 출처 이름 - 원문 URL 또는 저장소 경로 (확인일: YYYY-MM-DD)
- 변경 파일: `data/example.json`
- 관련 공략:
  - 수정한 guide/build/team ID 또는 영향이 없는 이유
- 검증: 실행한 명령과 결과
```

## 2026-06-20 - Phase W 운영 기준선

- 상태: 검증 완료
- 적용 범위: ruleset
- 대상 ID: 없음
- 변경 전: 데이터 업데이트 절차와 통합 변경 이력이 없음
- 변경 후: 체크리스트와 변경 이력 형식을 도입했으며 운영 게임 데이터는 변경 없음
- 변경 이유: 시즌 및 룰 변경 시 데이터, 출처, 관련 공략을 함께 추적하기 위해 Phase W 운영 절차를 시작함
- 출처:
  - `docs/planning/development-loop-roadmap.md` Phase W (확인일: 2026-06-20)
  - `data/sources.md` Data Source Policy (확인일: 2026-06-20)
- 변경 파일: `docs/planning/data-update-checklist.md`, `data/update-log.md`, `data/sources.md`, `docs/planning/development-loop-roadmap.md`
- 관련 공략:
  - 운영 게임 데이터가 바뀌지 않아 `data/guides.json`, `data/builds.json`, `data/teams.json` 수정 없음
- 검증: JSON 파싱, `npm run lint`, `npm run build`
