#!/bin/bash
# 클로드 챗에서 받은 결과물을 사이트에 반영한다.
#   ./publish.sh                     이미 폴더에 넣어둔 변경사항을 커밋·푸시
#   ./publish.sh ~/Downloads/out/*   해당 파일들을 폴더로 복사한 뒤 커밋·푸시
set -e
cd "$(dirname "$0")"
REPO=StandardJun/stat-tutoring-2026-2
URL=https://standardjun.github.io/stat-tutoring-2026-2/

[ $# -gt 0 ] && { cp -v "$@" . ; }

git add -A
git diff --cached --quiet && { echo "변경사항이 없습니다."; exit 0; }
git diff --cached --name-status
git commit -qm "자료 업데이트 $(date +%Y-%m-%d)"
git push -q origin main
echo "푸시 완료. 배포 대기 중..."

for i in $(seq 1 25); do
  s=$(gh api "repos/$REPO/pages/builds/latest" --jq .status 2>/dev/null)
  [ "$s" = built ] && break
  [ "$s" = errored ] && { echo "배포 실패. https://github.com/$REPO/actions 확인"; exit 1; }
  sleep 6
done

code=$(curl -s -o /dev/null -w '%{http_code}' "$URL")
echo "배포 완료 ($code)  →  $URL"
