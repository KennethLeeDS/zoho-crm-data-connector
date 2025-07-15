const axios = require('axios');
const TokenManager = require('../auth/token-manager');

class ContactSearch {
  constructor() {
    this.tokenManager = new TokenManager();
  }

  async searchContactByEmail(email) {
    try {
      // Validate email format
      if (!email || !this.isValidEmail(email)) {
        throw new Error('Invalid email format provided');
      }

      // Get valid access token
      const tokenData = await this.tokenManager.getValidToken();
      
      // Construct search URL
      const searchUrl = `${tokenData.apiDomain}/crm/v8/Contacts/search`;
      
      console.log(`🔍 Searching for contact with email: ${email}`);
      console.log(`📡 API URL: ${searchUrl}`);
      
      const response = await axios.get(searchUrl, {
        params: {
          email: email
        },
        headers: {
          'Authorization': `${tokenData.tokenType} ${tokenData.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log('📊 Search Response Status:', response.status);
      console.log('📋 Response Data:', JSON.stringify(response.data, null, 2));

      // Handle response
      if (response.data && response.data.data && response.data.data.length > 0) {
        const contacts = response.data.data;
        
        if (contacts.length === 1) {
          console.log(`✅ Found 1 contact matching email: ${email}`);
          return contacts[0];
        } else {
          console.log(`⚠️  Found ${contacts.length} contacts matching email: ${email}`);
          console.log('   Returning the first contact (most recent)');
          return contacts[0];
        }
      } else {
        console.log(`❌ No contact found with email: ${email}`);
        return null;
      }
      
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        console.error('🚨 API Error Response:', JSON.stringify(errorData, null, 2));
        
        if (error.response.status === 401) {
          throw new Error('Authentication failed. Please check your credentials.');
        } else if (error.response.status === 404) {
          throw new Error('Contact not found or API endpoint not available.');
        } else if (error.response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`Zoho CRM API error: ${errorData.message || error.response.statusText}`);
        }
      } else if (error.request) {
        throw new Error('Network error: Unable to reach Zoho CRM API');
      } else {
        throw new Error(`Contact search error: ${error.message}`);
      }
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  formatContactInfo(contact) {
    if (!contact) return null;
    
    return {
      id: contact.id,
      email: contact.Email,
      firstName: contact.First_Name,
      lastName: contact.Last_Name,
      fullName: contact.Full_Name,
      company: contact.Account_Name?.name || contact.Company,
      phone: contact.Phone,
      mobile: contact.Mobile,
      createdTime: contact.Created_Time,
      modifiedTime: contact.Modified_Time,
      owner: contact.Owner?.name,
      rawData: contact
    };
  }
}

module.exports = ContactSearch;