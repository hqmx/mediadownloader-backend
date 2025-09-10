const { Readable } = require('stream');
const path = require('path');

class DownloadManager {
  constructor() {
    this.supportedFormats = {
      video: [
        {
          format: 'mp4',
          description: 'MP4 Video',
          qualities: ['360p', '480p', '720p', '1080p']
        },
        {
          format: 'webm',
          description: 'WebM Video', 
          qualities: ['360p', '480p', '720p', '1080p']
        },
        {
          format: 'avi',
          description: 'AVI Video',
          qualities: ['360p', '480p', '720p']
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
          format: 'wav',
          description: 'WAV Audio',
          qualities: ['44.1kHz', '48kHz']
        }
      ]
    };
  }

  async downloadVideo(options) {
    const validation = this.validateDownloadOptions(options);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    // Mock download process
    const filename = `mock_video_${Date.now()}.${options.format}`;
    const filePath = path.join('/tmp', filename);
    const fileSize = options.audioOnly ? 5000000 : 25000000; // 5MB for audio, 25MB for video

    return {
      success: true,
      filePath: filePath,
      filename: filename,
      fileSize: fileSize,
      format: options.format,
      quality: options.quality
    };
  }

  async getDownloadStream(options) {
    const validation = this.validateDownloadOptions(options);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    // Create a mock readable stream
    const mockData = Buffer.from('mock video/audio data');
    const stream = new Readable({
      read() {
        this.push(mockData);
        this.push(null); // End of stream
      }
    });

    // Add metadata to stream
    stream.filename = `mock_download_${Date.now()}.${options.format}`;
    stream.contentType = options.audioOnly ? 'audio/mpeg' : 'video/mp4';
    stream.contentLength = options.audioOnly ? 5000000 : 25000000;

    return stream;
  }

  getSupportedFormats() {
    return this.supportedFormats;
  }

  validateDownloadOptions(options) {
    const errors = [];

    // Check required fields
    if (!options.url) {
      errors.push('URL은 필수입니다');
    }

    if (!options.format) {
      errors.push('포맷은 필수입니다');
    }

    if (!options.quality) {
      errors.push('화질/품질은 필수입니다');
    }

    // Validate URL
    if (options.url && (!options.url.includes('youtube.com') && !options.url.includes('youtu.be'))) {
      errors.push('유효하지 않은 URL입니다');
    }

    // Validate format
    if (options.format) {
      const allFormats = [
        ...this.supportedFormats.video.map(v => v.format),
        ...this.supportedFormats.audio.map(a => a.format)
      ];

      if (!allFormats.includes(options.format)) {
        errors.push('지원하지 않는 포맷입니다');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  async cleanupTempFiles() {
    // Mock cleanup process
    const deletedCount = Math.floor(Math.random() * 10);

    return {
      success: true,
      deletedCount: deletedCount,
      message: `${deletedCount}개의 임시 파일이 삭제되었습니다`
    };
  }

  async getDownloadProgress(downloadId) {
    // Mock download progress
    return {
      downloadId: downloadId,
      progress: Math.floor(Math.random() * 100),
      status: 'downloading',
      downloadedBytes: Math.floor(Math.random() * 10000000),
      totalBytes: 25000000,
      speed: Math.floor(Math.random() * 1000000) + 500000, // 500KB/s ~ 1.5MB/s
      eta: Math.floor(Math.random() * 60) + 10 // 10-70 seconds
    };
  }
}

module.exports = new DownloadManager();