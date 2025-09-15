/**
 * 진짜 사람처럼 브라우저를 조작하는 시뮬레이터
 * YouTube 봇 감지를 완전히 우회하는 인간 행동 패턴 구현
 */

class HumanBehaviorSimulator {
  constructor() {
    this.patterns = {
      // 마우스 움직임 패턴 (실제 인간의 마우스 트래킹 데이터 기반)
      mouse: {
        jitter: { min: 1, max: 3 },        // 미세한 떨림
        pause: { min: 100, max: 300 },     // 움직임 사이 일시정지
        curve: { points: 15, variance: 5 } // 곡선 경로
      },

      // 스크롤 패턴
      scroll: {
        speed: { min: 50, max: 200 },      // 스크롤 속도 variation
        pause: { min: 800, max: 2500 },    // 스크롤 후 읽기 시간
        distance: { min: 200, max: 600 }   // 한 번에 스크롤하는 거리
      },

      // 키보드 타이핑 패턴
      typing: {
        wpm: { min: 45, max: 85 },         // 분당 타이핑 속도
        pause: { min: 50, max: 200 },      // 키 사이 지연
        mistake: 0.02                      // 오타 확률 (2%)
      },

      // 페이지 상호작용 패턴
      interaction: {
        hover: { min: 500, max: 1500 },    // 요소 위 머무는 시간
        click: { min: 80, max: 120 },      // 클릭 지속 시간
        focus: { min: 200, max: 800 }      // 포커스 전 대기
      }
    };

    // 현재 세션의 행동 특성 (개인별 고유 패턴)
    this.personalProfile = this.generatePersonalProfile();
  }

  // 개인별 고유한 행동 패턴 생성
  generatePersonalProfile() {
    return {
      mouseSpeed: 0.7 + Math.random() * 0.6,        // 0.7 ~ 1.3
      scrollHabit: Math.random() < 0.3 ? 'fast' : 'normal', // 빠른 스크롤러 vs 보통
      readingPause: 1000 + Math.random() * 2000,     // 읽기 시간 개인차
      clickStyle: Math.random() < 0.2 ? 'quick' : 'deliberate', // 클릭 스타일
      attentionSpan: 5000 + Math.random() * 10000,   // 집중 지속 시간
      curiosityLevel: Math.random()                   // 탐색 욕구 (0-1)
    };
  }

  // 🎯 진짜 사람처럼 YouTube 메인 페이지 브라우징
  async browseYouTubeNaturally(page) {
    console.log('🎭 자연스러운 YouTube 브라우징 시작...');

    // 1. 페이지 로드 후 자연스러운 대기
    await this.naturalPageLoadWait(page);

    // 2. 초기 시선 이동 (실제 사람이 화면을 훑어보는 패턴)
    await this.simulateInitialGaze(page);

    // 3. 추천 비디오 탐색 (호기심 기반)
    await this.exploreRecommendedVideos(page);

    // 4. 스크롤하며 콘텐츠 탐색
    await this.naturalScrollExploration(page);

    // 5. 랜덤한 상호작용 (검색, 메뉴 클릭 등)
    await this.randomInteractions(page);

    console.log('✅ 자연스러운 브라우징 완료');
  }

  // 페이지 로드 후 실제 사람이 기다리는 패턴
  async naturalPageLoadWait(page) {
    // 페이지 로딩 완료까지 기다림
    await page.waitForLoadState('domcontentloaded');

    // 사람이 페이지를 인식하는 시간 (0.5~2초)
    const recognitionTime = 500 + Math.random() * 1500;
    await page.waitForTimeout(recognitionTime);

    // 네트워크가 완전히 안정될 때까지 추가 대기
    await page.waitForLoadState('networkidle');

    // 사람이 화면을 정리해서 보는 시간
    const processTime = 300 + Math.random() * 700;
    await page.waitForTimeout(processTime);
  }

  // 초기 시선 이동 패턴 (사람이 화면을 처음 볼 때)
  async simulateInitialGaze(page) {
    const viewport = page.viewportSize();

    // F-패턴 읽기 (서구권 사용자의 일반적 시선 패턴)
    const gazePoints = [
      { x: viewport.width * 0.1, y: viewport.height * 0.15 },  // 좌상단
      { x: viewport.width * 0.8, y: viewport.height * 0.15 },  // 우상단 (헤더)
      { x: viewport.width * 0.1, y: viewport.height * 0.4 },   // 좌측 중앙
      { x: viewport.width * 0.5, y: viewport.height * 0.4 },   // 중앙
      { x: viewport.width * 0.1, y: viewport.height * 0.7 }    // 좌하단
    ];

    for (const point of gazePoints) {
      await this.moveMouseNaturally(page, point.x, point.y);

      // 시선 머무는 시간 (읽기/인식 시간)
      const gazeTime = 200 + Math.random() * 500;
      await page.waitForTimeout(gazeTime);
    }
  }

  // 추천 비디오 탐색 (호기심 기반 행동)
  async exploreRecommendedVideos(page) {
    try {
      // YouTube 추천 비디오 썸네일 찾기
      const videoThumbnails = await page.$$('ytd-rich-item-renderer img, ytd-compact-video-renderer img');

      if (videoThumbnails.length === 0) return;

      // 개인 호기심 수준에 따라 탐색할 비디오 수 결정
      const exploreTo = Math.min(
        Math.floor(this.personalProfile.curiosityLevel * 5) + 2,
        videoThumbnails.length
      );

      console.log(`🔍 ${exploreTo}개의 추천 비디오 탐색 중...`);

      for (let i = 0; i < exploreTo; i++) {
        const thumbnail = videoThumbnails[i];

        // 썸네일 위로 마우스 이동 (hover 효과)
        await this.hoverElement(page, thumbnail);

        // 제목 읽는 시간 (썸네일 크기와 개인 읽기 속도 고려)
        const readingTime = this.personalProfile.readingPause * (0.5 + Math.random() * 0.5);
        await page.waitForTimeout(readingTime);

        // 20% 확률로 실제 클릭 (하지만 즉시 뒤로가기)
        if (Math.random() < 0.2) {
          await this.clickElement(page, thumbnail);
          await page.waitForTimeout(1000 + Math.random() * 2000);
          await page.goBack();
          await page.waitForTimeout(500 + Math.random() * 1000);
        }
      }
    } catch (error) {
      console.log('추천 비디오 탐색 중 오류 (무시):', error.message);
    }
  }

  // 자연스러운 스크롤 탐색
  async naturalScrollExploration(page) {
    const scrollCount = 2 + Math.floor(Math.random() * 4); // 2~5번 스크롤

    for (let i = 0; i < scrollCount; i++) {
      // 스크롤 거리 (개인 습관에 따라)
      const scrollDistance = this.personalProfile.scrollHabit === 'fast'
        ? this.patterns.scroll.distance.max
        : this.patterns.scroll.distance.min + Math.random() * 200;

      // 부드러운 스크롤 (실제 마우스 휠과 유사)
      await this.smoothScroll(page, scrollDistance);

      // 스크롤 후 내용 읽기/관찰 시간
      const pauseTime = this.patterns.scroll.pause.min +
                       Math.random() * (this.patterns.scroll.pause.max - this.patterns.scroll.pause.min);
      await page.waitForTimeout(pauseTime);

      // 가끔 위로 살짝 스크롤 (재확인 행동)
      if (Math.random() < 0.3) {
        await this.smoothScroll(page, -100);
        await page.waitForTimeout(500);
      }
    }
  }

  // 랜덤한 상호작용 (더 사람다운 행동)
  async randomInteractions(page) {
    const interactions = [];

    // 검색창 클릭 (30% 확률)
    if (Math.random() < 0.3) {
      interactions.push(() => this.interactWithSearchBox(page));
    }

    // 메뉴 버튼 호버 (20% 확률)
    if (Math.random() < 0.2) {
      interactions.push(() => this.hoverMenuItems(page));
    }

    // 페이지 새로고침 (10% 확률)
    if (Math.random() < 0.1) {
      interactions.push(() => this.naturalRefresh(page));
    }

    // 실행
    for (const interaction of interactions) {
      try {
        await interaction();
      } catch (error) {
        console.log('상호작용 중 오류 (무시):', error.message);
      }
    }
  }

  // 🎯 목표 비디오로 자연스럽게 이동
  async navigateToTargetVideo(page, targetUrl) {
    console.log('🎯 목표 비디오로 자연스럽게 이동...');

    // 1. 주소창 클릭 (실제 사람처럼)
    await this.navigateViaAddressBar(page, targetUrl);

    // 2. 페이지 로드 대기
    await this.naturalPageLoadWait(page);

    // 3. 비디오 페이지에서의 자연스러운 행동
    await this.naturalVideoPageBehavior(page);
  }

  // 주소창을 통한 자연스러운 네비게이션
  async navigateViaAddressBar(page, url) {
    // 주소창 클릭 (Ctrl+L과 유사한 효과)
    await page.keyboard.press('Control+l');
    await page.waitForTimeout(200 + Math.random() * 300);

    // URL 타이핑 (실제 사람의 타이핑 패턴)
    await this.typeNaturally(page, url);

    // Enter 키 누르기
    await page.keyboard.press('Enter');
  }

  // 비디오 페이지에서의 자연스러운 행동
  async naturalVideoPageBehavior(page) {
    // 1. 비디오 제목 읽기
    await this.readVideoTitle(page);

    // 2. 비디오 플레이어 영역 관찰
    await this.observeVideoPlayer(page);

    // 3. 설명란 스크롤
    await this.exploreDescription(page);

    // 4. 댓글 섹션 훑어보기
    await this.browseComments(page);
  }

  // ========== 기본 행동 메서드들 ==========

  // 자연스러운 마우스 이동
  async moveMouseNaturally(page, x, y) {
    const currentPos = await page.mouse.position || { x: 0, y: 0 };

    // 베지어 곡선을 이용한 자연스러운 경로
    const steps = 10 + Math.floor(Math.random() * 10);

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;

      // 이징 함수 적용 (실제 사람의 마우스 가속/감속 패턴)
      const easeProgress = this.easeInOutCubic(progress);

      const newX = currentPos.x + (x - currentPos.x) * easeProgress;
      const newY = currentPos.y + (y - currentPos.y) * easeProgress;

      // 미세한 지터 추가 (손떨림 시뮬레이션)
      const jitterX = (Math.random() - 0.5) * this.patterns.mouse.jitter.max;
      const jitterY = (Math.random() - 0.5) * this.patterns.mouse.jitter.max;

      await page.mouse.move(newX + jitterX, newY + jitterY);

      // 이동 사이의 자연스러운 지연
      const delay = this.patterns.mouse.pause.min +
                   Math.random() * (this.patterns.mouse.pause.max - this.patterns.mouse.pause.min);
      await page.waitForTimeout(delay * this.personalProfile.mouseSpeed);
    }
  }

  // 요소 위에 자연스럽게 호버
  async hoverElement(page, element) {
    const box = await element.boundingBox();
    if (!box) return;

    // 요소 중앙에서 약간 랜덤한 위치
    const x = box.x + box.width * (0.3 + Math.random() * 0.4);
    const y = box.y + box.height * (0.3 + Math.random() * 0.4);

    await this.moveMouseNaturally(page, x, y);

    // 호버 시간
    const hoverTime = this.patterns.interaction.hover.min +
                     Math.random() * (this.patterns.interaction.hover.max - this.patterns.interaction.hover.min);
    await page.waitForTimeout(hoverTime);
  }

  // 자연스러운 클릭
  async clickElement(page, element) {
    await this.hoverElement(page, element);

    // 클릭 전 포커스 시간
    const focusTime = this.patterns.interaction.focus.min +
                     Math.random() * (this.patterns.interaction.focus.max - this.patterns.interaction.focus.min);
    await page.waitForTimeout(focusTime);

    // 실제 클릭 (press down -> wait -> release)
    await page.mouse.down();

    const clickDuration = this.patterns.interaction.click.min +
                         Math.random() * (this.patterns.interaction.click.max - this.patterns.interaction.click.min);
    await page.waitForTimeout(clickDuration);

    await page.mouse.up();
  }

  // 부드러운 스크롤
  async smoothScroll(page, distance) {
    const steps = 5 + Math.floor(Math.random() * 5);
    const stepDistance = distance / steps;

    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, stepDistance);

      const stepDelay = 50 + Math.random() * 100;
      await page.waitForTimeout(stepDelay);
    }
  }

  // 자연스러운 타이핑
  async typeNaturally(page, text) {
    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // 오타 시뮬레이션 (매우 낮은 확률)
      if (Math.random() < this.patterns.typing.mistake) {
        // 잘못된 키 입력 후 백스페이스
        await page.keyboard.type('x');
        await page.waitForTimeout(100 + Math.random() * 200);
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(100 + Math.random() * 200);
      }

      await page.keyboard.type(char);

      // 타이핑 속도 variation
      const typingDelay = this.patterns.typing.pause.min +
                         Math.random() * (this.patterns.typing.pause.max - this.patterns.typing.pause.min);
      await page.waitForTimeout(typingDelay);
    }
  }

  // ========== 특화된 YouTube 행동들 ==========

  async interactWithSearchBox(page) {
    try {
      const searchBox = await page.$('input#search');
      if (!searchBox) return;

      await this.clickElement(page, searchBox);
      await page.waitForTimeout(500 + Math.random() * 1000);

      // 검색어 일부 타이핑 후 취소 (호기심 표현)
      await this.typeNaturally(page, 'music');
      await page.waitForTimeout(1000 + Math.random() * 2000);

      // 검색어 지우기
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Backspace');
    } catch (error) {
      // 무시
    }
  }

  async hoverMenuItems(page) {
    try {
      const menuButton = await page.$('button[aria-label*="menu"], button[title*="menu"]');
      if (menuButton) {
        await this.hoverElement(page, menuButton);
      }
    } catch (error) {
      // 무시
    }
  }

  async readVideoTitle(page) {
    try {
      const titleElement = await page.$('h1.ytd-watch-metadata yt-formatted-string');
      if (titleElement) {
        await this.hoverElement(page, titleElement);

        // 제목 읽는 시간 (제목 길이에 비례)
        const titleText = await titleElement.textContent();
        const readingTime = Math.max(1000, titleText.length * 50); // 글자당 50ms
        await page.waitForTimeout(readingTime);
      }
    } catch (error) {
      // 무시
    }
  }

  async observeVideoPlayer(page) {
    try {
      const player = await page.$('#movie_player, .video-player');
      if (player) {
        await this.hoverElement(page, player);
        await page.waitForTimeout(2000 + Math.random() * 3000);
      }
    } catch (error) {
      // 무시
    }
  }

  async exploreDescription(page) {
    // 설명란까지 스크롤
    await this.smoothScroll(page, 300);
    await page.waitForTimeout(1000 + Math.random() * 2000);
  }

  async browseComments(page) {
    // 댓글 섹션까지 스크롤
    await this.smoothScroll(page, 500);
    await page.waitForTimeout(1500 + Math.random() * 2500);
  }

  async naturalRefresh(page) {
    await page.keyboard.press('F5');
    await this.naturalPageLoadWait(page);
  }

  // ========== 유틸리티 함수들 ==========

  // 이징 함수 (자연스러운 가속/감속)
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  // 세션 리셋 (새로운 사용자 프로필 생성)
  resetSession() {
    this.personalProfile = this.generatePersonalProfile();
    console.log('🔄 인간 행동 프로파일 리셋 완료');
  }
}

module.exports = HumanBehaviorSimulator;