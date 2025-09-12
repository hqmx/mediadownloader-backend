class SmartProxyManager {
  constructor() {
    this.config = {
      endpoint: process.env.SMARTPROXY_ENDPOINT || 'gate.smartproxy.com',
      port: process.env.SMARTPROXY_PORT || '10000',
      username: process.env.SMARTPROXY_USERNAME,
      password: process.env.SMARTPROXY_PASSWORD,
      sessionId: this.generateSessionId()
    };
    
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
    
    // SmartProxy 포맷: username-session-sessionID:password@endpoint:port
    const authString = `${username}-session-${sessionId}:${password}`;
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
      port: this.config.port
    };
  }
}

module.exports = SmartProxyManager;