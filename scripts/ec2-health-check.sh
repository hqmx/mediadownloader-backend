#!/bin/bash

# EC2 서버 헬스체크 스크립트
# Plan B 스텔스 시스템 상태 점검

echo "🏥 EC2 서버 헬스체크 시작..."

# 기본 서버 정보
echo "📊 서버 정보:"
echo "- 호스트명: $(hostname)"
echo "- 현재 시간: $(date)"
echo "- 업타임: $(uptime -p)"
echo "- 메모리 사용량: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "- 디스크 사용량: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"

echo ""
echo "🔍 시스템 점검:"

# Node.js 버전 확인
echo "- Node.js: $(node --version 2>/dev/null || echo '❌ 설치되지 않음')"

# PM2 상태 확인
echo "- PM2:"
if pm2 list 2>/dev/null | grep -q "mediadownloader"; then
    echo "  ✅ mediadownloader 프로세스 실행 중"
else
    echo "  ❌ mediadownloader 프로세스 없음"
fi

# Nginx 상태 확인
echo "- Nginx:"
if systemctl is-active --quiet nginx; then
    echo "  ✅ 실행 중"
else
    echo "  ❌ 정지됨"
fi

# yt-dlp 버전 확인
echo "- yt-dlp:"
if command -v yt-dlp &> /dev/null; then
    echo "  ✅ $(yt-dlp --version)"
else
    echo "  ❌ 설치되지 않음"
fi

# Playwright 브라우저 확인
echo "- Playwright Chromium:"
if [ -d "$HOME/.cache/ms-playwright/chromium-*" ]; then
    echo "  ✅ 설치됨"
else
    echo "  ❌ 설치되지 않음"
fi

echo ""
echo "🌐 네트워크 점검:"

# 인터넷 연결 확인
if curl -s --connect-timeout 5 google.com > /dev/null; then
    echo "- 인터넷 연결: ✅ 정상"
else
    echo "- 인터넷 연결: ❌ 실패"
fi

# YouTube 접속 확인
if curl -s --connect-timeout 10 https://www.youtube.com > /dev/null; then
    echo "- YouTube 접속: ✅ 정상"
else
    echo "- YouTube 접속: ❌ 실패"
fi

# SmartProxy 연결 확인
echo "- SmartProxy 테스트:"
if [ -f ".env" ]; then
    source .env
    if [ -n "$SMARTPROXY_USERNAME" ] && [ -n "$SMARTPROXY_PASSWORD" ]; then
        PROXY_URL="http://${SMARTPROXY_USERNAME}:${SMARTPROXY_PASSWORD}@${SMARTPROXY_ENDPOINT:-gate.smartproxy.com}:${SMARTPROXY_PORT:-8000}"

        if curl -s --connect-timeout 10 --proxy "$PROXY_URL" http://httpbin.org/ip > /dev/null; then
            echo "  ✅ SmartProxy 연결 성공"
        else
            echo "  ❌ SmartProxy 연결 실패"
        fi
    else
        echo "  ⚠️ SmartProxy 자격증명 미설정"
    fi
else
    echo "  ⚠️ .env 파일 없음"
fi

echo ""
echo "🚀 애플리케이션 점검:"

# API 헬스체크
if curl -s --connect-timeout 10 http://localhost:3000/api/health > /dev/null; then
    echo "- API 서버: ✅ 정상 (포트 3000)"
else
    echo "- API 서버: ❌ 실패 (포트 3000)"
fi

# HTTPS 접속 확인
if curl -s --connect-timeout 10 https://mediadownloader.hqmx.net/api/health > /dev/null; then
    echo "- HTTPS 접속: ✅ 정상"
else
    echo "- HTTPS 접속: ❌ 실패"
fi

echo ""
echo "📋 로그 점검 (최근 10줄):"
if pm2 list 2>/dev/null | grep -q "mediadownloader"; then
    pm2 logs mediadownloader --lines 10 --nostream
else
    echo "❌ PM2 프로세스가 실행되지 않음"
fi

echo ""
echo "🎯 Plan B 시스템 빠른 테스트:"
echo "다음 명령어로 실제 YouTube 다운로드를 테스트할 수 있습니다:"
echo ""
echo "curl -X POST https://mediadownloader.hqmx.net/api/video-info \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"url\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}'"

echo ""
echo "🏥 헬스체크 완료!"