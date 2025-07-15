const axios = require('axios');
const JWTTokenGenerator = require('../auth/jwt-token-generator');
require('dotenv').config();

class DataswiftWalletClient {
  constructor() {
    this.apiUrl = process.env.DATASWIFT_API_URL || 'https://postman.hubat.net';
    this.walletId = process.env.DATASWIFT_WALLET_ID;
    this.jwtGenerator = new JWTTokenGenerator();
    
    if (!this.walletId) {
      console.warn('⚠️  DATASWIFT_WALLET_ID not provided - using default wallet endpoint');
    }
  }

  async writeToNamespace(namespace, path, data, jwtToken = null) {
    try {
      // Get JWT token if not provided
      const token = jwtToken || await this.jwtGenerator.generateJWTToken();
      
      // Construct API endpoint
      const endpoint = `${this.apiUrl}/api/v2.6/data/${namespace}/${path}`;
      
      console.log(`📝 Writing data to namespace: ${namespace}/${path}`);
      console.log(`📡 API Endpoint: ${endpoint}`);
      console.log(`🔐 Using JWT token: ${token.substring(0, 50)}...`);
      
      const response = await axios.post(endpoint, data, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        timeout: 30000
      });

      console.log('📊 Write Response Status:', response.status);
      console.log('📋 Write Response Data:', response.data);

      return {
        success: true,
        status: response.status,
        data: response.data,
        namespace: namespace,
        path: path
      };
      
    } catch (error) {
      if (error.response) {
        console.error('🚨 Dataswift Write Error:', error.response.status, error.response.data);
        throw new Error(`Failed to write to namespace ${namespace}/${path}: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error(`Network error writing to namespace ${namespace}/${path}: Unable to reach Dataswift API`);
      } else {
        throw new Error(`Dataswift write error: ${error.message}`);
      }
    }
  }

  async writeZohoCRMData(contactData, jwtToken = null) {
    try {
      // Use zoho-crm namespace as specified in requirements
      const namespace = 'zoho-crm';
      const path = `contact-${contactData.id}`;
      
      console.log(`📝 Writing Zoho CRM contact to namespace: ${namespace}/${path}`);
      
      const result = await this.writeToNamespace(namespace, path, contactData, jwtToken);
      
      console.log('✅ Successfully wrote Zoho CRM contact data to wallet!');
      return result;
      
    } catch (error) {
      console.error('❌ Failed to write Zoho CRM data:', error.message);
      throw error;
    }
  }

  async readFromNamespace(namespace, path, jwtToken = null) {
    try {
      // Get JWT token if not provided
      const token = jwtToken || await this.jwtGenerator.generateJWTToken();
      
      // Construct API endpoint
      const endpoint = `${this.apiUrl}/api/v2.6/data/${namespace}/${path}`;
      
      console.log(`📖 Reading data from namespace: ${namespace}/${path}`);
      console.log(`📡 API Endpoint: ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        timeout: 30000
      });

      console.log('📊 Read Response Status:', response.status);
      console.log('📋 Read Response Data:', response.data);

      return {
        success: true,
        status: response.status,
        data: response.data,
        namespace: namespace,
        path: path
      };
      
    } catch (error) {
      if (error.response) {
        console.error('🚨 Dataswift Read Error:', error.response.status, error.response.data);
        throw new Error(`Failed to read from namespace ${namespace}/${path}: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error(`Network error reading from namespace ${namespace}/${path}: Unable to reach Dataswift API`);
      } else {
        throw new Error(`Dataswift read error: ${error.message}`);
      }
    }
  }
}

module.exports = DataswiftWalletClient;