class MediaDownloader {
    constructor() {
        this.currentVideoInfo = null;
        this.supportedFormats = null;
        this.initializeEventListeners();
        this.loadSupportedFormats();
    }

    initializeEventListeners() {
        // URL 분석 버튼
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzeVideo();
        });

        // URL 입력 필드에서 Enter 키
        document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.analyzeVideo();
            }
        });

        // 다운로드 타입 변경
        document.querySelectorAll('input[name="downloadType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleDownloadType(e.target.value);
            });
        });

        // 다운로드 버튼
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.startDownload();
        });

        // 다시 다운로드 버튼
        document.getElementById('downloadAgainBtn').addEventListener('click', () => {
            this.resetDownload();
        });
    }

    async loadSupportedFormats() {
        try {
            const response = await fetch('/api/formats');
            this.supportedFormats = await response.json();
            this.populateFormatOptions();
        } catch (error) {
            console.error('포맷 정보를 불러올 수 없습니다:', error);
        }
    }

    populateFormatOptions() {
        if (!this.supportedFormats) return;

        // 비디오 포맷 옵션 업데이트
        const videoFormatSelect = document.getElementById('videoFormat');
        videoFormatSelect.innerHTML = '';
        this.supportedFormats.video.forEach(format => {
            const option = document.createElement('option');
            option.value = format.format;
            option.textContent = `${format.format.toUpperCase()} - ${format.description}`;
            videoFormatSelect.appendChild(option);
        });

        // 오디오 포맷 옵션 업데이트
        const audioFormatSelect = document.getElementById('audioFormat');
        audioFormatSelect.innerHTML = '';
        this.supportedFormats.audio.forEach(format => {
            const option = document.createElement('option');
            option.value = format.format;
            option.textContent = `${format.format.toUpperCase()} - ${format.description}`;
            audioFormatSelect.appendChild(option);
        });
    }

    async analyzeVideo() {
        const urlInput = document.getElementById('urlInput');
        const url = urlInput.value.trim();

        if (!url) {
            this.showError('URL을 입력해 주세요.');
            return;
        }

        if (!this.isValidYouTubeUrl(url)) {
            this.showError('유효한 YouTube URL을 입력해 주세요.');
            return;
        }

        this.hideError();
        this.showLoading(true);

        try {
            const response = await fetch('/api/video-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '비디오 정보를 가져올 수 없습니다.');
            }

            this.currentVideoInfo = await response.json();
            this.displayVideoInfo();
            this.showDownloadOptions();

        } catch (error) {
            console.error('Error analyzing video:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displayVideoInfo() {
        if (!this.currentVideoInfo) return;

        const videoInfoDiv = document.getElementById('videoInfo');
        const thumbnail = document.getElementById('videoThumbnail');
        const title = document.getElementById('videoTitle');
        const duration = document.getElementById('videoDuration');
        const platform = document.getElementById('videoPlatform');

        thumbnail.src = this.currentVideoInfo.thumbnail || '/placeholder.jpg';
        thumbnail.alt = this.currentVideoInfo.title || 'Video thumbnail';
        title.textContent = this.currentVideoInfo.title || '제목 없음';
        duration.textContent = `⏱️ ${this.formatDuration(this.currentVideoInfo.duration)}`;
        platform.textContent = `📺 ${this.currentVideoInfo.platform || 'Unknown'}`;

        videoInfoDiv.style.display = 'block';
    }

    showDownloadOptions() {
        document.getElementById('downloadOptions').style.display = 'block';
    }

    toggleDownloadType(type) {
        const videoFormats = document.getElementById('videoFormats');
        const audioFormats = document.getElementById('audioFormats');

        if (type === 'video') {
            videoFormats.style.display = 'grid';
            audioFormats.style.display = 'none';
        } else {
            videoFormats.style.display = 'none';
            audioFormats.style.display = 'grid';
        }
    }

    async startDownload() {
        if (!this.currentVideoInfo) {
            this.showError('먼저 비디오를 분석해 주세요.');
            return;
        }

        const downloadType = document.querySelector('input[name="downloadType"]:checked').value;
        const isAudioOnly = downloadType === 'audio';

        let format, quality;
        if (isAudioOnly) {
            format = document.getElementById('audioFormat').value;
            quality = document.getElementById('audioQuality').value;
        } else {
            format = document.getElementById('videoFormat').value;
            quality = document.getElementById('videoQuality').value;
        }

        const downloadOptions = {
            url: document.getElementById('urlInput').value.trim(),
            format: format,
            quality: quality,
            audioOnly: isAudioOnly
        };

        this.showLoading(true);
        this.hideError();

        try {
            // 먼저 다운로드 시작 요청
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(downloadOptions)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '다운로드를 시작할 수 없습니다.');
            }

            const result = await response.json();
            
            // 스트림 다운로드 시작
            this.downloadViaStream(result.downloadId, downloadOptions);

        } catch (error) {
            console.error('Error starting download:', error);
            this.showError(error.message);
            this.showLoading(false);
        }
    }

    downloadViaStream(downloadId, options) {
        // 진행 상황 표시
        this.showProgress();
        this.updateProgress(0, '다운로드 준비 중...');

        // 쿼리 파라미터 구성
        const params = new URLSearchParams({
            url: options.url,
            format: options.format,
            quality: options.quality,
            audioOnly: options.audioOnly
        });

        // 스트림 다운로드 URL
        const downloadUrl = `/api/download/stream/${downloadId}?${params.toString()}`;

        // 가상의 진행 상황 업데이트 (실제로는 서버에서 진행 상황을 받아야 함)
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 95) progress = 95;
            
            this.updateProgress(progress, '다운로드 중...');
        }, 500);

        // 파일 다운로드
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `download_${Date.now()}.${options.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 다운로드 완료 처리 (실제로는 서버 응답을 기다려야 함)
        setTimeout(() => {
            clearInterval(progressInterval);
            this.updateProgress(100, '다운로드 완료!');
            setTimeout(() => {
                this.showDownloadComplete();
                this.showLoading(false);
            }, 1000);
        }, 3000);
    }

    showProgress() {
        document.getElementById('downloadOptions').style.display = 'none';
        document.getElementById('downloadProgress').style.display = 'block';
    }

    updateProgress(percent, message) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const progressPercent = document.getElementById('progressPercent');

        progressFill.style.width = `${percent}%`;
        progressText.textContent = message;
        progressPercent.textContent = `${Math.round(percent)}%`;
    }

    showDownloadComplete() {
        document.getElementById('downloadProgress').style.display = 'none';
        document.getElementById('downloadComplete').style.display = 'block';
    }

    resetDownload() {
        // 모든 섹션 숨기기
        document.getElementById('videoInfo').style.display = 'none';
        document.getElementById('downloadOptions').style.display = 'none';
        document.getElementById('downloadProgress').style.display = 'none';
        document.getElementById('downloadComplete').style.display = 'none';

        // 입력 필드 초기화
        document.getElementById('urlInput').value = '';
        this.currentVideoInfo = null;
        
        // 비디오 다운로드 옵션으로 재설정
        document.querySelector('input[name="downloadType"][value="video"]').checked = true;
        this.toggleDownloadType('video');

        this.hideError();
    }

    showError(message) {
        const errorDiv = document.getElementById('urlError');
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    }

    hideError() {
        const errorDiv = document.getElementById('urlError');
        errorDiv.classList.remove('show');
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = show ? 'flex' : 'none';
    }

    isValidYouTubeUrl(url) {
        const patterns = [
            /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
            /^https?:\/\/youtu\.be\/[\w-]+/,
            /^https?:\/\/m\.youtube\.com\/watch\?v=[\w-]+/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    }

    formatDuration(seconds) {
        if (!seconds) return '알 수 없음';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    new MediaDownloader();
});