# 한은 총재 Phase 5.2

## 레퍼런스와 화면 원칙

Torpor Games 공식 화면의 지도는 장소와 관계를 유지하는 배경이고, 사건에서는 발언자와 응답 선택이 그 위에서 우선순위를 차지한다. 지도와 자료는 상황을 찾는 데 쓰인다. 인물 초상은 이해관계와 발언자를 식별한다. 모바일 자료에서는 장면과 선택의 읽기 순서가 데스크톱 화면과 별도로 구성된다. 공식 플레이 영상 링크와 공개 스틸을 조사했다. 영상 본편 재생은 확인하지 못했다.

- [Torpor Games 프레스킷](https://www.torporgames.com/presskit)
- [공식 Steam 화면과 소개](https://store.steampowered.com/app/1207650/Suzerain/)
- [모바일 플레이 영상 및 화면을 제공하는 공식 발표](https://www.torporgames.com/press-releases-new/2025/7/11/political-drama-suzerain-available-on-mobile-from-december-8th)

한은 총재에서는 지도의 역할을 집무실의 보고서·시장 단말·전화·회의 자료가 맡는다. 금통위는 같은 회의실을 유지하면서 보고, 목표, 금리안, 위원 발언과 표결을 이어간다. 네이비와 황동을 장면에, 밝은 종이를 보고서에, 청록을 시장 단말에 사용한다. 320·390px에서는 좌석을 두 열로 배치하고 대화 선택을 세로로 표시한다. 모션 감소 설정을 준수하며 순차 표결은 언제든 닫을 수 있다.

## 아트와 적용 범위

Phase 5.2에서 현대 한국을 배경으로 한 2D 페인팅 여섯 컷을 제작해 적용했다. 집무실은 office52.jpg, 금통위 테이블은 board52.jpg, 대통령실은 president52.jpg, 국정감사장은 hearing52.jpg, 금융위기 상황실은 crisis52.jpg, 부처 협의 장면은 ministry52.jpg다. 기존 총재 출신 초상 세 종, 위원 열두 명의 원본 초상과 기자회견장 일러스트를 새 레이아웃에서 재사용했다. 중앙일보 공식 한글 로고를 사용하고 게임 속 가상 기사로 표시한다.

위원별 다섯 가지 별도 표정과 자세 일러스트, 기자 개개인의 초상, 새로운 출신별 총재 초상은 제작하지 않았다. 위원 반응은 기존 초상, 대사, 의견 변경 및 표결 결과로 표현한다. 대통령과 정부 인물은 장소 일러스트에 등장한다.

## 경제 HUD와 성적표

관측 기준일, 기준금리, 전년 동월 대비 물가상승률, 원/달러, 경기 흐름, 국민 지지도, 정책 신뢰를 장면과 함께 표시한다. 경기·정치 항목은 펼쳐서 조회한다. 경제 성적표는 버튼이나 Alt+E로 열고, 닫으면 기존 선택 화면으로 돌아간다.

성적표는 2027년 취임·직전 회의 전·현재 모형값을 비교한다. 회의 목표 탭은 목표와 실제 결과, 기본 경로와 금리안의 차이, 기록된 충격, 다른 지표 변화를 표시한다. 평가 전에는 평가 대기로 표시한다. 지표 추이 탭에는 실제 모형 경로와 이미 확정된 회의·공개 충격의 시점을 표시한다. 경기 흐름은 내부 점수이고 GDP 성장률 전망은 미산출이다. 저장 형식과 경제 엔진은 그대로 사용한다.

## 비교 캡처

| 장면 | 1440px 이전 / 이후 | 390px 이전 / 이후 |
| --- | --- | --- |
| 집무실 | [5.1](artifacts/phase51/1440-office.png) · [5.2](artifacts/phase52-final/1440-office.png) | [5.1](artifacts/phase51/390-office.png) · [5.2](artifacts/phase52-final/390-office.png) |
| 금통위 | [5.1](artifacts/phase51/1440-committee.png) · [5.2](artifacts/phase52-final/1440-committee.png) | [5.1](artifacts/phase51/390-committee.png) · [5.2](artifacts/phase52-final/390-committee.png) |
| 설득 | [5.1](artifacts/phase51/1440-persuasion.png) · [5.2](artifacts/phase52-final/1440-persuasion.png) | [5.1](artifacts/phase51/390-persuasion.png) · [5.2](artifacts/phase52-final/390-persuasion.png) |
| 대통령실 | [5.1](artifacts/phase51/1440-government.png) · [5.2](artifacts/phase52-final/1440-government.png) | [5.1](artifacts/phase51/390-government.png) · [5.2](artifacts/phase52-final/390-government.png) |
| 기자회견 | [5.1](artifacts/phase51/1440-press.png) · [5.2](artifacts/phase52-final/1440-press.png) | [5.1](artifacts/phase51/390-press.png) · [5.2](artifacts/phase52-final/390-press.png) |
| 중앙일보 | [5.1](artifacts/phase51/1440-newspaper.png) · [5.2](artifacts/phase52-final/1440-newspaper.png) | [5.1](artifacts/phase51/390-newspaper.png) · [5.2](artifacts/phase52-final/390-newspaper.png) |
| 2029년 | [5.1](artifacts/phase51/1440-ending.png) · [5.2](artifacts/phase52-final/1440-ending.png) | [5.1](artifacts/phase51/390-ending.png) · [5.2](artifacts/phase52-final/390-ending.png) |
## 검증

자동 회귀 테스트 50개를 통과했다. Chrome에서 320·390·768·1440px를 사용해 세 출신으로 8회 회의와 2029년 엔딩까지 진행했다. 집무실 보고서와 정부 연락, 순차 표결 닫기, 설득과 기자회견 중 성적표 복귀, Alt+E, 목표 평가 대기, 일곱 개 추이 그래프를 검사했다. Phase 5.1과 동일 시드·입력으로 테스트한 네 임기의 금리 경로, 사건, 설득 및 표결, 국민 지지도, 정책 신뢰, 역사적 표제가 일치했다. 모바일은 실제 Chrome 터치 에뮬레이션이며 실물 기기와 이용자 시험은 미실시 상태다.
