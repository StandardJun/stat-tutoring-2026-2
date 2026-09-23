#!/bin/bash
# source/ 를 source.zip 으로 묶는다. 클로드 챗에 업로드할 때 사용.
# 새 회차를 만들 때는 항상 이 zip을 올려야 한다 — build.js가 weeks.json을 보고
# index.html과 "모든" weekN.html을 매번 새로 만들기 때문.
set -e
cd "$(dirname "$0")"
rm -f source.zip
zip -rq source.zip source -x '*.DS_Store' 'source/out/*' 'source/.chars.txt'
echo "source.zip 생성 완료 ($(du -h source.zip | cut -f1)) — 클로드 챗에 이 파일을 올리세요."
