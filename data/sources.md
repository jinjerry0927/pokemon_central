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
| `pokemon-champions-data` | 커뮤니티 Pokemon Champions Data 저장소 | 포켓몬별 Champions 기술 후보 교차 검증 | CC BY 4.0 출처 표시가 필요하다. 2026-04-16 스냅샷이며 원본 Serebii URL과 수집기가 없어 M-B 확정 근거로 단독 사용하지 않는다. |
| `serebii-champions-pokedex` | Serebii Champions Pokédex | 현재 포켓몬·폼별 기술 후보, 사용 가능 특성 ID, 이전 커뮤니티 스냅샷의 변경점 확인 | 첫 커뮤니티 데이터셋이 Serebii를 원본으로 명시하므로 기술의 독립 검증으로 보지 않는다. 기술·특성 설명은 복사하지 않는다. |
| `serebii-champions-items` | Serebii Champions Items | Champions에서 사용할 수 있는 소지 도구와 나무열매 ID 확인 | Miscellaneous Items는 제외한다. 설명 문구는 복사하지 않고 도구 ID와 분류만 보관한다. |
| `championsbattledata` | [Champions Battle Data API](https://championsbattledata.com/) | 포켓몬별 기술, 특성, 도구, 능력 보정, HABCDS 포인트 사용률 | 사용률은 참고 지표이며 정답 빌드로 표시하지 않는다. API 응답을 수집 시점 JSON으로 저장하고 런타임 호출하지 않는다. |
| `pokemondb` | PokemonDB | 등록 확인된 포켓몬의 종족값, 기술, 아이템, 특성 교차 검증 | 설명 문구는 그대로 복사하지 않고 요약한다. |
| `smogon` | Smogon | 실전 빌드 방향, 아이템/기술 채용 예시 참고 | Pokemon Champions 환경과 다를 수 있어 그대로 추천하지 않는다. |
| `manual-curation` | Pokemon Central 수동 큐레이션 | Pokemon Champions 등록 여부, 전용 빌드, 팀, 운영 메모 | 작성자 검증일과 근거를 남긴 뒤 공개한다. |

## 파일별 정책

- `pokemon.json`: Pokemon Champions 등록 확인된 포켓몬의 기본 식별자, 한국어/영어 이름, 타입, 종족값, 특성 연결 정보를 저장한다.
- `moves.json`: 기술의 타입, 분류, 위력, 명중률, PP 등 계산기와 상세 페이지에 필요한 값을 저장한다.
- `abilities.json`: 특성 이름과 한국어 요약 설명을 저장한다.
- `items.json`: 아이템 이름과 한국어 요약 설명을 저장한다.
- `generated/champions-items-m-b.json`: Champions 사용 가능 소지 도구 후보, PokeAPI 이름, 공식 규정의 중복 허용 여부를 저장한다.
- `generated/champions-abilities-m-b.json`: Champions 폼별 사용 가능 특성 ID와 PokeAPI 한국어·영어 이름을 저장한다.
- `generated/usage-insights-m-b.json`: 포켓몬별 기술, 특성, 도구, 능력 보정, HABCDS 포인트 사용률 인사이트를 저장한다. 고정 샘플 빌드가 아니라 사용 경향을 보여주는 참고 데이터다.
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
- `npm run data:moves`는 235개 폼의 PokeAPI 전체 세대 학습 이력을 합쳐 기술 상세 후보와 포켓몬별 후보 매핑을 생성한다.
- `npm run data:moves:pilot`은 5마리의 커뮤니티 Champions learnset과 PokeAPI 후보 차이를 `data/generated/champions-learnset-pilot-m-b.json`에 기록한다.
- `npm run data:moves:pilot:serebii`는 현재 Serebii Champions Pokédex의 5마리 기술 ID를 직접 읽어 이전 파일럿과 비교한다.
- `npm run data:moves:serebii`는 M-B 235개 폼의 현재 기술 ID를 수집하고 `serebii-learnsets-m-b.json`과 파싱 실패·기술 상세 미연결 전용 `serebii-learnset-review-m-b.json`을 생성한다.
- `npm run data:items`는 Serebii Champions Items의 Hold Items와 Berries를 읽고 PokeAPI 이름을 결합해 `data/generated/champions-items-m-b.json`을 생성한다.
- `npm run data:abilities`는 M-B 235개 폼의 PokeAPI 특성 매핑을 Serebii Champions 종 페이지에서 전수 확인하고 `data/generated/champions-abilities-m-b.json`을 생성한다.
- `npm run data:usage`는 Champions Battle Data API의 현재 Doubles 사용률을 읽고 내부 포켓몬, 기술, 특성, 도구 ID에 연결해 `data/generated/usage-insights-m-b.json`을 생성한다.
- 특성 수집기는 폼별 매핑과 한국어 이름에는 PokeAPI를 사용하고, 각 특성이 해당 Champions 종 페이지에 존재하는지 별도로 검증한다. 특성 설명은 복사하지 않는다.
- Miscellaneous Items는 팀빌더의 소지 도구 대상에서 제외하며, 공식 M-B 규정의 동일 도구 중복 금지를 팀 구성 검증에 적용한다.
- 도구 설명은 외부 페이지에서 복사하지 않는다. 생성 결과는 이름과 사용 가능 여부를 제공하는 `review-candidate`로 유지하고 추천 빌드 승격은 별도 메타 검토를 거친다.
- 사용률 인사이트는 Champions Battle Data API의 `generatedAt`, `dataVersion`, 확인일을 함께 기록한다. 수치가 없거나 출처가 불명확하면 추천처럼 표시하지 않고 보류한다.
- 전체 수집기는 지역폼, 팔데아 켄타로스, 성별폼, 로토무 전용 기술, 루가루암 폼을 분리하며 파싱 실패를 자동 승격하지 않는다.
- Serebii 직접 비교는 원본 갱신 검증이며 독립된 두 번째 출처 검증은 아니다. 충돌 기술과 신규 항목만 후속 게임 검증 대상으로 남긴다.
- 이전 스냅샷 변경, 신규 M-B 포켓몬, 자동 분리된 폼은 전체 스냅샷에 상태를 보존하되 차단 검토 목록에는 넣지 않는다.
- Serebii 학습 기술 후보는 포켓몬 상세와 팀빌더에서 `검토 후보` 및 확인일을 함께 표시할 수 있다. 주요 기술, 추천 빌드, 계산기 기본값으로 승격할 때는 별도 메타 검토가 필요하다.
- 파일럿의 `source-candidate`, `form-review-required`, `source-missing` 상태는 확정 여부가 아니라 다음 검토 작업을 구분한다.
- PokeAPI 학습 이력은 Champions 사용 가능 기술의 확정 근거가 아니므로 기술 후보는 `review-candidate`로만 저장한다.
- 미리보기 파일은 `data/pokemon.json`을 자동으로 덮어쓰지 않으며, `npm run data:validate` 검증과 공식 등록 확인을 통과한 뒤 수동 검토한다.
- `unverified` 또는 `mvp-sample` 항목은 동기화가 성공해도 공개 데이터로 승격하지 않는다.
