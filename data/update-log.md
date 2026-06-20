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

## 2026-06-20 - Regulation M-B 공식 포켓몬 데이터 승격

- 상태: 검증 완료
- 적용 범위: pokemon, ruleset
- 대상 ID: Regulation M-B 공식 Eligible Pokémon 235개 폼
- 변경 전: `data/pokemon.json`의 MVP 샘플 20개
- 변경 후: M-B 공식 로스터와 PokeAPI 기본 정보가 결합된 공개 데이터 235개
- 변경 이유: Pokemon Champions에 실제 존재하고 M-B에서 사용 가능한 포켓몬만 도감과 도구에 제공하기 위함
- 출처:
  - Pokémon Champions 공식 Regulation Set M-B 공지 - https://champions-news.pokemon-home.com/en/page/776.html (확인일: 2026-06-20)
  - Pokémon Champions 공식 Eligible Pokémon 목록 - https://web-view.app.pokemonchampions.jp/battle/pages/events/rs178066986988lmoqpm/en/pokemon.html (확인일: 2026-06-20)
  - PokeAPI - https://pokeapi.co/ (확인일: 2026-06-20)
- 변경 파일: `data/pokemon.json`, `data/generated/champions-roster-m-b.json`, `data/generated/pokemon-m-b-preview.json`, `scripts/sync-champions-roster.mjs`, `scripts/sync-pokemon.mjs`, `scripts/promote-pokemon-data.mjs`, `scripts/validate-data.mjs`
- 관련 공략:
  - 기존 `data/builds.json`의 포켓몬 ID는 모두 M-B 공개 데이터에 존재함을 확인
  - 주요 기술은 별도 큐레이션 대상이므로 `keyMoveIds`를 빈 배열로 유지하며 `data/guides.json`, `data/teams.json`은 이번 변경에서 수정하지 않음
- 검증: `npm.cmd run data:roster:verify`, `npm.cmd run data:sync`, `npm.cmd run data:promote`, `npm.cmd run data:validate`, `npm.cmd run lint`, `npm.cmd run build` 성공; 포켓몬 정적 경로와 사이트맵 URL 235개 생성 확인

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
