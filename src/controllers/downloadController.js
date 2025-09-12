const SmartDownloader = require('../services/smartDownloader');
const downloadManager = require('../services/downloadManager');
const urlValidator = require('../services/urlValidator');

class DownloadController {
  constructor() {
    this.smartDownloader = new SmartDownloader();
  }

  /**
   * 비디오 정보 추출 (스마트 다운로더 사용)
   */
  async getVideoInfo(req, res) {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ 
          success: false,
          error: 'URL is required' 
        });
      }

      if (!urlValidator.isValidUrl(url)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid URL provided' 
        });
      }

      console.log('=== 비디오 정보 추출 시작 ===');
      console.log('요청 URL:', url);
      
      const videoInfo = await this.smartDownloader.extractVideoInfo(url);
      
      res.json({
        success: true,
        data: videoInfo,
        method: 'smart-downloader',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('=== 비디오 정보 추출 실패 ===');
      console.error('에러:', error.message);
      
      res.status(500).json({ 
        success: false,
        error: error.message,
        suggestion: '잠시 후 다시 시도하거나 다른 비디오 URL을 사용해보세요.'
      });
    }
  }

  /**
   * 지원하는 포맷 목록 반환
   */
  getSupportedFormats(req, res) {
    try {
      const formats = downloadManager.getSupportedFormats();
      res.json(formats);
    } catch (error) {
      console.error('Error getting supported formats:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 다운로드 시작
   */
  async startDownload(req, res) {
    try {
      const { url, format, quality, audioOnly } = req.body;

      if (!url || !format || !quality) {
        return res.status(400).json({ 
          error: 'URL, format, and quality are required' 
        });
      }

      const downloadOptions = { url, format, quality, audioOnly };
      const validation = downloadManager.validateDownloadOptions(downloadOptions);

      if (!validation.isValid) {
        return res.status(400).json({ 
          error: validation.errors.join(', ') 
        });
      }

      const result = await downloadManager.downloadVideo(downloadOptions);
      
      res.json({
        success: true,
        downloadId: result.downloadId || Date.now().toString(),
        filename: result.filename,
        message: 'Download started successfully'
      });
    } catch (error) {
      console.error('Error starting download:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 스트림 다운로드
   */
  async streamDownload(req, res) {
    try {
      const { downloadId } = req.params;
      const { url, format, quality, audioOnly } = req.query;

      if (!url || !format || !quality) {
        return res.status(400).json({ 
          error: 'Missing required parameters: url, format, quality' 
        });
      }

      const downloadOptions = { 
        url, 
        format, 
        quality, 
        audioOnly: audioOnly === 'true' 
      };

      const stream = await downloadManager.getDownloadStream(downloadOptions);
      
      // 적절한 헤더 설정
      const contentType = this.getContentType(format);
      const filename = stream.filename || `download_${Date.now()}.${format}`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      if (stream.contentLength) {
        res.setHeader('Content-Length', stream.contentLength);
      }

      // 스트림을 응답으로 파이프
      stream.pipe(res);
      
      stream.on('error', (error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream error occurred' });
        }
      });

    } catch (error) {
      console.error('Error streaming download:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }
  }

  /**
   * 다운로드 진행상황 조회
   */
  async getDownloadProgress(req, res) {
    try {
      const { downloadId } = req.params;

      if (!downloadId) {
        return res.status(400).json({ error: 'Download ID is required' });
      }

      // Mock implementation - 실제로는 다운로드 상태를 추적해야 함
      const progress = {
        downloadId: downloadId,
        status: 'completed',
        progress: 100,
        downloadedBytes: 25000000,
        totalBytes: 25000000,
        speed: 0,
        eta: 0
      };

      res.json(progress);
    } catch (error) {
      console.error('Error getting download progress:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 임시 파일 정리
   */
  async cleanupTempFiles(req, res) {
    try {
      const result = await downloadManager.cleanupTempFiles();
      res.json(result);
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 헬스 체크 (SmartDownloader 상태 포함)
   */
  async healthCheck(req, res) {
    try {
      const healthInfo = await this.smartDownloader.healthCheck();
      
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          ...healthInfo,
          downloadManager: true
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
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

module.exports = new DownloadController();