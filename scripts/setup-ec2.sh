#!/bin/bash

# EC2 Ubuntu/Debian용 설정 스크립트
# 사용법: chmod +x setup-ec2.sh && ./setup-ec2.sh

echo "🚀 EC2에서 Media Downloader 설정을 시작합니다..."

# 시스템 업데이트
echo "📦 시스템 패키지 업데이트 중..."
sudo apt update && sudo apt upgrade -y

# Node.js 20 설치 (NodeSource 사용)
echo "🟢 Node.js 20 설치 중..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python3 및 pip 설치 (yt-dlp를 위해)
echo "🐍 Python3 및 pip 설치 중..."
sudo apt install -y python3 python3-pip

# ffmpeg 설치
echo "🎬 FFmpeg 설치 중..."
sudo apt install -y ffmpeg

# yt-dlp 설치 (시스템 전역)
echo "⬇️ yt-dlp 설치 중..."
sudo pip3 install yt-dlp

# yt-dlp를 /usr/local/bin에 심볼릭 링크 생성 (PATH 보장)
sudo ln -sf $(which yt-dlp) /usr/local/bin/yt-dlp

# PM2 설치 (프로세스 관리자)
echo "⚙️ PM2 설치 중..."
sudo npm install -g pm2

# 애플리케이션 디렉토리 생성
echo "📁 애플리케이션 디렉토리 설정 중..."
sudo mkdir -p /opt/mediadownloader
sudo chown -R $USER:$USER /opt/mediadownloader

# Git이 설치되어 있지 않다면 설치
if ! command -v git &> /dev/null; then
    echo "📋 Git 설치 중..."
    sudo apt install -y git
fi

# 방화벽 설정 (포트 3000 허용)
echo "🔥 방화벽 설정 중..."
sudo ufw allow 3000/tcp
sudo ufw allow 22/tcp  # SSH 포트 유지
sudo ufw --force enable

# 임시 다운로드 디렉토리 생성
echo "📂 임시 다운로드 디렉토리 생성 중..."
sudo mkdir -p /tmp/mediadownloader
sudo chown -R $USER:$USER /tmp/mediadownloader

# 시스템 서비스를 위한 systemd 설정 생성
echo "🖥️ Systemd 서비스 설정 생성 중..."
sudo tee /etc/systemd/system/mediadownloader.service > /dev/null <<EOF
[Unit]
Description=Media Downloader Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/mediadownloader
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 환경 변수 파일 생성
echo "🔧 환경 설정 파일 생성 중..."
tee /opt/mediadownloader/.env > /dev/null <<EOF
NODE_ENV=production
PORT=3000
YTDLP_PATH=/usr/local/bin/yt-dlp
TEMP_DIR=/tmp/mediadownloader
EOF

# 애플리케이션 파일들 복사 (현재 디렉토리에서)
if [ -f "package.json" ]; then
    echo "📋 애플리케이션 파일 복사 중..."
    cp -r . /opt/mediadownloader/
    cd /opt/mediadownloader
    
    # 의존성 설치
    echo "📦 Node.js 의존성 설치 중..."
    npm install --production
    
    # PM2로 애플리케이션 시작
    echo "🚀 PM2로 애플리케이션 시작 중..."
    pm2 start src/server.js --name "mediadownloader"
    pm2 save
    pm2 startup
    
    echo "✅ 설정이 완료되었습니다!"
    echo ""
    echo "🌐 애플리케이션 URL: http://$(curl -s http://checkip.amazonaws.com):3000"
    echo "📊 PM2 상태 확인: pm2 status"
    echo "📋 로그 확인: pm2 logs mediadownloader"
    echo "🔄 재시작: pm2 restart mediadownloader"
    echo "🛑 중지: pm2 stop mediadownloader"
else
    echo "❌ 애플리케이션 파일을 찾을 수 없습니다."
    echo "이 스크립트를 프로젝트 루트 디렉토리에서 실행해 주세요."
    exit 1
fi

# 설치된 도구들의 버전 확인
echo ""
echo "🔍 설치된 버전 정보:"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Python3: $(python3 --version)"
echo "yt-dlp: $(yt-dlp --version)"
echo "ffmpeg: $(ffmpeg -version | head -n1)"
echo "PM2: $(pm2 --version)"

echo ""
echo "🎉 모든 설정이 완료되었습니다!"
echo "💡 보안 그룹에서 포트 3000을 열어야 외부에서 접속할 수 있습니다."