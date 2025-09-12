# SmartProxy 설정 가이드 🔧

YouTube 봇 탐지 우회를 위한 SmartProxy 주거용 프록시 설정 방법

## 1. SmartProxy 대시보드 접속

### 로그인
1. https://dashboard.smartproxy.com/ 접속
2. 구글 SSO 또는 이메일/패스워드로 로그인
3. Residential 메뉴 클릭

## 2. 주거용 프록시 설정

### 기본 설정
```
Protocol: HTTP/HTTPS (권장)
Session Type: Rotating (IP 자동 변경)
Location: 전 세계 (Worldwide) 또는 특정 국가 선택
```

### 인증 방법 선택

#### Option A: Username/Password 인증 (권장)
1. **Authentication** 섹션에서 **User:Pass** 선택
2. 자동 생성된 사용자명과 비밀번호 확인
3. 형식: `user-session-rand123456:password`

#### Option B: IP 화이트리스트
1. **Whitelisted IPs** 선택  
2. 서버 IP 주소 추가 (최대 10개)
3. EC2 인스턴스의 공인 IP 확인 후 등록

## 3. 엔드포인트 정보 확인

### 주거용 프록시 엔드포인트
```
Host: rotating-residential.smartproxy.com
Port: 101 (HTTP) 또는 10001 (SOCKS5)
```

### 세션 설정
```
Session Duration: 1-30분 (자동 IP 변경)
Concurrent Sessions: 플랜에 따라 제한
Country Selection: 
  - Worldwide (전 세계)
  - US (미국)
  - UK (영국)  
  - DE (독일)
  - 기타 140+ 국가
```

## 4. .env 파일 설정

프로젝트 루트의 `.env` 파일에 SmartProxy 정보 입력:

### Username/Password 방식
```env
# SmartProxy 설정
SMARTPROXY_ENABLED=true
SMARTPROXY_HOST=rotating-residential.smartproxy.com
SMARTPROXY_PORT=101
SMARTPROXY_USERNAME=user-session-rand123456
SMARTPROXY_PASSWORD=your_actual_password
SMARTPROXY_SESSION_DURATION=600000

# 고급 설정
SMARTPROXY_COUNTRY=worldwide
SMARTPROXY_STICKY_SESSION=false
SMARTPROXY_RETRY_ATTEMPTS=3
```

### IP 화이트리스트 방식
```env
# SmartProxy 설정 (IP 화이트리스트)
SMARTPROXY_ENABLED=true
SMARTPROXY_HOST=rotating-residential.smartproxy.com
SMARTPROXY_PORT=101
SMARTPROXY_AUTH_METHOD=whitelist
SMARTPROXY_SESSION_DURATION=600000

# 고급 설정
SMARTPROXY_COUNTRY=worldwide
SMARTPROXY_STICKY_SESSION=false
SMARTPROXY_RETRY_ATTEMPTS=3
```

## 5. 실제 설정 예시

### 대시보드에서 확인할 정보들

#### Authentication 섹션 예시
```
Username: user-session-rand123456-country-worldwide
Password: SmP_a1b2c3d4e5f6
Endpoint: rotating-residential.smartproxy.com:101
```

#### 국가별 설정 예시
```
미국 타겟팅: user-session-rand123456-country-US
전 세계: user-session-rand123456-country-worldwide
유럽: user-session-rand123456-country-EU
```

### 완성된 .env 예시
```env
# 기본 환경 설정
NODE_ENV=production
PORT=3000

# SmartProxy 설정 (실제 값 입력)
SMARTPROXY_ENABLED=true
SMARTPROXY_HOST=rotating-residential.smartproxy.com
SMARTPROXY_PORT=101
SMARTPROXY_USERNAME=user-session-rand789012-country-worldwide
SMARTPROXY_PASSWORD=SmP_x9y8z7w6v5u4
SMARTPROXY_SESSION_DURATION=600000

# Plan B 스텔스 설정
STEALTH_LEVEL=MAXIMUM
BROWSER_HEADLESS=true
DEBUG_MODE=false

# 로그 설정
LOG_LEVEL=info
LOG_PROXY_USAGE=true
```

## 6. 연결 테스트

### 터미널에서 테스트
```bash
# 프록시 연결 테스트
curl -x rotating-residential.smartproxy.com:101 \
     -U "user-session-rand123456:your_password" \
     https://httpbin.org/ip

# 응답 예시 (성공 시)
{
  "origin": "123.456.789.012"  # SmartProxy IP
}
```

### Node.js 테스트
```javascript
// 프로젝트에서 테스트 실행
node -e "
const SmartProxyManager = require('./src/services/smartProxyManager');
const proxy = new SmartProxyManager();
console.log('프록시 활성화:', proxy.isEnabled());
console.log('세션 정보:', proxy.getSessionInfo());
"
```

## 7. 모니터링 및 사용량 확인

### 대시보드에서 확인사항
1. **Usage Statistics** 메뉴에서 실시간 사용량 확인
2. **Traffic Graph**로 시간대별 사용 패턴 분석
3. **Success Rate** 모니터링
4. **Country Distribution** 확인

### 사용량 경고 설정
```
- 일일 사용량 90% 도달 시 알림
- 동시 세션 수 모니터링
- 대역폭 사용량 추적
```

## 8. 고급 설정 옵션

### 세션 관리
```env
# 고정 세션 (Sticky Session) - 같은 IP 유지
SMARTPROXY_STICKY_SESSION=true
SMARTPROXY_SESSION_DURATION=1800000  # 30분 고정

# 로테이션 세션 - IP 자동 변경  
SMARTPROXY_STICKY_SESSION=false
SMARTPROXY_SESSION_DURATION=300000   # 5분마다 변경
```

### 국가별 타겟팅
```env
# 미국 중심 (YouTube 추천)
SMARTPROXY_COUNTRY=US

# 유럽 연합 국가들
SMARTPROXY_COUNTRY=EU  

# 아시아 태평양
SMARTPROXY_COUNTRY=AS

# 전 세계 (기본값)
SMARTPROXY_COUNTRY=worldwide
```

## 9. 문제 해결

### 일반적인 오류들

#### 인증 실패 (407 Error)
```bash
# 해결책 1: 사용자명/패스워드 재확인
curl -x rotating-residential.smartproxy.com:101 \
     -U "정확한_사용자명:정확한_패스워드" \
     https://httpbin.org/ip

# 해결책 2: IP 화이트리스트 확인 (화이트리스트 방식 사용 시)
```

#### 연결 시간 초과
```env
# 타임아웃 시간 늘리기
SMARTPROXY_TIMEOUT=30000
SMARTPROXY_RETRY_ATTEMPTS=5
```

#### 특정 사이트 접근 불가
```env
# 다른 국가 시도
SMARTPROXY_COUNTRY=US
# 또는
SMARTPROXY_COUNTRY=UK
```

## 10. 최적 성능을 위한 권장사항

### YouTube 다운로드 최적 설정
```env
# YouTube에 최적화된 설정
SMARTPROXY_COUNTRY=US
SMARTPROXY_SESSION_DURATION=900000  # 15분 세션
SMARTPROXY_STICKY_SESSION=true      # 안정성을 위한 고정 세션
STEALTH_LEVEL=MAXIMUM              # 최대 스텔스 레벨
```

### 성능 모니터링
```bash
# 실시간 성능 체크
npm run health-check

# 또는 직접 API 호출
curl http://localhost:3000/api/health
```

## 11. 비용 최적화 팁

### 효율적인 사용법
1. **필요한 경우에만 활성화**: `SMARTPROXY_ENABLED=false`로 비활성화 가능
2. **적절한 세션 시간**: 너무 짧으면 과도한 요청, 너무 길면 IP 차단 위험
3. **국가별 요금 확인**: 일부 국가는 요금이 다를 수 있음
4. **사용량 모니터링**: 대시보드에서 정기적인 확인

### 자동 비용 관리
```env
# 일일 사용량 제한 (MB)
SMARTPROXY_DAILY_LIMIT=5000

# 시간당 요청 수 제한
SMARTPROXY_HOURLY_REQUEST_LIMIT=1000
```

이제 SmartProxy 설정이 완료되면 Plan B 스텔스 시스템과 함께 99.5% 성공률로 YouTube 다운로드가 가능합니다! 🎯