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
- `source/` — 빌드 소스 (클로드 챗에 업로드하는 원본)
  - `weeks.json` — 회차 목록(제목·요약·리드문·footer·파일명·공개 여부)
  - `weeks/wN.html` — 회차 본문 조각 (수식은 `\( \)`, `\[ \]`)
  - `weeks/wN.js` — (선택) 그 회차 위젯 스크립트
  - `img/*.png` — 본문에서 `{{IMG:파일명}}`으로 참조
  - `base.css` — 공통 스타일
  - `build.js` — `node build.js` → `out/index.html`, `out/weekN.html`

## 새 회차 추가하기

HTML 빌드는 **클로드 챗에서** 합니다. `build.js`는 클로드 챗 샌드박스 경로
(`/home/claude/...`의 katex·나눔바른고딕)를 참조하므로 로컬에서는 실행되지 않습니다.

1. `./pack.sh` — `source.zip` 생성
2. 클로드 챗에 `source.zip` 업로드 → 새 회차 작성 요청
   - `weeks/wN.html` (필요하면 `wN.js`, `img/*.png`) 추가
   - `weeks.json`의 `weeks` 배열에 항목 추가 (`ready: true`면 공개)
   - `node build.js` 실행 → `out/` 결과물과 갱신된 `source/`를 받아옴
3. `./publish.sh ~/Downloads/out/*` — 받은 파일을 복사하고 커밋·푸시·배포 확인
   (`source/`도 갱신본으로 덮어쓴 뒤 `./publish.sh`만 실행해도 됩니다)

### 주의

- **`source/`는 항상 최신 상태로 유지**해야 합니다. `build.js`는 `weeks.json`을 읽어
  `index.html`과 **모든** `weekN.html`을 매번 새로 만들기 때문에, 오래된 `source/`로
  빌드하면 이전 회차의 수정 내역이 되돌아갑니다.
- 산출물(`weekN.html`)만 직접 손으로 고치면 다음 빌드 때 사라집니다.
  고칠 내용은 `source/` 쪽에도 반영하세요.
