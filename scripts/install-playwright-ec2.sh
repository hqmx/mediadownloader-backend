#!/bin/bash

# EC2 서버용 Playwright 설치 스크립트
# Ubuntu 20.04/22.04 지원

echo "🎭 EC2 서버용 Playwright 설치 시작..."

# 시스템 업데이트
echo "📦 시스템 패키지 업데이트..."
sudo apt-get update

# Playwright 의존성 설치
echo "🔧 Playwright 의존성 설치..."
sudo apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    libatspi2.0-0 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxshmfence1 \
    libglib2.0-0

# 추가 폰트 및 로케일 설치 (YouTube 렌더링 최적화)
echo "🖋️ 폰트 및 로케일 설치..."
sudo apt-get install -y \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-noto-cjk \
    xvfb \
    locales

# 로케일 설정
sudo locale-gen en_US.UTF-8

# Playwright 브라우저 설치
echo "🌐 Playwright 브라우저 설치..."
cd /home/ubuntu/mediadownloader-backend
npx playwright install chromium
npx playwright install-deps chromium

# 권한 설정
echo "🔐 권한 설정..."
sudo chmod -R 755 node_modules/.bin/
sudo chown -R ubuntu:ubuntu /home/ubuntu/mediadownloader-backend

# /tmp 디렉토리 쿠키 저장 폴더 생성
echo "🍪 쿠키 저장 폴더 생성..."
sudo mkdir -p /tmp/mediadownloader
sudo chown ubuntu:ubuntu /tmp/mediadownloader

# 테스트
echo "🧪 Playwright 설치 테스트..."
node -e "
const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://example.com');
    console.log('✅ Playwright 설치 성공!');
    await browser.close();
  } catch (error) {
    console.error('❌ Playwright 설치 실패:', error.message);
  }
})();
"

echo "🎉 EC2 Playwright 설치 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. SmartProxy 자격증명 설정: nano .env"
echo "2. 애플리케이션 재시작: pm2 restart mediadownloader"
echo "3. Plan B 테스트: curl -X POST https://mediadownloader.hqmx.net/api/video-info -H 'Content-Type: application/json' -d '{\"url\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}'"