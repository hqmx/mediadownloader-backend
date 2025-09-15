# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

TDD 방식으로 개발된 YouTube 미디어 다운로더 백엔드 시스템. YouTube 봇 감지를 우회하는 고급 스텔스 시스템이 통합되어 있습니다.

- **배포 환경**: AWS EC2 (Ubuntu)
- **라이브 URL**: https://mediadownloader.hqmx.net
- **개발 방식**: TDD (Test-Driven Development)
- **핵심 기능**: YouTube 봇 감지 우회, 스텔스 다운로드

## 개발 명령어

### 테스트
```bash
# 모든 테스트 실행
npm test

# 특정 테스트 파일 실행
npm test videoInfoExtractor.test.js

# 테스트 감시 모드
npm run test:watch

# 커버리지 리포트
npm run test:coverage
```

### 서버 실행
```bash
# 개발 모드 (nodemon)
npm run dev

# 프로덕션 모드
npm start

# PM2로 백그라운드 실행 (EC2)
pm2 start src/server.js --name mediadownloader
pm2 logs mediadownloader
pm2 restart mediadownloader
```

### 스텔스 시스템 설치 (EC2 배포용)
```bash
# 기본 환경 설정
chmod +x scripts/setup-ec2.sh
./scripts/setup-ec2.sh

# 스텔스 시스템 설치
chmod +x scripts/install-stealth.sh
./scripts/install-stealth.sh

# SmartProxy 자격증명 설정
cp .env.production .env
nano .env  # SMARTPROXY_USERNAME, SMARTPROXY_PASSWORD 입력
```

## 아키텍처 및 핵심 컴포넌트

### 계층형 아키텍처
```
src/
├── services/           # 비즈니스 로직 계층
│   ├── urlValidator.js             # URL 검증 서비스
│   ├── videoInfoExtractor.js       # yt-dlp 기반 정보 추출 + 스텔스 헤더
│   ├── downloadManager.js          # 파일 다운로드 관리
│   ├── smartProxyManager.js        # SmartProxy 주거용 프록시 관리
│   └── smartDownloader.js          # 통합 다운로더 (폴백 시스템)
├── controllers/        # API 컨트롤러 계층
│   └── downloadController.js       # HTTP 요청/응답 처리
├── routes/             # 라우팅 계층
│   └── api.js                      # API 엔드포인트 정의
└── server.js           # Express 서버 진입점
```

### 스텔스 시스템 아키텍처
프로젝트는 YouTube 봇 감지를 우회하기 위한 고급 스텔스 시스템을 포함합니다:

1. **SmartProxy 통합**: 주거용 프록시를 통한 IP 위장
2. **완벽한 헤더 위장**: 실제 브라우저 요청 헤더 모방
3. **다단계 폴백 시스템**: yt-dlp → Playwright 브라우저 → 인간 행동 시뮬레이션
4. **세션 로테이션**: 자동 IP 변경 및 지문 회피

### 테스트 구조
TDD 방식으로 개발되어 39개의 단위/통합 테스트가 있습니다:
```
tests/
├── unit/               # 단위 테스트
│   ├── __mocks__/      # 모의 객체
│   ├── urlValidator.test.js
│   ├── videoInfoExtractor.test.js
│   └── downloadManager.test.js
├── integration/        # 통합 테스트
└── setup.js           # 테스트 환경 설정
```

## 환경 설정 및 배포

### 로컬 개발
`.env` 파일에 기본 설정만 필요:
```env
NODE_ENV=development
PORT=3000
YTDLP_PATH=/usr/local/bin/yt-dlp
```

### 프로덕션 배포 (EC2)
스텔스 기능을 위한 SmartProxy 설정 필수:
```env
NODE_ENV=production
SMARTPROXY_ENABLED=true
SMARTPROXY_USERNAME=your_username  # 실제 값 필요
SMARTPROXY_PASSWORD=your_password  # 실제 값 필요
SMARTPROXY_ENDPOINT=gate.smartproxy.com
SMARTPROXY_PORT=10000
USE_BROWSER_FALLBACK=true
```

### 의존성 관리
- **런타임**: yt-dlp, ffmpeg, chromium (Playwright)
- **Node.js 패키지**: Express, Playwright, Jest
- **외부 서비스**: SmartProxy (주거용 프록시)

## 현재 이슈 및 해결 상태

### 주요 이슈: SmartProxy SSL 연결 문제
**상황**: SmartProxy를 통한 YouTube HTTPS 접속 시 SSL_ERROR_SYSCALL 발생
**원인**: YouTube의 프록시 IP 범위 탐지 및 SSL 연결 차단
**해결 방안**: 쿠키 기반 접근 방법 구현 계획

### 현재 작동 상태
- ✅ 웹 인터페이스: 정상 작동
- ✅ 영상 다운로드: 저화질로 성공
- ❌ 영상 정보 분석: SSL 문제로 실패
- ⚠️ SmartProxy: HTTP 작동, HTTPS 차단

## 개발 가이드라인

### TDD 워크플로우
1. **RED**: 실패하는 테스트 작성
2. **GREEN**: 최소한의 코드로 테스트 통과
3. **REFACTOR**: 코드 개선 및 리팩터링

### 코드 패턴
- **비동기 처리**: async/await 사용
- **에러 처리**: try-catch 블록과 적절한 HTTP 상태 코드
- **모듈화**: 서비스별 책임 분리
- **설정 관리**: 환경 변수를 통한 설정 외부화

### 보안 고려사항
- CORS 및 보안 헤더 설정 (helmet.js)
- 입력 검증 및 sanitization
- 임시 파일 자동 정리
- SmartProxy 자격증명 보호 (.env 파일)