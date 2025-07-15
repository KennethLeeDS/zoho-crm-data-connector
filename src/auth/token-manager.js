const ZohoOAuthClient = require('./oauth-client');

class TokenManager {
  constructor() {
    this.oauthClient = new ZohoOAuthClient();
    this.tokenCache = new Map();
    this.refreshLocks = new Map();
    this.cacheKey = 'zoho_access_token';
    this.refreshToken = process.env.ZOHO_CRM_REFRESH_TOKEN;
  }

  async getValidToken() {
    const cachedToken = this.tokenCache.get(this.cacheKey);
    
    // Check if we have a valid cached token
    if (cachedToken && await this.oauthClient.validateToken(cachedToken)) {
      return cachedToken;
    }

    // Check if token refresh is already in progress
    if (this.refreshLocks.has(this.cacheKey)) {
      const refreshPromise = this.refreshLocks.get(this.cacheKey);
      try {
        return await refreshPromise;
      } catch (error) {
        throw error;
      }
    }

    // Start token refresh
    const refreshPromise = this.refreshAccessToken();
    this.refreshLocks.set(this.cacheKey, refreshPromise);

    try {
      const newToken = await refreshPromise;
      return newToken;
    } finally {
      // Clean up the refresh lock
      this.refreshLocks.delete(this.cacheKey);
    }
  }

  async refreshAccessToken() {
    try {
      if (!this.refreshToken || this.refreshToken === 'your_refresh_token_here') {
        throw new Error('ZOHO_CRM_REFRESH_TOKEN is required. Please set it in your .env file after initial authorization.');
      }

      const tokenData = await this.oauthClient.refreshAccessToken(this.refreshToken);
      
      // Cache the new token
      this.tokenCache.set(this.cacheKey, tokenData);
      
      // Set up automatic cleanup when token expires
      this.scheduleTokenCleanup(tokenData.expiresAt);
      
      return tokenData;
    } catch (error) {
      // Clear invalid cached token
      this.tokenCache.delete(this.cacheKey);
      throw error;
    }
  }

  scheduleTokenCleanup(expiresAt) {
    const timeUntilExpiry = expiresAt - Date.now();
    
    if (timeUntilExpiry > 0) {
      setTimeout(() => {
        this.tokenCache.delete(this.cacheKey);
      }, timeUntilExpiry);
    }
  }

  async getAuthHeaders() {
    const token = await this.getValidToken();
    return {
      'Authorization': `${token.tokenType} ${token.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  clearCache() {
    this.tokenCache.clear();
    this.refreshLocks.clear();
  }

  getTokenInfo() {
    const cachedToken = this.tokenCache.get(this.cacheKey);
    if (!cachedToken) {
      return null;
    }

    return {
      hasToken: true,
      expiresAt: new Date(cachedToken.expiresAt).toISOString(),
      scope: cachedToken.scope,
      apiDomain: cachedToken.apiDomain,
      isValid: this.oauthClient.validateToken(cachedToken)
    };
  }
}

module.exports = TokenManager;