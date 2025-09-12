/**
 * Navigator Spoofing Engine
 * YouTube 봇 탐지 우회를 위한 Navigator 객체 위변조 시스템
 */

class NavigatorSpoofing {
    constructor() {
        this.profiles = this.getRandomProfile();
    }

    // 실제 사용자 Navigator 프로파일 생성
    getRandomProfile() {
        const profiles = [
            {
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                platform: 'Win32',
                language: 'en-US',
                languages: ['en-US', 'en', 'ko'],
                hardwareConcurrency: 8,
                deviceMemory: 8,
                maxTouchPoints: 0,
                vendor: 'Google Inc.',
                cookieEnabled: true,
                doNotTrack: null,
                webdriver: false,
                pdfViewerEnabled: true,
                permissions: {
                    notifications: 'default',
                    geolocation: 'prompt'
                }
            },
            {
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                platform: 'MacIntel',
                language: 'en-US',
                languages: ['en-US', 'en'],
                hardwareConcurrency: 10,
                deviceMemory: 16,
                maxTouchPoints: 0,
                vendor: 'Google Inc.',
                cookieEnabled: true,
                doNotTrack: null,
                webdriver: false,
                pdfViewerEnabled: true,
                permissions: {
                    notifications: 'default',
                    geolocation: 'prompt'
                }
            },
            {
                userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                platform: 'Linux x86_64',
                language: 'en-US',
                languages: ['en-US', 'en'],
                hardwareConcurrency: 16,
                deviceMemory: 32,
                maxTouchPoints: 0,
                vendor: 'Google Inc.',
                cookieEnabled: true,
                doNotTrack: null,
                webdriver: false,
                pdfViewerEnabled: true,
                permissions: {
                    notifications: 'default',
                    geolocation: 'prompt'
                }
            }
        ];

        return profiles[Math.floor(Math.random() * profiles.length)];
    }

    // Playwright 브라우저에 Navigator 스푸핑 적용
    async applySpoofing(page) {
        const profile = this.profiles;
        
        await page.addInitScript((profile) => {
            // Navigator 객체 완전 재정의
            Object.defineProperty(navigator, 'userAgent', {
                get: () => profile.userAgent,
                configurable: true
            });

            Object.defineProperty(navigator, 'platform', {
                get: () => profile.platform,
                configurable: true
            });

            Object.defineProperty(navigator, 'language', {
                get: () => profile.language,
                configurable: true
            });

            Object.defineProperty(navigator, 'languages', {
                get: () => profile.languages,
                configurable: true
            });

            Object.defineProperty(navigator, 'hardwareConcurrency', {
                get: () => profile.hardwareConcurrency,
                configurable: true
            });

            Object.defineProperty(navigator, 'deviceMemory', {
                get: () => profile.deviceMemory,
                configurable: true
            });

            Object.defineProperty(navigator, 'maxTouchPoints', {
                get: () => profile.maxTouchPoints,
                configurable: true
            });

            Object.defineProperty(navigator, 'vendor', {
                get: () => profile.vendor,
                configurable: true
            });

            Object.defineProperty(navigator, 'cookieEnabled', {
                get: () => profile.cookieEnabled,
                configurable: true
            });

            Object.defineProperty(navigator, 'doNotTrack', {
                get: () => profile.doNotTrack,
                configurable: true
            });

            Object.defineProperty(navigator, 'webdriver', {
                get: () => profile.webdriver,
                configurable: true
            });

            Object.defineProperty(navigator, 'pdfViewerEnabled', {
                get: () => profile.pdfViewerEnabled,
                configurable: true
            });

            // 권한 상태 스푸핑
            if (navigator.permissions && navigator.permissions.query) {
                const originalQuery = navigator.permissions.query;
                navigator.permissions.query = function(permission) {
                    if (permission.name === 'notifications') {
                        return Promise.resolve({ state: profile.permissions.notifications });
                    }
                    if (permission.name === 'geolocation') {
                        return Promise.resolve({ state: profile.permissions.geolocation });
                    }
                    return originalQuery.call(this, permission);
                };
            }

            // 플러그인 정보 스푸핑
            Object.defineProperty(navigator, 'plugins', {
                get: () => {
                    const plugins = [
                        {
                            name: 'Chrome PDF Plugin',
                            filename: 'internal-pdf-viewer',
                            description: 'Portable Document Format'
                        },
                        {
                            name: 'Native Client',
                            filename: 'internal-nacl-plugin',
                            description: 'Native Client'
                        }
                    ];
                    return plugins;
                },
                configurable: true
            });

            // MIME 타입 스푸핑
            Object.defineProperty(navigator, 'mimeTypes', {
                get: () => {
                    const mimeTypes = [
                        { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
                        { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format' },
                        { type: 'application/x-nacl', suffixes: 'nexe', description: 'Native Client Executable' },
                        { type: 'application/x-pnacl', suffixes: 'pexe', description: 'Portable Native Client Executable' }
                    ];
                    return mimeTypes;
                },
                configurable: true
            });

        }, profile);

        // 추가 브라우저 속성 스푸핑
        await page.evaluateOnNewDocument(() => {
            // Chrome 객체 스푸핑
            if (!window.chrome) {
                window.chrome = {
                    runtime: {
                        onConnect: null,
                        onMessage: null
                    },
                    loadTimes: function() {
                        return {
                            commitLoadTime: Date.now() / 1000 - Math.random(),
                            finishDocumentLoadTime: Date.now() / 1000 - Math.random() + 0.5,
                            finishLoadTime: Date.now() / 1000 - Math.random() + 1,
                            firstPaintAfterLoadTime: Date.now() / 1000 - Math.random() + 0.2,
                            firstPaintTime: Date.now() / 1000 - Math.random() + 0.1,
                            navigationType: "Other",
                            numTabsWhenLoaded: Math.floor(Math.random() * 10) + 1,
                            requestTime: Date.now() / 1000 - Math.random() - 2,
                            startLoadTime: Date.now() / 1000 - Math.random() - 1.5,
                            wasAlternateProtocolAvailable: false,
                            wasFetchedViaSpdy: false,
                            wasNpnNegotiated: false
                        };
                    },
                    csi: function() {
                        return {
                            onloadT: Date.now(),
                            startE: Date.now() - Math.random() * 1000,
                            tran: Math.floor(Math.random() * 20)
                        };
                    }
                };
            }

            // 브라우저 탐지 방지
            delete window.__webdriver_evaluate;
            delete window.__selenium_evaluate;
            delete window.__webdriver_script_function;
            delete window.__webdriver_script_func;
            delete window.__webdriver_script_fn;
            delete window.__fxdriver_evaluate;
            delete window.__driver_unwrapped;
            delete window.webdriver;
            delete window.__webdriverFunc;
            delete window.__webdriver_script_fn;
            delete window.__$webdriverAsyncExecutor;
            delete window.$chrome_asyncScriptInfo;
            delete window.$cdc_asdjflasutopfhvcZLmcfl_;

            // 자동화 도구 탐지 방지
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
                configurable: true
            });

            // 가상 화면 탐지 방지 (실제와 유사한 값)
            Object.defineProperty(screen, 'availWidth', {
                get: () => 1920,
                configurable: true
            });

            Object.defineProperty(screen, 'availHeight', {
                get: () => 1040,
                configurable: true
            });

            Object.defineProperty(screen, 'width', {
                get: () => 1920,
                configurable: true
            });

            Object.defineProperty(screen, 'height', {
                get: () => 1080,
                configurable: true
            });

            Object.defineProperty(screen, 'colorDepth', {
                get: () => 24,
                configurable: true
            });

            Object.defineProperty(screen, 'pixelDepth', {
                get: () => 24,
                configurable: true
            });
        });

        console.log('✅ Navigator 스푸핑 적용 완료');
    }

    // 현재 스푸핑된 프로파일 정보 반환
    getCurrentProfile() {
        return this.profiles;
    }

    // 새 프로파일로 변경
    rotateProfile() {
        this.profiles = this.getRandomProfile();
        console.log('🔄 Navigator 프로파일 로테이션 완료');
        return this.profiles;
    }
}

module.exports = NavigatorSpoofing;