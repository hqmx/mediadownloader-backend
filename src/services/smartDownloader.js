const StealthBrowser = require('./stealthBrowser');

class SmartDownloader {
  constructor() {
    this.stealthBrowser = new StealthBrowser();
    this.attemptCount = 0;

    // 단순화: 성공하는 방법만 사용
    this.methods = [
      {
        name: 'browser-stealth',
        handler: this.tryBrowserStealth.bind(this),
        description: 'Playwright browser with cookie-based authentication'
      }
    ];

    console.log('🎯 SmartDownloader 단순화 완료 - Playwright + 쿠키 인증만 사용');
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
          this.masterStealth.resetSession();
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


  async tryBrowserStealth(url) {
    console.log('🌐 Playwright + 쿠키 기반 인증 사용');

    const result = await this.stealthBrowser.extractVideoInfo(url);

    if (!result || !result.videoId) {
      throw new Error('브라우저에서 유효한 비디오 정보를 가져오지 못했습니다');
    }

    console.log(`✅ 비디오 정보 추출 성공: ${result.title}`);
    return result;
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
        enabled: proxyManager.isEnabled(),
        sessionInfo: proxyManager.getSessionInfo()
      },
      services: {
        ytdlp: true,
        playwright: true
      }
    };
  }
}

module.exports = SmartDownloader;