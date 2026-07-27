# Figma Community 배포 자산

이 폴더에는 Figma Community의 플러그인 게시 화면에 직접 업로드할 최종 PNG가 들어 있습니다.

| 파일 | 용도 | 크기 | Figma 원본 노드 |
| --- | --- | --- | --- |
| `icon.png` | 플러그인 아이콘 | 128 × 128 | `16375:5062` (`logo`) |
| `thumbnail.png` | Community 썸네일 | 1920 × 1080 | `16375:5241` (`썸네일`) |

원본은 [PODO Design System의 `리소스` 섹션](https://www.figma.com/design/uaLVvCUnvoWj4oz6ZMXxwP/PODO-Design-System?node-id=16375-5064)에 있습니다. `assets.json`은 원본 파일·노드 ID, 규격, 현재 PNG의 SHA-256을 기록합니다.

## 게시할 때

1. Figma 데스크톱 앱에서 **Plugins → Manage plugins**를 엽니다.
2. PODO Design System 플러그인의 메뉴에서 **Publish** 또는 **Publish update**를 선택합니다.
3. 이미지 단계에서 `icon.png`와 `thumbnail.png`를 각각 업로드합니다.
4. 제출 전에 `npm run community:check`로 파일 손상이나 잘못된 크기가 없는지 확인합니다.

이 파일들은 플러그인 런타임 번들에 포함되지 않으며 `manifest.json`에서 참조하지 않습니다. Community 게시 정보는 Figma의 게시 화면에서 관리되기 때문입니다.

원본 디자인을 수정한 경우 두 노드를 PNG 1×로 다시 내보내 파일을 교체하고, `assets.json`의 SHA-256도 함께 갱신합니다.
