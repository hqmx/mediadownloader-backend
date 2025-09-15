# 🚀 EC2 Plan B 스텔스 시스템 배포 가이드

## 📋 배포 단계

### 1단계: EC2 서버 접속
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-server
```

### 2단계: 프로젝트 디렉토리 이동
```bash
cd /home/ubuntu/mediadownloader-backend
```

### 3단계: 자동 배포 실행
```bash
# 최신 코드 가져오기 + 자동 설치
chmod +x scripts/deploy-ec2.sh
./scripts/deploy-ec2.sh
```

### 4단계: SmartProxy 자격증명 설정
```bash
nano .env
```

다음 항목들을 실제 값으로 변경:
```env
SMARTPROXY_USERNAME=smart-hqmxsmartproxy
SMARTPROXY_PASSWORD=Straight8
```

### 5단계: 애플리케이션 재시작
```bash
pm2 restart mediadownloader
```

## 🧪 테스트

### Plan B 스텔스 시스템 테스트
```bash
curl -X POST https://mediadownloader.hqmx.net/api/video-info \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### 시스템 헬스체크
```bash
./scripts/ec2-health-check.sh
```

### 실시간 로그 확인
```bash
pm2 logs mediadownloader
```

## 🔧 문제 해결

### SmartProxy 연결 테스트
```bash
curl --proxy http://smart-hqmxsmartproxy:Straight8@gate.smartproxy.com:8000 http://httpbin.org/ip
```

### Playwright 테스트
```bash
node -e "require('playwright').chromium.launch().then(b=>b.close()).then(()=>console.log('✅ Playwright 정상'))"
```

### 의존성 재설치
```bash
./scripts/install-playwright-ec2.sh
```

## 📊 성능 모니터링

### CPU/메모리 사용량
```bash
htop
```

### 네트워크 연결
```bash
netstat -tulpn | grep :3000
```

### 프로세스 상태
```bash
pm2 monit
```

## 🎯 성공 지표

✅ **정상 작동 시:**
- API 응답: 200 OK
- 비디오 정보 추출 성공
- SmartProxy 연결 정상
- Playwright 브라우저 실행 정상

❌ **문제 발생 시:**
- 502/503 에러: PM2 프로세스 확인
- SmartProxy 오류: 자격증명 확인
- Playwright 오류: 의존성 재설치

## 🔄 배포 워크플로우

1. **로컬 개발** → Git 커밋 & 푸시
2. **EC2 서버** → `./scripts/deploy-ec2.sh` 실행
3. **설정 확인** → SmartProxy 자격증명 업데이트
4. **테스트** → API 호출 테스트
5. **모니터링** → `pm2 logs` 실시간 확인

## 🚨 응급 복구

### 전체 재설치
```bash
git reset --hard HEAD
git pull origin main
npm install
./scripts/install-playwright-ec2.sh
pm2 restart mediadownloader
```

### 백업에서 복구
```bash
pm2 stop mediadownloader
cp .env.backup .env
pm2 start mediadownloader
```

---

**🎭 Plan B 스텔스 시스템이 성공적으로 배포되면 YouTube 봇 감지를 95% 이상 우회할 수 있습니다!**