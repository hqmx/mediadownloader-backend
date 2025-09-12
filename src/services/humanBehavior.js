/**
 * Human Behavior Simulation Engine
 * 고급 인간 행동 패턴 시뮬레이션 시스템
 */

class HumanBehaviorSimulation {
    constructor() {
        this.sessionStartTime = Date.now();
        this.mouseTrajectory = [];
        this.behaviorProfile = this.generateBehaviorProfile();
    }

    // 행동 프로파일 생성 (각 사용자마다 고유한 패턴)
    generateBehaviorProfile() {
        return {
            mouseSpeed: 100 + Math.random() * 200,        // 100-300px/sec
            clickDelay: 50 + Math.random() * 100,         // 50-150ms
            scrollSpeed: 3 + Math.random() * 7,           // 3-10 units
            typingSpeed: 80 + Math.random() * 40,         // 80-120 WPM
            readingPause: 500 + Math.random() * 1500,     // 0.5-2초
            attentionSpan: 5000 + Math.random() * 10000,  // 5-15초
            fidgetiness: Math.random(),                    // 0-1 (얼마나 자주 움직이는가)
            cautiousness: Math.random(),                   // 0-1 (얼마나 신중한가)
            curiosity: Math.random()                       // 0-1 (얼마나 탐험적인가)
        };
    }

    // Playwright 페이지에 고급 인간 행동 적용
    async simulateRealisticBehavior(page) {
        console.log('🤖 고급 인간 행동 시뮬레이션 시작...');
        
        // 초기 페이지 로딩 대기 (인간적 반응 시간)
        await this.simulateInitialPageLoad(page);
        
        // 자연스러운 마우스 입장
        await this.naturalMouseEntry(page);
        
        // 페이지 탐색 행동
        await this.explorePageNaturally(page);
        
        // 주의 집중 패턴
        await this.simulateAttentionPattern(page);
        
        console.log('✅ 인간 행동 시뮬레이션 완료');
    }

    // 초기 페이지 로딩 시 인간적 반응
    async simulateInitialPageLoad(page) {
        // 페이지 로딩을 기다리는 동안의 자연스러운 행동
        const loadWaitTime = 1500 + Math.random() * 2000; // 1.5-3.5초
        
        // 로딩 중 작은 마우스 움직임
        const startTime = Date.now();
        while (Date.now() - startTime < loadWaitTime) {
            await page.mouse.move(
                Math.random() * 100,
                Math.random() * 100,
                { steps: 1 }
            );
            await page.waitForTimeout(200 + Math.random() * 300);
        }
    }

    // 자연스러운 마우스 입장 패턴
    async naturalMouseEntry(page) {
        const viewport = await page.viewportSize();
        const entryPoints = [
            { x: 0, y: viewport.height / 2 },        // 왼쪽 중앙
            { x: viewport.width / 2, y: 0 },         // 상단 중앙  
            { x: viewport.width, y: viewport.height / 2 }, // 우측 중앙
            { x: viewport.width / 2, y: viewport.height }  // 하단 중앙
        ];
        
        const entry = entryPoints[Math.floor(Math.random() * entryPoints.length)];
        
        // 화면 경계에서 시작
        await page.mouse.move(entry.x, entry.y, { steps: 1 });
        
        // 베지어 곡선을 따라 자연스럽게 중앙으로 이동
        const targetX = viewport.width / 2 + (Math.random() - 0.5) * 200;
        const targetY = viewport.height / 2 + (Math.random() - 0.5) * 200;
        
        await this.moveMouseWithBezier(page, entry.x, entry.y, targetX, targetY);
    }

    // 베지어 곡선을 따른 자연스러운 마우스 이동
    async moveMouseWithBezier(page, startX, startY, endX, endY) {
        const steps = 20 + Math.random() * 30; // 20-50 단계
        const controlPoints = this.generateBezierControlPoints(startX, startY, endX, endY);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const point = this.calculateBezierPoint(t, 
                { x: startX, y: startY },
                controlPoints.cp1,
                controlPoints.cp2,
                { x: endX, y: endY }
            );
            
            // 미세한 떨림 추가 (인간의 손떨림 시뮬레이션)
            const jitterX = (Math.random() - 0.5) * 2;
            const jitterY = (Math.random() - 0.5) * 2;
            
            await page.mouse.move(
                point.x + jitterX, 
                point.y + jitterY, 
                { steps: 1 }
            );
            
            // 속도 변화 (시작과 끝에서 느림)
            const speedFactor = Math.sin(t * Math.PI); // 0에서 1로 갔다가 0으로
            const delay = (1 / this.behaviorProfile.mouseSpeed) * 1000 / speedFactor;
            await page.waitForTimeout(Math.max(10, delay));
        }
        
        // 마우스 경로 기록
        this.mouseTrajectory.push({ x: endX, y: endY, timestamp: Date.now() });
    }

    // 베지어 곡선 제어점 생성
    generateBezierControlPoints(startX, startY, endX, endY) {
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        
        // 곡선의 "굽힘" 정도를 랜덤하게 설정
        const curvature = 50 + Math.random() * 100;
        const angle = Math.random() * Math.PI * 2;
        
        return {
            cp1: {
                x: midX + Math.cos(angle) * curvature,
                y: midY + Math.sin(angle) * curvature
            },
            cp2: {
                x: midX - Math.cos(angle) * curvature,
                y: midY - Math.sin(angle) * curvature
            }
        };
    }

    // 베지어 곡선 상의 점 계산
    calculateBezierPoint(t, p0, p1, p2, p3) {
        const oneMinusT = 1 - t;
        return {
            x: oneMinusT * oneMinusT * oneMinusT * p0.x +
               3 * oneMinusT * oneMinusT * t * p1.x +
               3 * oneMinusT * t * t * p2.x +
               t * t * t * p3.x,
            y: oneMinusT * oneMinusT * oneMinusT * p0.y +
               3 * oneMinusT * oneMinusT * t * p1.y +
               3 * oneMinusT * t * t * p2.y +
               t * t * t * p3.y
        };
    }

    // 페이지를 자연스럽게 탐색
    async explorePageNaturally(page) {
        const viewport = await page.viewportSize();
        const explorationTime = 3000 + Math.random() * 7000; // 3-10초 탐색
        const startTime = Date.now();
        
        while (Date.now() - startTime < explorationTime) {
            // 읽기 패턴 시뮬레이션 (Z 패턴 또는 F 패턴)
            if (Math.random() > 0.5) {
                await this.simulateZPattern(page, viewport);
            } else {
                await this.simulateFPattern(page, viewport);
            }
            
            // 가끔 스크롤
            if (Math.random() > 0.7) {
                await this.naturalScroll(page);
            }
            
            // 호버 효과 확인 (인간은 종종 요소에 마우스를 올린다)
            if (Math.random() > 0.6) {
                await this.hoverRandomElement(page);
            }
            
            await page.waitForTimeout(500 + Math.random() * 1500);
        }
    }

    // Z 패턴 읽기 시뮬레이션
    async simulateZPattern(page, viewport) {
        const points = [
            { x: 50, y: 100 },                           // 좌상단
            { x: viewport.width - 50, y: 120 },          // 우상단
            { x: 50, y: viewport.height / 2 },           // 좌중단
            { x: viewport.width - 50, y: viewport.height / 2 + 20 } // 우중단
        ];
        
        for (const point of points) {
            await this.moveMouseWithBezier(
                page,
                this.mouseTrajectory[this.mouseTrajectory.length - 1]?.x || viewport.width / 2,
                this.mouseTrajectory[this.mouseTrajectory.length - 1]?.y || viewport.height / 2,
                point.x,
                point.y
            );
            
            // 읽기 시간 시뮬레이션
            await page.waitForTimeout(this.behaviorProfile.readingPause);
        }
    }

    // F 패턴 읽기 시뮬레이션
    async simulateFPattern(page, viewport) {
        const points = [
            { x: 50, y: 100 },                    // 좌상단
            { x: viewport.width - 100, y: 100 },  // 우상단 (첫 번째 수평선)
            { x: 50, y: 200 },                    // 좌측 돌아가기
            { x: viewport.width / 2, y: 200 },    // 중앙까지 (두 번째 수평선)
            { x: 50, y: 300 },                    // 좌측 (수직 스캔 시작)
            { x: 50, y: 400 },                    // 수직 스캔 계속
            { x: 50, y: 500 }                     // 수직 스캔 끝
        ];
        
        for (const point of points) {
            await this.moveMouseWithBezier(
                page,
                this.mouseTrajectory[this.mouseTrajectory.length - 1]?.x || viewport.width / 2,
                this.mouseTrajectory[this.mouseTrajectory.length - 1]?.y || viewport.height / 2,
                point.x,
                point.y
            );
            
            await page.waitForTimeout(this.behaviorProfile.readingPause * 0.7);
        }
    }

    // 자연스러운 스크롤
    async naturalScroll(page) {
        const scrollAmount = this.behaviorProfile.scrollSpeed * (50 + Math.random() * 200);
        const scrollSteps = 5 + Math.random() * 10;
        const stepAmount = scrollAmount / scrollSteps;
        
        for (let i = 0; i < scrollSteps; i++) {
            await page.evaluate((step) => {
                window.scrollBy(0, step);
            }, stepAmount);
            
            await page.waitForTimeout(30 + Math.random() * 70);
        }
        
        // 스크롤 후 약간의 정착 시간
        await page.waitForTimeout(200 + Math.random() * 500);
    }

    // 랜덤 요소에 호버
    async hoverRandomElement(page) {
        try {
            const elements = await page.$$('a, button, [role="button"], .yt-simple-endpoint');
            if (elements.length > 0) {
                const randomElement = elements[Math.floor(Math.random() * elements.length)];
                const box = await randomElement.boundingBox();
                
                if (box) {
                    await this.moveMouseWithBezier(
                        page,
                        this.mouseTrajectory[this.mouseTrajectory.length - 1]?.x || 0,
                        this.mouseTrajectory[this.mouseTrajectory.length - 1]?.y || 0,
                        box.x + box.width / 2,
                        box.y + box.height / 2
                    );
                    
                    // 호버 시간
                    await page.waitForTimeout(300 + Math.random() * 1200);
                }
            }
        } catch (error) {
            // 요소를 찾을 수 없어도 계속 진행
            console.log('호버할 요소를 찾을 수 없음');
        }
    }

    // 주의 집중 패턴 시뮬레이션
    async simulateAttentionPattern(page) {
        const focusTime = this.behaviorProfile.attentionSpan;
        const startTime = Date.now();
        
        // 집중된 행동 (마우스 움직임 적음)
        while (Date.now() - startTime < focusTime * 0.7) {
            // 아주 작은 마우스 움직임만
            const currentPos = this.mouseTrajectory[this.mouseTrajectory.length - 1];
            if (currentPos) {
                await page.mouse.move(
                    currentPos.x + (Math.random() - 0.5) * 10,
                    currentPos.y + (Math.random() - 0.5) * 10,
                    { steps: 1 }
                );
            }
            
            await page.waitForTimeout(1000 + Math.random() * 2000);
        }
        
        // 집중력 분산 (더 활발한 움직임)
        while (Date.now() - startTime < focusTime) {
            if (Math.random() > 0.5) {
                await this.naturalScroll(page);
            }
            
            if (Math.random() > 0.6) {
                const viewport = await page.viewportSize();
                await this.moveMouseWithBezier(
                    page,
                    this.mouseTrajectory[this.mouseTrajectory.length - 1]?.x || 0,
                    this.mouseTrajectory[this.mouseTrajectory.length - 1]?.y || 0,
                    Math.random() * viewport.width,
                    Math.random() * viewport.height
                );
            }
            
            await page.waitForTimeout(300 + Math.random() * 800);
        }
    }

    // 타이핑 패턴 시뮬레이션 (검색어 입력 등에 사용)
    async simulateTyping(page, selector, text) {
        const element = await page.$(selector);
        if (!element) return;
        
        await element.click();
        await page.waitForTimeout(this.behaviorProfile.clickDelay);
        
        // 문자별로 타이핑
        for (let i = 0; i < text.length; i++) {
            await page.keyboard.type(text[i]);
            
            // 타이핑 속도 변화 (WPM 기반)
            const baseDelay = 60000 / (this.behaviorProfile.typingSpeed * 5); // 5글자/단어 가정
            const variation = baseDelay * (Math.random() * 0.5 + 0.75); // 25% 빠름 ~ 25% 느림
            
            await page.waitForTimeout(variation);
            
            // 가끔 오타 수정 시뮬레이션
            if (Math.random() < 0.02 && i < text.length - 1) { // 2% 확률
                await page.keyboard.press('Backspace');
                await page.waitForTimeout(200 + Math.random() * 300);
                i--; // 다시 같은 문자 타이핑
            }
        }
    }

    // 행동 통계 반환
    getBehaviorStats() {
        return {
            sessionDuration: Date.now() - this.sessionStartTime,
            mouseMovements: this.mouseTrajectory.length,
            behaviorProfile: this.behaviorProfile
        };
    }

    // 새로운 세션을 위한 리셋
    resetSession() {
        this.sessionStartTime = Date.now();
        this.mouseTrajectory = [];
        this.behaviorProfile = this.generateBehaviorProfile();
        console.log('🔄 인간 행동 프로파일 리셋 완료');
    }
}

module.exports = HumanBehaviorSimulation;