# 영어 본문 학습

영어2 2학기 기말고사(Lesson 3·4) 본문 학습 사이트. 상상모의고사K(https://sangsang-k.web.app) 메뉴에서 연결돼요.

- **첫단추**: 영어 한 줄 · 해석 한 줄, 교과서 단어 뜻, 지시어·연결어 단서
- **배열**: 문장 배열 · 실전 (A)(B)(C) · 단어 배열 (드래그 또는 탭)
- **삽입**: 실전 5자리 · 모든 자리

| 파일 | 내용 |
|---|---|
| `index.html` | 화면·스타일 (상상모의고사K 디자인 토큰) |
| `study.js` | 화면 동작, 드래그, 학습 기록(이 기기 localStorage) |
| `study-data.js` | 지문 데이터 — 새 과를 추가할 때는 이 파일만 고치면 돼요 |
| `fonts/pretendard/` | Pretendard Variable (SIL OFL 1.1) |

미리보기: `npx serve .` → http://localhost:3000
배포: GitHub Pages (Settings → Pages → Branch: main / root)
