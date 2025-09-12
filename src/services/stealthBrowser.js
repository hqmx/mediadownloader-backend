const { chromium } = require('playwright');
const SmartProxyManager = require('./smartProxyManager');
const MasterStealthController = require('./masterStealthController');
const fs = require('fs').promises;
const path = require('path');

class StealthBrowser {
  constructor() {
    this.proxyManager = new SmartProxyManager();
    this.stealthController = new MasterStealthController();
    this.cookiesPath = '/tmp/youtube-cookies.json';
  }

  async extractVideoInfo(url) {
    const proxyUrl = this.proxyManager.getProxy();
    console.log('Starting stealth browser with SmartProxy:', proxyUrl ? 'enabled' : 'disabled');
    
    // 프록시 설정
    const launchOptions = {
      headless: process.env.DEBUG_MODE !== 'true',
      args: [
        // 완벽한 스텔스 설정
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security',
        '--disable-features=BlockInsecurePrivateNetworkRequests',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--password-store=basic',
        '--use-mock-keychain',
        '--force-color-profile=srgb',
        '--disable-extensions',
        '--disable-plugins'
      ]
    };

    // SmartProxy 설정 추가
    if (proxyUrl) {
      launchOptions.proxy = { server: proxyUrl };
    }

    const browser = await chromium.launch(launchOptions);

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: [],
      geolocation: { latitude: 40.7128, longitude: -74.0060 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'DNT': '1'
      }
    });

    // 기존 쿠키 로드
    await this.loadCookies(context);

    const page = await context.newPage();

    // Plan B 완전 스텔스 시스템 적용
    const stealthSuccess = await this.stealthController.applyStealth(browser, context, page);
    if (!stealthSuccess) {
      console.warn('⚠️ 일부 스텔스 기능 적용 실패, 기본 스텔스로 진행');
      await this.applyStealthPatches(context);
    }
    
    try {
      console.log('Navigating to YouTube URL...');
      // YouTube 접속 (고급 인간 행동은 MasterStealthController에서 자동 처리)
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // 추가 대기 시간 (완전한 로딩 보장)
      await page.waitForTimeout(2000 + Math.random() * 3000);
      
      // 비디오 정보 추출
      console.log('Extracting video information...');
      const videoInfo = await this.extractInfo(page);
      
      if (!videoInfo) {
        throw new Error('비디오 정보를 추출할 수 없습니다');
      }
      
      // 쿠키 저장 (재사용)
      const cookies = await context.cookies();
      await this.saveCookies(cookies);
      
      // 스텔스 세션 통계 로깅
      const stealthStats = this.stealthController.getSessionStats();
      console.log(`✅ 비디오 추출 성공: ${videoInfo.title} (스텔스 성공률: ${stealthStats.successRate.toFixed(1)}%)`);
      
      // 적응형 스텔스 조정
      await this.stealthController.adaptiveStealth();
      
      return videoInfo;
    } catch (error) {
      console.error('Browser extraction failed:', error.message);
      throw error;
    } finally {
      await browser.close();
    }
  }

  async applyStealthPatches(context) {
    // navigator.webdriver 제거 및 각종 스텔스 패치
    await context.addInitScript(() => {
      // navigator.webdriver 완전 제거
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
      
      // Chrome 객체 패치
      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };
      
      // 권한 API 패치
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
      
      // 플러그인 배열 패치
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });
      
      // 언어 패치
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });

      // WebGL 패치
      const getParameter = WebGLRenderingContext.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Open Source Technology Center';
        }
        if (parameter === 37446) {
          return 'Mesa DRI Intel(R) Ivybridge Mobile ';
        }
        return getParameter(parameter);
      };

      // 스크린 해상도 패치
      Object.defineProperty(screen, 'colorDepth', {
        get: () => 24
      });
    });
  }

  async simulateHumanEntry(page) {
    console.log('Simulating human entry behavior...');
    
    // 초기 마우스 위치 설정
    await page.mouse.move(0, 0);
    
    // 점진적 마우스 이동
    for (let i = 0; i < 5; i++) {
      await page.mouse.move(
        100 + i * 100 + Math.random() * 50,
        100 + i * 50 + Math.random() * 30,
        { steps: 10 + Math.random() * 10 }
      );
      await page.waitForTimeout(200 + Math.random() * 300);
    }
  }

  async simulateHumanBehavior(page) {
    console.log('Simulating human behavior...');
    
    // 랜덤 대기
    await page.waitForTimeout(2000 + Math.random() * 3000);
    
    // 자연스러운 마우스 움직임
    for (let i = 0; i < 3; i++) {
      const x = 200 + Math.random() * 600;
      const y = 200 + Math.random() * 400;
      await page.mouse.move(x, y, { steps: 20 });
      await page.waitForTimeout(500 + Math.random() * 1000);
    }
    
    // 가끔 스크롤
    if (Math.random() > 0.5) {
      await page.evaluate(() => {
        window.scrollBy(0, 100 + Math.random() * 200);
      });
      await page.waitForTimeout(1000);
      await page.evaluate(() => {
        window.scrollBy(0, -(50 + Math.random() * 100));
      });
    }
    
    // 가끔 클릭 (안전한 영역)
    if (Math.random() > 0.7) {
      await page.mouse.click(400 + Math.random() * 100, 300 + Math.random() * 100);
      await page.waitForTimeout(500);
    }
  }

  async extractInfo(page) {
    // YouTube 페이지에서 정보 추출
    try {
      const videoInfo = await page.evaluate(() => {
        const playerResponse = window.ytInitialPlayerResponse;
        if (playerResponse && playerResponse.videoDetails) {
          const details = playerResponse.videoDetails;
          return {
            videoId: details.videoId,
            title: details.title,
            duration: parseInt(details.lengthSeconds) || 0,
            thumbnail: details.thumbnail?.thumbnails?.[0]?.url,
            platform: 'youtube',
            formats: this.parseStreamingFormats(playerResponse.streamingData)
          };
        }
        
        // 대체 방법: DOM에서 직접 추출
        const titleElement = document.querySelector('meta[name="title"]');
        const videoIdMatch = window.location.href.match(/[?&]v=([^&]+)/);
        
        if (titleElement && videoIdMatch) {
          return {
            videoId: videoIdMatch[1],
            title: titleElement.content,
            duration: 0,
            thumbnail: document.querySelector('meta[property="og:image"]')?.content,
            platform: 'youtube',
            formats: []
          };
        }
        
        return null;
      });

      return videoInfo;
    } catch (error) {
      console.error('Error extracting video info from page:', error);
      return null;
    }
  }

  parseStreamingFormats(streamingData) {
    if (!streamingData) return [];
    
    const formats = [];
    
    // 비디오 포맷
    if (streamingData.formats) {
      streamingData.formats.forEach(format => {
        formats.push({
          formatId: format.itag,
          ext: format.mimeType?.split('/')[1]?.split(';')[0] || 'mp4',
          quality: format.qualityLabel || 'unknown',
          filesize: format.contentLength,
          vcodec: format.mimeType?.includes('video') ? 'h264' : null,
          acodec: format.mimeType?.includes('audio') ? 'aac' : null,
          resolution: format.qualityLabel,
          fps: format.fps
        });
      });
    }
    
    // 적응형 포맷
    if (streamingData.adaptiveFormats) {
      streamingData.adaptiveFormats.forEach(format => {
        formats.push({
          formatId: format.itag,
          ext: format.mimeType?.split('/')[1]?.split(';')[0] || 'mp4',
          quality: format.qualityLabel || (format.height ? `${format.height}p` : 'unknown'),
          filesize: format.contentLength,
          vcodec: format.mimeType?.includes('video') ? 'h264' : null,
          acodec: format.mimeType?.includes('audio') ? 'aac' : null,
          resolution: format.height ? `${format.width}x${format.height}` : null,
          abr: format.averageBitrate,
          fps: format.fps
        });
      });
    }
    
    return formats;
  }

  async loadCookies(context) {
    try {
      const cookiesData = await fs.readFile(this.cookiesPath, 'utf8');
      const cookies = JSON.parse(cookiesData);
      await context.addCookies(cookies);
      console.log('Loaded existing cookies');
    } catch (error) {
      console.log('No existing cookies found, starting fresh');
    }
  }

  async saveCookies(cookies) {
    try {
      await fs.writeFile(this.cookiesPath, JSON.stringify(cookies, null, 2));
      console.log('Cookies saved for future use');
    } catch (error) {
      console.error('Failed to save cookies:', error.message);
    }
  }
}

module.exports = StealthBrowser;