# Usage-Based Team Build Insights Roadmap

Pokemon Central의 다음 팀빌더 방향은 고정 샘플 빌드 제공이 아니라, 포켓몬별 사용률 데이터를 정리해 사용자가 직접 무난한 조합을 만들 수 있게 돕는 것이다.

## Product Direction

- `샘플`은 공식 정답 세트가 아니라 사람들이 공유하는 참고 빌드로 취급한다.
- 사이트의 차별점은 특정 작성자의 빌드를 복사하게 하는 것이 아니라, 기술, 특성, 도구, 능력 보정, HABCDS 포인트의 사용 경향을 데이터로 보여주는 것이다.
- 사용자는 가장 많이 쓰이는 선택지를 위에서 확인하고, 자신의 팀 목적에 맞게 직접 조합한다.
- 팀 공유 코드 복붙 기능은 Pokemon Champions 안에도 있으므로 지금은 우선순위를 낮춘다.

## Data Model Plan

새 데이터는 Champions Battle Data API를 수집 시점에 정적 JSON으로 저장해 사용한다. 런타임에서 외부 API를 직접 호출하지 않는다.

예상 파일:

- `data/generated/usage-insights-m-b.json`

초기 스키마:

```json
{
  "schemaVersion": 1,
  "regulationId": "M-B",
  "checkedAt": "YYYY-MM-DD",
  "source": {
    "id": "championsbattledata",
    "description": "Champions Battle Data API Doubles Current usage snapshot."
  },
  "entries": [
    {
      "pokemonId": "delphox",
      "usageRank": 1,
      "moves": [
        { "moveId": "fire-blast", "usagePercent": 62.5 }
      ],
      "abilities": [
        { "abilityId": "blaze", "usagePercent": 78.1 }
      ],
      "items": [
        { "itemId": "delphoxite", "usagePercent": 41.2 }
      ],
      "statPointSpreads": [
        {
          "label": "H32 A0 B0 C0 D0 S34",
          "statPoints": {
            "hp": 32,
            "attack": 0,
            "specialAttack": 0,
            "defense": 0,
            "specialDefense": 0,
            "speed": 34
          },
          "usagePercent": 18.4
        }
      ],
      "natureModifiers": [
        { "labelKo": "스피드 보정", "usagePercent": 45.6 }
      ],
      "notesKo": "사용률 참고용 데이터이며 정답 빌드가 아니다."
    }
  ]
}
```

## UI Plan

### Phase 1: Team Builder Usage Hints

- 포켓몬 슬롯 안에 `사용률 힌트` 영역을 추가한다.
- 기술 선택 드롭다운은 사용률 데이터가 있는 기술을 먼저 정렬한다.
- 도구 선택 드롭다운은 사용률 데이터가 있는 도구를 먼저 정렬한다.
- 특성 선택 드롭다운은 사용률 데이터가 있는 특성을 먼저 정렬한다.
- 메가진화 가능 포켓몬은 슬롯 상단에 `메가진화 가능` 배지를 표시한다.
- 전용 메가스톤은 지금처럼 해당 포켓몬에게만 노출한다.

### Phase 2: Pokemon Detail Usage Panel

- 포켓몬 상세 페이지에 `사용률 인사이트` 패널을 추가한다.
- 기술, 특성, 도구, 스탯 포인트, 능력 보정 Top N을 표로 보여준다.
- “많이 쓰임”과 “추천”을 분리해서 표시한다. 사용률이 높아도 무조건 추천이라고 쓰지 않는다.

### Phase 3: Build Assist, Not Preset

- `가장 많이 쓰인 조합 적용` 버튼은 나중에 검토한다.
- 적용하더라도 “샘플 빌드 불러오기”가 아니라 “사용률 상위 선택지 채우기”로 표현한다.
- 팀 공유 코드 입력/복사는 후순위로 둔다.

## Validation Rules

- 스탯 포인트 총합은 66을 넘기지 않는다.
- 기술은 최대 4개까지만 선택한다.
- 도구 중복은 허용하지 않는다.
- 메가스톤은 `allowedPokemonIds`에 포함된 포켓몬에게만 선택 가능하다.
- 사용률 데이터가 현재 M-B 포켓몬, 기술, 특성, 도구 ID와 맞지 않으면 검증 실패로 처리한다.

## First Implementation Step

1. `usage-insights-m-b.json` 스키마와 검증 함수를 만든다.
2. Champions Battle Data API를 수집해 235마리의 Doubles Current 사용률을 저장한다.
3. 팀빌더에서 해당 데이터가 있는 경우 정렬, 사용률 힌트, 메가진화 배지를 적용한다.
4. 실제 “자동 채우기”는 보류한다.

## Open Questions

- 능력 보정의 내부 표현을 한국어 라벨만 둘지, 별도 enum으로 둘지 정해야 한다.
- `teammate` 데이터까지 팀빌더 추천 흐름에 연결할지 정해야 한다.
