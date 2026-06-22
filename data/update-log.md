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

## 2026-06-20 - Serebii 현재 기술표 5마리 비교

- 상태: 검토 중
- 적용 범위: move
- 대상 ID: venusaur, raichu-alola, rotom-wash, incineroar, gholdengo
- 변경 전: 2026-04-16 Serebii 스크랩을 기반으로 한 커뮤니티 기술 후보만 존재
- 변경 후: 현재 Serebii Champions Pokédex의 포켓몬·폼별 기술 ID와 이전 후보의 추가·삭제 차이를 기록
- 변경 이유: 전체 수동 검증 대신 현재 원본과의 차이, 폼 통합 오류, M-B 신규 미수록 항목만 선별하기 위함
- 출처:
  - Serebii Champions Pokédex - https://www.serebii.net/pokedex-champions/ (확인일: 2026-06-20)
  - Pokemon Champions Data - https://github.com/otterlyclueless/pokemon-champions-data (확인일: 2026-06-20)
- 변경 파일: `data/generated/serebii-learnset-pilot-m-b.json`, `scripts/sync-serebii-learnset-pilot.mjs`, `scripts/lib/pokemon-data.mjs`, `scripts/validate-data.mjs`
- 관련 공략:
  - Serebii가 이전 커뮤니티 데이터셋의 원본이므로 독립 검증으로 승격하지 않고 모든 결과를 `review-candidate`로 유지함
- 검증: `npm.cmd run data:moves:pilot:serebii`, `npm.cmd run data:validate`, `npm.cmd run lint`, `npm.cmd run build`

## 2026-06-20 - Champions 기술 5마리 수집 파일럿

- 상태: 검토 중
- 적용 범위: move
- 대상 ID: venusaur, raichu-alola, rotom-wash, incineroar, gholdengo
- 변경 전: PokeAPI 전체 세대 기술 후보만 존재하고 Champions 포켓몬별 기술 후보 출처 없음
- 변경 후: 커뮤니티 Champions learnset과 PokeAPI 후보의 교집합 및 차이, 폼 검토와 미수록 상태를 분리한 파일럿 스냅샷 생성
- 변경 이유: 235마리 전체 확장 전에 외부 learnset 수집 가능성과 폼별 한계를 검증하기 위함
- 출처:
  - Pokemon Champions Data learnsets - https://github.com/otterlyclueless/pokemon-champions-data (확인일: 2026-06-20)
  - PokeAPI - https://pokeapi.co/ (확인일: 2026-06-20)
- 변경 파일: `data/generated/champions-learnset-pilot-m-b.json`, `scripts/sync-champions-learnset-pilot.mjs`, `scripts/lib/pokemon-data.mjs`, `scripts/validate-data.mjs`
- 관련 공략:
  - 외부 스냅샷이 M-B보다 오래됐고 폼 통합 및 미수록 항목이 있어 `data/moves.json`, `keyMoveIds`, 빌드와 공략에는 반영하지 않음
- 검증: `npm.cmd run data:moves:pilot`, `npm.cmd run data:validate`, `npm.cmd run lint`, `npm.cmd run build`

## 2026-06-20 - M-B 기술 후보 데이터 생성

- 상태: 검토 중
- 적용 범위: move
- 대상 ID: M-B 포켓몬 235개 폼에서 확인된 PokeAPI 기술 후보 674개
- 변경 전: M-B 전체 로스터 기준 기술 후보와 포켓몬별 학습 기술 매핑 없음
- 변경 후: 기술 상세 후보 674개와 포켓몬별 후보 참조 19,925개 생성
- 변경 이유: 주요 기술 큐레이션 전에 타입, 분류, 위력, 명중률, PP를 갖춘 검토 대상을 확보하기 위함
- 출처:
  - PokeAPI Pokémon 및 Move 리소스 - https://pokeapi.co/ (확인일: 2026-06-20)
- 변경 파일: `data/generated/pokemon-m-b-preview.json`, `data/generated/moves-m-b-candidates.json`, `data/generated/pokemon-move-candidates-m-b.json`, `scripts/sync-pokemon.mjs`, `scripts/sync-moves.mjs`, `scripts/validate-data.mjs`
- 관련 공략:
  - 전체 세대 학습 이력은 Champions 확정 기술이 아니므로 `data/moves.json`, `keyMoveIds`, 공략과 빌드에는 아직 반영하지 않음
  - PokeAPI 한국어 이름이 없는 기술 후보 46개는 추가 출처 확인 후 공개 여부를 결정함
- 검증: `npm.cmd run data:sync`, `npm.cmd run data:moves`, `npm.cmd run data:validate` 성공; 674개 기술 ID와 235개 포켓몬 매핑의 중복 및 참조 무결성 확인

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
