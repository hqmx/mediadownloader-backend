const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 간단한 쿠키 기반 YouTube 정보 추출
 * 브라우저 타임아웃 문제를 피하기 위한 백업 방법
 */
class QuickCookieExtractor {
  constructor() {
    this.cookiePath = '/tmp/quick-youtube-cookies.txt';
    this.initializeCookies();
  }

  // 정적 YouTube 쿠키 초기화
  initializeCookies() {
    const cookieContent = `# Netscape HTTP Cookie File
.youtube.com	TRUE	/	FALSE	1735689600	CONSENT	YES+cb.20210328-17-p0.en+FX+000
.youtube.com	TRUE	/	FALSE	1735689600	VISITOR_INFO1_LIVE	Uakgb_J5B9g
.youtube.com	TRUE	/	FALSE	1735689600	PREF	tz=Asia.Seoul
`;

    try {
      fs.writeFileSync(this.cookiePath, cookieContent);
      console.log(`🍪 QuickCookieExtractor 쿠키 파일 생성: ${this.cookiePath}`);
    } catch (error) {
      console.error('쿠키 파일 생성 실패:', error.message);
    }
  }

  // 비디오 정보 추출
  async extractVideoInfo(url) {
    console.log('🚀 QuickCookieExtractor 실행 중...');

    const args = [
      '--cookies', this.cookiePath,
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
      '--add-header', 'DNT:1',
      '--socket-timeout', '30',
      '--retries', '2',
      '--quiet',
      '--no-warnings',
      '--dump-json',
      url
    ];

    return new Promise((resolve, reject) => {
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
              method: 'quick-cookie'
            };

            console.log(`✅ QuickCookieExtractor 성공: ${result.title}`);
            resolve(result);
          } catch (parseError) {
            reject(new Error(`QuickCookieExtractor JSON 파싱 실패: ${parseError.message}`));
          }
        } else {
          console.error('QuickCookieExtractor stderr:', stderr);
          reject(new Error(`QuickCookieExtractor 실패 (코드 ${code}): ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`QuickCookieExtractor 프로세스 오류: ${error.message}`));
      });
    });
  }

  // 다운로드
  async downloadVideo(url, options) {
    console.log('🚀 QuickCookieExtractor 다운로드 시작...');

    const downloadId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const filename = `download_${downloadId}.${options.format}`;
    const filePath = path.join('/tmp/mediadownloader', filename);

    // 임시 디렉토리 생성
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const args = [
      '--cookies', this.cookiePath,
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
      '--add-header', 'DNT:1',
      '--socket-timeout', '30',
      '--retries', '2',
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
      const process = spawn('yt-dlp', args);
      let stderr = '';

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0 && fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          console.log(`✅ QuickCookieExtractor 다운로드 성공: ${filename}`);
          resolve({
            success: true,
            downloadId: downloadId,
            filename: filename,
            filePath: filePath,
            fileSize: stats.size,
            method: 'quick-cookie'
          });
        } else {
          console.error('QuickCookieExtractor 다운로드 stderr:', stderr);
          reject(new Error(`QuickCookieExtractor 다운로드 실패 (코드 ${code}): ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`QuickCookieExtractor 다운로드 프로세스 오류: ${error.message}`));
      });
    });
  }
}

module.exports = new QuickCookieExtractor();