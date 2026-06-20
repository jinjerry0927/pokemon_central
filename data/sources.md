# Data Source Policy

Pokemon Central의 공개 데이터는 출처와 사용 범위가 확인된 정보만 사용한다. 출처가 불명확한 데이터는 공개 페이지, 추천 빌드, 계산기 기본값에 사용하지 않는다.

## 기본 저장 방식

- 기본 데이터는 `data/` 아래 JSON 파일로 관리한다.
- 외부 API는 MVP에서 런타임 의존성으로 사용하지 않는다.
- 포켓몬 목록은 Pokemon Champions에 실제 등록된 포켓몬만 공개 데이터로 사용한다.
- 전국도감 전체 포켓몬을 기본 포함하지 않는다. 업데이트로 Pokemon Champions에 추가된 포켓몬만 수동 확인 후 추가한다.
- Pokemon Champions 전용 메타, 추천 빌드, 추천 팀은 수동 큐레이션 데이터로 분리한다.
- 공개 전 검증이 끝나지 않은 데이터는 UI에서 검증 필요 상태로 표시하거나 공개 범위에서 제외한다.

## 출처별 사용 범위

| Source ID | 출처 | 사용 범위 | 주의사항 |
| --- | --- | --- | --- |
| `official-regulation` | Pokémon Champions 공식 Regulation 및 Eligible Pokémon 목록 | 현재 규정의 사용 가능 포켓몬, 폼, 최초 확인 규정 | 규정 사용 가능 여부와 게임 전체 보유 로스터를 동일하게 취급하지 않는다. |
| `pokeapi` | PokeAPI | Pokemon Champions에 등록 확인된 포켓몬의 기본 정보, 타입, 특성, 기술 기본값 확인 | 등록 여부 판단에는 사용하지 않는다. |
| `pokemondb` | PokemonDB | 등록 확인된 포켓몬의 종족값, 기술, 아이템, 특성 교차 검증 | 설명 문구는 그대로 복사하지 않고 요약한다. |
| `smogon` | Smogon | 실전 빌드 방향, 아이템/기술 채용 예시 참고 | Pokemon Champions 환경과 다를 수 있어 그대로 추천하지 않는다. |
| `manual-curation` | Pokemon Central 수동 큐레이션 | Pokemon Champions 등록 여부, 전용 빌드, 팀, 운영 메모 | 작성자 검증일과 근거를 남긴 뒤 공개한다. |

## 파일별 정책

- `pokemon.json`: Pokemon Champions 등록 확인된 포켓몬의 기본 식별자, 한국어/영어 이름, 타입, 종족값, 특성 연결 정보를 저장한다.
- `moves.json`: 기술의 타입, 분류, 위력, 명중률, PP 등 계산기와 상세 페이지에 필요한 값을 저장한다.
- `abilities.json`: 특성 이름과 한국어 요약 설명을 저장한다.
- `items.json`: 아이템 이름과 한국어 요약 설명을 저장한다.
- `builds.json`: 추천 빌드, 역할 태그, 노력치, 기술, 아이템, 운영 메모를 저장한다.
- `teams.json`: 추천 팀, 구성 포켓몬, 역할 요약, 운영 메모를 저장한다.

## Pokemon Champions 등록 기준

- `pokemon.json`의 포켓몬은 `championsAvailability.status`를 포함한다.
- 공개 가능한 포켓몬은 `championsAvailability.status`가 `confirmed`인 항목으로 제한한다.
- `unverified`, `removed`, `rumored` 상태의 포켓몬은 도감, 빌드, 팀 추천, 계산기 기본 선택지에 노출하지 않는다.
- 등록 확인 근거는 `championsAvailability.evidence`에 짧게 남긴다.
- 업데이트로 추가된 포켓몬은 확인일을 `championsAvailability.lastChecked`에 남긴다.
- 현재 샘플 데이터는 스키마 검증용이며, `publishStatus: "schema-sample"` 항목은 공개용 데이터가 아니다.

## 공개 전 확인 기준

- 각 JSON 항목에는 `id`와 `sources`를 포함한다.
- 포켓몬 항목은 Pokemon Champions 등록 여부가 `confirmed`일 때만 공개한다.
- 외부 출처의 긴 설명은 복사하지 않고 한국어로 짧게 요약한다.
- Pokemon Champions 전용 판단은 `manual-curation`으로 표시한다.
- 출처가 서로 충돌하면 공개하지 않고 Backlog 또는 검증 메모로 남긴다.

## 업데이트 운영

- 시즌, 룰셋, 포켓몬, 기술, 아이템 변경은 `docs/planning/data-update-checklist.md` 순서로 확인한다.
- 모든 반영 내역은 `data/update-log.md`에 변경 전후, 변경 이유, 원문 출처, 확인일을 남긴다.
- 관련 `guides.json`, `builds.json`, `teams.json`을 함께 검토하고 수정 여부 또는 영향이 없는 이유를 기록한다.

## PokeAPI 동기화 미리보기

- `data/champions-roster.json`은 동기화할 포켓몬의 허용 목록이며 Pokemon Champions 등록 근거를 별도로 보관한다.
- `npm run data:roster`는 공식 게임 내 뉴스에서 M-A와 M-B의 `Eligible Pokémon` 목록을 읽고 `data/generated/champions-roster-m-b.json`을 생성한다.
- 공식 Regulation 수집 결과는 `confirmed` 근거를 갖지만 검토 전에는 `publishStatus: "review-candidate"`로 유지한다.
- `npm run data:roster:verify`는 공식 폼 ID에 연결한 모든 PokeAPI slug와 종 ID를 전수 확인한다.
- 메가진화 허용 목록은 Regulation 공지의 별도 규칙이며 현재 로스터 스냅샷에는 포함하지 않는다.
- `npm run data:sync`는 공식 M-B 스냅샷의 235개 폼을 PokeAPI에서 받아 `data/generated/pokemon-m-b-preview.json`을 생성한다.
- `npm run data:sync:sample`은 기존 임시 5마리 동기화 흐름을 별도로 유지한다.
- `npm run data:promote`는 검증된 M-B 미리보기를 `publishStatus: "public"`으로 변환해 `data/pokemon.json`에 반영한다.
- 미리보기 파일은 `data/pokemon.json`을 자동으로 덮어쓰지 않으며, `npm run data:validate` 검증과 공식 등록 확인을 통과한 뒤 수동 검토한다.
- `unverified` 또는 `mvp-sample` 항목은 동기화가 성공해도 공개 데이터로 승격하지 않는다.
