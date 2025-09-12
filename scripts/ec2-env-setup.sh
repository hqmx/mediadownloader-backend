#!/bin/bash

# EC2에서 .env 파일 설정을 위한 스크립트

echo "🚀 EC2 환경 설정 시작..."

# 프로젝트 디렉토리로 이동
cd /opt/mediadownloader

# .env 파일 백업 (기존 파일이 있다면)
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ 기존 .env 파일 백업 완료"
fi

# 새로운 .env 파일 생성
cat > .env << 'EOF'
# 환경 설정 - EC2 프로덕션용
NODE_ENV=production
PORT=3000

# yt-dlp 바이너리 경로 (EC2)
YTDLP_PATH=/usr/local/bin/yt-dlp

# 임시 다운로드 디렉토리
TEMP_DIR=/tmp/mediadownloader

# 로깅 레벨
LOG_LEVEL=info

# 최대 파일 크기 (1GB)
MAX_FILE_SIZE=1073741824

# 동시 다운로드 제한
MAX_CONCURRENT_DOWNLOADS=5

# ===========================================
# SmartProxy 설정 (실제 대시보드 정보)
# ===========================================

# SmartProxy 활성화
SMARTPROXY_ENABLED=true

# SmartProxy 접속 정보 (스크린샷에서 확인된 실제 값)
SMARTPROXY_HOST=proxy.smartproxy.net
SMARTPROXY_PORT=3120
SMARTPROXY_USERNAME=smart-hqmxsmartproxy
SMARTPROXY_PASSWORD=Straight8

# 세션 관리
SMARTPROXY_SESSION_DURATION=600000
SMARTPROXY_STICKY_SESSION=false
SMARTPROXY_COUNTRY=worldwide
SMARTPROXY_RETRY_ATTEMPTS=3

# Plan B 스텔스 레벨
STEALTH_LEVEL=MAXIMUM

# ===========================================
# 스텔스 브라우저 설정
# ===========================================

# Playwright 브라우저 폴백 사용
USE_BROWSER_FALLBACK=true

# 헤드리스 모드 (서버에서는 true)
BROWSER_HEADLESS=true

# 인간 행동 시뮬레이션 활성화
SIMULATE_HUMAN=true

# 쿠키 저장 및 재사용
SAVE_COOKIES=true

# ===========================================
# 디버깅 및 로깅 (프로덕션)
# ===========================================

# 디버그 모드 (프로덕션에서는 false)
DEBUG_MODE=false

# 상세 로깅 비활성화 (성능을 위해)
VERBOSE_LOGGING=false

# 성공/실패 통계 수집
COLLECT_STATS=true
EOF

echo "✅ .env 파일 생성 완료"

# 권한 설정
chmod 600 .env
echo "✅ .env 파일 권한 설정 완료"

# 설정 확인
echo ""
echo "🔍 현재 .env 설정 확인:"
echo "SMARTPROXY_HOST: $(grep SMARTPROXY_HOST .env | cut -d'=' -f2)"
echo "SMARTPROXY_PORT: $(grep SMARTPROXY_PORT .env | cut -d'=' -f2)"
echo "SMARTPROXY_USERNAME: $(grep SMARTPROXY_USERNAME .env | cut -d'=' -f2)"
echo ""

# SmartProxy 연결 테스트
echo "🧪 SmartProxy 연결 테스트 중..."
curl -x proxy.smartproxy.net:3120 \
     -U "smart-hqmxsmartproxy:Straight8" \
     --max-time 10 \
     -s https://httpbin.org/ip

if [ $? -eq 0 ]; then
    echo "✅ SmartProxy 연결 테스트 성공!"
else
    echo "❌ SmartProxy 연결 테스트 실패 - 설정을 확인해주세요"
fi

echo ""
echo "🎯 다음 단계:"
echo "1. npm install 실행"
echo "2. pm2 restart mediadownloader"
echo "3. 웹사이트 테스트"
echo ""