const DataswiftWalletClient = require('../storage/dataswyft-wallet-client');

async function testWalletWrite() {
  console.log('🔄 Testing Dataswyft wallet write operations...\n');
  
  const walletClient = new DataswiftWalletClient();
  
  try {
    // Test 1: Simple write to existing namespace
    console.log('🔄 Test 1: Writing to test namespace...');
    const testResult = await walletClient.writeToNamespace('test', 'contacts', {
      test: 'zoho_crm_integration',
      timestamp: new Date().toISOString(),
      data: {
        email: 'test@example.com',
        name: 'Test User'
      }
    });
    
    console.log('✅ Test write successful!');
    console.log(`📋 Record ID: ${testResult.recordId}`);
    
    // Test 2: Try to write to zoho_crm namespace
    console.log('\n🔄 Test 2: Writing to zoho_crm namespace...');
    
    const sampleZohoData = {
      namespace: "zoho_crm",
      endpoint: "/crm/v8/Contacts/search",
      data: {
        id: "test123",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: {
          provider: "zoho_crm",
          version: "v8",
          endpoint: "/crm/v8/Contacts/search",
          module: "Contacts"
        },
        content: {
          email: "test@example.com",
          firstname: "Test",
          lastname: "User",
          company: "Test Company",
          phone: "+1-555-0123",
          jobtitle: "Developer",
          country: "United States",
          city: "New York",
          registration_number: "TEST-123",
          address: "123 Test Street",
          address2: null,
          zip: "12345",
          tax_file_number: "TAX-123",
          sales_service_tax_number: "SST-123",
          kyb_verified: true,
          kyb_verified_at: new Date().toISOString(),
          zoho_object_id: "test123",
          properties: {}
        },
        metadata: {
          sync_timestamp: new Date().toISOString(),
          connector_version: "1.0.0",
          schema_version: "1.0",
          import_trigger: "test"
        }
      }
    };
    
    const zohoCRMResult = await walletClient.writeToNamespace('zoho_crm', 'contacts', sampleZohoData);
    
    console.log('✅ Zoho CRM write successful!');
    console.log(`📋 Record ID: ${zohoCRMResult.recordId}`);
    
    console.log('\n🎉 All wallet write tests passed!');
    console.log('✅ Ready to proceed with full integration');
    
  } catch (error) {
    console.error('❌ Wallet write test failed:', error.message);
    
    if (error.response) {
      console.error('📋 Error response:', error.response.data);
    }
    
    // Let's try to understand what namespaces are available
    console.log('\n🔄 Testing different namespace patterns...');
    
    const testPatterns = [
      { namespace: 'zoho', endpoint: 'contacts' },
      { namespace: 'crm', endpoint: 'contacts' },
      { namespace: 'zoho_crm', endpoint: 'data' },
      { namespace: 'data', endpoint: 'zoho_crm' }
    ];
    
    for (const pattern of testPatterns) {
      try {
        console.log(`🔄 Trying ${pattern.namespace}/${pattern.endpoint}...`);
        const result = await walletClient.writeToNamespace(pattern.namespace, pattern.endpoint, {
          test: 'namespace_discovery',
          timestamp: new Date().toISOString()
        });
        console.log(`✅ ${pattern.namespace}/${pattern.endpoint} works! Record ID: ${result.recordId}`);
        break;
      } catch (patternError) {
        console.log(`❌ ${pattern.namespace}/${pattern.endpoint} failed: ${patternError.message}`);
      }
    }
  }
}

// Run the test
if (require.main === module) {
  testWalletWrite();
}

module.exports = testWalletWrite;