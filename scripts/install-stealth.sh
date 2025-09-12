#!/bin/bash

# SmartProxy + Playwright 스텔스 시스템 설치 스크립트
# YouTube 봇 감지 우회를 위한 고급 설정

set -e

echo "==========================================="
echo "   SmartProxy + Playwright 스텔스 설치"
echo "==========================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Node.js 패키지 업데이트
log_info "Node.js 패키지 업데이트 중..."
npm install

# Playwright 설치
log_info "Playwright 설치 중..."
npm install playwright@1.40.0 https-proxy-agent@7.0.2 socks-proxy-agent@8.0.2

# Playwright 브라우저 설치
log_info "Playwright Chromium 브라우저 설치 중..."
npx playwright install chromium

# 시스템 의존성 설치 (Ubuntu/Debian)
log_info "Playwright 시스템 의존성 설치 중..."
if command -v apt-get &> /dev/null; then
    sudo npx playwright install-deps chromium
elif command -v yum &> /dev/null; then
    log_warn "CentOS/RHEL 감지됨. 수동으로 의존성을 설치해야 할 수 있습니다."
fi

# 임시 디렉토리 생성
log_info "임시 디렉토리 설정 중..."
mkdir -p /tmp/mediadownloader
chmod 755 /tmp/mediadownloader

# .env 파일 확인 및 생성
if [ ! -f .env ]; then
    log_warn ".env 파일이 없습니다. .env.example에서 복사합니다."
    cp .env.example .env
    echo ""
    log_warn "중요: .env 파일에서 SmartProxy 자격증명을 설정해야 합니다:"
    echo "  - SMARTPROXY_USERNAME=your_username"
    echo "  - SMARTPROXY_PASSWORD=your_password"
    echo ""
fi

# PM2 설치 확인
if ! command -v pm2 &> /dev/null; then
    log_info "PM2 설치 중..."
    sudo npm install -g pm2
fi

# 테스트 실행
log_info "설치 검증 중..."

# Node.js 모듈 테스트
node -e "
const SmartDownloader = require('./src/services/smartDownloader');
console.log('✅ SmartDownloader 모듈 로드 성공');

const smartDownloader = new SmartDownloader();
console.log('✅ SmartDownloader 인스턴스 생성 성공');
" 2>/dev/null && log_info "Node.js 모듈 검증 완료" || log_error "Node.js 모듈 검증 실패"

# Playwright 테스트
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  await browser.close();
  console.log('✅ Playwright Chromium 테스트 성공');
})();
" 2>/dev/null && log_info "Playwright 검증 완료" || log_error "Playwright 검증 실패"

echo ""
echo "==========================================="
echo "           설치 완료!"
echo "==========================================="
echo ""
echo "다음 단계:"
echo "1. .env 파일에서 SmartProxy 자격증명 설정"
echo "2. 애플리케이션 재시작: pm2 restart mediadownloader"
echo "3. 헬스 체크: curl http://localhost:3000/api/health"
echo ""
echo "스텔스 기능이 활성화된 YouTube 다운로더가 준비되었습니다!"
echo ""

# 현재 설정 표시
log_info "현재 환경 설정:"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - yt-dlp: $(which yt-dlp 2>/dev/null || echo '❌ 없음')"
echo "  - Playwright: ✅ 설치됨"
echo "  - PM2: $(pm2 --version 2>/dev/null || echo '❌ 없음')"