# 🎬 Media Downloader Backend

TDD(Test-Driven Development)로 개발된 YouTube 및 소셜 미디어 다운로더 백엔드 시스템입니다.

## ✨ 주요 기능

- 🔍 **URL 검증**: YouTube URL 유효성 자동 검사
- 📺 **비디오 정보 추출**: 제목, 썸네일, 시간 등 메타데이터
- 🎥 **다양한 포맷 지원**: MP4, WebM, MKV (비디오) | MP3, M4A, Opus (오디오)
- ⚡ **스트리밍 다운로드**: 실시간 다운로드 진행 상황
- 🎨 **반응형 웹 UI**: 모바일 및 데스크톱 최적화
- 🧪 **완전한 테스트 커버리지**: 39개 단위/통합 테스트

## 🏗️ 아키텍처

```
/mediadownloader
├── src/
│   ├── services/         # 핵심 비즈니스 로직
│   │   ├── urlValidator.js
│   │   ├── videoInfoExtractor.js
│   │   └── downloadManager.js
│   ├── controllers/      # API 컨트롤러
│   │   └── downloadController.js
│   ├── routes/           # Express 라우팅
│   │   └── api.js
│   └── server.js         # 메인 서버
├── tests/                # TDD 테스트 (39개)
│   ├── unit/            # 단위 테스트
│   └── integration/     # 통합 테스트
├── public/              # 프론트엔드 UI
└── scripts/
    └── setup-ec2.sh     # EC2 자동 설정 스크립트
```

## 🚀 빠른 시작

### 로컬 개발

```bash
# 1. 레포지토리 클론
git clone https://github.com/hqmx/mediadownloader-backend.git
cd mediadownloader-backend

# 2. 의존성 설치
npm install

# 3. 테스트 실행
npm test

# 4. 개발 서버 시작
npm run dev

# 🌐 http://localhost:3000 접속
```

### EC2 배포 (권장)

```bash
# 1. EC2 Ubuntu/Debian 인스턴스에서
git clone https://github.com/hqmx/mediadownloader-backend.git
cd mediadownloader-backend

# 2. 자동 설정 스크립트 실행 (Node.js, yt-dlp, ffmpeg, PM2 자동 설치)
chmod +x scripts/setup-ec2.sh
./scripts/setup-ec2.sh

# 3. AWS 보안 그룹에서 포트 3000 열기
# 4. http://[EC2-IP]:3000 접속
```

## 📋 시스템 요구사항

### 로컬 개발
- Node.js 18+
- npm 또는 yarn

### 프로덕션 (EC2)
- Ubuntu 20.04+ 또는 Debian 11+
- 최소 1GB RAM, 1vCPU
- 10GB 이상 디스크 공간
- 인터넷 연결

## 🔧 환경 설정

`.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
NODE_ENV=production
PORT=3000
YTDLP_PATH=/usr/local/bin/yt-dlp
TEMP_DIR=/tmp/mediadownloader
```

## 📊 API 엔드포인트

### 🔍 비디오 정보
```http
POST /api/video-info
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

### 📥 다운로드 시작
```http
POST /api/download
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "format": "mp4",
  "quality": "720p",
  "audioOnly": false
}
```

### 🎵 스트림 다운로드
```http
GET /api/download/stream/{downloadId}?url=...&format=mp4&quality=720p
```

### ❤️ 헬스 체크
```http
GET /health
```

## 🧪 테스트

```bash
# 모든 테스트 실행
npm test

# 테스트 커버리지
npm run test:coverage

# 감시 모드로 테스트
npm run test:watch
```

**테스트 현황**: ✅ 39/39 통과

## 🛠️ PM2 관리 (프로덕션)

```bash
# 상태 확인
pm2 status

# 로그 확인
pm2 logs mediadownloader

# 재시작
pm2 restart mediadownloader

# 중지
pm2 stop mediadownloader

# 모니터링
pm2 monit
```

## 🔒 보안 고려사항

- ✅ CORS 설정 활성화
- ✅ Helmet.js 보안 헤더
- ✅ Request rate limiting
- ✅ Input validation
- ✅ 임시 파일 자동 정리

## 📱 지원 플랫폼

- 📺 YouTube (`youtube.com`, `youtu.be`)
- 🎵 YouTube Music

*더 많은 플랫폼 지원 예정*

## 🤝 기여하기

1. 포크하기
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 커밋 (`git commit -m 'Add amazing feature'`)
4. 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📄 라이센스

이 프로젝트는 ISC 라이센스를 따릅니다.

## ⚠️ 면책조항

이 도구는 개인적 목적과 교육용으로만 사용하세요. 저작권이 보호되는 콘텐츠의 다운로드 시 해당 플랫폼의 이용약관을 준수해야 합니다.

---

## 🆘 문제 해결

### EC2에서 yt-dlp 오류 발생시
```bash
sudo pip3 install --upgrade yt-dlp
```

### 포트 3000 접속 불가시
- AWS 보안 그룹에서 포트 3000 허용 확인
- UFW 방화벽 상태 확인: `sudo ufw status`

### 다운로드 실패시
- ffmpeg 설치 확인: `ffmpeg -version`
- 임시 디렉토리 권한 확인: `ls -la /tmp/mediadownloader`

---

🚀 **개발자**: Claude Code와 TDD 방식으로 구축  
📧 **지원**: GitHub Issues를 통해 문의  
🌟 **도움이 되셨다면 Star를 눌러주세요!**