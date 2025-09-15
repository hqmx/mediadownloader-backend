#!/bin/bash

# EC2 자동 배포 스크립트
# Plan B 스텔스 시스템 배포

echo "🚀 EC2 Plan B 스텔스 시스템 배포 시작..."

# GitHub에서 최신 코드 가져오기
echo "📥 최신 코드 가져오기..."
cd /home/ubuntu/mediadownloader-backend
git pull origin main

# 패키지 업데이트
echo "📦 Node.js 패키지 업데이트..."
npm install

# .env 파일 확인 및 생성
if [ ! -f ".env" ]; then
    echo "⚙️ .env 파일 생성 중..."
    cp .env.production .env

    echo ""
    echo "🔑 SmartProxy 자격증명을 설정해주세요:"
    echo "nano .env"
    echo ""
    echo "다음 항목들을 실제 값으로 변경하세요:"
    echo "- SMARTPROXY_USERNAME=실제_사용자명_입력"
    echo "- SMARTPROXY_PASSWORD=실제_비밀번호_입력"
    echo ""
    read -p "자격증명 설정을 완료했습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 자격증명 설정 후 다시 실행해주세요."
        exit 1
    fi
fi

# Playwright 설치 (아직 설치되지 않은 경우)
if [ ! -d "node_modules/playwright" ]; then
    echo "🎭 Playwright 설치 중..."
    chmod +x scripts/install-playwright-ec2.sh
    ./scripts/install-playwright-ec2.sh
fi

# PM2로 애플리케이션 재시작
echo "🔄 애플리케이션 재시작..."
pm2 restart mediadownloader || pm2 start src/app.js --name mediadownloader

# PM2 로그 확인
echo "📊 애플리케이션 상태 확인..."
pm2 status
pm2 logs mediadownloader --lines 10

echo ""
echo "🎉 Plan B 스텔스 시스템 배포 완료!"
echo ""
echo "📋 테스트 명령어:"
echo "curl -X POST https://mediadownloader.hqmx.net/api/video-info \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"url\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}'"
echo ""
echo "📈 실시간 로그 확인:"
echo "pm2 logs mediadownloader"
echo ""
echo "🔧 문제 해결:"
echo "1. SmartProxy 연결 확인: curl --proxy http://user:pass@gate.smartproxy.com:8000 http://httpbin.org/ip"
echo "2. Playwright 테스트: node -e \"require('playwright').chromium.launch().then(b=>b.close())\""
echo "3. 환경 변수 확인: cat .env | grep SMARTPROXY"