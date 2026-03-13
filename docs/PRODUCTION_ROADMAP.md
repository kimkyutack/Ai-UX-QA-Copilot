# Production Roadmap

## Product direction
이 프로젝트를 본격 제품으로 키우려면 `한 번 분석하는 데모`에서 `팀이 반복적으로 UX 품질을 추적하는 워크플로우 도구`로 전환해야 합니다.

## What changed now
- `job -> report` 흐름을 중심으로 서버 구조를 재배치했습니다.
- 파일 기반 저장소를 넣어 로컬에서도 분석 이력 구조를 유지할 수 있게 만들었습니다.
- `/api/jobs`, `/api/jobs/[jobId]`, `/api/reports/[reportId]` 엔드포인트를 추가했습니다.
- Prisma 스키마 초안을 추가해 Postgres 전환 경로를 명확하게 만들었습니다.
- AI 분석 단계를 `specialist agents -> synthesizer -> verifier` 오케스트레이션으로 확장했습니다.

## Current orchestration flow
1. Collector
   - HTTP 수집
   - Playwright fallback 수집
2. Specialist agents (parallel)
   - clarity
   - accessibility
   - conversion
   - mobile
3. Synthesizer
   - 전문 에이전트 결과 병합
   - 최종 리포트 생성
4. Verifier
   - evidence 없는 finding 제거
   - 중복 finding 제거
   - 최종 결과 정리

## Recommended next implementation order
1. Auth 추가
   - `Auth.js` 또는 `Clerk`로 사용자/워크스페이스 개념 도입
2. DB 전환
   - `.data` 저장소를 Prisma + Postgres로 교체
3. Background jobs
   - `Trigger.dev` 또는 `Inngest`로 `queued -> running -> completed` 비동기 처리
4. Screenshots and compare mode
   - 데스크톱/모바일 스크린샷 저장
   - 이전 리포트 대비 변화량 비교
5. Team workflow
   - 상태 변경, 메모, 담당자, 해결 여부
6. Billing and rate limits
   - 사용량 기반 제한과 Stripe 결제
7. Advanced orchestration
   - visual hierarchy agent
   - copywriting rewrite agent
   - verifier LLM stage

## Recommended folders
- `types/domain`: 핵심 엔티티 타입
- `types/api`: 요청/응답 타입
- `services/analysis`: 오케스트레이션 계층
- `services/repositories`: 저장소 계층
- `services/fetch`: 수집 계층
- `services/openai`: AI 연동 계층
- `services/orchestration`: 에이전트 종합과 검증 계층
- `app/api`: 라우트 계층

## API design
- `POST /api/jobs`
  - 분석 작업 생성 및 실행
- `GET /api/jobs`
  - 최근 분석 작업 목록
- `GET /api/jobs/:jobId`
  - 단일 작업 상태와 연결된 리포트 조회
- `GET /api/reports/:reportId`
  - 저장된 리포트 조회

## Data model overview
- Workspace
- Project
- ProjectTarget
- AuditJob
- AuditReport

## Why this matters
지금부터 중요한 건 AI 호출 그 자체보다 `저장`, `비교`, `재실행`, `팀 실행 흐름`입니다. 여기에 오케스트레이션 구조까지 들어가면 어떤 전문 영역의 분석이 약한지도 추적하고 교체할 수 있습니다.
