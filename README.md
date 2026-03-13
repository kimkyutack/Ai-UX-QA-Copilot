# Audit Flow AI

Next.js 기반 AI UX QA Copilot 프로젝트입니다. 제품 URL을 입력하면 페이지의 텍스트 구조를 수집하고, 전문 분석 에이전트가 명확성, 접근성, 전환, 모바일 관점에서 문제를 정리해 한국어 리포트를 생성합니다.

현재 프로젝트는 `랜딩 페이지`와 `워크스페이스 페이지`를 분리한 구조입니다.

- `/`: 제품 소개와 분석 방식 안내
- `/workspace`: 실제 분석 실행 화면

## 핵심 특징

- `HTTP 수집 -> 필요 시 Playwright 렌더 -> AI 오케스트레이션` 흐름으로 분석합니다.
- `clarity`, `accessibility`, `conversion`, `mobile` specialist agent가 병렬로 판단합니다.
- 최종 리포트에는 `evidence`, `agent trace`, `분석 한계`가 함께 포함됩니다.
- API key는 저장하지 않습니다.
  현재 탭에서만 유지되며, 분석 요청 시에만 서버로 전달됩니다.
- provider/model 설정만 저장되며, key는 서비스 데이터에 남기지 않습니다.

## 현재 라우트

- `/`: 랜딩 페이지
- `/workspace`: 분석 워크스페이스
- `/api/analyze`: 단일 분석 실행
- `/api/jobs`: 작업 생성 및 목록 조회
- `/api/jobs/[jobId]`: 작업 상태와 결과 조회
- `/api/reports/[reportId]`: 저장된 리포트 조회
- `/api/settings`: provider/model 설정 조회 및 저장

## 실행 방법

```bash
npm install
npx playwright install chromium
npm run dev
```

브라우저에서 아래 경로를 사용합니다.

- `http://localhost:3000/`
- `http://localhost:3000/workspace`

## 환경 변수

이 프로젝트는 기본적으로 사용자가 직접 입력한 API key를 요청마다 전달하는 구조입니다.

선택 사항:

```bash
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-5-mini
```

- `OPENAI_API_KEY`를 넣으면 로컬 개발 중 기본 fallback으로 사용할 수 있습니다.
- 실제 서비스 운영 기준으로는 워크스페이스에서 key를 직접 입력하는 흐름을 권장합니다.
- key는 서버 파일이나 DB에 저장하지 않도록 구현되어 있습니다.

## 프로젝트 구조

```text
app/
  page.tsx                    랜딩 페이지
  workspace/page.tsx          실제 분석 워크스페이스
  api/                        분석, 작업, 설정 API
components/
  ux-copilot.tsx              워크스페이스 메인 UI
services/
  analysis/                   작업 실행 진입점
  api/                        클라이언트 fetch 래퍼
  fetch/                      HTTP 수집과 Playwright 렌더 수집
  llm/                        provider/model 해석 및 구조화 생성
  openai/                     specialist / synthesizer 에이전트
  orchestration/              멀티 에이전트 실행 및 검증
  repositories/               로컬 저장소 계층
lib/
  heuristic-audit.ts          휴리스틱 기반 fallback 힌트
types/
  api/                        API 요청/응답 타입
  domain/                     작업, 리포트, 설정 도메인 타입
```

## 분석 흐름

1. 사용자가 `/workspace`에서 provider, model, API key를 입력합니다.
2. API key는 현재 탭 메모리에만 유지됩니다.
3. `/api/analyze` 요청 시 URL과 함께 provider/model/apiKey를 서버로 전달합니다.
4. 서버는 페이지 컨텍스트를 수집합니다.
5. specialist agent가 병렬 분석을 수행합니다.
6. synthesizer가 최종 리포트를 정리합니다.
7. verifier가 중복 이슈와 어색한 수정안을 정리합니다.
8. UI는 리포트, evidence, agent trace, limitation을 함께 보여줍니다.

## 품질 관련 메모

- 동일한 문구를 그대로 반복하는 수정안 예시(`A -> A`)는 프롬프트와 후처리에서 모두 막고 있습니다.
- 결과가 이상할 때는 워크스페이스의 `분석에 사용된 페이지 근거`와 `분석 한계` 섹션을 먼저 확인하는 것이 좋습니다.
- 텍스트와 DOM 기반 분석이므로, 색 대비나 여백 같은 시각적 문제는 제한적으로만 추정합니다.

## 다음 단계 후보

- 분석 히스토리 저장과 비교 리포트
- 스크린샷 기반 visual agent 추가
- 팀 메모 / 해결 상태 / assignee 기능
- Prisma + Postgres 전환
- background job 시스템 고도화
