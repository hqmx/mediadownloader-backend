# 안정적이고 확장 가능한 YouTube 다운로더 아키텍처 설계

## 1. 현재 문제점 분석

### 기존 시스템의 한계
- **단일 서버 의존**: Single Point of Failure
- **SmartProxy 의존성**: 비용 및 SSL 연결 이슈
- **실시간 처리**: 모든 요청마다 YouTube 접근
- **확장성 부족**: 트래픽 증가 시 병목

### 대형 서비스 조사 결과
Y2mate, SaveFrom 등 대형 서비스들의 실제 아키텍처:
- 서버 사이드 처리 (브라우저 직접 접근 불가)
- 분산 서버 구조
- 고급 캐싱 시스템
- API Gateway 및 Rate Limiting

## 2. 새로운 아키텍처: "Smart Server-Side with Intelligent Caching"

### 핵심 컨셉
1. **다층 캐싱 시스템**: 대부분의 요청을 캐시에서 처리
2. **분산 처리**: 여러 서버/IP 로테이션
3. **지능형 백그라운드 크롤링**: 인기 비디오 사전 처리
4. **API First**: RESTful API 중심 설계

## 3. 상세 아키텍처

### Layer 1: API Gateway & Load Balancer
```
[Client] → [CloudFlare CDN] → [API Gateway] → [Load Balancer]
                                    ↓
                            [Rate Limiting]
                            [Authentication]
                            [Monitoring]
```

### Layer 2: Application Layer
```
[Load Balancer] → [App Server 1] [App Server 2] [App Server 3]
                       ↓              ↓              ↓
                  [Cache Check] → [Redis Cluster] ← [Cache Check]
                       ↓                                ↓
                  [Background    [Video Info API]  [Download API]
                   Crawler]
```

### Layer 3: Data Layer
```
[Redis Cluster]     [MongoDB Cluster]     [File Storage]
     ↓                    ↓                     ↓
[Session Cache]    [Video Metadata]      [Temporary Files]
[Rate Limiting]    [Popular Videos]      [Download Cache]
[User Data]        [Statistics]          [Logs]
```

### Layer 4: Background Services
```
[Background Crawler] → [Video Info Extractor] → [yt-dlp Pool]
        ↓                      ↓                      ↓
[Popular Videos]         [Batch Processing]     [Multiple IPs]
[Trending Topics]        [Scheduled Updates]    [IP Rotation]
[User Requests]          [Error Handling]       [Health Check]
```

## 4. 핵심 구현 전략

### 4.1 지능형 캐싱 시스템

#### Cache-First Strategy
```javascript
async function getVideoInfo(videoId) {
  // 1차: Redis 캐시 확인
  let videoInfo = await redis.get(`video:${videoId}`);
  if (videoInfo) {
    return JSON.parse(videoInfo);
  }

  // 2차: MongoDB 확인
  videoInfo = await db.videos.findOne({ videoId });
  if (videoInfo && !isExpired(videoInfo)) {
    // Redis 캐시 업데이트
    await redis.setex(`video:${videoId}`, 3600, JSON.stringify(videoInfo));
    return videoInfo;
  }

  // 3차: 실시간 추출 (백그라운드 큐에 추가)
  await backgroundQueue.add('extract-video', { videoId });
  return { status: 'processing', estimatedTime: '30s' };
}
```

#### Background Crawler
```javascript
// 인기 비디오 사전 크롤링
class BackgroundCrawler {
  async crawlTrending() {
    const trendingVideos = await getTrendingVideos();
    for (const video of trendingVideos) {
      await this.extractAndCache(video.id);
    }
  }

  async crawlUserRequests() {
    const requestedVideos = await getRequestedButNotCached();
    for (const video of requestedVideos) {
      await this.extractAndCache(video.id);
    }
  }
}
```

### 4.2 분산 처리 시스템

#### IP Rotation Pool
```javascript
class IPRotationManager {
  constructor() {
    this.ips = [
      { ip: 'server1.example.com', status: 'active', lastUsed: 0 },
      { ip: 'server2.example.com', status: 'active', lastUsed: 0 },
      { ip: 'server3.example.com', status: 'active', lastUsed: 0 },
    ];
  }

  getNextIP() {
    // Round-robin + health check
    const availableIPs = this.ips.filter(ip => ip.status === 'active');
    const leastUsed = availableIPs.sort((a, b) => a.lastUsed - b.lastUsed)[0];
    leastUsed.lastUsed = Date.now();
    return leastUsed.ip;
  }
}
```

#### Queue-Based Processing
```javascript
// Bull Queue를 사용한 비동기 처리
const videoQueue = new Bull('video processing');

videoQueue.process('extract-info', async (job) => {
  const { videoId } = job.data;
  const serverIP = ipManager.getNextIP();

  try {
    const videoInfo = await extractVideoInfo(videoId, serverIP);
    await cacheVideoInfo(videoId, videoInfo);
    return videoInfo;
  } catch (error) {
    // IP 상태 업데이트 및 재시도
    ipManager.markIPAsDown(serverIP);
    throw error;
  }
});
```

### 4.3 고성능 API 설계

#### RESTful API with Caching
```javascript
// GET /api/v1/video/:videoId
app.get('/api/v1/video/:videoId', async (req, res) => {
  const { videoId } = req.params;

  // Rate limiting
  const rateLimitKey = `rate:${req.ip}`;
  const requests = await redis.incr(rateLimitKey);
  if (requests === 1) {
    await redis.expire(rateLimitKey, 60); // 1분
  }
  if (requests > 10) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  try {
    const videoInfo = await getVideoInfo(videoId);

    // CDN 캐싱 헤더
    res.set({
      'Cache-Control': 'public, max-age=3600',
      'ETag': generateETag(videoInfo),
    });

    res.json(videoInfo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch video info' });
  }
});
```

## 5. 인프라 구성

### 5.1 AWS 기반 인프라
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    replicas: 3
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis-cluster:6379
      - MONGODB_URL=mongodb://mongo-cluster:27017

  redis:
    image: redis:alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

  mongodb:
    image: mongo:latest
    volumes:
      - mongo-data:/data/db

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### 5.2 Kubernetes 배포 (확장성)
```yaml
# k8s-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: youtube-downloader
spec:
  replicas: 5
  selector:
    matchLabels:
      app: youtube-downloader
  template:
    metadata:
      labels:
        app: youtube-downloader
    spec:
      containers:
      - name: app
        image: youtube-downloader:latest
        ports:
        - containerPort: 3000
        env:
        - name: REDIS_URL
          value: "redis://redis-service:6379"
---
apiVersion: v1
kind: Service
metadata:
  name: youtube-downloader-service
spec:
  selector:
    app: youtube-downloader
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## 6. 성능 최적화

### 6.1 데이터베이스 최적화
```javascript
// MongoDB 인덱스 설정
db.videos.createIndex({ videoId: 1 }, { unique: true });
db.videos.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24시간 TTL
db.videos.createIndex({ popularity: -1 });
db.videos.createIndex({ "metadata.duration": 1 });

// Redis 최적화
redis.config('set', 'maxmemory-policy', 'allkeys-lru');
redis.config('set', 'maxmemory', '2gb');
```

### 6.2 CDN 및 캐싱 전략
```javascript
// CloudFlare 설정
const cacheRules = {
  '/api/v1/video/*': {
    cacheTtl: 3600, // 1시간
    browserTtl: 1800, // 30분
    cacheLevel: 'cache_everything'
  },
  '/api/v1/download/*': {
    cacheTtl: 300, // 5분
    browserTtl: 0, // 브라우저 캐시 안함
    cacheLevel: 'bypass'
  }
};
```

## 7. 모니터링 및 관리

### 7.1 헬스체크 시스템
```javascript
// /health 엔드포인트
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      redis: await checkRedis(),
      mongodb: await checkMongoDB(),
      youtube: await checkYouTubeAccess(),
      disk: await checkDiskSpace(),
      memory: process.memoryUsage()
    }
  };

  const allHealthy = Object.values(health.services)
    .filter(service => typeof service === 'object')
    .every(service => service.status === 'ok');

  res.status(allHealthy ? 200 : 503).json(health);
});
```

### 7.2 로깅 및 알림
```javascript
// Winston 로거 설정
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Slack 알림
const notifySlack = async (message, level = 'info') => {
  if (level === 'error') {
    await slack.chat.postMessage({
      channel: '#alerts',
      text: `🚨 Production Error: ${message}`
    });
  }
};
```

## 8. 예상 성능 지표

### 현재 vs 새 시스템
| 지표 | 현재 시스템 | 새 시스템 |
|------|-------------|-----------|
| 응답 시간 | 8-15초 | 0.5-2초 (캐시 히트) |
| 동시 사용자 | 50명 | 1000명+ |
| 성공률 | 70% (SSL 문제) | 95%+ |
| 서버 부하 | 높음 | 낮음 (캐시) |
| 확장성 | 제한적 | 무제한 |

### 비용 분석
- **현재**: EC2 + SmartProxy = $100/월
- **새 시스템**: EC2 + Redis + MongoDB = $150/월
- **ROI**: 10배 이상의 사용자 처리 가능

## 9. 구현 로드맵

### Phase 1: 캐싱 시스템 구축 (2주)
- Redis 클러스터 설정
- MongoDB 메타데이터 저장소
- 기본 캐싱 로직 구현

### Phase 2: 백그라운드 처리 (2주)
- Bull Queue 시스템
- 백그라운드 크롤러
- IP 로테이션 매니저

### Phase 3: API 최적화 (1주)
- Rate limiting
- CDN 설정
- 성능 튜닝

### Phase 4: 모니터링 & 배포 (1주)
- 헬스체크 시스템
- 로깅 및 알림
- 프로덕션 배포

## 10. 결론

이 아키텍처는:
- **Y2mate, SaveFrom과 동일한 방식**: 검증된 대형 서비스 패턴
- **확장 가능**: 대용량 트래픽 처리
- **안정적**: 캐시 우선 + 분산 처리
- **비용 효율적**: 기존 인프라 활용
- **미래 지향적**: Kubernetes 확장 준비

**SSL 문제의 임시방편이 아닌, 장기적으로 안정적이고 확장 가능한 솔루션**입니다.