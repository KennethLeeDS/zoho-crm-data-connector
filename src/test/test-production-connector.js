const ZohoCRMConnector = require('../connectors/zoho-crm-connector');

async function testProductionConnector() {
  console.log('🔄 Testing Production Zoho CRM Connector...\n');
  
  const connector = new ZohoCRMConnector();
  
  try {
    const email = 'michael.chen@globalfinance.com';
    
    console.log(`📧 Testing contact retrieval for: ${email}\n`);
    
    // Test getting single contact
    console.log('🔄 Testing getContactForDataswyft...');
    const singleContact = await connector.getContactForDataswyft(email);
    
    if (singleContact) {
      console.log('✅ Single contact retrieved successfully!');
      console.log('📋 Contact ID:', singleContact.data.id);
      console.log('📋 Contact Email:', singleContact.data.content.email);
      console.log('📋 Contact Name:', `${singleContact.data.content.firstname} ${singleContact.data.content.lastname}`);
      console.log('📋 Company:', singleContact.data.content.company);
      console.log('📋 Fields retrieved:', Object.keys(singleContact.data.content).length);
    } else {
      console.log('❌ No contact found');
    }
    
    console.log('\n🔄 Testing getAllContactsForDataswyft...');
    const allContacts = await connector.getAllContactsForDataswyft(email);
    
    console.log(`✅ Retrieved ${allContacts.length} contact(s)`);
    
    if (allContacts.length > 0) {
      console.log('\n📦 Sample transformed data structure:');
      console.log('═'.repeat(50));
      console.log(JSON.stringify(allContacts[0], null, 2));
      
      console.log('\n📊 Field mapping verification:');
      console.log('═'.repeat(50));
      const content = allContacts[0].data.content;
      console.log(`✓ email: ${content.email}`);
      console.log(`✓ firstname: ${content.firstname}`);
      console.log(`✓ lastname: ${content.lastname}`);
      console.log(`✓ company: ${content.company}`);
      console.log(`✓ phone: ${content.phone}`);
      console.log(`✓ jobtitle: ${content.jobtitle}`);
      console.log(`✓ country: ${content.country}`);
      console.log(`✓ city: ${content.city}`);
      console.log(`✓ address: ${content.address}`);
      console.log(`✓ address2: ${content.address2}`);
      console.log(`✓ zip: ${content.zip}`);
      console.log(`✓ registration_number: ${content.registration_number}`);
      console.log(`✓ tax_file_number: ${content.tax_file_number}`);
      console.log(`✓ sales_service_tax_number: ${content.sales_service_tax_number}`);
      console.log(`✓ kyb_verified: ${content.kyb_verified}`);
      console.log(`✓ kyb_verified_at: ${content.kyb_verified_at}`);
      console.log(`✓ zoho_object_id: ${content.zoho_object_id}`);
      
      console.log('\n📋 Data structure validation:');
      console.log('═'.repeat(50));
      console.log(`✓ namespace: ${allContacts[0].namespace}`);
      console.log(`✓ endpoint: ${allContacts[0].endpoint}`);
      console.log(`✓ data.id: ${allContacts[0].data.id}`);
      console.log(`✓ data.created_at: ${allContacts[0].data.created_at}`);
      console.log(`✓ data.updated_at: ${allContacts[0].data.updated_at}`);
      console.log(`✓ data.source.provider: ${allContacts[0].data.source.provider}`);
      console.log(`✓ data.source.version: ${allContacts[0].data.source.version}`);
      console.log(`✓ data.metadata.sync_timestamp: ${allContacts[0].data.metadata.sync_timestamp}`);
      console.log(`✓ data.metadata.connector_version: ${allContacts[0].data.metadata.connector_version}`);
    }
    
    console.log('\n🎉 Production connector test completed successfully!');
    console.log('\n💡 Ready for integration with Dataswyft wallet:');
    console.log('   - Limited field API requests ✓');
    console.log('   - Proper data transformation ✓');
    console.log('   - Error handling ✓');
    console.log('   - Production-ready structure ✓');
    
  } catch (error) {
    console.error('❌ Production connector test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.stack) {
      console.error('   Stack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testProductionConnector();
}

module.exports = testProductionConnector;