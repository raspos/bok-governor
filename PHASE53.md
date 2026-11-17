# Phase 5.3 타이포그래피

이전 화면에서는 타이틀·장면 제목·대사가 대체로 같은 고딕 계열에 의존했다. 세 시안은 같은 플레이 시드와 카메라를 사용해 문서, 수치, 대화의 위계를 비교했다.

| 시안 | 판단 |
| --- | --- |
| A | 명조 제목과 고딕 대사의 밀도가 분리된다. 인물 이름은 650, 대화는 430과 약 1.68 행간을 사용한다. 기본으로 채택했다. |
| B | Paperlogy 제목과 숫자가 빠르게 읽힌다. 현대적 인상이 강하고, 정치 드라마의 문서와 대화 구분은 A안보다 약하게 느껴진다. |
| C | 더 굵은 명조 제목과 여유 있는 대화 행간이 회고 지면에 어울린다. 모바일에서는 긴 대화에 필요한 세로 공간이 늘어난다. |

## 390px A·B·C 비교

| 시안 | 타이틀 | 위원과 대화 | 정례 기자회견 |
| --- | --- | --- | --- |
| A · 시네마틱 | [캡처](artifacts/type-a/390-title.png) | [캡처](artifacts/type-a/390-persuasion.png) | [캡처](artifacts/type-a/390-press.png) |
| B · 현대적 경제 전략 | [캡처](artifacts/type-b/390-title.png) | [캡처](artifacts/type-b/390-persuasion.png) | [캡처](artifacts/type-b/390-press.png) |
| C · 에디토리얼 | [캡처](artifacts/type-c/390-title.png) | [캡처](artifacts/type-c/390-persuasion.png) | [캡처](artifacts/type-c/390-press.png) |

| 장면 | 이전 | 적용 후 |
| --- | --- | --- |
| 타이틀 | [이전](artifacts/type-before/390-title.png) | [이후](artifacts/inaugural-final/390-title.png) |
| 정례 기자회견 | [이전](artifacts/type-before/390-press.png) | [이후](artifacts/inaugural-final/390-press.png) |
| 위원 대화 | [이전](artifacts/type-before/390-persuasion.png) | [이후](artifacts/inaugural-final/390-persuasion.png) |
| 금리 결정 | [이전](artifacts/type-before/390-decision.png) | [이후](artifacts/inaugural-final/390-decision.png) |
| BOK워치 | [이전](artifacts/type-before/390-watch.png) | [이후](artifacts/inaugural-final/390-watch.png) |
| 중앙일보 1면 | [이전](artifacts/type-before/390-newspaper.png) | [이후](artifacts/inaugural-final/390-newspaper.png) |

## 1440px A·B·C 비교

| 시안 | 타이틀 | 위원과 대화 | 정례 기자회견 |
| --- | --- | --- | --- |
| A · 시네마틱 | [캡처](artifacts/type-a/1440-title.png) | [캡처](artifacts/type-a/1440-persuasion.png) | [캡처](artifacts/type-a/1440-press.png) |
| B · 현대적 경제 전략 | [캡처](artifacts/type-b/1440-title.png) | [캡처](artifacts/type-b/1440-persuasion.png) | [캡처](artifacts/type-b/1440-press.png) |
| C · 에디토리얼 | [캡처](artifacts/type-c/1440-title.png) | [캡처](artifacts/type-c/1440-persuasion.png) | [캡처](artifacts/type-c/1440-press.png) |

| 장면 | 이전 | 적용 후 |
| --- | --- | --- |
| 타이틀 | [이전](artifacts/type-before/1440-title.png) | [이후](artifacts/inaugural-final/1440-title.png) |
| 정례 기자회견 | [이전](artifacts/type-before/1440-press.png) | [이후](artifacts/inaugural-final/1440-press.png) |
| 위원 대화 | [이전](artifacts/type-before/1440-persuasion.png) | [이후](artifacts/inaugural-final/1440-persuasion.png) |
| 금리 결정 | [이전](artifacts/type-before/1440-decision.png) | [이후](artifacts/inaugural-final/1440-decision.png) |
| BOK워치 | [이전](artifacts/type-before/1440-watch.png) | [이후](artifacts/inaugural-final/1440-watch.png) |
| 중앙일보 1면 | [이전](artifacts/type-before/1440-newspaper.png) | [이후](artifacts/inaugural-final/1440-newspaper.png) |


## 적용 기준

명조 타이틀은 본문과 다른 글자 비례, 단어 사이 간격, 영문 부제 크기를 갖는다. 한글 표기는 한은 총재, 영문 부제는 Governor of the Bank of Korea다. 금리·시장 수치에는 고정 폭 숫자 옵션을 적용했다. 신문 제목·본문은 명조를 사용하고 날짜·부제·도표 설명은 고딕을 쓴다. 장면 제목의 짧은 전환은 시스템 모션 감소와 게임 설정을 따른다.

Pretendard Variable, Noto Serif KR의 한글·기본 기호 범위 WOFF2, Paperlogy Bold를 파일에 포함한다. 라이선스는 dist 폴더의 각 OFL 고지에 있다. Chrome DevTools의 실제 렌더링 글꼴 기록은 각 캡처 폴더의 fonts.json에 저장된다. 비교 시안은 play.html의 주소 끝에 #type=b 또는 #type=c를 붙여 선택할 수 있다.

[ Pretendard 원본](https://github.com/orioncactus/pretendard) · [Noto Serif KR OFL](https://github.com/google/fonts/blob/main/ofl/notoserifkr/OFL.txt) · [Paperlogy 배포 및 조건](https://freesentation.blog/paperlogyfont)
