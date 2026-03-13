# UX Audit Copilot

OpenAI Responses API와 Playwright를 사용하는 Next.js 기반 UX QA 프로젝트입니다. 제품 URL을 입력하면 HTTP 수집을 먼저 시도하고, 근거가 약하면 Playwright로 실제 렌더 결과를 다시 읽어 한국어 UX 감사 리포트를 생성합니다.

## 지금 구조에서 달라진 점

이 프로젝트는 이제 단순 `analyze` 데모를 넘어서 `job -> report` 구조를 갖춘 프로덕션 준비 단계로 확장되었습니다.

- `/api/analyze`: 기존 단일 분석 진입점
- `/api/jobs`: 작업 생성 및 목록 조회
- `/api/jobs/[jobId]`: 작업 상태와 결과 조회
- `/api/reports/[reportId]`: 저장된 리포트 조회
- `.data/`: 로컬 개발용 파일 저장소
- `prisma/schema.prisma`: Postgres 전환용 스키마 초안

## 필요한 환경 변수

```bash
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-5-mini
# Prisma 도입 시
DATABASE_URL=postgresql://...
```

## 실행 방법

```bash
npm install
npx playwright install chromium
npm run dev
```

## 현재 구조

- `types/domain/`: 작업, 리포트, 프로젝트, 워크스페이스 엔티티
- `types/api/`: API 요청/응답 타입
- `services/api/`: 클라이언트 fetch 래퍼
- `services/analysis/`: 분석 오케스트레이션
- `services/repositories/`: 로컬 저장소 계층
- `services/fetch/`: HTTP 수집과 Playwright 렌더 수집
- `services/openai/`: OpenAI 클라이언트와 AI 리포트 생성
- `lib/`: 순수 유틸리티와 휴리스틱 초안 생성
- `docs/PRODUCTION_ROADMAP.md`: 다음 단계 로드맵

## 추천 다음 단계

1. Auth 도입
2. Prisma + Postgres 전환
3. background job 시스템 도입
4. 스크린샷 저장과 compare mode 추가
5. 팀 워크플로우와 결제 시스템 도입
