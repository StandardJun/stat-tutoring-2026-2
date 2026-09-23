# 기초통계학 피어튜터링 학습 노트 (2026-2학기)

서울대학교 기초통계학 피어튜터링 회차별 학습 노트입니다.

**👉 https://standardjun.github.io/stat-tutoring-2026-2/**

| 회차 | 날짜 | 주제 |
|---|---|---|
| 1주차 | 9월 16일 | 통계학의 큰 그림과 모수 |
| 2주차 | 9월 23일 | 표본분산부터 독립까지 |

## 구조

- `index.html` — 회차 목록(허브)
- `weekN.html` — 회차별 자료. 폰트·이미지·수식까지 내장한 단독 파일
- `source/` — 빌드 소스
  - `weeks.json` — 회차 목록(제목·요약·파일명·공개 여부)
  - `weeks/wN.html` — 회차 본문 조각 (수식은 `\( \)`, `\[ \]`)
  - `weeks/wN.js` — (선택) 그 회차 위젯 스크립트
  - `img/*.png` — 본문에서 `{{IMG:파일명}}`으로 참조
  - `base.css` — 공통 스타일
  - `build.js` — `node build.js` → `out/index.html`, `out/weekN.html`

## 새 회차 추가하기

1. `source/weeks/wN.html` (필요하면 `wN.js`, `img/*.png`) 작성
2. `source/weeks.json`의 `weeks` 배열에 항목 추가 (`ready: true`면 공개)
3. `node build.js` 실행 후 `out/`의 결과물을 저장소 루트로 복사
4. `git add -A && git commit -m "N주차 추가" && git push`

push하면 1~2분 내로 GitHub Pages에 반영됩니다.
