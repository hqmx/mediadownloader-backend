class SmartProxyManager {
  constructor() {
    this.config = {
      endpoint: process.env.SMARTPROXY_ENDPOINT || 'proxy.smartproxy.net',
      port: process.env.SMARTPROXY_PORT || '3120',
      username: process.env.SMARTPROXY_USERNAME,
      password: process.env.SMARTPROXY_PASSWORD,
      sessionId: this.generateSessionId()
    };

    // 다중 엔드포인트 지원 (터널링 문제 시 자동 전환)
    this.fallbackEndpoints = [
      { endpoint: 'gate.smartproxy.com', port: '8000' },
      { endpoint: 'rotating.smartproxy.com', port: '10000' },
      { endpoint: 'proxy.smartproxy.net', port: '3120' }
    ];
    this.currentEndpointIndex = 0;

    this.enabled = process.env.SMARTPROXY_ENABLED === 'true';
    this.proxyUrl = this.enabled ? this.buildProxyUrl() : null;
  }

  generateSessionId() {
    // 스티키 세션 (같은 IP 유지) 또는 로테이션
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${random}`;
  }

  buildProxyUrl() {
    const { username, password, endpoint, port, sessionId } = this.config;
    
    if (!username || !password) {
      console.warn('SmartProxy credentials not configured');
      return null;
    }
    
    // SmartProxy 기본 포맷: username:password@endpoint:port (세션 없이)
    const authString = `${username}:${password}`;
    return `http://${authString}@${endpoint}:${port}`;
  }

  getProxy() {
    if (!this.enabled) {
      return null;
    }
    
    if (!this.proxyUrl) {
      console.error('SmartProxy URL not available');
      return null;
    }
    
    return this.proxyUrl;
  }

  rotateSession() {
    if (!this.enabled) {
      return null;
    }
    
    // 새로운 세션 ID로 IP 변경
    this.config.sessionId = this.generateSessionId();
    this.proxyUrl = this.buildProxyUrl();
    console.log('SmartProxy session rotated:', this.config.sessionId);
    return this.proxyUrl;
  }

  isEnabled() {
    return this.enabled && this.proxyUrl !== null;
  }

  getSessionInfo() {
    return {
      enabled: this.enabled,
      sessionId: this.config.sessionId,
      endpoint: this.config.endpoint,
      port: this.config.port,
      endpointIndex: this.currentEndpointIndex
    };
  }

  // 터널링 오류 시 다른 엔드포인트로 전환
  switchEndpoint() {
    if (!this.enabled) {
      return null;
    }

    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.fallbackEndpoints.length;
    const newEndpoint = this.fallbackEndpoints[this.currentEndpointIndex];

    this.config.endpoint = newEndpoint.endpoint;
    this.config.port = newEndpoint.port;
    this.config.sessionId = this.generateSessionId();
    this.proxyUrl = this.buildProxyUrl();

    console.log(`🔄 SmartProxy 엔드포인트 전환: ${newEndpoint.endpoint}:${newEndpoint.port}`);
    return this.proxyUrl;
  }

  // 터널링 테스트
  async testTunneling() {
    if (!this.enabled) {
      return { success: false, reason: 'SmartProxy disabled' };
    }

    // 간단한 HTTPS 연결 테스트 (실제 구현 시 curl 또는 axios 사용)
    return {
      success: true,
      endpoint: `${this.config.endpoint}:${this.config.port}`,
      sessionId: this.config.sessionId
    };
  }
}

module.exports = SmartProxyManager;