const urlValidator = require('../../src/services/urlValidator');

describe('URL Validator Service', () => {
  describe('isValidUrl', () => {
    test('유효한 YouTube URL을 검증해야 함', () => {
      const validUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ'
      ];

      validUrls.forEach(url => {
        expect(urlValidator.isValidUrl(url)).toBe(true);
      });
    });

    test('유효하지 않은 URL을 거부해야 함', () => {
      const invalidUrls = [
        'not-a-url',
        'https://example.com',
        'https://vimeo.com/123456',
        '',
        null,
        undefined
      ];

      invalidUrls.forEach(url => {
        expect(urlValidator.isValidUrl(url)).toBe(false);
      });
    });

    test('지원하지 않는 플랫폼 URL을 거부해야 함', () => {
      const unsupportedUrls = [
        'https://dailymotion.com/video/x7xyz',
        'https://twitch.tv/video/123456789'
      ];

      unsupportedUrls.forEach(url => {
        expect(urlValidator.isValidUrl(url)).toBe(false);
      });
    });
  });

  describe('extractVideoId', () => {
    test('YouTube URL에서 비디오 ID를 추출해야 함', () => {
      const testCases = [
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          expected: 'dQw4w9WgXcQ'
        },
        {
          url: 'https://youtu.be/dQw4w9WgXcQ',
          expected: 'dQw4w9WgXcQ'
        },
        {
          url: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=PLxxxx',
          expected: 'dQw4w9WgXcQ'
        }
      ];

      testCases.forEach(({ url, expected }) => {
        expect(urlValidator.extractVideoId(url)).toBe(expected);
      });
    });

    test('유효하지 않은 URL에 대해 null을 반환해야 함', () => {
      expect(urlValidator.extractVideoId('invalid-url')).toBeNull();
      expect(urlValidator.extractVideoId('')).toBeNull();
      expect(urlValidator.extractVideoId(null)).toBeNull();
    });
  });

  describe('getSupportedPlatform', () => {
    test('URL에서 플랫폼을 식별해야 함', () => {
      const testCases = [
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          expected: 'youtube'
        },
        {
          url: 'https://youtu.be/dQw4w9WgXcQ',
          expected: 'youtube'
        }
      ];

      testCases.forEach(({ url, expected }) => {
        expect(urlValidator.getSupportedPlatform(url)).toBe(expected);
      });
    });

    test('지원하지 않는 플랫폼에 대해 null을 반환해야 함', () => {
      expect(urlValidator.getSupportedPlatform('https://example.com')).toBeNull();
    });
  });
});