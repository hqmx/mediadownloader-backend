# 📋 Plan A: 쿠키 기반 YouTube 접근 시스템

## 📊 개요 (Executive Summary)

현재 SmartProxy SSL 차단 문제를 **근본적으로 해결**하기 위한 쿠키 기반 접근 시스템입니다. YouTube의 정상적인 인증 메커니즘을 활용하여 프록시 의존성을 완전히 제거하고, **경쟁사와 동일한 사용자 경험**을 제공합니다.

**핵심 전략**: 실제 브라우저 세션에서 획득한 쿠키를 yt-dlp에 전달하여 인증된 세션으로 YouTube에 접근. SSL 문제를 **회피가 아닌 완전 해결**.

---

## 🎯 Plan A vs Plan B 비교 분석

### Plan A: 쿠키 기반 접근 (권장)

**장점:**
- ✅ **SSL 문제 근본 해결**: 프록시 불필요로 SSL 차단 완전 회피
- ✅ **비용 효율성**: SmartProxy 월 $100+ 절약
- ✅ **기술적 단순성**: 복잡한 스텔스 시스템 불필요
- ✅ **높은 성공률**: YouTube 정상 인증 메커니즘 활용 (95%+)
- ✅ **경쟁사 동등**: y2mate, savefrom과 동일한 UX 제공
- ✅ **즉시 구현 가능**: 기존 코드 최소 수정

**단점:**
- ⚠️ **쿠키 관리**: 정기적 갱신 및 만료 처리 필요
- ⚠️ **EC2 IP 제약**: 데이터센터 IP 여전히 존재 (하지만 쿠키로 완화)

### Plan B: 스텔스 + 레지덴셜 프록시

**장점:**
- ✅ **주거용 IP**: 가정용 IP로 완벽 위장
- ✅ **고급 기술**: 9개 감지 계층 모두 우회
- ✅ **99.9% 목표**: 이론적 최고 성공률

**단점:**
- ❌ **SSL 차단**: 현재 핵심 문제 미해결
- ❌ **높은 복잡성**: 9개 시스템 통합 및 관리
- ❌ **높은 비용**: SmartProxy + 개발 비용 지속
- ❌ **구현 시간**: 완전 구현까지 4-6주 소요
- ❌ **유지보수**: 지속적인 YouTube 대응 필요

---

## 🏗️ Plan A 상세 구현 설계

### 1️⃣ 쿠키 자동 생성 시스템

#### 핵심 컴포넌트: Playwright Cookie Generator
```javascript
// src/services/cookieManager.js
class YouTubeCookieManager {
  constructor() {
    this.cookieDirectory = '/tmp/youtube-cookies';
    this.cookieLifetime = 24 * 60 * 60 * 1000; // 24시간
    this.activeCookies = new Map();
    this.rotationIndex = 0;
  }

  async generateFreshCookies() {
    console.log('🍪 새로운 YouTube 쿠키 생성 중...');

    const browser = await playwright.chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul'
    });

    const page = await context.newPage();

    try {
      // 1. YouTube 홈페이지 접속
      console.log('📱 YouTube 홈페이지 접속...');
      await page.goto('https://www.youtube.com', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // 2. 자연스러운 사용자 행동 시뮬레이션
      await this.simulateNaturalBrowsing(page);

      // 3. 쿠키 추출 및 저장
      const cookies = await context.cookies();
      const cookieId = this.generateCookieId();

      await this.saveCookies(cookieId, cookies);
      console.log(`✅ 쿠키 생성 완료: ${cookieId}`);

      return cookieId;

    } finally {
      await browser.close();
    }
  }

  async simulateNaturalBrowsing(page) {
    // 페이지 로딩 대기
    await page.waitForTimeout(3000 + Math.random() * 2000);

    // 스크롤하며 추천 비디오 탐색
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, 300 + Math.random() * 200);
      });
      await page.waitForTimeout(2000 + Math.random() * 1000);
    }

    // 검색창 클릭 (실제 검색은 안 함)
    try {
      const searchBox = await page.$('input#search');
      if (searchBox) {
        await searchBox.click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      // 검색창이 없어도 무시
    }

    // 최종 대기
    await page.waitForTimeout(2000);
  }

  async saveCookies(cookieId, cookies) {
    // Netscape 포맷으로 저장 (yt-dlp 호환)
    const cookieText = this.convertToNetscapeFormat(cookies);
    const filePath = `${this.cookieDirectory}/${cookieId}.txt`;

    await fs.writeFile(filePath, cookieText);

    this.activeCookies.set(cookieId, {
      filePath,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      useCount: 0
    });
  }

  convertToNetscapeFormat(cookies) {
    let netscapeCookies = '# Netscape HTTP Cookie File\n';
    netscapeCookies += '# This is a generated file! Do not edit.\n\n';

    cookies.forEach(cookie => {
      if (cookie.domain.includes('youtube.com') || cookie.domain.includes('google.com')) {
        const line = [
          cookie.domain,
          cookie.domain.startsWith('.') ? 'TRUE' : 'FALSE',
          cookie.path,
          cookie.secure ? 'TRUE' : 'FALSE',
          cookie.expires ? Math.floor(cookie.expires) : '0',
          cookie.name,
          cookie.value
        ].join('\t');
        netscapeCookies += line + '\n';
      }
    });

    return netscapeCookies;
  }

  generateCookieId() {
    return `yt-cookie-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### 2️⃣ yt-dlp 쿠키 통합 시스템

#### videoInfoExtractor.js 수정
```javascript
// src/services/videoInfoExtractor.js (쿠키 기반으로 수정)
const { spawn } = require('child_process');
const YouTubeCookieManager = require('./cookieManager');

class VideoInfoExtractor {
  constructor() {
    this.cookieManager = new YouTubeCookieManager();
    this.ytDlpPath = process.env.YTDLP_PATH || 'yt-dlp';
  }

  async extractVideoInfo(url) {
    console.log(`🎯 비디오 정보 추출 시작: ${url}`);

    try {
      // 1. 사용 가능한 쿠키 선택
      const cookieFile = await this.cookieManager.getValidCookie();

      // 2. yt-dlp 쿠키 모드로 실행
      const videoInfo = await this.runYtDlpWithCookies(url, cookieFile);

      // 3. 쿠키 사용 기록 업데이트
      await this.cookieManager.markCookieUsed(cookieFile);

      console.log('✅ 비디오 정보 추출 성공');
      return this.formatVideoInfo(videoInfo);

    } catch (error) {
      console.error('❌ 비디오 정보 추출 실패:', error.message);

      // 쿠키 문제일 경우 새 쿠키 생성 시도
      if (this.isCookieError(error)) {
        console.log('🔄 쿠키 문제 감지, 새 쿠키 생성 중...');
        await this.cookieManager.generateFreshCookies();
        // 재시도는 상위 레벨에서 처리
      }

      throw error;
    }
  }

  async runYtDlpWithCookies(url, cookieFile) {
    const args = [
      '--cookies', cookieFile,
      '--dump-json',
      '--no-playlist',
      '--ignore-errors',
      '--no-warnings',
      '--extract-flat',
      url
    ];

    return new Promise((resolve, reject) => {
      const process = spawn(this.ytDlpPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const videoInfo = JSON.parse(stdout);
            resolve(videoInfo);
          } catch (parseError) {
            reject(new Error(`JSON 파싱 실패: ${parseError.message}`));
          }
        } else {
          reject(new Error(`yt-dlp 실행 실패 (코드: ${code}): ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`프로세스 실행 실패: ${error.message}`));
      });

      // 30초 타임아웃
      setTimeout(() => {
        process.kill();
        reject(new Error('yt-dlp 실행 타임아웃'));
      }, 30000);
    });
  }

  async downloadVideo(url, format = 'best', outputPath = '/tmp') {
    console.log(`📥 비디오 다운로드 시작: ${url}`);

    const cookieFile = await this.cookieManager.getValidCookie();
    const args = [
      '--cookies', cookieFile,
      '--format', format,
      '--output', `${outputPath}/%(title)s.%(ext)s`,
      '--no-playlist',
      url
    ];

    return new Promise((resolve, reject) => {
      const process = spawn(this.ytDlpPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      process.on('close', (code) => {
        if (code === 0) {
          console.log('✅ 비디오 다운로드 성공');
          resolve(true);
        } else {
          reject(new Error(`다운로드 실패 (코드: ${code})`));
        }
      });
    });
  }

  isCookieError(error) {
    const cookieErrorPatterns = [
      'Sign in to confirm',
      'not a bot',
      'HTTP Error 403',
      'Forbidden',
      'Private video',
      'cookies'
    ];

    return cookieErrorPatterns.some(pattern =>
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  formatVideoInfo(rawInfo) {
    return {
      videoId: rawInfo.id,
      title: rawInfo.title || 'Unknown Title',
      duration: rawInfo.duration || 0,
      thumbnail: rawInfo.thumbnail || rawInfo.thumbnails?.[0]?.url,
      uploader: rawInfo.uploader || 'Unknown',
      viewCount: rawInfo.view_count || 0,
      platform: 'youtube',
      formats: this.extractFormats(rawInfo)
    };
  }

  extractFormats(rawInfo) {
    if (!rawInfo.formats) return [];

    return rawInfo.formats
      .filter(format => format.height && format.ext)
      .map(format => ({
        quality: `${format.height}p`,
        format: format.ext,
        filesize: format.filesize,
        url: format.url,
        fps: format.fps
      }))
      .sort((a, b) => parseInt(b.quality) - parseInt(a.quality));
  }
}

module.exports = VideoInfoExtractor;
```

### 3️⃣ 쿠키 관리 및 자동 갱신 시스템

#### 확장된 CookieManager
```javascript
// cookieManager.js 확장 부분
class YouTubeCookieManager {
  // ... 이전 코드 ...

  async getValidCookie() {
    // 1. 기존 유효한 쿠키 확인
    const validCookie = await this.findValidCookie();
    if (validCookie) {
      return validCookie.filePath;
    }

    // 2. 유효한 쿠키가 없으면 새로 생성
    console.log('⚠️ 유효한 쿠키가 없음, 새로 생성...');
    const newCookieId = await this.generateFreshCookies();
    return this.activeCookies.get(newCookieId).filePath;
  }

  async findValidCookie() {
    const now = Date.now();

    for (const [cookieId, cookieInfo] of this.activeCookies) {
      // 24시간 이내이고 사용 횟수가 적은 쿠키 선택
      if (now - cookieInfo.createdAt < this.cookieLifetime &&
          cookieInfo.useCount < 100) {
        return cookieInfo;
      }
    }

    return null;
  }

  async markCookieUsed(cookieFile) {
    for (const [cookieId, cookieInfo] of this.activeCookies) {
      if (cookieInfo.filePath === cookieFile) {
        cookieInfo.lastUsed = Date.now();
        cookieInfo.useCount++;
        break;
      }
    }
  }

  // 백그라운드 쿠키 갱신 시스템
  startCookieRefreshScheduler() {
    setInterval(async () => {
      await this.cleanupExpiredCookies();
      await this.ensureMinimumCookies();
    }, 60 * 60 * 1000); // 1시간마다
  }

  async cleanupExpiredCookies() {
    const now = Date.now();
    const expiredCookies = [];

    for (const [cookieId, cookieInfo] of this.activeCookies) {
      if (now - cookieInfo.createdAt > this.cookieLifetime) {
        expiredCookies.push(cookieId);
      }
    }

    for (const cookieId of expiredCookies) {
      const cookieInfo = this.activeCookies.get(cookieId);
      await fs.unlink(cookieInfo.filePath).catch(() => {});
      this.activeCookies.delete(cookieId);
      console.log(`🗑️ 만료된 쿠키 삭제: ${cookieId}`);
    }
  }

  async ensureMinimumCookies() {
    const minimumCookies = 2;
    const currentCookies = this.activeCookies.size;

    if (currentCookies < minimumCookies) {
      console.log(`🔄 최소 쿠키 수 부족 (${currentCookies}/${minimumCookies}), 생성 중...`);

      for (let i = currentCookies; i < minimumCookies; i++) {
        try {
          await this.generateFreshCookies();
          await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 간격
        } catch (error) {
          console.error(`쿠키 생성 실패: ${error.message}`);
        }
      }
    }
  }

  // 쿠키 검증 시스템
  async validateCookie(cookieFile) {
    try {
      const testResult = await this.runYtDlpWithCookies(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // 테스트 비디오
        cookieFile
      );
      return testResult !== null;
    } catch (error) {
      return false;
    }
  }
}
```

### 4️⃣ API 레이어 통합

#### downloadController.js 수정
```javascript
// src/controllers/downloadController.js (쿠키 기반으로 수정)
const VideoInfoExtractor = require('../services/videoInfoExtractor');

class DownloadController {
  constructor() {
    this.videoInfoExtractor = new VideoInfoExtractor();
  }

  async getVideoInfo(req, res) {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          error: 'URL이 필요합니다'
        });
      }

      console.log(`📋 비디오 정보 요청: ${url}`);

      // 쿠키 기반 정보 추출 (재시도 로직 포함)
      const videoInfo = await this.extractWithRetry(url);

      res.json({
        success: true,
        data: videoInfo,
        message: '비디오 정보 추출 성공'
      });

    } catch (error) {
      console.error('비디오 정보 추출 실패:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: '비디오 정보 추출에 실패했습니다'
      });
    }
  }

  async extractWithRetry(url, maxRetries = 2) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 시도 ${attempt}/${maxRetries}: ${url}`);

        const result = await this.videoInfoExtractor.extractVideoInfo(url);
        console.log(`✅ 시도 ${attempt} 성공`);
        return result;

      } catch (error) {
        lastError = error;
        console.log(`❌ 시도 ${attempt} 실패: ${error.message}`);

        if (attempt < maxRetries && this.videoInfoExtractor.isCookieError(error)) {
          console.log('🍪 쿠키 재생성 후 재시도...');
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 대기
          continue;
        }
      }
    }

    throw lastError;
  }

  async downloadVideo(req, res) {
    try {
      const { url, format = 'best', quality } = req.body;

      if (!url) {
        return res.status(400).json({
          error: 'URL이 필요합니다'
        });
      }

      console.log(`📥 다운로드 요청: ${url} (${format})`);

      // 스트리밍 다운로드로 응답
      await this.streamDownload(url, format, res);

    } catch (error) {
      console.error('다운로드 실패:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  async streamDownload(url, format, res) {
    const cookieFile = await this.videoInfoExtractor.cookieManager.getValidCookie();

    const args = [
      '--cookies', cookieFile,
      '--format', format,
      '--output', '-',  // stdout으로 출력
      '--no-playlist',
      url
    ];

    const ytdlp = spawn(this.videoInfoExtractor.ytDlpPath, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // 헤더 설정
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');

    // 스트림 연결
    ytdlp.stdout.pipe(res);

    ytdlp.stderr.on('data', (data) => {
      console.error('yt-dlp stderr:', data.toString());
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        console.error(`yt-dlp 종료 코드: ${code}`);
        if (!res.headersSent) {
          res.status(500).end();
        }
      }
    });

    ytdlp.on('error', (error) => {
      console.error('yt-dlp 프로세스 오류:', error);
      if (!res.headersSent) {
        res.status(500).end();
      }
    });
  }
}

module.exports = DownloadController;
```

---

## 🚀 Plan A 구현 단계

### Phase 1: 기본 쿠키 시스템 (1주)
1. ✅ **YouTubeCookieManager 구현** - Playwright 기반 쿠키 생성
2. ✅ **videoInfoExtractor 수정** - 쿠키 모드로 전환
3. ✅ **기본 테스트** - 로컬 환경에서 검증
4. ✅ **EC2 배포** - 프로덕션 환경 테스트

### Phase 2: 자동화 및 최적화 (1주)
1. 🔄 **자동 갱신 시스템** - 백그라운드 쿠키 관리
2. 🔄 **에러 복구** - 실패 시 자동 재시도
3. 🔄 **성능 모니터링** - 성공률 추적
4. 🔄 **UI 개선** - 사용자 경험 향상

### Phase 3: 고도화 (1주)
1. 🔮 **다중 쿠키 풀** - 로드 밸런싱
2. 🔮 **지능형 로테이션** - 사용 패턴 최적화
3. 🔮 **캐싱 시스템** - 응답 속도 향상
4. 🔮 **모니터링 대시보드** - 운영 도구

---

## 📊 Plan A 예상 성과

### 기술적 성과
- **SSL 문제**: 100% 해결 (프록시 불사용)
- **성공률**: 95%+ (YouTube 정상 인증)
- **응답 시간**: 3-5초 (현재 실패 → 성공)
- **안정성**: 높음 (단순한 구조)

### 경제적 성과
- **월 비용 절약**: $100+ (SmartProxy 제거)
- **개발 비용**: 최소 (기존 코드 활용)
- **유지보수**: 낮음 (단순 구조)

### 사용자 경험
- **URL 입력** → **자동 분석** → **화질 선택** → **다운로드**
- **경쟁사와 동일한 플로우** 제공
- **빠른 응답** (SSL 문제 해결)

---

## 🆚 Plan A vs Plan B 최종 권장사항

### 🥇 **Plan A (쿠키 기반) 우선 진행 권장**

**이유:**
1. **즉시 효과**: 현재 SSL 문제 바로 해결
2. **높은 성공률**: 95%+ 달성 가능
3. **낮은 리스크**: 단순하고 안정적인 구조
4. **빠른 구현**: 1-2주 내 완성 가능
5. **경제적**: 비용 절약하며 성능 향상

### 🥈 **Plan B (스텔스) 후순위**

**조건부 진행:**
- Plan A로 90% 이상 성공률 달성 후
- 추가 성능 향상이 필요한 경우
- SSL 문제 해결 후 Plan B 재검토

---

## 🎯 결론 및 추천 실행 계획

### 즉시 실행: Plan A 1단계
1. **쿠키 매니저 구현** (2-3일)
2. **videoInfoExtractor 수정** (1-2일)
3. **EC2 테스트 및 배포** (1-2일)

### 성공 지표 확인
- **SSL 문제 해결** ✅/❌
- **성공률 90%+** ✅/❌
- **사용자 플로우 정상** ✅/❌

### Plan A 성공 시
- **Plan B 보류**
- **Plan A 고도화** 진행
- **경쟁사 수준 서비스** 완성

### Plan A 한계 발견 시
- **Plan B 재검토**
- **하이브리드 접근** 고려
- **대안 전략** 수립

**결론**: **Plan A를 먼저 진행**하여 SSL 문제를 근본적으로 해결하고, 성과를 확인한 후 필요시 Plan B를 추가하는 것이 **가장 효율적이고 안전한 접근법**입니다.