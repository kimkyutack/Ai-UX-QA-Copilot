# Repository Rules

## Architecture
- Keep shared domain entities under `types/domain/`.
- Keep request and response contracts under `types/api/`.
- Keep browser or server-side data collection in `services/fetch/`.
- Keep external API clients and model calls in `services/openai/`.
- Keep orchestration logic in `services/analysis/` and `services/orchestration/`.
- Keep persistence logic in `services/repositories/`.
- Keep client-side request wrappers in `services/api/`.
- Keep pure scoring, parsing, and helper logic in `lib/`.
- UI components should stay focused on rendering and user interaction only.
- Route handlers should validate input and delegate business logic to services.

## Type Safety
- Reuse exported domain types instead of redefining inline object shapes.
- Prefer explicit types for API responses and server-side service outputs.
- When a response shape grows, extend the type in `types/` first and then update callers.
- Keep report/debug payloads typed end to end.

## Fetching and IO
- Do not call `fetch` directly inside React components when the request can live in `services/api/`.
- Keep server-side page collection logic separated from route handlers.
- When a page can be SSR HTML or client-rendered HTML, prefer `HTTP fetch -> Playwright fallback`.
- Return debug metadata for collection quality when it helps verify AI behavior.
- Persist durable server state through repository modules, not ad hoc file writes in routes.

## AI Integration
- Prompts must require evidence-based outputs tied to observed page strings.
- Avoid passing large hardcoded heuristic reports as full prompts when they can dominate model output.
- Structured JSON responses should be normalized before they reach the UI.
- Surface weak-signal states instead of pretending analysis confidence is high.
- Keep prompts, schemas, and post-processing separated enough to swap models later.
- Prefer specialist-agent orchestration for complex analysis over one large monolithic prompt.
- Specialist agents should have narrow responsibility and small structured outputs.
- Final reports must be synthesized and locally verified before reaching the UI.

## Product Direction
- Prefer job-based workflows over one-shot request handlers when the feature is expected to grow.
- Every major feature should be compatible with future concepts like workspaces, projects, history, compare mode, and exports.
- Design report views so they can later support saved reports, comments, ownership, and resolution state.

## UI
- Prefer real product information hierarchy over oversized hero typography.
- Design for future additions like history, compare mode, and exports.
- Show evidence or provenance when AI-generated content could otherwise feel generic.
- When adding loading states, communicate what stage the system is in.
- If orchestration exists, expose enough trace data to debug agent quality.

## Workflow
- After meaningful refactors, run `npm run build`.
- If Playwright is introduced, verify browser availability or document the install requirement.
- If a mock or local persistence layer is added, document the intended production replacement path.
