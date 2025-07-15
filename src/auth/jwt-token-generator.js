const axios = require('axios');
require('dotenv').config();

class JWTTokenGenerator {
  constructor() {
    this.apiUrl = process.env.DATASWIFT_API_URL || 'https://postman.hubat.net';
    this.username = process.env.DATASWIFT_USERNAME;
    this.password = process.env.DATASWIFT_PASSWORD;
    
    if (!this.username || !this.password) {
      throw new Error('DATASWIFT_USERNAME and DATASWIFT_PASSWORD are required');
    }
  }

  async generateJWTToken() {
    try {
      console.log('🔐 Generating JWT token for Dataswift authentication...');
      console.log(`📡 API URL: ${this.apiUrl}/users/access_token`);
      console.log(`👤 Username: ${this.username}`);
      
      const response = await axios.get(`${this.apiUrl}/users/access_token`, {
        headers: {
          'Accept': 'application/json',
          'username': this.username,
          'password': this.password
        },
        timeout: 30000
      });

      console.log('📊 JWT Token Response Status:', response.status);
      console.log('📋 JWT Token Response:', response.data);

      if (response.data) {
        // Check if response contains a token property or if the entire response is the token
        const token = response.data.token || response.data.access_token || response.data;
        
        if (typeof token === 'string') {
          console.log('✅ JWT token generated successfully!');
          return token;
        } else {
          console.log('📦 Full response structure:', JSON.stringify(response.data, null, 2));
          throw new Error('JWT token not found in response');
        }
      } else {
        throw new Error('No response data received');
      }
      
    } catch (error) {
      if (error.response) {
        console.error('🚨 JWT Token Generation Error:', error.response.status, error.response.data);
        throw new Error(`JWT token generation failed: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error('JWT token generation failed: Network error or timeout');
      } else {
        throw new Error(`JWT token generation error: ${error.message}`);
      }
    }
  }

  async validateJWTToken(token) {
    // Simple validation - check if token exists and is a string
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // Basic JWT structure check (should have 3 parts separated by dots)
    const parts = token.split('.');
    return parts.length === 3;
  }
}

module.exports = JWTTokenGenerator;