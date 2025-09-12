/**
 * Fingerprint Mutation Engine
 * Canvas, WebGL, Audio Context 등의 브라우저 지문 변조 시스템
 */

class FingerprintMutation {
    constructor() {
        this.canvasNoiseLevel = Math.random() * 0.1 + 0.05; // 5-15% 노이즈
        this.webglNoiseLevel = Math.random() * 0.05 + 0.02; // 2-7% 노이즈
        this.audioNoiseLevel = Math.random() * 0.001 + 0.0005; // 0.05-0.15% 노이즈
    }

    // Playwright 페이지에 지문 변조 적용
    async applyMutation(page) {
        await this.mutateCanvas(page);
        await this.mutateWebGL(page);
        await this.mutateAudioContext(page);
        await this.mutateWebRTC(page);
        await this.mutateTimezone(page);
        await this.mutateLanguages(page);
        
        console.log('✅ 브라우저 지문 변조 적용 완료');
    }

    // Canvas 지문 변조
    async mutateCanvas(page) {
        await page.addInitScript((noiseLevel) => {
            const getImageData = HTMLCanvasElement.prototype.toDataURL;
            HTMLCanvasElement.prototype.toDataURL = function() {
                const ctx = this.getContext('2d');
                if (ctx) {
                    const imageData = ctx.getImageData(0, 0, this.width, this.height);
                    const data = imageData.data;
                    
                    // 픽셀 데이터에 미세한 노이즈 추가
                    for (let i = 0; i < data.length; i += 4) {
                        if (Math.random() < noiseLevel) {
                            data[i] = Math.min(255, Math.max(0, data[i] + Math.floor((Math.random() - 0.5) * 10)));
                            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + Math.floor((Math.random() - 0.5) * 10)));
                            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + Math.floor((Math.random() - 0.5) * 10)));
                        }
                    }
                    ctx.putImageData(imageData, 0, 0);
                }
                return getImageData.apply(this, arguments);
            };

            // Canvas 컨텍스트 메서드 후킹
            const originalGetContext = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
                const context = originalGetContext.call(this, contextType, contextAttributes);
                
                if (context && contextType === '2d') {
                    // fillText에 미세한 변조 추가
                    const originalFillText = context.fillText;
                    context.fillText = function(text, x, y, maxWidth) {
                        const noise = Math.random() * 0.03 - 0.015;
                        return originalFillText.call(this, text, x + noise, y + noise, maxWidth);
                    };
                }
                
                return context;
            };

        }, this.canvasNoiseLevel);
    }

    // WebGL 지문 변조
    async mutateWebGL(page) {
        await page.addInitScript((noiseLevel) => {
            const getContext = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
                const context = getContext.call(this, contextType, contextAttributes);
                
                if (context && (contextType === 'webgl' || contextType === 'webgl2')) {
                    // WebGL 렌더러 정보 변조
                    const getParameter = context.getParameter;
                    context.getParameter = function(parameter) {
                        const result = getParameter.call(this, parameter);
                        
                        if (parameter === context.RENDERER) {
                            const variations = [
                                'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)',
                                'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti Direct3D11 vs_5_0 ps_5_0, D3D11-27.21.14.5671)',
                                'ANGLE (AMD, AMD Radeon RX 580 Series Direct3D11 vs_5_0 ps_5_0, D3D11)'
                            ];
                            return variations[Math.floor(Math.random() * variations.length)];
                        }
                        
                        if (parameter === context.VENDOR) {
                            return 'Google Inc. (Intel)';
                        }
                        
                        if (parameter === context.VERSION) {
                            return 'WebGL 1.0 (OpenGL ES 2.0 Chromium)';
                        }
                        
                        if (parameter === context.SHADING_LANGUAGE_VERSION) {
                            return 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)';
                        }
                        
                        return result;
                    };

                    // WebGL 확장 정보 변조
                    const getSupportedExtensions = context.getSupportedExtensions;
                    context.getSupportedExtensions = function() {
                        const extensions = getSupportedExtensions.call(this);
                        // 일부 확장을 랜덤하게 제거하여 지문을 변조
                        if (Math.random() < noiseLevel * 10) {
                            return extensions.filter(() => Math.random() > 0.1);
                        }
                        return extensions;
                    };
                }
                
                return context;
            };
            
        }, this.webglNoiseLevel);
    }

    // Audio Context 지문 변조
    async mutateAudioContext(page) {
        await page.addInitScript((noiseLevel) => {
            if (window.AudioContext || window.webkitAudioContext) {
                const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
                
                function PatchedAudioContext() {
                    const context = new OriginalAudioContext();
                    
                    // createAnalyser 메서드 패치
                    const originalCreateAnalyser = context.createAnalyser;
                    context.createAnalyser = function() {
                        const analyser = originalCreateAnalyser.call(this);
                        const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;
                        
                        analyser.getFloatFrequencyData = function(array) {
                            originalGetFloatFrequencyData.call(this, array);
                            // 미세한 노이즈 추가
                            for (let i = 0; i < array.length; i++) {
                                if (Math.random() < noiseLevel * 100) {
                                    array[i] += (Math.random() - 0.5) * noiseLevel * 10;
                                }
                            }
                        };
                        
                        return analyser;
                    };
                    
                    return context;
                }
                
                // AudioContext 대체
                if (window.AudioContext) {
                    window.AudioContext = PatchedAudioContext;
                }
                if (window.webkitAudioContext) {
                    window.webkitAudioContext = PatchedAudioContext;
                }
            }
            
        }, this.audioNoiseLevel);
    }

    // WebRTC 지문 변조
    async mutateWebRTC(page) {
        await page.addInitScript(() => {
            if (window.RTCPeerConnection) {
                const originalRTCPeerConnection = window.RTCPeerConnection;
                
                window.RTCPeerConnection = function(configuration) {
                    // 가짜 ICE 후보자 생성
                    const fakeLocalIPs = [
                        '192.168.1.' + (Math.floor(Math.random() * 254) + 2),
                        '10.0.0.' + (Math.floor(Math.random() * 254) + 2),
                        '172.16.0.' + (Math.floor(Math.random() * 254) + 2)
                    ];
                    
                    const connection = new originalRTCPeerConnection(configuration);
                    
                    // createOffer 메서드 패치
                    const originalCreateOffer = connection.createOffer;
                    connection.createOffer = function(options) {
                        return originalCreateOffer.call(this, options).then(offer => {
                            // SDP에서 IP 주소 변조
                            if (offer.sdp) {
                                const fakeIP = fakeLocalIPs[Math.floor(Math.random() * fakeLocalIPs.length)];
                                offer.sdp = offer.sdp.replace(
                                    /c=IN IP4 \d+\.\d+\.\d+\.\d+/g, 
                                    `c=IN IP4 ${fakeIP}`
                                );
                            }
                            return offer;
                        });
                    };
                    
                    return connection;
                };
                
                // 원래 프로토타입 복사
                window.RTCPeerConnection.prototype = originalRTCPeerConnection.prototype;
            }
        });
    }

    // 시간대 지문 변조
    async mutateTimezone(page) {
        await page.addInitScript(() => {
            // 일반적인 시간대 중 하나로 고정
            const commonTimezones = [
                'America/New_York',
                'America/Los_Angeles', 
                'Europe/London',
                'Europe/Berlin',
                'Asia/Tokyo',
                'Asia/Shanghai'
            ];
            
            const selectedTimezone = commonTimezones[Math.floor(Math.random() * commonTimezones.length)];
            
            // Intl.DateTimeFormat의 timeZone 변조
            const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
            Intl.DateTimeFormat.prototype.resolvedOptions = function() {
                const options = originalResolvedOptions.call(this);
                if (!this._customTimeZone) {
                    options.timeZone = selectedTimezone;
                }
                return options;
            };

            // Date 객체의 getTimezoneOffset 변조
            const timezoneOffsets = {
                'America/New_York': 300,
                'America/Los_Angeles': 480,
                'Europe/London': 0,
                'Europe/Berlin': -60,
                'Asia/Tokyo': -540,
                'Asia/Shanghai': -480
            };
            
            const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
            Date.prototype.getTimezoneOffset = function() {
                return timezoneOffsets[selectedTimezone] || originalGetTimezoneOffset.call(this);
            };
        });
    }

    // 언어 설정 지문 변조
    async mutateLanguages(page) {
        await page.addInitScript(() => {
            const languageProfiles = [
                ['en-US', 'en'],
                ['en-GB', 'en'],
                ['de-DE', 'de', 'en-US', 'en'],
                ['fr-FR', 'fr', 'en-US', 'en'],
                ['ja-JP', 'ja', 'en-US', 'en'],
                ['ko-KR', 'ko', 'en-US', 'en']
            ];
            
            const selectedProfile = languageProfiles[Math.floor(Math.random() * languageProfiles.length)];
            
            Object.defineProperty(navigator, 'language', {
                get: () => selectedProfile[0],
                configurable: true
            });
            
            Object.defineProperty(navigator, 'languages', {
                get: () => selectedProfile,
                configurable: true
            });
        });
    }

    // 현재 변조 설정 정보 반환
    getSettings() {
        return {
            canvasNoiseLevel: this.canvasNoiseLevel,
            webglNoiseLevel: this.webglNoiseLevel,
            audioNoiseLevel: this.audioNoiseLevel
        };
    }

    // 새로운 노이즈 레벨로 갱신
    regenerateSettings() {
        this.canvasNoiseLevel = Math.random() * 0.1 + 0.05;
        this.webglNoiseLevel = Math.random() * 0.05 + 0.02;
        this.audioNoiseLevel = Math.random() * 0.001 + 0.0005;
        
        console.log('🔄 지문 변조 설정 갱신 완료');
        return this.getSettings();
    }
}

module.exports = FingerprintMutation;