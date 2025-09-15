const VideoInfoExtractor = require('./videoInfoExtractor');
const StealthBrowser = require('./stealthBrowser');
const MasterStealthController = require('./masterStealthController');

class SmartDownloader {
  constructor() {
    this.videoExtractor = new VideoInfoExtractor();
    this.browserExtractor = new StealthBrowser();
    this.masterStealth = new MasterStealthController();
    this.attemptCount = 0;
    
    this.methods = [
      { 
        name: 'yt-dlp-stealth', 
        handler: this.tryYtDlpStealth.bind(this),
        description: 'yt-dlp with SmartProxy and stealth headers'
      },
      { 
        name: 'browser-stealth', 
        handler: this.tryBrowserStealth.bind(this),
        description: 'Playwright browser with SmartProxy and human simulation'
      }
    ];
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

  async tryYtDlpStealth(url) {
    console.log('🔧 yt-dlp + SmartProxy + 스텔스 헤더 사용');
    
    // VideoInfoExtractor가 이미 스텔스 기능 내장됨
    const result = await this.videoExtractor.extractVideoInfo(url);
    
    if (!result || !result.videoId) {
      throw new Error('yt-dlp에서 유효한 비디오 정보를 가져오지 못했습니다');
    }
    
    return result;
  }

  async tryBrowserStealth(url) {
    console.log('🌐 Playwright + Plan B 완전 스텔스 시스템 사용');
    
    // 시도 횟수에 따른 스텔스 레벨 조정
    if (this.attemptCount > 1) {
      this.masterStealth.setStealthLevel('MAXIMUM');
    }
    if (this.attemptCount > 2) {
      this.masterStealth.setStealthLevel('EXTREME');
    }
    
    const result = await this.browserExtractor.extractVideoInfo(url);
    
    if (!result || !result.videoId) {
      throw new Error('브라우저에서 유효한 비디오 정보를 가져오지 못했습니다');
    }
    
    // 스텔스 성능 통계 로깅
    const stealthStats = this.masterStealth.getSessionStats();
    console.log(`📊 스텔스 성공률: ${stealthStats.successRate.toFixed(1)}%, 탐지 이벤트: ${stealthStats.detectionEvents.length}개`);
    
    return {
      ...result,
      stealthStats
    };
  }

  async randomDelay() {
    const delay = 3000 + Math.random() * 5000; // 3-8초 랜덤
    console.log(`⏱️  ${Math.floor(delay)}ms 대기 중...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  logSuccess(method, duration) {
    const logData = {
      method,
      duration,
      timestamp: new Date().toISOString(),
      success: true,
      stealthStats: method === 'browser-stealth' ? this.masterStealth.getSessionStats() : null
    };
    
    // 성공 로그 (나중에 파일로 저장 가능)
    console.log('📊 성공 통계:', logData);
    
    // 성공 시 적응형 스텔스 최적화
    if (method === 'browser-stealth') {
      this.masterStealth.adaptiveStealth();
    }
  }

  // 통계 및 모니터링용 메서드들
  getMethodStats() {
    // 향후 구현: 각 방법별 성공률 통계
    return {
      'yt-dlp-stealth': { attempts: 0, successes: 0, successRate: 0 },
      'browser-stealth': { attempts: 0, successes: 0, successRate: 0 }
    };
  }

  async healthCheck() {
    // SmartProxy 연결 상태 확인
    const proxyManager = this.videoExtractor.proxyManager;
    
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