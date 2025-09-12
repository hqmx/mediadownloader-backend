/**
 * Master Stealth Controller
 * Plan B 스텔스 시스템의 중앙 제어 엔진
 * 모든 봇 탐지 우회 기술을 통합 관리
 */

const NavigatorSpoofing = require('./navigatorSpoofing');
const FingerprintMutation = require('./fingerprintMutation');
const HumanBehaviorSimulation = require('./humanBehavior');
const BrowserRequestSimulation = require('./requestSimulation');
const SmartProxyManager = require('./smartProxyManager');

class MasterStealthController {
    constructor() {
        this.navigatorSpoof = new NavigatorSpoofing();
        this.fingerprintMutator = new FingerprintMutation();
        this.humanBehavior = new HumanBehaviorSimulation();
        this.requestSimulator = new BrowserRequestSimulation();
        this.proxyManager = new SmartProxyManager();
        
        this.stealthLevel = 'MAXIMUM'; // BASIC, MEDIUM, MAXIMUM, EXTREME
        this.sessionStats = {
            startTime: Date.now(),
            appliedTechniques: [],
            successRate: 0,
            detectionEvents: []
        };
        
        console.log('🛡️ Master Stealth Controller 초기화 완료');
    }

    // Playwright 브라우저에 완전한 스텔스 시스템 적용
    async applyStealth(browser, context, page) {
        console.log(`🚀 스텔스 레벨 ${this.stealthLevel} 적용 시작...`);
        
        try {
            // Phase 1: Core Stealth Components (병렬 적용)
            await Promise.all([
                this.applyNavigatorSpoofing(page),
                this.applyFingerprintMutation(page),
                this.applyRequestSimulation(page)
            ]);

            // Phase 2: Advanced Browser Patches
            await this.applyAdvancedPatches(context, page);

            // Phase 3: Anti-Detection Scripts
            await this.applyAntiDetectionScripts(page);

            // Phase 4: Human Behavior (페이지 로드 후)
            this.scheduleBehaviorSimulation(page);

            // Phase 5: Monitoring & Adaptation
            await this.setupDetectionMonitoring(page);

            console.log('✅ 완전한 스텔스 시스템 적용 완료');
            this.sessionStats.appliedTechniques = [
                'Navigator Spoofing',
                'Fingerprint Mutation', 
                'Request Simulation',
                'Human Behavior',
                'Anti-Detection Scripts'
            ];

            return true;
        } catch (error) {
            console.error('❌ 스텔스 시스템 적용 실패:', error.message);
            this.sessionStats.detectionEvents.push({
                type: 'STEALTH_FAILURE',
                error: error.message,
                timestamp: Date.now()
            });
            return false;
        }
    }

    // Navigator 스푸핑 적용
    async applyNavigatorSpoofing(page) {
        await this.navigatorSpoof.applySpoofing(page);
        console.log('✅ Navigator 스푸핑 적용됨');
    }

    // 지문 변조 적용
    async applyFingerprintMutation(page) {
        await this.fingerprintMutator.applyMutation(page);
        console.log('✅ 브라우저 지문 변조 적용됨');
    }

    // 요청 시뮬레이션 적용
    async applyRequestSimulation(page) {
        await this.requestSimulator.applyRequestSimulation(page);
        console.log('✅ HTTP 요청 시뮬레이션 적용됨');
    }

    // 고급 브라우저 패치 적용
    async applyAdvancedPatches(context, page) {
        // 브라우저 컨텍스트 레벨 패치
        await context.addInitScript(() => {
            // DevTools 탐지 방지
            let devtools = false;
            const devToolsChecker = () => {
                const widthThreshold = window.outerWidth - window.innerWidth > 160;
                const heightThreshold = window.outerHeight - window.innerHeight > 160;
                if (widthThreshold || heightThreshold) {
                    devtools = true;
                }
            };
            
            setInterval(devToolsChecker, 500);

            // 자동화 탐지 변수들 완전 제거
            const automationVars = [
                '__webdriver_evaluate', '__selenium_evaluate', '__webdriver_script_function',
                '__webdriver_script_func', '__webdriver_script_fn', '__fxdriver_evaluate',
                '__driver_unwrapped', 'webdriver', '__webdriverFunc', '__webdriver_unwrapped',
                '__webdriver_script_fn', '__$webdriverAsyncExecutor', '$chrome_asyncScriptInfo',
                '$cdc_asdjflasutopfhvcZLmcfl_', '__webdriver_evaluate', '__selenium_evaluate'
            ];

            automationVars.forEach(variable => {
                try {
                    delete window[variable];
                } catch (e) {}
            });

            // 브라우저 이벤트 리스너 탐지 방지
            const originalAddEventListener = EventTarget.prototype.addEventListener;
            EventTarget.prototype.addEventListener = function(type, listener, options) {
                // 자동화 도구가 사용하는 특정 이벤트 리스너 차단
                if (type === 'beforeunload' && listener.toString().includes('webdriver')) {
                    return;
                }
                return originalAddEventListener.call(this, type, listener, options);
            };

            // 콘솔 로그 탐지 방지
            const originalLog = console.log;
            console.log = function(...args) {
                const message = args.join(' ');
                if (!message.includes('webdriver') && !message.includes('selenium')) {
                    originalLog.apply(console, args);
                }
            };
        });

        // 페이지 레벨 고급 패치
        await page.addInitScript(() => {
            // Performance API 정규화
            if (window.performance) {
                const originalNow = performance.now;
                performance.now = function() {
                    return originalNow.call(this) + Math.random() * 0.1;
                };

                // Navigation Timing 정규화
                Object.defineProperty(performance, 'timing', {
                    get() {
                        const timing = window.performance.timing;
                        // 실제 사용자와 유사한 타이밍 값들로 조정
                        return {
                            ...timing,
                            navigationStart: timing.navigationStart + Math.floor(Math.random() * 10),
                            domContentLoadedEventStart: timing.domContentLoadedEventStart + Math.floor(Math.random() * 50),
                            loadEventStart: timing.loadEventStart + Math.floor(Math.random() * 100)
                        };
                    }
                });
            }

            // Geolocation API 패치
            if (navigator.geolocation) {
                const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
                navigator.geolocation.getCurrentPosition = function(success, error, options) {
                    // 약간의 지연과 함께 가짜 위치 반환
                    setTimeout(() => {
                        if (success) {
                            success({
                                coords: {
                                    latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
                                    longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
                                    accuracy: 65 + Math.random() * 10
                                },
                                timestamp: Date.now()
                            });
                        }
                    }, 100 + Math.random() * 500);
                };
            }

            // Battery API 패치
            if (navigator.getBattery) {
                navigator.getBattery = function() {
                    return Promise.resolve({
                        charging: Math.random() > 0.3,
                        chargingTime: Math.random() * 7200,
                        dischargingTime: Math.random() * 14400,
                        level: 0.2 + Math.random() * 0.7
                    });
                };
            }

            // Connection API 패치
            if (navigator.connection) {
                Object.defineProperties(navigator.connection, {
                    effectiveType: {
                        get: () => ['slow-2g', '2g', '3g', '4g'][Math.floor(Math.random() * 4)]
                    },
                    downlink: {
                        get: () => Math.random() * 10
                    },
                    rtt: {
                        get: () => 50 + Math.random() * 200
                    }
                });
            }
        });

        console.log('✅ 고급 브라우저 패치 적용됨');
    }

    // 안티 디텍션 스크립트 적용
    async applyAntiDetectionScripts(page) {
        await page.addInitScript(() => {
            // YouTube 특화 안티 디텍션
            if (window.location.hostname.includes('youtube.com')) {
                // YouTube의 봇 탐지 스크립트 무력화
                const originalFetch = window.fetch;
                window.fetch = function(url, options = {}) {
                    // 텔레메트리 및 분석 요청 차단
                    if (typeof url === 'string') {
                        if (url.includes('/api/stats/') || 
                            url.includes('/ptracking') || 
                            url.includes('/generate_204') ||
                            url.includes('/_/scs/')) {
                            return Promise.resolve(new Response('{}', { status: 200 }));
                        }
                    }
                    
                    return originalFetch.call(this, url, options);
                };

                // YouTube 내부 변수들 정규화
                if (window.yt) {
                    // Config 정규화
                    if (window.yt.config_) {
                        window.yt.config_.EXPERIMENT_FLAGS = window.yt.config_.EXPERIMENT_FLAGS || {};
                        window.yt.config_.EXPERIMENT_FLAGS.service_worker_enabled = false;
                        window.yt.config_.EXPERIMENT_FLAGS.web_player_sentinel_is_uniplayer = false;
                    }
                }

                // ytInitialData 및 ytInitialPlayerResponse 보호
                let ytDataBackup = null;
                let ytPlayerBackup = null;
                
                Object.defineProperty(window, 'ytInitialData', {
                    get() { return ytDataBackup; },
                    set(value) { ytDataBackup = value; },
                    configurable: true
                });

                Object.defineProperty(window, 'ytInitialPlayerResponse', {
                    get() { return ytPlayerBackup; },
                    set(value) { ytPlayerBackup = value; },
                    configurable: true
                });

                // 브라우저 확장 탐지 방지
                if (chrome && chrome.runtime) {
                    const originalSendMessage = chrome.runtime.sendMessage;
                    chrome.runtime.sendMessage = function(extensionId, message, options, callback) {
                        // 자동화 관련 메시지 차단
                        if (typeof message === 'object' && message.type === 'automation') {
                            return;
                        }
                        return originalSendMessage.apply(this, arguments);
                    };
                }
            }

            // 일반적인 봇 탐지 회피
            const protectedFunctions = [
                'toString', 'valueOf', 'hasOwnProperty', 'propertyIsEnumerable',
                'isPrototypeOf', 'constructor', 'call', 'apply', 'bind'
            ];

            protectedFunctions.forEach(funcName => {
                try {
                    const original = Function.prototype[funcName];
                    Function.prototype[funcName] = function(...args) {
                        // 봇 탐지 관련 호출 필터링
                        const caller = (new Error()).stack;
                        if (caller && (caller.includes('webdriver') || caller.includes('selenium'))) {
                            return undefined;
                        }
                        return original.apply(this, args);
                    };
                } catch (e) {}
            });

            // DOM 변경 감지 차단
            const originalCreateElement = document.createElement;
            document.createElement = function(tagName) {
                const element = originalCreateElement.call(this, tagName);
                
                // 봇 탐지용 요소 생성 차단
                if (tagName.toLowerCase() === 'iframe' && arguments.length > 1) {
                    const src = arguments[1];
                    if (src && (src.includes('webdriver') || src.includes('automation'))) {
                        return document.createDocumentFragment();
                    }
                }
                
                return element;
            };
        });

        console.log('✅ 안티 디텍션 스크립트 적용됨');
    }

    // 인간 행동 시뮬레이션 스케줄링
    scheduleBehaviorSimulation(page) {
        // 페이지 로드 완료 후 인간 행동 시뮬레이션 시작
        setTimeout(async () => {
            try {
                await this.humanBehavior.simulateRealisticBehavior(page);
                console.log('✅ 인간 행동 시뮬레이션 완료');
            } catch (error) {
                console.warn('⚠️ 인간 행동 시뮬레이션 일부 실패:', error.message);
            }
        }, 2000 + Math.random() * 3000);

        // 지속적인 백그라운드 활동
        const backgroundActivity = setInterval(async () => {
            try {
                const viewport = await page.viewportSize();
                if (viewport) {
                    // 미세한 마우스 움직임
                    const x = Math.random() * viewport.width;
                    const y = Math.random() * viewport.height;
                    await page.mouse.move(x, y, { steps: 1 });
                }
            } catch (error) {
                clearInterval(backgroundActivity);
            }
        }, 10000 + Math.random() * 20000); // 10-30초마다

        // 페이지 종료 시 정리
        page.on('close', () => {
            clearInterval(backgroundActivity);
        });
    }

    // 탐지 모니터링 설정
    async setupDetectionMonitoring(page) {
        // 페이지에서 발생하는 오류 모니터링
        page.on('pageerror', (error) => {
            const errorMessage = error.message.toLowerCase();
            if (errorMessage.includes('bot') || 
                errorMessage.includes('automation') || 
                errorMessage.includes('webdriver')) {
                
                this.sessionStats.detectionEvents.push({
                    type: 'PAGE_ERROR',
                    message: error.message,
                    timestamp: Date.now()
                });
                
                console.warn('🚨 봇 탐지 관련 오류 감지:', error.message);
            }
        });

        // 콘솔 메시지 모니터링
        page.on('console', (msg) => {
            const text = msg.text().toLowerCase();
            if (text.includes('bot') || 
                text.includes('automation') || 
                text.includes('captcha')) {
                
                this.sessionStats.detectionEvents.push({
                    type: 'CONSOLE_WARNING',
                    message: msg.text(),
                    timestamp: Date.now()
                });
                
                console.warn('🚨 봇 탐지 관련 콘솔 메시지:', msg.text());
            }
        });

        // 응답 모니터링
        page.on('response', (response) => {
            const url = response.url();
            const status = response.status();
            
            // 403, 429 등 봇 차단 응답 코드 모니터링
            if (status === 403 || status === 429) {
                this.sessionStats.detectionEvents.push({
                    type: 'BLOCKED_RESPONSE',
                    url: url,
                    status: status,
                    timestamp: Date.now()
                });
                
                console.warn(`🚨 차단 응답 코드 감지: ${status} for ${url}`);
            }

            // CAPTCHA 관련 응답 모니터링
            if (url.includes('captcha') || url.includes('recaptcha')) {
                this.sessionStats.detectionEvents.push({
                    type: 'CAPTCHA_DETECTED',
                    url: url,
                    timestamp: Date.now()
                });
                
                console.warn('🚨 CAPTCHA 감지:', url);
            }
        });

        console.log('✅ 봇 탐지 모니터링 시스템 활성화');
    }

    // 스텔스 레벨 설정
    setStealthLevel(level) {
        const validLevels = ['BASIC', 'MEDIUM', 'MAXIMUM', 'EXTREME'];
        if (validLevels.includes(level)) {
            this.stealthLevel = level;
            console.log(`🔧 스텔스 레벨 변경: ${level}`);
            
            // 레벨에 따른 설정 조정
            switch (level) {
                case 'BASIC':
                    this.fingerprintMutator.canvasNoiseLevel = 0.05;
                    break;
                case 'MEDIUM':
                    this.fingerprintMutator.canvasNoiseLevel = 0.08;
                    break;
                case 'MAXIMUM':
                    this.fingerprintMutator.canvasNoiseLevel = 0.12;
                    break;
                case 'EXTREME':
                    this.fingerprintMutator.canvasNoiseLevel = 0.15;
                    break;
            }
        }
    }

    // 성공률 계산 및 적응
    calculateSuccessRate() {
        const totalAttempts = this.sessionStats.appliedTechniques.length;
        const detectionEvents = this.sessionStats.detectionEvents.length;
        
        if (totalAttempts === 0) return 0;
        
        this.sessionStats.successRate = Math.max(0, (1 - detectionEvents / totalAttempts) * 100);
        return this.sessionStats.successRate;
    }

    // 적응형 스텔스 조정
    async adaptiveStealth() {
        const successRate = this.calculateSuccessRate();
        
        if (successRate < 70) {
            // 성공률이 낮으면 더 강력한 스텔스 적용
            if (this.stealthLevel !== 'EXTREME') {
                const levels = ['BASIC', 'MEDIUM', 'MAXIMUM', 'EXTREME'];
                const currentIndex = levels.indexOf(this.stealthLevel);
                this.setStealthLevel(levels[currentIndex + 1]);
            }
            
            // 프록시 로테이션
            this.proxyManager.rotateSession();
            
            // 브라우저 프로파일 변경
            this.navigatorSpoof.rotateProfile();
            this.fingerprintMutator.regenerateSettings();
            this.humanBehavior.resetSession();
            
            console.log('🔄 적응형 스텔스 조정 완료');
        }
    }

    // 세션 통계 반환
    getSessionStats() {
        return {
            ...this.sessionStats,
            successRate: this.calculateSuccessRate(),
            stealthLevel: this.stealthLevel,
            sessionDuration: Date.now() - this.sessionStats.startTime,
            techniques: {
                navigator: this.navigatorSpoof.getCurrentProfile(),
                fingerprint: this.fingerprintMutator.getSettings(),
                behavior: this.humanBehavior.getBehaviorStats(),
                requests: this.requestSimulator.getRequestStats()
            }
        };
    }

    // 새 세션 시작
    resetSession() {
        this.sessionStats = {
            startTime: Date.now(),
            appliedTechniques: [],
            successRate: 0,
            detectionEvents: []
        };
        
        // 모든 하위 시스템 리셋
        this.navigatorSpoof.rotateProfile();
        this.fingerprintMutator.regenerateSettings();
        this.humanBehavior.resetSession();
        this.requestSimulator.resetSession();
        this.proxyManager.rotateSession();
        
        console.log('🔄 Master Stealth Controller 세션 리셋 완료');
    }
}

module.exports = MasterStealthController;