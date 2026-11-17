# 한은 총재 · BOK GOVERNOR

2027년 여덟 차례 금통위에서 금리를 결정하고 2029년까지 정책 유산을 평가하는 교육용 시뮬레이션입니다.

## 실행 및 구조

- `play.html`을 브라우저에서 엽니다. `node build-play.mjs`로 오프라인 파일을 재생성할 수 있습니다.
- 모듈 버전은 `node serve.mjs`를 실행한 뒤 http://127.0.0.1:4173 에서 엽니다. 정적 호스팅 디렉터리는 `dist/`입니다.
- `dist/economy.mjs`는 월별 모형, `dist/game.mjs`는 회의·표결·반사실·결산, `dist/ui.mjs`는 화면과 저장을 담당합니다. 이전 Phase 1 저장은 기존 로컬 저장 키에 남고 이번 버전은 새 임기로 시작합니다.
- 1월 14일, 2월 25일, 4월 9일, 5월 27일, 7월 15일, 8월 26일, 10월 15일, 11월 25일에 회의를 엽니다. [한국은행 2027년 예정 일정 공지](https://www.bok.or.kr/portal/bbs/B0000502/view.do?menuNo=201263&nttId=11066075)

## 게임 시작 및 시나리오

게임 시작 순서는 다음과 같이 진행됩니다:
`타이틀 화면` → `총재 출신 선택` → `경제 시나리오 선택` → `신년 취임 기자회견` → `집무실` → `제1차 금통위`

총재 출신(경제학자·경제 관료·정치인)과 별도로 6가지 경제 시나리오를 선택하여 다양한 거시경제 위기 상황을 시뮬레이션할 수 있습니다:
- **기본 시나리오 (권장)**: 물가 2.80%, 경기 1.80점, 환율 1,440원, 금융위험 32점의 균형 상태에서 출발
- **① 물가와의 전쟁**: 물가 3.70%, 기대물가 3.20%, 성장 둔화(1.30점)의 고물가 국면에서 금리 추가 인상 여부 고민
- **② 침체의 그림자**: 물가 1.40%, 경기 0.80점, 소비·투자 급랭 국면에서 경기 부양을 위한 조기 금리 인하 고민
- **③ 흔들리는 원화**: 환율 1,530원, 미 연준 고금리(4.25%), 수입물가 급등 상황에서 외환 방어와 내수 부양의 상충
- **④ 빚의 경고**: 가계신용 증가율 7.20%, 부동산 과열(4.50%), 금융위험 48점 국면에서 거시건전성과 통화정책 조합
- **⑤ 반도체의 역설**: 설비투자 3.40점 호황 vs 소비 1.10점 침체의 양극화 속에서 외형 성장을 믿고 긴축할 수 있을지의 딜레마
- **🎲 무작위 시나리오**: 무작위 경제 환경에서 예측 불가능한 도전을 시작

각 시나리오는 초기 지표뿐만 아니라 **BOK워치의 첫 금통위 전망, 위원들의 초기 판단과 설득 난이도, 신년 취임 기자회견의 세 번째 심층 질문, 첫 중앙일보 1면 쟁점**에 유기적으로 연동됩니다.

## Phase 2.5

최신 플레이 감사와 BOK WATCH 계산 방법은 [Phase 4 보고서](PHASE4.md)에 있습니다. [Phase 3 보고서](PHASE3.md)는 통합 이전 기준입니다.

- 새 게임은 경제학자·경제 관료·경제 전문가 출신 정치인 중 한 명을 선택합니다. 같은 시드에서는 출신과 무관하게 같은 6명이 선정됩니다. 12인 후보 풀에서 부총재 자격자가 한 자리를 맡고 나머지 다섯 자리를 채우는 방식은 게임 규칙입니다. 이전 저장의 위원과 완료된 표결은 보존됩니다.
- 회의실에서 제안 금리와 전망을 고르고 위원의 이름을 눌러 판단 근거와 투표 이력을 봅니다. 이견이 있는 위원에게 근거를 제시하고 반론에 답할 수 있습니다. 회당 최대 두 번이며 한 번에 한 단계만 이동합니다. 근거의 방향과 크기, 위원의 성향·유연성·저항, 출신별 설명 방식과 정책적 신뢰가 결과를 좌우합니다. 회의 뒤 실제 지표로 근거를 재검토해 위원 신뢰에 기록합니다.
- 평상시 의결은 출석위원 과반이 필요합니다. 게임은 7명 출석을 가정하며, 4표를 얻은 안이 없으면 상위 두 안을 결선에 붙이고 탈락안을 지지했던 위원은 가까운 대안으로 이동합니다. 후보 동률에는 동결에 가까운 안을 우선합니다. 결선과 가상 인선은 시뮬레이션 규칙입니다. [한국은행법 제21조](https://www.law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=00&joNo=0021&lsiSeq=276153&urlMode=lsScJoRltInfoR)
- 원유·관세·전쟁·신용경색·AI 투자·연준·반도체·추경 사건을 시드와 당월 상태로 계산합니다. 충격은 2~3개월에 걸쳐 감쇠합니다. 금융 경색과 AI·연준 충격은 위험을 키우고, 전쟁과 유가 사건은 중복된 공급 충격 일부를 상쇄합니다. 유동성 지원은 위험을 낮추면서 신용을 늘릴 수 있고, 대출 점검은 신용을 억제하면서 내수를 약화시킬 수 있습니다.
- 정부 요청과 국정감사 답변은 공조와 정책 설명에 반영됩니다. 추경은 별도 외생 충격입니다. 공식 재의는 장관이 공표하고 동일 안 재찬성 5명 이상에서 대통령이 최종 결정합니다. 게임에서는 5표 미달 시 위원들이 대체안을 결선에 붙이고, 대통령이 같은 안을 채택하지 않으면 직전 금리를 적용합니다. 후속 절차와 대통령의 판단 기준은 게임의 단순화입니다. [한국은행법 제92조](https://www.law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=00&joNo=0092&lsiSeq=276153&urlMode=lsScJoRltInfoR)
- 국민 지지도는 생활비·소득, 고용, 이자, 주택과 금융 위험의 변화로 6개 계층에 달리 반영합니다. 2·5·8·11월에 가상 평가를 발표합니다. 지지도는 후속 압박 가능성에 영향을 주며, 독립성 인식과 금융시장 신뢰는 금리의 위험 프리미엄에 영향을 줍니다. 기존 1~2개월 경제 파급 수식의 계수는 유지했습니다.
- 2029년 신문 1면은 2027년 실제 경로, 위험 대응 효과와 정책 소통 기록에서 칭호와 명암을 도출합니다. 이후 후임 금리와 외부 충격에 관한 가정은 기존 결산과 같습니다.

### 실행 검증

`node --test model.test.mjs dots.test.mjs phase25.test.mjs`로 경제, 의결과 점도표, 정부 압박과 재의, 계층별 지지도, 세 출신의 전체 임기와 판정을 확인합니다.

`node browser_test.mjs`는 임시 포트의 로컬 HTTP 서버를 띄우고 Node Playwright로 Chrome을 실행합니다. 기본은 작업 폴더 상위의 기존 Playwright 드라이버와 Windows Chrome이며, 다른 설치는 `BOK_PLAYWRIGHT`와 `BOK_CHROME`으로 지정합니다. 기본 실행 환경에서는 루프백 연결이 `EACCES`로 차단됐습니다. 루프백이 허용된 실행에서는 320·390·768·1440px에서 전체 임기, 저장 복구, 터치 입력, 21점 비겹침과 가로 넘침을 검증했습니다. 캡처와 실행 기록은 `artifacts/phase25/`에 있습니다.

기존 버전의 1440px 실제 플레이에서 같은 형식의 위원 의견이 반복됐고, 직전 결정의 파급을 다음 회의에서 따로 찾아야 했습니다. 새 버전은 사건이 이어지는 동안에는 매번 위기 화면을 요구하지 않고, 시작 화면과 결과에 직전 지표 변화 및 다음 쟁점을 추가했습니다. 320px에서 어색하게 넘어가던 메뉴와 위원 이름 줄바꿈도 조정했습니다.

추가 그림은 기본 ImageGen으로 제작했습니다. `dist/board.jpg`는 서울이 내려다보이는 가상 통화위원회 회의실과 경제전문가 여섯 자리를, `dist/press.jpg`는 남색 기자회견장과 취재진을, `dist/governors.jpg`는 경제학자·관료·정치인 출신을 상징하는 세 가상 인물의 초상화를 그린 이미지입니다.

이미지 생성 프롬프트

- `dist/board.jpg` · “Wide panoramic editorial game environment 2D semirealistic painterly render, fictional 2027 Korean central bank monetary committee boardroom, six distinct middle-aged Korean economists seated around walnut oval table facing viewer from governor's perspective, navy suits with varied colors, papers and microphones, Seoul skyline through tall windows, restrained warm brass and deep ink navy, atmospheric low key institutional lighting, realistic faces, no visible text or logos.”
- `dist/press.jpg` · “Wide panoramic semirealistic painted 2D strategy game environment, press conference room in fictional modern Korean central bank, audience of journalists seen from behind silhouetted, brass microphones with empty lectern and navy curtains, subdued ivory directional lighting, distinct formal dramatic charcoal navy and muted brass style. No text, insignia, flags or logos.”
- `dist/governors.jpg` · “Three equally sized side-by-side Korean fictional central bank governor portraits in a strict triptych, each centered in their own third with equal head height, no borders. Left silver-haired male economist professor with round glasses and ivory backdrop, middle middle-aged Korean female senior economic civil servant in navy blazer, right middle-aged Korean male economic policy politician with thoughtful earnest expression. Upscale semirealistic painted Korean economic strategy game art, deep navy ivory restrained gold, no text or logos.”

## 경제모형

게임의 전략성과 플레이 경험을 높이기 위해 실제 통화정책의 파급시차를 1~2개월로 압축했습니다. 게임 속 경제지표의 변화 시점과 크기는 실제 경제에 대한 예측이 아닙니다.

금리 변경 폭을 시장 반응에 한 번 적용합니다. 금리 수준은 중립 기준 2.50% 대비 편차의 가중합으로 매월 반영합니다. 성장 가중치는 첫째 달부터 `[.26,.16,.065]`, 물가 가중치는 `[.14,.14,.05,.025]`입니다. 직접 경로의 약 87%와 79%가 각각 첫 2개월에 들어갑니다. 소비와 투자는 성장과 같은 가중합에 반응하며 가계신용 증가율에는 당월 대출금리와 성장이 반영됩니다. 이전 3개월의 금리는 3.00%로 시작하는 가정입니다. 유가·미국 금리·세계 수요·시장 위험이 정책 효과와 함께 결과를 바꿉니다. 계수와 시차는 게임 가정이며 역사적 인과 추정은 미검증입니다. [한국은행 파급경로 설명](https://www.bok.or.kr/eng/main/contents.do?menuNo=400024)

가계부채 잔액은 월별로 환산한 부채 증가율을 누적합니다. 금융불균형에는 가계신용과 주택가격, 기대물가에는 목표 대비 물가 오차, 경제 기초체력에는 투자와 금융불안이 반영됩니다. 회의 화면의 동결 비교는 같은 충격에서 회의 전 금리를 유지한 경로입니다. 무충격 비교는 의결 금리와 파급 강도를 유지하고 외생 충격을 제거한 경로입니다. 두 차이는 상호작용을 포함하며 합산을 전제로 하지 않습니다.

2028~2029년에는 월별 충격을 이어서 적용하고 후임 총재가 연 2.50%를 유지한다고 가정합니다. 유산의 영향은 같은 후임 금리 및 충격에서 2027년 말 네 누적 상태만 그해 연중 동결 경로의 값으로 대체한 경우와 비교합니다. 미래 충격의 영향은 같은 2027년 말 상태에서 2028~2029년 외생 충격만 제거해 확인합니다.

## 공식 자료 및 검증

### 조건부 금리전망

2·5·8·11월에는 기준금리 표결을 확정한 뒤 총재가 0.25%p 간격으로 6개월 후 금리 전망을 세 개 제출합니다. 여섯 위원의 경제·금융 전망을 더해 21점을 익명으로 공개하고 직전 발표와 비교합니다. 11월 발표의 대상일은 2028년 5월입니다. [한국은행 조건부 금리전망 설명](https://www.bok.or.kr/portal/bbs/B0000347/view.do?menuNo=201106&nttId=10096941)

`dist/dots.mjs`는 전망, 기자 질문, 시장 가격, 정책 신뢰, 결산 평가를 관리합니다. 시장의 예상 금리는 의결과 기존 기대, 물가·성장·위험, 발표 분포와 기자회견 답변에 반응합니다. 단기 시장금리의 모형값은 여기에 위험·신뢰 프리미엄을 반영합니다. 근거를 설명한 수정은 신뢰 하락으로 처리하지 않으며, 근거가 부족한 상충 신호가 반복되면 신뢰가 떨어집니다. 점도표와 기자회견은 기존 1~2개월 경제 파급모형과 별도로 작동하며 향후 의결 금리를 확정하지 않습니다.

정책 일지와 시장 상태는 기존 로컬 저장 키에 함께 기록됩니다. 업데이트 전에 완료한 회의에는 점도표가 소급 생성되지 않습니다. `node --test model.test.mjs dots.test.mjs`로 회의, 발표, 시장·신뢰, 이력 및 결산을 재현합니다.

| 통계코드 | 기간 | 단위 | 관측 수 |
|---|---|---|---:|
| [FEDFUNDS](https://fred.stlouisfed.org/data/FEDFUNDS) | 2007.01–2026.10 | 월평균 %, 비계절조정 | 238 |
| [EXKOUS](https://fred.stlouisfed.org/data/EXKOUS) | 2007.01–2026.10 | 월평균 원/USD, 비계절조정 | 238 |
| [POILBREUSDM](https://fred.stlouisfed.org/data/POILBREUSDM) | 2007.01–2026.09 | 월평균 USD/배럴, 비계절조정 | 237 |

`data/`에는 세 시계열과 한국은행의 2026년 기준금리·소비자물가·대출금리 공표값이 들어 있습니다. `fetch-data.ps1`이 FRED 다운로드를 지원하며 `node audit-data.mjs`는 스냅샷의 형식과 월별 연속성을 확인합니다. [한국은행 공표자료](https://www.bok.or.kr/portal/main/main.do)

`node --test model.test.mjs`는 1~2개월 반응, 충격에 따른 방향 역전, 재현성과 수치 범위, 여덟 회의, 오프라인 UI 이벤트, 누적 상태와 2029년 재평가를 검증합니다. 브라우저 검증은 Phase 2.5의 Node 검사기를 사용합니다. `browser_test.py`는 이전 버전의 진단용으로 남겼습니다.

`dist/office.jpg`는 기본 ImageGen으로 제작한 가상 집무실 이미지입니다. 프롬프트는 “Wide cinematic game environment still, fictional Korean central bank governor’s office overlooking Seoul at blue hour, warm brass desk lamp and documents, floor to ceiling windows, subtle Korean modernist architecture, realistic painterly rendering, restrained deep navy and brass, center-right focal point suitable for website hero crop. No people, words, flags, logos or signage.”

정량 목표, 기자간담회, 신문 1면 구현과 공식 출처는 [Phase 4.2–4.4](PHASE42-44.md)를 참고하세요.
Phase 5 변경점과 전후 화면은 [구현 보고](PHASE5.md), 이용자 5인 검증 방법은 [공개 베타 관찰 기록](BETA-PLAYTEST.md)을 참고하세요.
Phase 5.2의 장면형 UI, 경제 성적표와 전후 비교는 [Phase 5.2](PHASE52.md)에 있습니다.
