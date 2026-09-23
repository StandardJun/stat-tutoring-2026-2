# 기초통계학 피어튜터링 학습 노트 (2026-2학기)

서울대학교 기초통계학 피어튜터링 회차별 학습 노트입니다.

**👉 https://standardjun.github.io/stat-tutoring-2026-2/**

| 회차 | 날짜 | 주제 |
|---|---|---|
| 1주차 | 9월 16일 | 통계학의 큰 그림과 모수 |
| 2주차 | 9월 23일 | 표본분산부터 독립까지 |

## 빌드는 CI가 한다

이 저장소에는 **소스만** 들어 있습니다. 완성된 HTML은 커밋하지 않습니다.
`main`에 푸시하면 GitHub Actions(`.github/workflows/pages.yml`)가
`source/`를 빌드해서 `source/out/`을 Pages에 배포합니다.
빌드가 실패하면 배포되지 않습니다.

주소는 `/`, `/week1.html`, `/week2.html` 그대로입니다.

## 소스 구조

```
source/
  build.js        빌드 스크립트 (node build.js → out/)
  base.css        공통 스타일
  weeks.json      회차 목록과 학기 진도 계획
  weeks/wN.html   N회차 본문 조각. 수식은 \( \) \[ \], 그림은 {{IMG:파일명}}
  weeks/wN.js     그 회차 위젯 스크립트 (선택)
  img/*.png       본문에 들어가는 그림
  package.json    katex, @kfonts/nanum-barun-gothic (버전 고정)
```

빌드는 KaTeX로 수식을 미리 렌더링하고, 나눔바른고딕을 그 페이지에 실제로 쓰인
글자만 서브셋해서 넣고, 그림을 data URI로 박아 넣습니다. 그래서 각 결과물은
외부 요청이 전혀 없는 단독 HTML 파일입니다.

## 새 회차 추가하기

1. `source/weeks/wN.html` (필요하면 `wN.js`, `img/*.png`) 추가
2. `source/weeks.json`의 `weeks` 배열에 항목 추가 (`ready: true`면 공개)
3. 로컬에서 빌드 확인 (선택): `cd source && ./build.sh`
4. 커밋 메시지 `"N회차 자료 추가"` 로 `main`에 푸시 → Actions가 배포

## 로컬 빌드 (확인용)

```bash
cd source
npm ci
python3 -m venv .venv && .venv/bin/pip install fonttools brotli   # 최초 1회
./build.sh          # → source/out/
```

`build.sh`는 `.venv`가 있으면 PATH에 얹어 `pyftsubset`을 찾습니다.
`source/out/`은 커밋하지 않습니다.

## 주의

- 결과물(`weekN.html`)을 직접 고치지 마세요. 다음 빌드 때 사라집니다.
  고칠 내용은 `source/` 쪽에 반영해야 합니다.
- `build.js`는 `weeks.json`을 읽어 `index.html`과 **모든** `weekN.html`을
  매번 새로 만듭니다. `source/`가 곧 사이트의 정본입니다.
