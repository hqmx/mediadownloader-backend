#!/bin/bash

# EC2에서 GitHub 리포지토리 설정 자동화 스크립트

echo "🚀 EC2 GitHub 설정 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Git 설치 확인 및 설치
if ! command -v git &> /dev/null; then
    log_info "Git 설치 중..."
    sudo apt update
    sudo apt install git -y
else
    log_info "Git이 이미 설치되어 있습니다: $(git --version)"
fi

# GitHub 사용자 정보 입력
read -p "GitHub 사용자명을 입력하세요: " GITHUB_USERNAME
read -p "GitHub 이메일을 입력하세요: " GITHUB_EMAIL

# Git 사용자 정보 설정
log_info "Git 사용자 정보 설정 중..."
git config --global user.name "$GITHUB_USERNAME"
git config --global user.email "$GITHUB_EMAIL"

# SSH 키 존재 확인
if [ ! -f ~/.ssh/id_ed25519 ]; then
    log_info "SSH 키 생성 중..."
    ssh-keygen -t ed25519 -C "$GITHUB_EMAIL" -f ~/.ssh/id_ed25519 -N ""
    
    # SSH 에이전트 시작
    eval "$(ssh-agent -s)"
    ssh-add ~/.ssh/id_ed25519
else
    log_info "SSH 키가 이미 존재합니다"
fi

# 공개키 출력
echo ""
log_info "다음 공개키를 GitHub에 등록해주세요:"
echo "=========================================="
cat ~/.ssh/id_ed25519.pub
echo ""
echo "=========================================="
echo ""
echo "GitHub 등록 방법:"
echo "1. https://github.com/settings/keys 접속"
echo "2. 'New SSH key' 클릭"
echo "3. Title: 'EC2 Server'"
echo "4. Key: 위의 공개키 내용 붙여넣기"
echo ""

read -p "GitHub에 SSH 키를 등록했다면 Enter를 눌러주세요..."

# SSH 연결 테스트
log_info "GitHub SSH 연결 테스트 중..."
if ssh -T git@github.com -o StrictHostKeyChecking=no 2>&1 | grep -q "successfully authenticated"; then
    log_info "GitHub SSH 연결 성공!"
else
    log_warn "GitHub SSH 연결에 문제가 있을 수 있습니다. 수동으로 확인해주세요."
fi

# 기존 프로젝트 백업
if [ -d "/opt/mediadownloader" ]; then
    log_warn "기존 프로젝트를 백업합니다..."
    sudo mv /opt/mediadownloader /opt/mediadownloader.backup.$(date +%Y%m%d_%H%M%S)
fi

# GitHub 리포지토리 클론
log_info "GitHub 리포지토리 클론 중..."
sudo git clone git@github.com:hqmx/mediadownloader-backend.git /opt/mediadownloader

# 소유권 변경
sudo chown -R $USER:$USER /opt/mediadownloader

# 프로젝트 폴더로 이동
cd /opt/mediadownloader

# Node.js 의존성 설치
log_info "Node.js 의존성 설치 중..."
npm install

# Plan B 스텔스 시스템 설치
if [ -f "scripts/install-stealth.sh" ]; then
    log_info "Plan B 스텔스 시스템 설치 중..."
    chmod +x scripts/install-stealth.sh
    ./scripts/install-stealth.sh
fi

# .env 파일 생성
if [ -f ".env.example" ] && [ ! -f ".env" ]; then
    log_info ".env 파일 생성 중..."
    cp .env.example .env
    
    # SmartProxy 설정 추가
    cat >> .env << 'EOF'

# SmartProxy 설정 (실제 값으로 수정 필요)
SMARTPROXY_ENABLED=true
SMARTPROXY_HOST=proxy.smartproxy.net
SMARTPROXY_PORT=3120
SMARTPROXY_USERNAME=smart-hqmxsmartproxy
SMARTPROXY_PASSWORD=Straight8
SMARTPROXY_SESSION_DURATION=600000
SMARTPROXY_STICKY_SESSION=false
SMARTPROXY_COUNTRY=worldwide
SMARTPROXY_RETRY_ATTEMPTS=3
STEALTH_LEVEL=MAXIMUM
EOF
    
    log_info ".env 파일에 SmartProxy 설정이 추가되었습니다"
fi

echo ""
echo "=========================================="
log_info "GitHub 리포지토리 설정 완료!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. nano .env - 환경 변수 설정 확인/수정"
echo "2. pm2 restart mediadownloader - 서비스 재시작"
echo "3. pm2 logs mediadownloader - 로그 확인"
echo ""
echo "프로젝트 위치: /opt/mediadownloader"
echo "Git 브랜치: $(git branch --show-current)"
echo "최신 커밋: $(git log -1 --oneline)"
echo ""