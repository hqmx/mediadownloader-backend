class UrlValidator {
  /**
   * URL이 지원하는 플랫폼의 유효한 URL인지 검증
   * @param {string} url 
   * @returns {boolean}
   */
  isValidUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // YouTube URL 패턴 검증
    const youtubePatterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/,
      /^https?:\/\/m\.youtube\.com\/watch\?v=[\w-]+/
    ];

    return youtubePatterns.some(pattern => pattern.test(url));
  }

  /**
   * URL에서 비디오 ID를 추출
   * @param {string} url 
   * @returns {string|null}
   */
  extractVideoId(url) {
    if (!this.isValidUrl(url)) {
      return null;
    }

    let videoId = null;

    // YouTube URL에서 비디오 ID 추출
    if (url.includes('youtube.com/watch?v=')) {
      const match = url.match(/[?&]v=([^&]+)/);
      videoId = match ? match[1] : null;
    } else if (url.includes('youtu.be/')) {
      const match = url.match(/youtu\.be\/([^?]+)/);
      videoId = match ? match[1] : null;
    }

    return videoId;
  }

  /**
   * URL에서 지원되는 플랫폼을 식별
   * @param {string} url 
   * @returns {string|null}
   */
  getSupportedPlatform(url) {
    if (!url || typeof url !== 'string') {
      return null;
    }

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }

    return null;
  }
}

module.exports = new UrlValidator();