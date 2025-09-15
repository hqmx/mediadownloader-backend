/**
 * 진짜 사람처럼 브라우징하는 완전 스텔스 브라우저
 * YouTube 봇 감지를 완전히 우회하는 고급 시스템
 */

const { chromium } = require('playwright');
const SmartProxyManager = require('./smartProxyManager');
const HumanBehaviorSimulator = require('./humanBehaviorSimulator');
const fs = require('fs').promises;
const path = require('path');

class StealthBrowser {
  constructor() {
    this.proxyManager = new SmartProxyManager();
    this.humanBehavior = new HumanBehaviorSimulator();
    this.cookiesPath = '/tmp/youtube-cookies.json';
    this.sessionId = Date.now().toString();
  }

  async extractVideoInfo(url) {
    console.log('🎭 진짜 사람처럼 브라우저 시작...');

    const proxyUrl = this.proxyManager.getProxy();
    console.log('SmartProxy:', proxyUrl ? 'enabled' : 'disabled');

    const browser = await this.launchStealthBrowser(proxyUrl);
    const context = await this.createStealthContext(browser);

    try {
      // 1. YouTube 메인 페이지부터 자연스럽게 시작
      const page = await this.startNaturalBrowsing(context);

      // 2. 목표 비디오로 진짜 사람처럼 이동
      await this.navigateToVideoLikeHuman(page, url);

      // 3. 비디오 정보 추출 (사람이 보는 것처럼)
      const videoInfo = await this.extractVideoInfoLikeHuman(page);

      // 4. 쿠키 저장 (다음 세션에서 활용)
      await this.saveCookies(context);

      console.log('✅ 진짜 사람처럼 브라우징 완료!');
      return videoInfo;

    } catch (error) {
      console.error('❌ 스텔스 브라우징 실패:', error.message);
      throw new Error(`비디오 정보를 추출할 수 없습니다: ${error.message}`);
    } finally {
      await browser.close();
    }
  }

  // 완전 스텔스 브라우저 실행
  async launchStealthBrowser(proxyUrl) {
    const launchOptions = {
      headless: process.env.DEBUG_MODE !== 'true',
      args: [
        // 기본 보안 설정
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',

        // 봇 탐지 우회 (핵심)
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-shared-workers',

        // 실제 브라우저 모방
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps',
        '--disable-popup-blocking',
        '--disable-translate',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-field-trial-config',
        '--disable-back-forward-cache',
        '--disable-ipc-flooding-protection',

        // 메모리 및 성능 최적화
        '--memory-pressure-off',
        '--max_old_space_size=4096',
        '--force-color-profile=srgb',
        '--disable-background-media-suspend',

        // 고급 스텔스 옵션
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-component-extensions-with-background-pages',
        '--disable-background-networking',
        '--disable-client-side-phishing-detection'
      ]
    };

    // SmartProxy 설정
    if (proxyUrl) {
      launchOptions.proxy = { server: proxyUrl };
    }

    return await chromium.launch(launchOptions);
  }

  // 완전 스텔스 컨텍스트 생성
  async createStealthContext(browser) {
    // 실제 사용자 환경 시뮬레이션
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

    const context = await browser.newContext({
      userAgent: randomUA,
      viewport: {
        width: 1920 + Math.floor(Math.random() * 100),
        height: 1080 + Math.floor(Math.random() * 100)
      },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: [],
      geolocation: {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1
      },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      colorScheme: 'light',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': `"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"`,
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    // 기존 쿠키 로드
    await this.loadCookies(context);

    // 완전 스텔스 패치 적용
    await this.applyCompleteStealth(context);

    return context;
  }

  // 완전한 스텔스 패치 시스템
  async applyCompleteStealth(context) {
    await context.addInitScript(() => {
      // 1. navigator.webdriver 완전 제거
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });

      // 2. Chrome 개발자 도구 탐지 우회
      window.chrome = {
        runtime: {},
        loadTimes: function() { return { requestTime: Date.now() / 1000 }; },
        csi: function() { return { onloadT: Date.now() }; },
        app: {
          isInstalled: false,
          getDetails: function() { return undefined; },
          getIsInstalled: function() { return false; }
        }
      };

      // 3. 권한 API 패치 (실제 브라우저처럼)
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => {
        if (parameters.name === 'notifications') {
          return Promise.resolve({ state: 'default' });
        }
        return originalQuery(parameters);
      };

      // 4. 플러그인 배열 시뮬레이션
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          return [
            { name: 'Chrome PDF Plugin', length: 1 },
            { name: 'Chrome PDF Viewer', length: 1 },
            { name: 'Native Client', length: 1 }
          ];
        }
      });

      // 5. 언어 설정 패치
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });

      // 6. WebGL 지문 변조
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
          return 'Intel Inc.';
        }
        if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
          return 'Intel(R) HD Graphics 630';
        }
        return getParameter.call(this, parameter);
      };

      // 7. Canvas 지문 변조 (미세한 노이즈 추가)
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function() {
        // 캔버스에 1픽셀 노이즈 추가
        const ctx = this.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, 1, 1);
          imageData.data[0] += Math.floor(Math.random() * 3);
          ctx.putImageData(imageData, 0, 0);
        }
        return originalToDataURL.apply(this, arguments);
      };

      // 8. 스크린 해상도 패치
      Object.defineProperty(screen, 'colorDepth', {
        get: () => 24
      });

      Object.defineProperty(screen, 'pixelDepth', {
        get: () => 24
      });

      // 9. 시간대 일관성 확보
      Date.prototype.getTimezoneOffset = function() {
        return 300; // EST
      };

      // 10. 마우스 이벤트 속성 추가 (실제 마우스처럼)
      document.addEventListener('mousemove', function(e) {
        e.isTrusted = true;
      }, true);

      document.addEventListener('click', function(e) {
        e.isTrusted = true;
      }, true);
    });
  }

  // 자연스러운 브라우징 시작
  async startNaturalBrowsing(context) {
    const page = await context.newPage();

    console.log('🏠 YouTube 메인 페이지부터 자연스럽게 시작...');

    // YouTube 메인 페이지 접속
    await page.goto('https://www.youtube.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // 페이지 로드 후 자연스러운 대기
    await this.humanBehavior.naturalPageLoadWait(page);

    // 자연스러운 브라우징 행동
    await this.humanBehavior.browseYouTubeNaturally(page);

    return page;
  }

  // 목표 비디오로 진짜 사람처럼 이동
  async navigateToVideoLikeHuman(page, targetUrl) {
    console.log('🎯 목표 비디오로 자연스럽게 이동...');

    // 주소창을 통한 자연스러운 네비게이션
    await page.keyboard.press('Control+l');
    await page.waitForTimeout(300 + Math.random() * 200);

    // URL 자연스럽게 타이핑
    await this.humanBehavior.typeNaturally(page, targetUrl);
    await page.keyboard.press('Enter');

    // 페이지 로드 대기 (SmartProxy 사용 시 더 오래 걸림)
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await this.humanBehavior.naturalPageLoadWait(page);

    // 비디오 페이지에서의 자연스러운 행동
    await this.naturalVideoPageBehavior(page);
  }

  // 비디오 페이지에서의 자연스러운 행동
  async naturalVideoPageBehavior(page) {
    console.log('📹 비디오 페이지에서 자연스럽게 행동...');

    // 1. 비디오 제목 읽기
    await this.simulateReading(page, 'h1.ytd-watch-metadata yt-formatted-string');

    // 2. 비디오 플레이어 영역 관찰
    await this.observeVideoPlayer(page);

    // 3. 설명란으로 스크롤하며 읽기
    await this.exploreDescription(page);

    // 4. 댓글 섹션 훑어보기
    await this.browseComments(page);
  }

  // 텍스트 읽기 시뮬레이션
  async simulateReading(page, selector) {
    try {
      const element = await page.$(selector);
      if (!element) return;

      await this.humanBehavior.hoverElement(page, element);

      const text = await element.textContent();
      if (text) {
        // 글자 수에 비례한 읽기 시간 (평균 읽기 속도: 분당 200단어)
        const readingTime = Math.max(1000, text.length * 60); // 글자당 60ms
        await page.waitForTimeout(readingTime);
      }
    } catch (error) {
      // 무시
    }
  }

  async observeVideoPlayer(page) {
    try {
      const player = await page.$('#movie_player, .video-player');
      if (player) {
        await this.humanBehavior.hoverElement(page, player);

        // 비디오 로딩 대기 (사람이 로딩을 기다리는 시간)
        await page.waitForTimeout(3000 + Math.random() * 2000);
      }
    } catch (error) {
      // 무시
    }
  }

  async exploreDescription(page) {
    // 설명란까지 부드럽게 스크롤
    await this.humanBehavior.smoothScroll(page, 400);
    await page.waitForTimeout(1500 + Math.random() * 1000);

    // 설명 내용 읽기
    await this.simulateReading(page, '#description-text, ytd-expandable-video-description-body-renderer');
  }

  async browseComments(page) {
    // 댓글 섹션까지 스크롤
    await this.humanBehavior.smoothScroll(page, 600);
    await page.waitForTimeout(2000 + Math.random() * 1500);

    // 댓글 몇 개 읽기
    try {
      const comments = await page.$$('ytd-comment-thread-renderer');
      const readCount = Math.min(3, comments.length);

      for (let i = 0; i < readCount; i++) {
        await this.humanBehavior.hoverElement(page, comments[i]);
        await page.waitForTimeout(1000 + Math.random() * 1500);
      }
    } catch (error) {
      // 무시
    }
  }

  // 진짜 사람처럼 비디오 정보 추출
  async extractVideoInfoLikeHuman(page) {
    console.log('📊 사람이 보는 것처럼 비디오 정보 추출...');

    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForLoadState('networkidle');

    // 사람이 정보를 인식하는 시간
    await page.waitForTimeout(2000);

    try {
      const videoInfo = await page.evaluate(() => {
        // 1차: ytInitialPlayerResponse에서 추출 (가장 정확)
        if (window.ytInitialPlayerResponse && window.ytInitialPlayerResponse.videoDetails) {
          const details = window.ytInitialPlayerResponse.videoDetails;
          const streamingData = window.ytInitialPlayerResponse.streamingData;

          // 브라우저 컨텍스트에서 formats 추출
          let formats = [];
          if (streamingData && streamingData.formats) {
            formats = streamingData.formats.map(format => ({
              format_id: format.itag,
              format: format.mimeType?.split('/')[1]?.split(';')[0] || 'mp4',
              quality: format.qualityLabel || 'unknown',
              filesize: format.contentLength || 0
            }));
          }

          return {
            videoId: details.videoId,
            title: details.title,
            duration: parseInt(details.lengthSeconds) || 0,
            thumbnail: details.thumbnail?.thumbnails?.[0]?.url,
            platform: 'youtube',
            description: details.shortDescription || '',
            viewCount: parseInt(details.viewCount) || 0,
            formats: formats,
            extractionMethod: 'ytInitialPlayerResponse'
          };
        }

        // 2차: DOM에서 직접 추출
        const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string') ||
                            document.querySelector('meta[name="title"]');
        const videoIdMatch = window.location.href.match(/[?&]v=([^&]+)/);

        if (titleElement && videoIdMatch) {
          return {
            videoId: videoIdMatch[1],
            title: titleElement.textContent || titleElement.content,
            duration: 0,
            thumbnail: document.querySelector('meta[property="og:image"]')?.content,
            platform: 'youtube',
            description: '',
            viewCount: 0,
            formats: [],
            extractionMethod: 'DOM'
          };
        }

        return null;
      });

      if (!videoInfo) {
        throw new Error('비디오 정보를 찾을 수 없습니다');
      }

      console.log(`✅ 비디오 정보 추출 성공: ${videoInfo.title} (방법: ${videoInfo.extractionMethod})`);
      return videoInfo;

    } catch (error) {
      console.error('비디오 정보 추출 실패:', error.message);
      throw error;
    }
  }

  // 스트리밍 포맷 파싱 (페이지 내에서 실행되는 함수)
  parseStreamingFormats(streamingData) {
    if (!streamingData) return [];

    const formats = [];

    // 기본 포맷
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
          fps: format.fps,
          url: format.url
        });
      });
    }

    // 적응형 포맷
    if (streamingData.adaptiveFormats) {
      streamingData.adaptiveFormats.forEach(format => {
        formats.push({
          formatId: format.itag,
          ext: format.mimeType?.split('/')[1]?.split(';')[0] || 'mp4',
          quality: format.qualityLabel || (format.height ? `${format.height}p` : 'audio'),
          filesize: format.contentLength,
          vcodec: format.mimeType?.includes('video') ? 'h264' : null,
          acodec: format.mimeType?.includes('audio') ? 'aac' : null,
          resolution: format.height ? `${format.width}x${format.height}` : null,
          abr: format.averageBitrate,
          fps: format.fps,
          url: format.url
        });
      });
    }

    return formats;
  }

  // 쿠키 관리
  async loadCookies(context) {
    try {
      const cookiesData = await fs.readFile(this.cookiesPath, 'utf8');
      const cookies = JSON.parse(cookiesData);

      // 유효한 쿠키만 로드 (만료되지 않은 것)
      const validCookies = cookies.filter(cookie => {
        return !cookie.expires || cookie.expires * 1000 > Date.now();
      });

      if (validCookies.length > 0) {
        await context.addCookies(validCookies);
        console.log(`✅ ${validCookies.length}개의 유효한 쿠키 로드됨`);
      }
    } catch (error) {
      console.log('🍪 기존 쿠키 없음, 새로 시작');
    }
  }

  async saveCookies(context) {
    try {
      const cookies = await context.cookies();

      // YouTube 관련 쿠키만 저장
      const youtubeCookies = cookies.filter(cookie =>
        cookie.domain.includes('youtube.com') ||
        cookie.domain.includes('google.com')
      );

      await fs.writeFile(this.cookiesPath, JSON.stringify(youtubeCookies, null, 2));
      console.log(`💾 ${youtubeCookies.length}개의 쿠키 저장됨`);
    } catch (error) {
      console.error('쿠키 저장 실패:', error.message);
    }
  }

  // 세션 리셋
  resetSession() {
    this.humanBehavior.resetSession();
    this.sessionId = Date.now().toString();
    console.log('🔄 스텔스 브라우저 세션 리셋 완료');
  }
}

module.exports = StealthBrowser;