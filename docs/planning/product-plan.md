# Pokemon Champions Guide Web Product Plan

## Goal

Pokemon Champions를 처음 접하거나 랭크/팀빌딩을 준비하는 한국어 사용자가 데스크탑에서 빠르게 정보를 찾고, 포켓몬 빌드와 팀 구성을 비교하며, 계산기로 검증할 수 있는 공략 웹을 만든다.

## Positioning

- Primary: desktop-first strategy and guide hub.
- Secondary: mobile-friendly reading/searching.
- Differentiator: Korean explanations, usage-based build insights, and tight linking between Pokedex, build, team builder, speed tiers, and damage calculation.

## MVP Scope Lock

- Target user: Korean Pokemon Champions beginners and players preparing for ranked battles.
- Primary device: desktop. Mobile support is limited to reading, lookup, and search assistance.
- First-release features are limited to Pokedex, Builds, Team Builder, Speed Tiers, Damage Calculator, and Guides.
- New ideas outside this list should be recorded in Backlog unless they unblock one of the first-release features.

## MVP Pages

1. Home
   - Current ruleset summary
   - Recommended beginner routes
   - Popular Pokemon/build shortcuts

2. Pokedex
   - Search by Korean/English name
   - Filter by type, role, speed tier, availability
   - Detail page with stats, type, ability, moves, recommended builds, counters

3. Builds
   - Usage-based move, ability, item, nature modifier, and stat point insights
   - Curated notes that explain common choices without presenting them as fixed official builds
   - Tags for beginner, balanced, offensive, defensive, support

4. Team Builder
   - 6 Pokemon slots
   - Team weakness summary
   - Role balance summary
   - Local browser save for MVP

5. Speed Tiers
   - Fast lookup for common speed benchmarks
   - Filters for Pokemon, role, and speed range
   - Links back to Pokemon details and related builds

6. Damage Calculator
   - Single attacker/defender calculation first
   - Link from Pokemon detail and team builder
   - Later expansion for weather, field, boosts, ability, and item modifiers

7. Guides
   - Beginner guide
   - First ranked team guide
   - Common matchup/counter guides

## Desktop Layout Direction

- Left: search/filter/navigation panel.
- Center: main list, builder, calculator, or guide content.
- Right: selected Pokemon/build/team insight panel.

Mobile should collapse these panels into tabs or stacked sections, but MVP decisions should prioritize desktop usability.

## Content Strategy

- Start with Champions Battle Data usage insights and 3 beginner team guides.
- Use simple Korean labels and avoid excessive competitive jargon.
- Every curated note should separate usage frequency from recommendation and explain when a choice can fail.

## Usage-Based Build Insights

Pokemon Central의 팀빌더 방향은 고정 샘플 빌드 제공이 아니라, 포켓몬별 사용률 데이터를 정리해 사용자가 직접 무난한 조합을 만들 수 있게 돕는 것이다.

- `샘플`은 공식 정답 세트가 아니라 사람들이 공유하는 참고 빌드로 취급한다.
- 사이트의 차별점은 특정 작성자의 빌드를 복사하게 하는 것이 아니라, 기술, 특성, 도구, 능력 보정, HABCDS 포인트의 사용 경향을 데이터로 보여주는 것이다.
- Champions Battle Data API는 수집 시점에 `data/generated/usage-insights-m-b.json`으로 저장하고, 런타임에서 외부 API를 직접 호출하지 않는다.
- 팀빌더는 사용률이 높은 기술, 특성, 도구를 먼저 정렬하고 슬롯 안에 `사용률 힌트`를 보여준다.
- “많이 쓰임”과 “추천”을 분리해서 표시한다. 사용률이 높아도 무조건 정답이라고 쓰지 않는다.
- 팀 공유 코드 입력/복사는 Pokemon Champions 자체 기능과 겹치므로 후순위로 둔다.

## Backlog

- Phase N guide candidate: Starter-choice guide for the early free team flow. Cover the initial choices shown in Pokemon Champions, explain why Pikachu is recommended for beginners, and compare alternate picks such as Charizard, Tyranitar, Armarouge, Palafin, Lucario, Gardevoir, Absol, Altaria, and Snorlax. If this later becomes interactive, move the "choose one starter -> receive the other five team members" flow to Phase J Team Builder.
- Advanced damage calculator options such as weather, field, boosts, ability, and item modifiers.
- Account sync, cloud save, or cross-device team storage.
- Community submissions, voting, comments, or build sharing.
- Automated metagame statistics ingestion.
- Native mobile app or mobile-first team building workflows.
- PvP simulator, battle replay tools, or matchmaking features.

## Legal / Attribution Notes

- Add clear fan-made disclaimer before public release.
- Track data sources per dataset.
- Do not assume official asset usage rights without checking the source license or usage policy.
