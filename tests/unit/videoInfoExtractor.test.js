// Mock the videoInfoExtractor for testing
jest.mock('../../src/services/videoInfoExtractor', () => {
  return require('./__mocks__/videoInfoExtractor');
});

const videoInfoExtractor = require('../../src/services/videoInfoExtractor');

describe('Video Info Extractor Service', () => {
  describe('extractVideoInfo', () => {
    test('유효한 YouTube URL에서 비디오 정보를 추출해야 함', async () => {
      const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      
      const result = await videoInfoExtractor.extractVideoInfo(testUrl);
      
      expect(result).toBeDefined();
      expect(result.title).toBeDefined();
      expect(typeof result.title).toBe('string');
      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe('number');
      expect(result.thumbnail).toBeDefined();
      expect(typeof result.thumbnail).toBe('string');
      expect(result.videoId).toBe('dQw4w9WgXcQ');
      expect(result.platform).toBe('youtube');
    });

    test('사용 가능한 포맷 목록을 반환해야 함', async () => {
      const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      
      const result = await videoInfoExtractor.extractVideoInfo(testUrl);
      
      expect(result.formats).toBeDefined();
      expect(Array.isArray(result.formats)).toBe(true);
      expect(result.formats.length).toBeGreaterThan(0);
      
      // 각 포맷은 필요한 속성을 가져야 함
      const format = result.formats[0];
      expect(format).toHaveProperty('formatId');
      expect(format).toHaveProperty('ext');
      expect(format).toHaveProperty('quality');
      expect(format).toHaveProperty('filesize');
    });

    test('유효하지 않은 URL에 대해 에러를 던져야 함', async () => {
      const invalidUrls = [
        'invalid-url',
        'https://example.com',
        null,
        undefined
      ];

      for (const url of invalidUrls) {
        await expect(videoInfoExtractor.extractVideoInfo(url))
          .rejects.toThrow('유효하지 않은 URL입니다');
      }
    });

    test('존재하지 않는 비디오에 대해 에러를 던져야 함', async () => {
      const nonExistentUrl = 'https://www.youtube.com/watch?v=nonexistentvideo';
      
      await expect(videoInfoExtractor.extractVideoInfo(nonExistentUrl))
        .rejects.toThrow();
    });
  });

  describe('getAvailableFormats', () => {
    test('비디오 포맷을 화질별로 분류해야 함', async () => {
      const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      
      const formats = await videoInfoExtractor.getAvailableFormats(testUrl);
      
      expect(formats).toBeDefined();
      expect(formats.video).toBeDefined();
      expect(formats.audio).toBeDefined();
      expect(Array.isArray(formats.video)).toBe(true);
      expect(Array.isArray(formats.audio)).toBe(true);
    });

    test('각 포맷에 필수 정보가 포함되어야 함', async () => {
      const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      
      const formats = await videoInfoExtractor.getAvailableFormats(testUrl);
      
      if (formats.video.length > 0) {
        const videoFormat = formats.video[0];
        expect(videoFormat).toHaveProperty('formatId');
        expect(videoFormat).toHaveProperty('quality');
        expect(videoFormat).toHaveProperty('ext');
        expect(videoFormat).toHaveProperty('resolution');
      }

      if (formats.audio.length > 0) {
        const audioFormat = formats.audio[0];
        expect(audioFormat).toHaveProperty('formatId');
        expect(audioFormat).toHaveProperty('quality');
        expect(audioFormat).toHaveProperty('ext');
        expect(audioFormat).toHaveProperty('abr');
      }
    });
  });

  describe('validateVideoAccess', () => {
    test('접근 가능한 비디오에 대해 true를 반환해야 함', async () => {
      const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      
      const result = await videoInfoExtractor.validateVideoAccess(testUrl);
      
      expect(result).toBe(true);
    });

    test('비공개 또는 제한된 비디오에 대해 false를 반환해야 함', async () => {
      const restrictedUrl = 'https://www.youtube.com/watch?v=restrictedvideo';
      
      const result = await videoInfoExtractor.validateVideoAccess(restrictedUrl);
      
      expect(result).toBe(false);
    });
  });
});