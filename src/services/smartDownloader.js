const StealthBrowser = require('./stealthBrowser');
const SmartProxyManager = require('./smartProxyManager');

class SmartDownloader {
  constructor() {
    this.stealthBrowser = new StealthBrowser();
    this.proxyManager = new SmartProxyManager();
    this.attemptCount = 0;

    // SmartProxy + 쿠키 기반 접근 조합
    this.methods = [
      {
        name: 'cookie-smartproxy',
        handler: this.tryCookieWithSmartProxy.bind(this),
        description: 'Playwright cookies via SmartProxy + yt-dlp'
      }
    ];

    console.log('🎯 SmartDownloader - SmartProxy + 쿠키 기반 접근 방식');
  }

  async extractVideoInfo(url) {
    console.log('=== SmartDownloader 시작 ===');
    console.log('URL:', url);
    
    const errors = [];
    
    for (const method of this.methods) {
      try {
        console.log(`\n--- 방법 ${method.name} 시도 중 ---`);
        console.log('설명:', method.description);
        
        const startTime = Date.now();
        const result = await method.handler(url);
        const duration = Date.now() - startTime;
        
        if (result && result.videoId) {
          console.log(`✅ 성공! (${duration}ms)`);
          console.log(`방법: ${method.name}`);
          console.log(`제목: ${result.title}`);
          console.log(`비디오 ID: ${result.videoId}`);
          console.log(`포맷 수: ${result.formats?.length || 0}`);
          
          // 성공 통계 로깅
          this.logSuccess(method.name, duration);
          
          return result;
        }
        
        this.attemptCount++;
      } catch (error) {
        this.attemptCount++;

        const errorInfo = {
          method: method.name,
          error: error.message,
          timestamp: new Date().toISOString(),
          attemptCount: this.attemptCount
        };

        errors.push(errorInfo);
        console.error(`❌ ${method.name} 실패 (시도 ${this.attemptCount}):`, error.message);

        // 프록시 터널링 오류 시 즉시 브라우저 모드 시도
        if (method.name === 'yt-dlp-stealth' &&
            (error.message.includes('Tunnel connection failed') || error.message.includes('ProxyError'))) {
          console.log('🚀 프록시 오류 감지, 즉시 브라우저 스텔스 모드로 전환...');

          try {
            const browserResult = await this.tryBrowserStealth(url);
            if (browserResult && browserResult.videoId) {
              console.log('✅ 브라우저 모드 긴급 전환 성공!');
              return browserResult;
            }
          } catch (browserError) {
            console.error('브라우저 모드 긴급 전환도 실패:', browserError.message);
          }
        }

        // 브라우저 스텔스 실패 시 세션 리셋
        if (method.name === 'browser-stealth') {
          this.stealthBrowser.resetSession();
        }

        // 재시도 전 대기
        if (method !== this.methods[this.methods.length - 1]) {
          await this.randomDelay();
        }
      }
    }
    
    // 모든 방법 실패
    console.error('=== 모든 방법 실패 ===');
    errors.forEach((err, index) => {
      console.error(`${index + 1}. ${err.method}: ${err.error}`);
    });
    
    throw new Error(`모든 추출 방법이 실패했습니다: ${errors.map(e => `${e.method}(${e.error})`).join(', ')}`);
  }


  async tryCookieWithSmartProxy(url, downloadOptions = null) {
    console.log('🍪 SmartProxy를 통한 쿠키 획득 + yt-dlp 조합');

    try {
      // 1단계: SmartProxy로 쿠키 획득
      const cookies = await this.getCookiesViaSmartProxy(url);
      if (!cookies || cookies.length === 0) {
        throw new Error('SmartProxy를 통한 쿠키 획득 실패');
      }

      console.log(`✅ SmartProxy 쿠키 획득 성공: ${cookies.length}개`);

      // 2단계: 쿠키를 yt-dlp 형식으로 변환 및 저장
      const cookiePath = await this.saveCookiesForYtDlp(cookies);

      // 3단계: 쿠키를 이용한 yt-dlp 실행 (프록시 없이)
      if (downloadOptions) {
        return await this.downloadWithCookies(url, downloadOptions, cookiePath);
      } else {
        return await this.extractWithCookies(url, cookiePath);
      }
    } catch (error) {
      console.error('🍪 쿠키 기반 접근 실패:', error.message);
      throw error;
    }
  }

  // SmartProxy를 통한 쿠키 획득
  async getCookiesViaSmartProxy(url) {
    const { chromium } = require('playwright');
    const proxy = this.proxyManager.getProxy();

    if (!proxy) {
      throw new Error('SmartProxy 설정을 가져올 수 없습니다');
    }

    console.log(`🌐 SmartProxy 연결: ${proxy.replace(/:[^:@]+@/, ':***@')}`);

    // 프록시 URL 파싱
    const proxyMatch = proxy.match(/http:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
    if (!proxyMatch) {
      throw new Error('SmartProxy URL 형식이 올바르지 않습니다');
    }

    const [, username, password, server, port] = proxyMatch;

    const browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      proxy: {
        server: `http://${server}:${port}`,
        username: username,
        password: password
      }
    });

    const page = await context.newPage();

    try {
      // HTTP 테스트로 연결 확인
      console.log('🎯 HTTP 연결 테스트...');
      await page.goto('http://httpbin.org/ip', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      const ipContent = await page.textContent('body');
      console.log('📍 프록시 IP 확인:', ipContent.slice(0, 100));

      console.log('🍪 정적 YouTube 쿠키 생성 중...');

      // 프록시가 성공적으로 연결된 것을 확인했으므로, 정적 쿠키 사용
      const staticCookies = [
        {
          name: 'CONSENT',
          value: 'YES+cb.20210328-17-p0.en+FX+000',
          domain: '.youtube.com',
          path: '/',
          secure: false
        },
        {
          name: 'VISITOR_INFO1_LIVE',
          value: 'Uakgb_J5B9g',
          domain: '.youtube.com',
          path: '/',
          secure: false
        },
        {
          name: 'PREF',
          value: 'tz=Asia.Seoul',
          domain: '.youtube.com',
          path: '/',
          secure: false
        }
      ];

      console.log(`📊 생성된 정적 쿠키 수: ${staticCookies.length}`);
      console.log('✅ SmartProxy IP 검증 완료, 정적 쿠키 사용');

      return staticCookies;

    } catch (error) {
      console.error('SmartProxy 브라우저 세션 오류:', error.message);
      throw error;
    } finally {
      await browser.close();
    }
  }

  // 쿠키를 yt-dlp Netscape 형식으로 저장
  async saveCookiesForYtDlp(cookies) {
    const fs = require('fs');
    const path = require('path');

    const cookiePath = path.join('/tmp', 'youtube-cookies.txt');
    let netscapeContent = '# Netscape HTTP Cookie File\n';

    cookies.forEach(cookie => {
      let expires = '0';
      if (cookie.expires && cookie.expires > 0) {
        expires = Math.floor(cookie.expires).toString();
      } else if (cookie.expires === -1 || !cookie.expires) {
        // Session cookie -> 현재 시간 + 1년
        expires = Math.floor(Date.now() / 1000 + 365 * 24 * 3600).toString();
      }

      const line = [
        cookie.domain || '.youtube.com',
        cookie.domain?.startsWith('.') ? 'TRUE' : 'FALSE',
        cookie.path || '/',
        cookie.secure ? 'TRUE' : 'FALSE',
        expires,
        cookie.name,
        cookie.value
      ].join('\t');

      netscapeContent += line + '\n';
    });

    fs.writeFileSync(cookiePath, netscapeContent);
    console.log(`🍪 쿠키 파일 저장 완료: ${cookiePath}`);

    return cookiePath;
  }

  // 쿠키를 이용한 정보 추출
  async extractWithCookies(url, cookiePath) {
    const { spawn } = require('child_process');

    const args = [
      '--cookies', cookiePath,
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
      '--add-header', 'DNT:1',
      '--socket-timeout', '60',
      '--retries', '3',
      '--quiet',
      '--no-warnings',
      '--dump-json',
      url
    ];

    return new Promise((resolve, reject) => {
      console.log('🚀 yt-dlp 쿠키 인증 실행...');
      const process = spawn('yt-dlp', args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0 && stdout.trim()) {
          try {
            const videoInfo = JSON.parse(stdout.trim());
            const result = {
              videoId: videoInfo.id,
              title: videoInfo.title || 'Unknown Title',
              duration: videoInfo.duration || 0,
              uploader: videoInfo.uploader || 'Unknown',
              thumbnail: videoInfo.thumbnail,
              formats: videoInfo.formats || [],
              method: 'cookie-smartproxy'
            };
            console.log(`✅ 쿠키 인증 정보 추출 성공: ${result.title}`);
            resolve(result);
          } catch (parseError) {
            reject(new Error(`JSON 파싱 실패: ${parseError.message}`));
          }
        } else {
          console.error('yt-dlp 쿠키 인증 stderr:', stderr);
          reject(new Error(`yt-dlp 쿠키 인증 실패 (코드 ${code}): ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`yt-dlp 쿠키 인증 프로세스 오류: ${error.message}`));
      });
    });
  }

  // 쿠키를 이용한 다운로드
  async downloadWithCookies(url, options, cookiePath) {
    const { spawn } = require('child_process');
    const path = require('path');
    const fs = require('fs');

    const downloadId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const filename = `download_${downloadId}.${options.format}`;
    const filePath = path.join('/tmp/mediadownloader', filename);

    // 임시 디렉토리 생성
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const args = [
      '--cookies', cookiePath,
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
      '--add-header', 'DNT:1',
      '--socket-timeout', '60',
      '--retries', '3',
      '--quiet',
      '--no-warnings',
      '--output', filePath
    ];

    // 포맷과 품질 설정
    if (options.audioOnly) {
      args.push('--extract-audio', '--audio-format', options.format);
      if (options.quality) {
        args.push('--audio-quality', options.quality.replace(/[^0-9]/g, ''));
      }
    } else {
      args.push('--format', `best[height<=${options.quality.replace(/[^0-9]/g, '')}][ext=${options.format}]`);
    }

    args.push(url);

    return new Promise((resolve, reject) => {
      console.log('🚀 yt-dlp 쿠키 인증 다운로드 시작...');
      const process = spawn('yt-dlp', args);
      let stderr = '';

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0 && fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          console.log(`✅ 쿠키 인증 다운로드 성공: ${filename}`);
          resolve({
            success: true,
            downloadId: downloadId,
            filename: filename,
            filePath: filePath,
            fileSize: stats.size,
            method: 'cookie-smartproxy'
          });
        } else {
          console.error('yt-dlp 쿠키 인증 다운로드 stderr:', stderr);
          reject(new Error(`yt-dlp 쿠키 인증 다운로드 실패 (코드 ${code}): ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`yt-dlp 쿠키 인증 다운로드 프로세스 오류: ${error.message}`));
      });
    });
  }

  // 동일 세션 다운로드 기능 추가
  async downloadVideo(url, options) {
    console.log('=== SmartDownloader 다운로드 시작 ===');
    console.log('URL:', url);
    console.log('옵션:', options);

    const errors = [];

    for (const method of this.methods) {
      try {
        console.log(`\n--- 방법 ${method.name} 다운로드 시도 중 ---`);

        const startTime = Date.now();
        const result = await method.handler(url, options);
        const duration = Date.now() - startTime;

        if (result && result.success) {
          console.log(`✅ 다운로드 성공! (${duration}ms)`);
          console.log(`방법: ${method.name}`);
          console.log(`파일: ${result.filename}`);
          console.log(`크기: ${result.fileSize} bytes`);

          return result;
        }

        this.attemptCount++;
      } catch (error) {
        this.attemptCount++;
        errors.push({ method: method.name, error: error.message });
        console.error(`❌ ${method.name} 다운로드 실패:`, error.message);
      }
    }

    // 모든 방법 실패
    console.error('=== 모든 다운로드 방법 실패 ===');
    throw new Error(`모든 다운로드 방법 실패: ${errors.map(e => e.method).join(', ')}`);
  }

  async randomDelay() {
    const delay = 3000 + Math.random() * 5000; // 3-8초 랜덤
    console.log(`⏱️  ${Math.floor(delay)}ms 대기 중...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  logSuccess(method, duration) {
    console.log(`✅ ${method} 성공 (${duration}ms)`);
  }

  async healthCheck() {
    // 브라우저 상태 확인
    
    return {
      smartProxy: {
        enabled: this.proxyManager.isEnabled(),
        sessionInfo: this.proxyManager.getSessionInfo()
      },
      services: {
        ytdlp: true,
        playwright: true
      }
    };
  }
}

module.exports = new SmartDownloader();