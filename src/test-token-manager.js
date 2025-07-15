const TokenManager = require('./auth/token-manager');

async function testTokenManager() {
  console.log('🔄 Testing Token Manager with Refresh Token...\n');
  
  const tokenManager = new TokenManager();
  
  try {
    // Test getting a valid token (will use refresh token if needed)
    console.log('📝 Getting valid access token...');
    const token = await tokenManager.getValidToken();
    
    console.log('✅ Successfully obtained access token!');
    console.log('📊 Token Information:');
    console.log(`   - Token Type: ${token.tokenType}`);
    console.log(`   - Expires In: ${token.expiresIn} seconds`);
    console.log(`   - API Domain: ${token.apiDomain}`);
    console.log(`   - Expires At: ${new Date(token.expiresAt).toISOString()}`);
    
    // Test getting auth headers
    console.log('\n🔐 Testing auth headers generation...');
    const headers = await tokenManager.getAuthHeaders();
    console.log(`   - Authorization header: ${headers.Authorization.substring(0, 50)}...`);
    
    // Test cached token retrieval
    console.log('\n💾 Testing cached token retrieval...');
    const cachedToken = await tokenManager.getValidToken();
    console.log(`   - Retrieved from cache: ${cachedToken === token}`);
    
    // Display token info
    console.log('\n📋 Token Manager Info:');
    const tokenInfo = tokenManager.getTokenInfo();
    if (tokenInfo) {
      console.log(`   - Has Token: ${tokenInfo.hasToken}`);
      console.log(`   - Expires At: ${tokenInfo.expiresAt}`);
      console.log(`   - API Domain: ${tokenInfo.apiDomain}`);
    }
    
    console.log('\n🎉 Token Manager test completed successfully!');
    console.log('\n💡 Usage Notes:');
    console.log('   - TokenManager will automatically refresh tokens when needed');
    console.log('   - Use tokenManager.getValidToken() for all API calls');
    console.log('   - Use tokenManager.getAuthHeaders() for easy header generation');
    
  } catch (error) {
    console.error('❌ Token Manager test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('ZOHO_CRM_REFRESH_TOKEN')) {
      console.error('\n💡 To set up the refresh token:');
      console.error('   1. Run: npm test (to get initial tokens)');
      console.error('   2. Copy the refresh token from the output');
      console.error('   3. Add it to your .env file as ZOHO_CRM_REFRESH_TOKEN');
      console.error('   4. Then run this test again');
    }
    
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testTokenManager();
}

module.exports = testTokenManager;