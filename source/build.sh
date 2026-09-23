#!/bin/bash
# 로컬 빌드 확인용. 결과는 source/out/ 에 생성된다(실제 배포는 GitHub Actions가 한다).
#   최초 1회:  npm ci && python3 -m venv .venv && .venv/bin/pip install fonttools brotli
set -e
cd "$(dirname "$0")"
[ -d .venv ] && PATH="$PWD/.venv/bin:$PATH"
command -v pyftsubset >/dev/null || { echo "pyftsubset 없음. .venv 설정을 확인하세요."; exit 1; }
[ -d node_modules ] || npm ci
node build.js
echo "빌드 완료 → source/out/"
