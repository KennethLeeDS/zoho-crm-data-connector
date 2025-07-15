const ZohoOAuthClient = require('./auth/oauth-client');
const readline = require('readline');

async function testZohoConnection() {
  console.log('🔄 Testing Zoho CRM Self-Client Authorization Code Flow...\n');
  
  const oauthClient = new ZohoOAuthClient();
  
  try {
    // Get authorization code from user
    console.log('📋 Please provide the authorization code from your self-client flow.');
    console.log('   The authorization code expires in 3 minutes, so enter it quickly!\n');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const authCode = await new Promise((resolve) => {
      rl.question('🔑 Enter the authorization code: ', (code) => {
        rl.close();
        resolve(code.trim());
      });
    });
    
    if (!authCode) {
      throw new Error('Authorization code is required');
    }
    
    // Step 1: Exchange authorization code for access token
    console.log('\n🔄 Step 1: Exchanging authorization code for access token...');
    const tokenData = await oauthClient.getAccessTokenFromCode(authCode);
    
    console.log('✅ Successfully obtained access token!');
    console.log('📊 Token Information:');
    console.log(`   - Token Type: ${tokenData.tokenType}`);
    console.log(`   - Expires In: ${tokenData.expiresIn} seconds`);
    console.log(`   - API Domain: ${tokenData.apiDomain}`);
    console.log(`   - Expires At: ${new Date(tokenData.expiresAt).toISOString()}`);
    console.log(`   - Has Refresh Token: ${!!tokenData.refreshToken}`);
    
    // Step 2: Test token validation
    console.log('\n🔍 Step 2: Testing token validation...');
    const isValid = await oauthClient.validateToken(tokenData);
    console.log(`   - Token is valid: ${isValid}`);
    
    // Step 3: Test refresh token (if available)
    if (tokenData.refreshToken) {
      console.log('\n🔄 Step 3: Testing refresh token...');
      const refreshedTokenData = await oauthClient.refreshAccessToken(tokenData.refreshToken);
      
      console.log('✅ Successfully refreshed access token!');
      console.log('📊 Refreshed Token Information:');
      console.log(`   - Token Type: ${refreshedTokenData.tokenType}`);
      console.log(`   - Expires In: ${refreshedTokenData.expiresIn} seconds`);
      console.log(`   - API Domain: ${refreshedTokenData.apiDomain}`);
      console.log(`   - Expires At: ${new Date(refreshedTokenData.expiresAt).toISOString()}`);
      
      // Test refreshed token validation
      const isRefreshedValid = await oauthClient.validateToken(refreshedTokenData);
      console.log(`   - Refreshed token is valid: ${isRefreshedValid}`);
    }
    
    console.log('\n🎉 Self-client authorization code flow test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Save the refresh token securely for future use');
    console.log('   2. Use the access token to make Zoho CRM API calls');
    console.log('   3. Use the provided API domain for all API requests');
    console.log('   4. Refresh the access token when it expires (every hour)');
    
  } catch (error) {
    console.error('❌ Self-client authorization code flow test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('required')) {
      console.error('\n💡 Please ensure you have:');
      console.error('   1. Created a .env file based on .env.example');
      console.error('   2. Set your ZOHO_CRM_CLIENT_ID and ZOHO_CRM_CLIENT_SECRET');
      console.error('   3. Configured your Zoho CRM Self-Client Application');
    }
    
    if (error.message.includes('invalid_code') || error.message.includes('expired')) {
      console.error('\n💡 Authorization code issues:');
      console.error('   1. Authorization codes expire in 3 minutes');
      console.error('   2. Each authorization code can only be used once');
      console.error('   3. Generate a new authorization code and try again');
    }
    
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testZohoConnection();
}

module.exports = testZohoConnection;