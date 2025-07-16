const axios = require('axios');
require('dotenv').config();

/**
 * Dataswyft Wallet API Client
 * Handles authentication and data storage to Dataswyft wallet namespaces
 */
class DataswiftWalletClient {
  constructor() {
    this.apiUrl = process.env.DATASWIFT_API_URL;
    this.username = process.env.DATASWIFT_USERNAME;
    this.password = process.env.DATASWIFT_PASSWORD;
    
    if (!this.apiUrl || !this.username || !this.password) {
      throw new Error('DATASWIFT_API_URL, DATASWIFT_USERNAME, and DATASWIFT_PASSWORD are required in environment variables');
    }
    
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get access token from Dataswyft API
   * @returns {Promise<string>} Access token
   */
  async getAccessToken() {
    try {
      console.log('🔄 Getting Dataswyft access token...');
      
      const response = await axios.get(`${this.apiUrl}/users/access_token`, {
        headers: {
          'Accept': 'application/json',
          'username': this.username,
          'password': this.password
        },
        timeout: 30000
      });

      console.log('✅ Access token obtained successfully!');
      
      // Store token and set expiry (assuming 1 hour expiry)
      this.accessToken = response.data.accessToken || response.data;
      this.tokenExpiry = Date.now() + (60 * 60 * 1000); // 1 hour from now
      
      return this.accessToken;
      
    } catch (error) {
      console.error('❌ Failed to get access token:', error.response?.data || error.message);
      throw new Error(`Failed to get Dataswyft access token: ${error.message}`);
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   * @returns {Promise<string>} Valid access token
   */
  async getValidAccessToken() {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }
    
    // Get new token
    return await this.getAccessToken();
  }

  /**
   * Write data to a specific namespace in Dataswyft wallet
   * @param {string} namespace - The namespace to write to (e.g., 'zoho_crm')
   * @param {string} endpoint - The endpoint path (e.g., 'contacts')
   * @param {Object} data - The data to write
   * @returns {Promise<Object>} Response from Dataswyft API including recordId
   */
  async writeToNamespace(namespace, endpoint, data) {
    try {
      console.log(`🔄 Writing data to namespace: ${namespace}/${endpoint}`);
      
      const accessToken = await this.getValidAccessToken();
      
      const response = await axios.post(
        `${this.apiUrl}/api/v2.6/data/${namespace}/${endpoint}`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': accessToken
          },
          timeout: 30000
        }
      );

      console.log('✅ Data written successfully to Dataswyft wallet!');
      console.log(`📋 Response status: ${response.status}`);
      
      return {
        success: true,
        recordId: response.data.recordId || response.data.id,
        response: response.data,
        status: response.status
      };
      
    } catch (error) {
      console.error('❌ Failed to write to namespace:', error.response?.data || error.message);
      throw new Error(`Failed to write to Dataswyft namespace ${namespace}/${endpoint}: ${error.message}`);
    }
  }

  /**
   * Write Zoho CRM contact data to zoho-crm namespace
   * @param {Object} transformedData - Transformed contact data from ZohoCRMConnector
   * @returns {Promise<Object>} Response including recordId
   */
  async writeZohoCRMContact(transformedData) {
    // Use hyphen instead of underscore: zoho-crm/contacts
    return await this.writeToNamespace('zoho-crm', 'contacts', transformedData);
  }

  /**
   * Test the connection to Dataswyft wallet
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      console.log('🔄 Testing Dataswyft wallet connection...');
      
      const accessToken = await this.getValidAccessToken();
      
      // Test with a simple data write
      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Connection test from Zoho CRM connector'
      };
      
      const result = await this.writeToNamespace('test', 'connection', testData);
      
      console.log('✅ Dataswyft wallet connection test successful!');
      console.log(`📋 Test record ID: ${result.recordId}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Dataswyft wallet connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = DataswiftWalletClient;