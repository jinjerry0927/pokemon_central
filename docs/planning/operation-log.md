# Operation Log

월간 운영 결과를 최신 기록이 위에 오도록 추가한다. 대시보드 수치나 외부 상태를 확인하지 못한 경우 추정하지 않는다.

## Entry Template

```markdown
## YYYY-MM

- Review date: YYYY-MM-DD
- Review window: YYYY-MM-DD ~ YYYY-MM-DD
- Next review: YYYY-MM-DD

### Usage

- Popular pages: 확인값 또는 확인 불가 사유
- Search queries: 확인값 또는 확인 불가 사유
- Decision: 유지할 페이지와 개선 후보

### Maintenance

- Data errors: 수정 내용 또는 변경 없음
- New guides: 작성한 공략 또는 추가하지 않은 근거
- Builds/teams: 최신화 내용 또는 변경 없음
- Backlog: 연결한 Backlog ID 또는 없음

### Verification

- JSON parse: Pass / Fail / Not run
- `npm run lint`: Pass / Fail / Not run
- `npm run build`: Pass / Fail / Not run
- Live URL: 확인한 경로 또는 확인하지 못한 이유

### Release

- Commit/deploy: 커밋과 배포 정보 또는 배포 없음
- Notes: 다음 점검에서 확인할 항목
```

첫 월간 운영 기록은 실제 Analytics와 Search Console 점검을 수행한 뒤 템플릿 위에 추가한다.
