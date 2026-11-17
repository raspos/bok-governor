# 한은 총재 회의실 재제작 및 실행 경로 감사

## 실행 경로

기획자가 지정한 play.html을 Chrome의 file URL로 직접 열고 첫 금통위를 캡처했다. 이전 화면에서도 Phase 5.2의 경제 HUD와 회의실 아트가 로드됐다. 같은 회의실 그림 아래에 위원 카드가 다시 나오는 구조였으므로, 차이는 실제 표시 파일의 불일치가 아니라 화면 구성에서 재현됐다.

play.html은 build-play.mjs가 dist의 스타일시트와 모듈을 하나의 문서로 묶는다. 그림도 data URL로 포함한다. 서버판은 dist/index.html과 style.css, ui.mjs 및 개별 그래픽을 읽는다. 저장 키와 경로는 기존대로 유지한다. 사용자 브라우저에서 이전에 열어 둔 탭에는 새로고침이 필요하다.

## 회의실

책상과 빈 좌석을 그린 새 배경 위에 임기에 참여하는 총재 1명과 위원 6명의 투명 상반신을 놓았다. 각 좌석에는 이름과 표결 방향이 표시된다. 위원을 선택하면 그 좌석이 강조되고 장면 바로 아래에 확대 초상·발언·총재의 답변이 열린다. 경기 지표는 조사국 보고서로 접었다. 모바일은 좌석을 간단히 배열하고 대화가 활성화되면 확대 발언자 초상을 우선 표시한다. 기존 경제 성적표는 같은 위치에서 열 수 있다.

| 폭 | 이전 파일 | 최종 파일 |
| --- | --- | --- |
| 1440px | [회의실 이전](artifacts/rebuild-before/1440-committee.png) | [회의실 이후](artifacts/rebuild-final/1440-committee.png) · [설득](artifacts/rebuild-final/1440-persuasion.png) |
| 390px | [회의실 이전](artifacts/rebuild-before/390-committee.png) | [회의실 이후](artifacts/rebuild-final/390-committee.png) · [설득](artifacts/rebuild-final/390-persuasion.png) |

## 실제 그래픽 파일

- [금통위 회의실](dist/council-chamber.jpg)
- [금통위원 12명과 총재 출신 3종의 투명 초상](dist/council-cast.png)
- [총재 집무실](dist/office-rebuild.jpg)
- [기자회견장](dist/press-rebuild.jpg)
- [대통령실 회동](dist/president-rebuild.jpg)

세 새 배경은 실제 게임에 연결했다. 국정감사장·위기 상황실과 중앙일보 공식 제호는 기존 그래픽을 사용한다. 중앙일보와 2029년 회고는 기존의 지면 연출을 유지한다. 기자회견에서는 출신별로 붙던 고정 서두를 제거하고, 질문에 대한 답을 먼저 표시한다. 공개된 과거 속기록은 저장값을 보여준다.

인물과 선택을 같은 상황에 배치하는 방식을 공식 Suzerain 플레이 화면으로 확인했다. 원본 그래픽은 게임에 포함하지 않았다. [Torpor Games 공식 플레이 스틸](https://www.suzeraingame.com/) · [공식 Steam 페이지](https://store.steampowered.com/app/1207650/Suzerain/)
## 검증 결과

Chrome의 지정된 file URL에서 390px·1440px로 8차례 금통위와 2029년 엔딩까지 진행했다. 로컬 서버판은 320·390·768·1440px에서 같은 임기 흐름을 검증했다. 390px와 1440px에서는 동일 폭·시드·입력으로 로컬 이전·이후와 서버판의 금리·사건·설득·정책 신뢰·지지도·엔딩 기록이 일치했다. 브라우저 검사 중 위원 초상 CSS가 적용되지 않는 문제와 데스크톱 좌석 클릭 영역이 서로 겹치는 문제를 찾아 수정했다. 수정 후 초상 및 배경 디코딩, 실제 설득, 일곱 표 공개, 저장·복귀와 성적표 복귀를 확인했다. 자동 회귀 테스트 50개가 통과했다. 휴대전화는 Chrome 터치 에뮬레이션으로 검증했다.
