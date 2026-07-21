# 2026-07-20~21 런타임 검증 캠페인 증거 보관

`podo-ui` 전 컴포넌트를 React / Next.js / Hono(SSR) / React Native(react-native-web)
실소비 하니스에서 `npx agent-browser`로 구동 검증하고, `codex exec` 적대적
리뷰 6라운드를 돌린 캠페인의 증거 사본이다. 결과 요약은 CHANGELOG 2.1.0
항목과 커밋 dd8cf91 / 2fbb57d 본문 참조.

- `reports/` — 런타임별 최종 검증 리포트(`react|next|hono|native.md` —
  세션 배너·타르볼 sha·체크별 증거 인용·History 부록 포함)와 브라우저
  명령 전문 로그(`*-commands.log`, eval JS 전체 포함).
- `codex-reviews/` — 라운드별 적대적 리뷰 프롬프트(`prompt-*.md`)와 판정
  원문(`review{N}-{runtime}.md`, 전 라운드 VERDICT: FAIL — 라운드가 갈수록
  발견 수위가 버그 → 엣지 → 기능 요구로 내려간 기록).
- 스크린샷(~19MB)은 용량상 커밋하지 않았다. 하니스 앱 소스와 재현 절차는
  각 리포트의 "how to reproduce" 절에 있다(하니스 자체는 세션 임시
  디렉토리라 소멸 — 리포트의 절차로 재구성 가능).

검증 당시 게이트: `pnpm check` 그린(최종 342 tests). 최종 검증 대상
아티팩트 sha1은 각 리포트 헤더에 기록되어 있다.
