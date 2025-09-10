// Mock the downloadManager for testing
jest.mock('../../src/services/downloadManager', () => {
  return require('./__mocks__/downloadManager');
});

const downloadManager = require('../../src/services/downloadManager');
const fs = require('fs');
const path = require('path');

describe('Download Manager Service', () => {
  describe('downloadVideo', () => {
    test('선택한 포맷으로 비디오를 다운로드해야 함', async () => {
      const downloadOptions = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        format: 'mp4',
        quality: '720p',
        audioOnly: false
      };

      const result = await downloadManager.downloadVideo(downloadOptions);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(result.filename).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);
      expect(path.extname(result.filename)).toBe('.mp4');
    });

    test('오디오만 다운로드해야 함', async () => {
      const downloadOptions = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        format: 'mp3',
        quality: '128kbps',
        audioOnly: true
      };

      const result = await downloadManager.downloadVideo(downloadOptions);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(result.filename).toBeDefined();
      expect(path.extname(result.filename)).toBe('.mp3');
    });

    test('유효하지 않은 URL에 대해 에러를 던져야 함', async () => {
      const downloadOptions = {
        url: 'invalid-url',
        format: 'mp4',
        quality: '720p'
      };

      await expect(downloadManager.downloadVideo(downloadOptions))
        .rejects.toThrow('유효하지 않은 URL입니다');
    });

    test('지원하지 않는 포맷에 대해 에러를 던져야 함', async () => {
      const downloadOptions = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        format: 'unsupported',
        quality: '720p'
      };

      await expect(downloadManager.downloadVideo(downloadOptions))
        .rejects.toThrow('지원하지 않는 포맷입니다');
    });
  });

  describe('getDownloadStream', () => {
    test('다운로드 스트림을 반환해야 함', async () => {
      const downloadOptions = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        format: 'mp4',
        quality: '720p'
      };

      const stream = await downloadManager.getDownloadStream(downloadOptions);

      expect(stream).toBeDefined();
      expect(stream.readable).toBe(true);
      expect(typeof stream.pipe).toBe('function');
    });

    test('스트림에 메타데이터가 포함되어야 함', async () => {
      const downloadOptions = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        format: 'mp4',
        quality: '720p'
      };

      const stream = await downloadManager.getDownloadStream(downloadOptions);

      expect(stream.filename).toBeDefined();
      expect(stream.contentType).toBeDefined();
      expect(stream.contentLength).toBeGreaterThan(0);
    });
  });

  describe('getSupportedFormats', () => {
    test('지원하는 포맷 목록을 반환해야 함', () => {
      const formats = downloadManager.getSupportedFormats();

      expect(formats).toBeDefined();
      expect(formats.video).toBeDefined();
      expect(formats.audio).toBeDefined();
      expect(Array.isArray(formats.video)).toBe(true);
      expect(Array.isArray(formats.audio)).toBe(true);
      expect(formats.video.length).toBeGreaterThan(0);
      expect(formats.audio.length).toBeGreaterThan(0);
    });

    test('비디오 포맷에 필요한 속성이 포함되어야 함', () => {
      const formats = downloadManager.getSupportedFormats();
      const videoFormat = formats.video[0];

      expect(videoFormat).toHaveProperty('format');
      expect(videoFormat).toHaveProperty('description');
      expect(videoFormat).toHaveProperty('qualities');
      expect(Array.isArray(videoFormat.qualities)).toBe(true);
    });

    test('오디오 포맷에 필요한 속성이 포함되어야 함', () => {
      const formats = downloadManager.getSupportedFormats();
      const audioFormat = formats.audio[0];

      expect(audioFormat).toHaveProperty('format');
      expect(audioFormat).toHaveProperty('description');
      expect(audioFormat).toHaveProperty('qualities');
      expect(Array.isArray(audioFormat.qualities)).toBe(true);
    });
  });

  describe('validateDownloadOptions', () => {
    test('유효한 다운로드 옵션을 승인해야 함', () => {
      const validOptions = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        format: 'mp4',
        quality: '720p',
        audioOnly: false
      };

      const result = downloadManager.validateDownloadOptions(validOptions);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('필수 필드가 누락된 경우 에러를 반환해야 함', () => {
      const invalidOptions = {
        format: 'mp4',
        quality: '720p'
        // url 누락
      };

      const result = downloadManager.validateDownloadOptions(invalidOptions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL은 필수입니다');
    });

    test('지원하지 않는 포맷에 대해 에러를 반환해야 함', () => {
      const invalidOptions = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        format: 'unsupported',
        quality: '720p'
      };

      const result = downloadManager.validateDownloadOptions(invalidOptions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('지원하지 않는 포맷입니다');
    });
  });

  describe('cleanupTempFiles', () => {
    test('임시 파일들을 정리해야 함', async () => {
      const result = await downloadManager.cleanupTempFiles();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(typeof result.deletedCount).toBe('number');
    });
  });
});