const { spawn } = require('child_process');
const { promisify } = require('util');
const urlValidator = require('./urlValidator');
const SmartProxyManager = require('./smartProxyManager');

class VideoInfoExtractor {
  constructor() {
    this.ytdlpPath = process.env.YTDLP_PATH || 'yt-dlp';
    this.proxyManager = new SmartProxyManager();
  }

  /**
   * yt-dlp 명령어를 실행하고 결과를 반환
   * @param {string[]} args 
   * @returns {Promise<string>}
   */
  async executeYtDlp(args) {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      
      const process = spawn(this.ytdlpPath, args);
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`yt-dlp 실행 실패: ${stderr}`));
        }
      });
      
      process.on('error', (error) => {
        reject(new Error(`yt-dlp 실행 오류: ${error.message}`));
      });
    });
  }

  /**
   * URL에서 비디오 정보를 추출 (스텔스 모드 포함)
   * @param {string} url 
   * @param {number} retryCount 
   * @returns {Promise<Object>}
   */
  async extractVideoInfo(url, retryCount = 0) {
    if (!urlValidator.isValidUrl(url)) {
      throw new Error('유효하지 않은 URL입니다');
    }

    try {
      const args = this.buildStealthArgs(url);
      console.log(`🔧 yt-dlp 인수: ${args.join(' ')}`);

      const jsonOutput = await this.executeYtDlp(args);
      const videoInfo = JSON.parse(jsonOutput);

      return {
        videoId: videoInfo.id,
        title: videoInfo.title,
        duration: videoInfo.duration,
        thumbnail: videoInfo.thumbnail,
        platform: urlValidator.getSupportedPlatform(url),
        formats: this.parseFormats(videoInfo.formats || [])
      };
    } catch (error) {
      console.error(`비디오 추출 실패 (시도 ${retryCount + 1}):`, error.message);

      if (retryCount < 3) {
        if (error.message.includes('Tunnel connection failed') || error.message.includes('ProxyError')) {
          console.log('🔄 프록시 터널링 오류 감지, 엔드포인트 전환 시도...');

          // 다른 엔드포인트로 전환
          const newProxy = this.proxyManager.switchEndpoint();
          if (newProxy) {
            console.log('🚀 새로운 엔드포인트로 재시도:', newProxy);
            await this.humanDelay();
            return this.extractVideoInfo(url, retryCount + 1);
          } else {
            console.log('🔄 모든 엔드포인트 실패, 프록시 비활성화 후 재시도...');

            // 모든 엔드포인트 실패 시 프록시 비활성화
            const originalEnabled = this.proxyManager.enabled;
            this.proxyManager.enabled = false;

            try {
              return await this.extractVideoInfo(url, retryCount + 1);
            } finally {
              // 프록시 설정 복원
              this.proxyManager.enabled = originalEnabled;
            }
          }
        } else {
          console.log(`🔄 비디오 추출 시도 ${retryCount + 1} 실패, 프록시 로테이션 중...`);
          this.proxyManager.rotateSession();
          await this.humanDelay();
          return this.extractVideoInfo(url, retryCount + 1);
        }
      }

      throw new Error(`비디오 정보 추출 실패: ${error.message}`);
    }
  }

  /**
   * 사용 가능한 포맷 목록을 반환
   * @param {string} url 
   * @returns {Promise<Object>}
   */
  async getAvailableFormats(url) {
    if (!urlValidator.isValidUrl(url)) {
      throw new Error('유효하지 않은 URL입니다');
    }

    try {
      const videoInfo = await this.extractVideoInfo(url);
      const formats = videoInfo.formats;

      return {
        video: formats.filter(f => f.vcodec && f.vcodec !== 'none'),
        audio: formats.filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'))
      };
    } catch (error) {
      throw new Error(`포맷 정보 추출 실패: ${error.message}`);
    }
  }

  /**
   * 비디오 접근 가능 여부를 검증
   * @param {string} url 
   * @returns {Promise<boolean>}
   */
  async validateVideoAccess(url) {
    try {
      const args = [
        '--simulate',
        '--no-playlist',
        url
      ];

      await this.executeYtDlp(args);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 포맷 정보를 파싱
   * @param {Array} formats 
   * @returns {Array}
   */
  parseFormats(formats) {
    return formats.map(format => ({
      formatId: format.format_id,
      ext: format.ext,
      quality: format.quality || format.format_note || 'unknown',
      filesize: format.filesize,
      vcodec: format.vcodec,
      acodec: format.acodec,
      resolution: format.resolution || (format.width && format.height ? `${format.width}x${format.height}` : null),
      abr: format.abr, // audio bitrate
      vbr: format.vbr, // video bitrate
      fps: format.fps
    }));
  }

  /**
   * 스텔스 모드 yt-dlp 인수 구성
   * @param {string} url 
   * @returns {Array}
   */
  buildStealthArgs(url) {
    const args = [];

    // SmartProxy 설정 + HTTPS 터널링 강제
    const proxy = this.proxyManager.getProxy();
    if (proxy) {
      args.push('--proxy', proxy);
    }

    // 완벽한 스텔스 헤더 세트
    args.push(
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
      '--add-header', 'Accept-Encoding:gzip, deflate, br',
      '--add-header', 'DNT:1',
      '--add-header', 'Connection:keep-alive',
      '--add-header', 'Upgrade-Insecure-Requests:1',
      '--add-header', 'Sec-Fetch-Dest:document',
      '--add-header', 'Sec-Fetch-Mode:navigate',
      '--add-header', 'Sec-Fetch-Site:none',
      '--add-header', 'Sec-Fetch-User:?1',
      '--add-header', 'Cache-Control:max-age=0'
    );

    // 인간적인 행동 패턴
    const randomRate = 100 + Math.random() * 100; // 100-200K 랜덤
    const randomSleep = 2 + Math.random() * 3;    // 2-5초 랜덤

    args.push(
      '--limit-rate', `${Math.floor(randomRate)}K`,
      '--sleep-interval', `${Math.floor(randomSleep)}`,
      '--max-sleep-interval', '10'
    );

    // SSL/TLS 최적화 + YouTube 우회 옵션
    args.push(
      '--no-check-certificate',
      '--prefer-insecure',
      '--no-call-home',
      '--socket-timeout', '30',
      '--retries', '3',
      '--fragment-retries', '3',
      '--quiet',
      '--no-warnings'
    );

    // 출력 옵션
    args.push(
      '--dump-json',
      '--no-playlist',
      url
    );

    return args;
  }

  /**
   * 인간적인 지연 시간
   * @returns {Promise}
   */
  async humanDelay() {
    const delay = 2000 + Math.random() * 4000; // 2-6초 랜덤
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

module.exports = VideoInfoExtractor;