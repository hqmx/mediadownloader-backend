/**
 * Browser Request Simulation Engine
 * 실제 브라우저의 HTTP 요청 패턴을 시뮬레이션하는 시스템
 */

class BrowserRequestSimulation {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.requestHistory = [];
        this.browserFingerprint = this.generateFingerprint();
        this.resourceLoadingPattern = this.generateResourcePattern();
    }

    // Playwright 페이지에 요청 시뮬레이션 적용
    async applyRequestSimulation(page) {
        await this.interceptAndModifyRequests(page);
        await this.simulateResourceLoading(page);
        await this.addNetworkBehavior(page);
        
        console.log('✅ 브라우저 요청 시뮬레이션 적용 완료');
    }

    // HTTP 요청 인터셉트 및 수정
    async interceptAndModifyRequests(page) {
        await page.route('**/*', async (route, request) => {
            const url = request.url();
            const headers = request.headers();
            
            // 실제 브라우저와 유사한 헤더 추가/수정
            const modifiedHeaders = {
                ...headers,
                ...this.generateRealisticHeaders(url, request.method()),
                'sec-fetch-site': this.determineFetchSite(url),
                'sec-fetch-mode': this.determineFetchMode(request.resourceType()),
                'sec-fetch-dest': this.determineFetchDest(request.resourceType()),
                'sec-fetch-user': request.isNavigationRequest() ? '?1' : undefined
            };

            // undefined 값 제거
            Object.keys(modifiedHeaders).forEach(key => {
                if (modifiedHeaders[key] === undefined) {
                    delete modifiedHeaders[key];
                }
            });

            // 요청 기록
            this.requestHistory.push({
                url,
                method: request.method(),
                resourceType: request.resourceType(),
                timestamp: Date.now(),
                headers: modifiedHeaders
            });

            // 네트워크 지연 시뮬레이션
            if (Math.random() < 0.1) { // 10% 확률로 약간의 지연
                await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 200));
            }

            try {
                await route.continue({ headers: modifiedHeaders });
            } catch (error) {
                console.log(`Request failed for ${url}: ${error.message}`);
                await route.abort();
            }
        });
    }

    // 실제 브라우저와 유사한 헤더 생성
    generateRealisticHeaders(url, method) {
        const headers = {};
        const isYouTube = url.includes('youtube.com') || url.includes('googlevideo.com');
        
        // 공통 헤더
        headers['accept-encoding'] = 'gzip, deflate, br';
        headers['accept-language'] = 'en-US,en;q=0.9,ko;q=0.8';
        headers['cache-control'] = Math.random() > 0.5 ? 'no-cache' : 'max-age=0';
        
        // URL 기반 Accept 헤더
        if (url.includes('.js')) {
            headers['accept'] = '*/*';
        } else if (url.includes('.css')) {
            headers['accept'] = 'text/css,*/*;q=0.1';
        } else if (url.includes('.png') || url.includes('.jpg') || url.includes('.webp')) {
            headers['accept'] = 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8';
        } else if (method === 'GET' && !url.includes('api')) {
            headers['accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';
        }

        // YouTube 특화 헤더
        if (isYouTube) {
            headers['x-client-data'] = this.generateClientData();
            headers['x-youtube-client-name'] = '1';
            headers['x-youtube-client-version'] = '2.20231214.01.00';
            
            if (url.includes('youtubei/v1/')) {
                headers['x-origin'] = 'https://www.youtube.com';
                headers['x-youtube-bootstrap-logged-in'] = 'false';
                headers['content-type'] = 'application/json';
            }
        }

        // 리퍼러 시뮬레이션
        if (method === 'GET' && !url.includes('favicon') && Math.random() > 0.3) {
            headers['referer'] = this.generateReferrer(url);
        }

        // 브라우저 플래그
        headers['sec-ch-ua'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
        headers['sec-ch-ua-mobile'] = '?0';
        headers['sec-ch-ua-platform'] = '"Windows"';
        headers['upgrade-insecure-requests'] = '1';

        return headers;
    }

    // Sec-Fetch-Site 헤더 결정
    determineFetchSite(url) {
        const currentDomain = 'youtube.com';
        
        if (url.includes(currentDomain)) {
            return 'same-origin';
        } else if (url.includes('googlevideo.com') || url.includes('googleusercontent.com')) {
            return 'same-site';
        } else if (url.includes('google.com') || url.includes('gstatic.com')) {
            return 'cross-site';
        } else {
            return 'cross-site';
        }
    }

    // Sec-Fetch-Mode 헤더 결정
    determineFetchMode(resourceType) {
        const modeMap = {
            'document': 'navigate',
            'stylesheet': 'no-cors',
            'script': 'no-cors',
            'image': 'no-cors',
            'font': 'cors',
            'xhr': 'cors',
            'fetch': 'cors'
        };
        
        return modeMap[resourceType] || 'no-cors';
    }

    // Sec-Fetch-Dest 헤더 결정
    determineFetchDest(resourceType) {
        const destMap = {
            'document': 'document',
            'stylesheet': 'style',
            'script': 'script',
            'image': 'image',
            'font': 'font',
            'xhr': 'empty',
            'fetch': 'empty',
            'media': 'video'
        };
        
        return destMap[resourceType] || 'empty';
    }

    // YouTube 클라이언트 데이터 생성
    generateClientData() {
        const variations = [
            'CgSA1QoQCgCYAQGgAQGiBwYKAEoAUAAaAAgA',
            'CgqA1QoQCgCYAQGgAQGiBwgKEAEaAAgA',
            'CgSA2AoQCgCYAQGgAQGiBwYKAEoAUAAaAAgA',
            'CgqA2AoQCgCYAQGgAQGiBwgKEAEaAAgA'
        ];
        return variations[Math.floor(Math.random() * variations.length)];
    }

    // 리퍼러 생성
    generateReferrer(currentUrl) {
        if (currentUrl.includes('youtube.com')) {
            const referrers = [
                'https://www.youtube.com/',
                'https://www.youtube.com/results?search_query=',
                'https://www.youtube.com/channel/',
                'https://www.google.com/',
                'https://www.youtube.com/watch?v='
            ];
            return referrers[Math.floor(Math.random() * referrers.length)];
        }
        
        return 'https://www.youtube.com/';
    }

    // 리소스 로딩 패턴 시뮬레이션
    async simulateResourceLoading(page) {
        // DOM이 로드된 후 추가 리소스를 점진적으로 로드
        await page.evaluate(() => {
            // 실제 브라우저처럼 이미지를 지연 로딩
            const images = document.querySelectorAll('img[data-src]');
            if (images.length > 0) {
                setTimeout(() => {
                    images.forEach(img => {
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                        }
                    });
                }, 100 + Math.random() * 500);
            }

            // 브라우저 이벤트 시뮬레이션
            setTimeout(() => {
                window.dispatchEvent(new Event('scroll'));
            }, 200 + Math.random() * 800);

            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 500 + Math.random() * 1500);
        });
    }

    // 네트워크 행동 패턴 추가
    async addNetworkBehavior(page) {
        // 페이지에 실제 브라우저가 하는 백그라운드 요청들 시뮬레이션
        await page.addInitScript(() => {
            // 브라우저 성능 메트릭 수집 시뮬레이션
            if (window.performance && window.performance.mark) {
                setTimeout(() => {
                    window.performance.mark('page-interactive');
                }, 1000 + Math.random() * 2000);
            }

            // 브라우저 저장소 접근 시뮬레이션
            try {
                localStorage.setItem('yt-player-quality', JSON.stringify({
                    data: 'hd720',
                    expiry: Date.now() + 86400000
                }));
                
                sessionStorage.setItem('yt-remote-session-app', 'youtube-html5');
                sessionStorage.setItem('yt-remote-session-name', 'Default');
            } catch (e) {
                // 저장소에 액세스할 수 없어도 계속 진행
            }

            // 브라우저 API 사용 시뮬레이션
            if (navigator.connection) {
                // 연결 정보 확인 (실제 사용자가 할 법한 행동)
                console.log('Connection type:', navigator.connection.effectiveType);
            }

            // 미디어 기능 확인
            if (window.HTMLMediaElement) {
                const video = document.createElement('video');
                const canPlayH264 = video.canPlayType('video/mp4; codecs="avc1.42E01E"');
                const canPlayWebM = video.canPlayType('video/webm; codecs="vp8, vorbis"');
                console.log('Media support:', { h264: canPlayH264, webm: canPlayWebM });
            }
        });

        // 백그라운드 요청 시뮬레이션
        setTimeout(async () => {
            try {
                await page.evaluate(() => {
                    // 실제 브라우저가 보내는 telemetry 요청 시뮬레이션
                    if (Math.random() > 0.7) {
                        fetch('/api/stats/watchtime', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                watchtime: Math.floor(Math.random() * 30),
                                timestamp: Date.now()
                            })
                        }).catch(() => {});
                    }
                });
            } catch (error) {
                // 요청이 실패해도 계속 진행
            }
        }, 3000 + Math.random() * 7000);
    }

    // 브라우저 지문 생성
    generateFingerprint() {
        return {
            screen: {
                width: 1920,
                height: 1080,
                colorDepth: 24,
                pixelDepth: 24
            },
            timezone: -480, // PST
            language: 'en-US',
            platform: 'Win32',
            cookieEnabled: true,
            javaEnabled: false,
            plugins: [
                'Chrome PDF Plugin',
                'Native Client'
            ]
        };
    }

    // 리소스 로딩 패턴 생성
    generateResourcePattern() {
        return {
            parallelRequests: 6, // 동시 요청 수
            resourcePriority: {
                'document': 'VeryHigh',
                'script': 'High',
                'stylesheet': 'High',
                'image': 'Low',
                'font': 'High'
            },
            cacheStrategy: {
                'static': 'max-age=3600',
                'dynamic': 'no-cache',
                'media': 'max-age=86400'
            }
        };
    }

    // 세션 ID 생성
    generateSessionId() {
        return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    }

    // 요청 통계 반환
    getRequestStats() {
        const stats = {
            totalRequests: this.requestHistory.length,
            requestsByType: {},
            averageRequestInterval: 0,
            sessionId: this.sessionId
        };

        // 리소스 타입별 분류
        this.requestHistory.forEach(req => {
            stats.requestsByType[req.resourceType] = (stats.requestsByType[req.resourceType] || 0) + 1;
        });

        // 평균 요청 간격 계산
        if (this.requestHistory.length > 1) {
            const totalTime = this.requestHistory[this.requestHistory.length - 1].timestamp - 
                            this.requestHistory[0].timestamp;
            stats.averageRequestInterval = totalTime / (this.requestHistory.length - 1);
        }

        return stats;
    }

    // 새 세션으로 리셋
    resetSession() {
        this.sessionId = this.generateSessionId();
        this.requestHistory = [];
        this.browserFingerprint = this.generateFingerprint();
        this.resourceLoadingPattern = this.generateResourcePattern();
        
        console.log('🔄 브라우저 요청 시뮬레이션 세션 리셋 완료');
    }
}

module.exports = BrowserRequestSimulation;