# 한은 총재 공통 화면 개편

play.html에서 서비스 헤더와 가로 내비게이션을 삭제했다. 새 타이틀 화면에서 새 게임, 이어하기, 게임 설명, 설정을 연다. 일시정지 메뉴는 장면 위에서 열리며 ESC, 저장하기, 설정, 타이틀 복귀를 지원한다. 기존 저장 키를 유지한다.

집무실의 책상, 모니터, 전화, 서류함과 회의 자료에서 관련 행동을 시작한다. 금통위에서는 배경과 인물·대화를 먼저 보여주고 회의 안건 목록을 필요할 때 펼친다. BOK워치와 정책 기록은 장면 위에서 열리는 별도 문서다. 하단 HUD에서 핵심 지표와 경제 성적표로 접근한다. 기사 화면에는 웹 공통 헤더가 없다.

중앙일보 신문은 새로 발행할 때 경제적 대립을 더 또렷하게 표현한다. 예를 들어 물가가 목표를 웃돌고 경기 흐름이 약해진 구간의 제목은 “물가는 목표 위, 경기는 뒷걸음…한은의 진퇴양난”이다. 기존에 저장된 기사의 제목과 내용은 보존한다.

| 장면 | 1440px 이전 → 이후 | 390px 이전 → 이후 |
| --- | --- | --- |
| 시작 | [이전 출신 선택](artifacts/rebuild-final/1440-background.png) · [타이틀](artifacts/game-shell-final/1440-title.png) | [이전 출신 선택](artifacts/rebuild-final/390-background.png) · [타이틀](artifacts/game-shell-final/390-title.png) |
| 총재 집무실 | [이전](artifacts/rebuild-final/1440-office.png) · [이후](artifacts/game-shell-final/1440-office.png) | [이전](artifacts/rebuild-final/390-office.png) · [이후](artifacts/game-shell-final/390-office.png) |
| 금통위 | [이전](artifacts/rebuild-final/1440-committee.png) · [이후](artifacts/game-shell-final/1440-committee.png) | [이전](artifacts/rebuild-final/390-committee.png) · [이후](artifacts/game-shell-final/390-committee.png) |
| 설득 | [이전](artifacts/rebuild-final/1440-persuasion.png) · [이후](artifacts/game-shell-final/1440-persuasion.png) | [이전](artifacts/rebuild-final/390-persuasion.png) · [이후](artifacts/game-shell-final/390-persuasion.png) |
| 기자회견 | [이전](artifacts/rebuild-final/1440-press.png) · [이후](artifacts/game-shell-final/1440-press.png) | [이전](artifacts/rebuild-final/390-press.png) · [이후](artifacts/game-shell-final/390-press.png) |
| 중앙일보 | [이전](artifacts/rebuild-final/1440-newspaper.png) · [이후](artifacts/game-shell-final/1440-newspaper.png) | [이전](artifacts/rebuild-final/390-newspaper.png) · [이후](artifacts/game-shell-final/390-newspaper.png) |
## 브라우저 검증

자동 테스트 50개가 통과했다. Chrome의 지정된 play.html에서 390px·1440px로 8차례 금통위, 2029년 엔딩, 타이틀 복귀와 이어하기를 실행했다. ESC로 메뉴 열기·닫기, 명시적 저장, 장면 위에서 전망과 성적표를 열고 돌아오기를 확인했다. 동일 시드와 선택의 개편 전후 전체 임기 결과는 두 화면 폭에서 일치했다. 모바일은 Chrome 터치 에뮬레이션으로 검증했다.
