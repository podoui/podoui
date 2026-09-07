# 문서 사이트 검색과 Google 연동

대상은 Cloudflare Worker `podoui`에 배포되는 https://podoui.com 입니다.

## 구현

`packages/docs/src/data/routes.json`이 문서 경로와 검색 메타데이터의 원본입니다.
`pnpm --filter @podoui/docs build`는 같은 React 페이지를 서버에서 렌더링해
26개 문서의 전체 본문 HTML과 canonical, 설명, Open Graph, Twitter metadata,
WebSite/TechArticle JSON-LD를 생성합니다. 앱 내 이동 때도 메타데이터가 갱신됩니다.
빌드용 서버 번들은 공개 산출물에서 제거합니다. 없는 문서는 404와 noindex를 반환합니다.

사이트맵은 https://podoui.com/sitemap.xml, 크롤링 정책은 `/robots.txt`입니다.
`/llms.txt`는 문서 링크와 요약을 제공하는 보조 파일이며 검색 노출의 필수 조건이나
노출 보장 수단이 아닙니다. GEO/AEO는 실제 문서 본문, 제목, 코드 예제와 링크를
JavaScript 없이 읽을 수 있게 하는 방식으로 대응합니다. 특수 AI 스키마나 숨겨진 FAQ는 추가하지 않습니다.

## 계정 연결

GitHub 저장소 Actions variables에 다음 값을 설정하고 `Deploy docs`를 실행합니다.
값은 공개 HTML에 들어가는 식별자이며 비밀 키가 아닙니다.

- `GOOGLE_ANALYTICS_ID`: 실제 GA4 웹 데이터 스트림 측정 ID (`G-...`).
- `GOOGLE_SITE_VERIFICATION`: Search Console URL 접두어 속성 `https://podoui.com/`의
  HTML 태그 인증에서 받은 `content` 값만 입력합니다.

누락된 값은 해당 연동만 비활성화합니다. 잘못된 형식은 빌드를 실패시킵니다.
GA4는 운영 origin에서만 로드합니다. 최초 표시와 SPA 문서 전환마다 수동 `page_view`를
보내며 StrictMode의 동일 경로 재실행은 중복 집계하지 않습니다. 쿼리와 해시는 수동
페이지 조회의 URL/리퍼러에서 제외하고 광고 개인화와 Google signals를 끕니다.
GA4 데이터 스트림의 향상된 측정 설정에서 **브라우저 기록 이벤트 기반 페이지 변경**을
꺼야 수동 조회와 중복되지 않습니다. 자동 사이트 검색/폼 수집도 스트림에서 확인하세요.

배포 후 Google 계정에서 Search Console 소유권 **확인**을 누르고 `sitemap.xml`을
제출해야 연결이 완료됩니다. 도메인 속성을 선택했다면 HTML 태그 대신 Google이 발급한
DNS TXT로 인증해야 합니다. Analytics 관리자에서 Search Console 링크를 생성하려면
해당 GA4 속성 편집 권한과 Search Console 소유자 권한이 필요합니다.
Realtime/DebugView에서 최초 진입, 내부 이동, 뒤로 가기 각각의 조회가 한 번씩 들어오는지 확인합니다.
측정 ID와 인증 토큰 없이 빌드·배포한 것만으로 계정이 연결되지는 않습니다.

## 참고

- [Google AI 검색 기능과 사이트](https://developers.google.com/search/docs/appearance/ai-features)
- [GA4 수동 페이지 조회](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [Search Console 소유권 인증](https://support.google.com/webmasters/answer/9008080)
- [Cloudflare HTML 경로 처리](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)
