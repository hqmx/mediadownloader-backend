// Mock data for testing
const mockVideoInfo = {
  id: 'dQw4w9WgXcQ',
  title: 'Rick Astley - Never Gonna Give You Up (Video)',
  duration: 212,
  thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  formats: [
    {
      format_id: '140',
      ext: 'm4a',
      format_note: 'medium, m4a_dash container, mp4a.40.2@128k (44100Hz)',
      acodec: 'mp4a.40.2',
      vcodec: 'none',
      quality: 'medium',
      abr: 128,
      filesize: 3457903
    },
    {
      format_id: '18',
      ext: 'mp4',
      format_note: 'medium, mp4_dash container, mp4a.40.2@96k (44100Hz)',
      acodec: 'mp4a.40.2',
      vcodec: 'avc1.42001E',
      width: 640,
      height: 360,
      resolution: '640x360',
      quality: 'medium',
      fps: 25,
      filesize: 15456789
    },
    {
      format_id: '22',
      ext: 'mp4',
      format_note: 'hd720, mp4_dash container, mp4a.40.2@192k (44100Hz)',
      acodec: 'mp4a.40.2',
      vcodec: 'avc1.64001F',
      width: 1280,
      height: 720,
      resolution: '1280x720',
      quality: 'hd720',
      fps: 25,
      filesize: 45678901
    }
  ]
};

class VideoInfoExtractor {
  async executeYtDlp(args) {
    // Mock yt-dlp execution
    if (args.includes('--dump-json')) {
      return JSON.stringify(mockVideoInfo);
    }
    if (args.includes('--simulate')) {
      if (args[args.length - 1].includes('restrictedvideo') || 
          args[args.length - 1].includes('nonexistentvideo')) {
        throw new Error('Video not accessible');
      }
      return 'SUCCESS';
    }
    return '';
  }

  async extractVideoInfo(url) {
    if (!url || typeof url !== 'string' || 
        (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      throw new Error('유효하지 않은 URL입니다');
    }

    if (url.includes('nonexistentvideo')) {
      throw new Error('Video not found');
    }

    return {
      videoId: mockVideoInfo.id,
      title: mockVideoInfo.title,
      duration: mockVideoInfo.duration,
      thumbnail: mockVideoInfo.thumbnail,
      platform: 'youtube',
      formats: this.parseFormats(mockVideoInfo.formats)
    };
  }

  async getAvailableFormats(url) {
    const videoInfo = await this.extractVideoInfo(url);
    const formats = videoInfo.formats;

    return {
      video: formats.filter(f => f.vcodec && f.vcodec !== 'none'),
      audio: formats.filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'))
    };
  }

  async validateVideoAccess(url) {
    try {
      if (url.includes('restrictedvideo') || url.includes('nonexistentvideo')) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  parseFormats(formats) {
    return formats.map(format => ({
      formatId: format.format_id,
      ext: format.ext,
      quality: format.quality || format.format_note || 'unknown',
      filesize: format.filesize,
      vcodec: format.vcodec,
      acodec: format.acodec,
      resolution: format.resolution || (format.width && format.height ? `${format.width}x${format.height}` : null),
      abr: format.abr,
      vbr: format.vbr,
      fps: format.fps
    }));
  }
}

module.exports = new VideoInfoExtractor();