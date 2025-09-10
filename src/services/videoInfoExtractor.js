const { spawn } = require('child_process');
const { promisify } = require('util');
const urlValidator = require('./urlValidator');

class VideoInfoExtractor {
  constructor() {
    this.ytdlpPath = 'yt-dlp'; // yt-dlp 바이너리 경로
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
   * URL에서 비디오 정보를 추출
   * @param {string} url 
   * @returns {Promise<Object>}
   */
  async extractVideoInfo(url) {
    if (!urlValidator.isValidUrl(url)) {
      throw new Error('유효하지 않은 URL입니다');
    }

    try {
      const args = [
        '--dump-json',
        '--no-playlist',
        url
      ];

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
      const args = [
        '--list-formats',
        '--no-playlist',
        url
      ];

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
}

module.exports = new VideoInfoExtractor();