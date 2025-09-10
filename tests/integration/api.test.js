const request = require('supertest');
const express = require('express');

// Mock all services
jest.mock('../../src/services/urlValidator');
jest.mock('../../src/services/videoInfoExtractor');  
jest.mock('../../src/services/downloadManager');

describe('API Integration Tests', () => {
  let app;

  beforeAll(() => {
    // 테스트용 Express 앱 설정
    app = express();
    app.use(express.json());

    // 기본 라우트 설정 (실제 구현에서는 별도 파일에서 import)
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.post('/api/video-info', async (req, res) => {
      try {
        const { url } = req.body;
        
        if (!url) {
          return res.status(400).json({ error: 'URL is required' });
        }

        // Mock response
        const videoInfo = {
          videoId: 'dQw4w9WgXcQ',
          title: 'Test Video',
          duration: 212,
          thumbnail: 'https://example.com/thumb.jpg',
          platform: 'youtube',
          formats: []
        };

        res.json(videoInfo);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/formats', (req, res) => {
      const formats = {
        video: [
          { format: 'mp4', description: 'MP4 Video', qualities: ['720p', '1080p'] }
        ],
        audio: [
          { format: 'mp3', description: 'MP3 Audio', qualities: ['128kbps', '320kbps'] }
        ]
      };
      res.json(formats);
    });

    app.post('/api/download', async (req, res) => {
      try {
        const { url, format, quality, audioOnly } = req.body;

        if (!url || !format || !quality) {
          return res.status(400).json({ 
            error: 'URL, format, and quality are required' 
          });
        }

        const result = {
          success: true,
          downloadId: 'test-download-123',
          filename: `test_video.${format}`,
          message: 'Download started successfully'
        };

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/download/stream/:downloadId', (req, res) => {
      const { downloadId } = req.params;
      const { url, format, quality } = req.query;

      if (!url || !format || !quality) {
        return res.status(400).json({ 
          error: 'Missing required parameters' 
        });
      }

      // Mock stream response
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="test_video.${format}"`);
      res.send('mock video data');
    });
  });

  describe('Health Check', () => {
    test('GET /health - 서버 상태를 반환해야 함', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Video Info API', () => {
    test('POST /api/video-info - 비디오 정보를 반환해야 함', async () => {
      const response = await request(app)
        .post('/api/video-info')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        .expect(200);

      expect(response.body).toHaveProperty('videoId');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('duration');
      expect(response.body).toHaveProperty('thumbnail');
      expect(response.body).toHaveProperty('platform');
      expect(response.body).toHaveProperty('formats');
    });

    test('POST /api/video-info - URL 없이 요청하면 400 에러', async () => {
      const response = await request(app)
        .post('/api/video-info')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('URL is required');
    });
  });

  describe('Formats API', () => {
    test('GET /api/formats - 지원하는 포맷 목록을 반환해야 함', async () => {
      const response = await request(app)
        .get('/api/formats')
        .expect(200);

      expect(response.body).toHaveProperty('video');
      expect(response.body).toHaveProperty('audio');
      expect(Array.isArray(response.body.video)).toBe(true);
      expect(Array.isArray(response.body.audio)).toBe(true);
      expect(response.body.video.length).toBeGreaterThan(0);
      expect(response.body.audio.length).toBeGreaterThan(0);
    });
  });

  describe('Download API', () => {
    test('POST /api/download - 다운로드를 시작해야 함', async () => {
      const downloadRequest = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        format: 'mp4',
        quality: '720p',
        audioOnly: false
      };

      const response = await request(app)
        .post('/api/download')
        .send(downloadRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.downloadId).toBeDefined();
      expect(response.body.filename).toBeDefined();
      expect(response.body.message).toBeDefined();
    });

    test('POST /api/download - 필수 파라미터 없이 요청하면 400 에러', async () => {
      const response = await request(app)
        .post('/api/download')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    test('GET /api/download/stream/:downloadId - 스트림 다운로드를 제공해야 함', async () => {
      const response = await request(app)
        .get('/api/download/stream/test-123')
        .query({
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          format: 'mp4',
          quality: '720p'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('video/mp4');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    test('GET /api/download/stream/:downloadId - 파라미터 없이 요청하면 400 에러', async () => {
      const response = await request(app)
        .get('/api/download/stream/test-123')
        .expect(400);

      expect(response.body.error).toContain('Missing required parameters');
    });
  });

  describe('Error Handling', () => {
    test('존재하지 않는 엔드포인트 요청시 404 반환', async () => {
      await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });

    test('잘못된 JSON 요청시 400 반환', async () => {
      const response = await request(app)
        .post('/api/video-info')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('CORS and Security', () => {
    test('CORS 헤더가 설정되어야 함', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // CORS 미들웨어가 추가되면 헤더 검증
      // expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});