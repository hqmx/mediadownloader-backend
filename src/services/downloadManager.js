const { spawn } = require('child_process');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const urlValidator = require('./urlValidator');

class DownloadManager {
  constructor() {
    this.ytdlpPath = 'yt-dlp';
    this.tempDir = '/tmp/mediadownloader';
    this.activeDownloads = new Map();
    
    // 지원하는 포맷 정의
    this.supportedFormats = {
      video: [
        {
          format: 'mp4',
          description: 'MP4 Video',
          qualities: ['360p', '480p', '720p', '1080p', '1440p', '2160p']
        },
        {
          format: 'webm',
          description: 'WebM Video',
          qualities: ['360p', '480p', '720p', '1080p', '1440p', '2160p']
        },
        {
          format: 'mkv',
          description: 'MKV Video',
          qualities: ['720p', '1080p', '1440p', '2160p']
        }
      ],
      audio: [
        {
          format: 'mp3',
          description: 'MP3 Audio',
          qualities: ['128kbps', '192kbps', '320kbps']
        },
        {
          format: 'm4a',
          description: 'M4A Audio',
          qualities: ['128kbps', '192kbps', '256kbps']
        },
        {
          format: 'opus',
          description: 'Opus Audio',
          qualities: ['128kbps', '192kbps', '256kbps']
        }
      ]
    };

    // 임시 디렉토리 생성
    this.ensureTempDir();
  }

  /**
   * 임시 디렉토리가 존재하는지 확인하고 생성
   */
  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 비디오/오디오 다운로드
   * @param {Object} options - 다운로드 옵션
   * @returns {Promise<Object>}
   */
  async downloadVideo(options) {
    const validation = this.validateDownloadOptions(options);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    const downloadId = this.generateDownloadId();
    const filename = this.generateFilename(options);
    const filePath = path.join(this.tempDir, filename);

    try {
      const args = this.buildYtDlpArgs(options, filePath);
      
      return new Promise((resolve, reject) => {
        const process = spawn(this.ytdlpPath, args);
        let stderr = '';

        this.activeDownloads.set(downloadId, {
          process: process,
          options: options,
          startTime: Date.now()
        });

        process.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        process.on('close', (code) => {
          this.activeDownloads.delete(downloadId);
          
          if (code === 0) {
            const stats = fs.statSync(filePath);
            resolve({
              success: true,
              downloadId: downloadId,
              filePath: filePath,
              filename: filename,
              fileSize: stats.size,
              format: options.format,
              quality: options.quality
            });
          } else {
            reject(new Error(`다운로드 실패: ${stderr}`));
          }
        });

        process.on('error', (error) => {
          this.activeDownloads.delete(downloadId);
          reject(new Error(`yt-dlp 실행 오류: ${error.message}`));
        });
      });
    } catch (error) {
      throw new Error(`다운로드 준비 실패: ${error.message}`);
    }
  }

  /**
   * 다운로드 스트림을 반환
   * @param {Object} options 
   * @returns {Promise<Stream>}
   */
  async getDownloadStream(options) {
    const validation = this.validateDownloadOptions(options);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    const args = this.buildYtDlpArgs(options, '-'); // stdout으로 출력
    
    return new Promise((resolve, reject) => {
      const process = spawn(this.ytdlpPath, args);
      const filename = this.generateFilename(options);

      // 스트림에 메타데이터 추가
      process.stdout.filename = filename;
      process.stdout.contentType = this.getContentType(options.format);
      process.stdout.contentLength = 0; // 실제로는 미리 알 수 없음

      let stderr = '';
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('error', (error) => {
        reject(new Error(`스트림 생성 실패: ${error.message}`));
      });

      // 프로세스가 시작되면 stdout 스트림을 반환
      process.on('spawn', () => {
        resolve(process.stdout);
      });
    });
  }

  /**
   * 지원하는 포맷 목록 반환
   * @returns {Object}
   */
  getSupportedFormats() {
    return this.supportedFormats;
  }

  /**
   * 다운로드 옵션 유효성 검사
   * @param {Object} options 
   * @returns {Object}
   */
  validateDownloadOptions(options) {
    const errors = [];

    if (!options.url) {
      errors.push('URL은 필수입니다');
    } else if (!urlValidator.isValidUrl(options.url)) {
      errors.push('유효하지 않은 URL입니다');
    }

    if (!options.format) {
      errors.push('포맷은 필수입니다');
    } else {
      const allFormats = [
        ...this.supportedFormats.video.map(v => v.format),
        ...this.supportedFormats.audio.map(a => a.format)
      ];
      if (!allFormats.includes(options.format)) {
        errors.push('지원하지 않는 포맷입니다');
      }
    }

    if (!options.quality) {
      errors.push('화질/품질은 필수입니다');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 임시 파일들 정리
   * @returns {Promise<Object>}
   */
  async cleanupTempFiles() {
    try {
      const files = fs.readdirSync(this.tempDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        
        // 1시간 이상 된 파일들 삭제
        if (Date.now() - stats.mtime.getTime() > 3600000) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      return {
        success: true,
        deletedCount: deletedCount,
        message: `${deletedCount}개의 임시 파일이 삭제되었습니다`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 다운로드 ID 생성
   * @returns {string}
   */
  generateDownloadId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 파일명 생성
   * @param {Object} options 
   * @returns {string}
   */
  generateFilename(options) {
    const timestamp = Date.now();
    const quality = options.quality.replace(/[^a-zA-Z0-9]/g, '');
    return `download_${timestamp}_${quality}.${options.format}`;
  }

  /**
   * yt-dlp 인수 구성
   * @param {Object} options 
   * @param {string} outputPath 
   * @returns {Array}
   */
  buildYtDlpArgs(options, outputPath) {
    const args = [];

    if (options.audioOnly) {
      args.push('--extract-audio', '--audio-format', options.format);
      if (options.quality) {
        args.push('--audio-quality', options.quality.replace(/[^0-9]/g, ''));
      }
    } else {
      args.push('--format', `best[height<=${options.quality.replace(/[^0-9]/g, '')}][ext=${options.format}]`);
    }

    args.push('--output', outputPath);
    args.push('--no-playlist');
    args.push(options.url);

    return args;
  }

  /**
   * 콘텐츠 타입 반환
   * @param {string} format 
   * @returns {string}
   */
  getContentType(format) {
    const contentTypes = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mkv': 'video/x-matroska',
      'mp3': 'audio/mpeg',
      'm4a': 'audio/mp4',
      'opus': 'audio/opus'
    };

    return contentTypes[format] || 'application/octet-stream';
  }
}

module.exports = new DownloadManager();