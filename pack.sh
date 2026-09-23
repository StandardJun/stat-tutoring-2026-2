#!/bin/bash
# 클로드 챗에 올릴 source.zip 을 만든다. (빌드 산출물·의존성 제외)
set -e
cd "$(dirname "$0")"
rm -f source.zip
zip -rq source.zip source \
  -x 'source/node_modules/*' 'source/.venv/*' 'source/out/*' 'source/.chars.txt' '*.DS_Store'
echo "source.zip 생성 ($(du -h source.zip | cut -f1)) — 클로드 챗에 이 파일을 올리세요."
