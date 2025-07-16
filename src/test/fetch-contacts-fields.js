const ZohoOAuthClient = require('../auth/oauth-client');
const axios = require('axios');

async function fetchContactsFields() {
  console.log('🔄 Fetching Zoho CRM Contacts module fields...\n');
  
  const oauthClient = new ZohoOAuthClient();
  
  try {
    // Get refresh token from environment
    const refreshToken = process.env.ZOHO_CRM_REFRESH_TOKEN;
    
    if (!refreshToken) {
      throw new Error('ZOHO_CRM_REFRESH_TOKEN is required in .env file');
    }
    
    // Step 1: Get access token using refresh token
    console.log('🔄 Step 1: Getting access token using refresh token...');
    const tokenData = await oauthClient.refreshAccessToken(refreshToken);
    
    console.log('✅ Successfully obtained access token!');
    console.log(`📊 Token expires at: ${new Date(tokenData.expiresAt).toISOString()}\n`);
    
    // Step 2: Try to fetch contacts fields using different approaches
    console.log('🔄 Step 2: Trying different approaches to get field information...');
    
    let response;
    let fields = [];
    
    // Try approach 1: Settings fields API (may require additional scope)
    try {
      console.log('   🔄 Trying settings/fields API...');
      const fieldsUrl = `${tokenData.apiDomain}/crm/v8/settings/fields?module=Contacts`;
      
      response = await axios.get(fieldsUrl, {
        headers: {
          'Authorization': `${tokenData.tokenType} ${tokenData.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      fields = response.data.fields || [];
      console.log('   ✅ Successfully fetched fields from settings API!');
      
    } catch (error) {
      console.log('   ❌ Settings API failed, trying alternative approach...');
      
      // Try approach 2: Get a sample contact record to see available fields
      try {
        console.log('   🔄 Trying to get sample contact record...');
        const contactsUrl = `${tokenData.apiDomain}/crm/v8/Contacts?per_page=1`;
        
        const contactsResponse = await axios.get(contactsUrl, {
          headers: {
            'Authorization': `${tokenData.tokenType} ${tokenData.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        
        console.log('   ✅ Successfully fetched sample contact!');
        console.log('   📋 Full response structure:', JSON.stringify(contactsResponse.data, null, 2));
        
        // Extract field names from the first contact record
        const contacts = contactsResponse.data.data || [];
        if (contacts.length > 0) {
          const sampleContact = contacts[0];
          
          // Convert contact object keys to field-like structure
          fields = Object.keys(sampleContact).map(key => ({
            api_name: key,
            display_label: key.replace(/_/g, ' '),
            data_type: typeof sampleContact[key] === 'object' && sampleContact[key] !== null ? 'object' : typeof sampleContact[key],
            sample_value: sampleContact[key]
          }));
        }
        
      } catch (innerError) {
        console.log('   ❌ Sample contact approach also failed');
        console.log('   📋 Error details:', {
          status: innerError.response?.status,
          statusText: innerError.response?.statusText,
          data: innerError.response?.data
        });
        throw error; // Re-throw the original error
      }
    }
    
    console.log('✅ Successfully fetched Contacts fields!\n');
    
    // Step 3: Display field information
    console.log(`📋 Found ${fields.length} fields in Contacts module:\n`);
    
    // Check if we have detailed field information or just basic field names
    const hasDetailedFields = fields.length > 0 && fields[0].section_name !== undefined;
    
    if (hasDetailedFields) {
      // Group fields by section for better organization (from settings API)
      const fieldsBySection = {};
      
      fields.forEach(field => {
        const section = field.section_name || 'General';
        if (!fieldsBySection[section]) {
          fieldsBySection[section] = [];
        }
        fieldsBySection[section].push(field);
      });
      
      // Display fields organized by section
      Object.keys(fieldsBySection).forEach(section => {
        console.log(`\n📂 ${section} Section:`);
        console.log('═'.repeat(50));
        
        fieldsBySection[section].forEach(field => {
          const required = field.required ? '(Required)' : '';
          const readOnly = field.read_only ? '(Read Only)' : '';
          const custom = field.custom_field ? '(Custom)' : '';
          
          console.log(`   ${field.api_name} ${required} ${readOnly} ${custom}`);
          console.log(`      Display Name: ${field.display_label}`);
          console.log(`      Type: ${field.data_type}`);
          
          if (field.default_value) {
            console.log(`      Default: ${field.default_value}`);
          }
          
          if (field.pick_list_values && field.pick_list_values.length > 0) {
            const pickListValues = field.pick_list_values.map(v => v.display_value || v.actual_value).join(', ');
            console.log(`      Options: ${pickListValues}`);
          }
          
          console.log('');
        });
      });
      
    } else {
      // Display basic field information (from sample contact)
      console.log('📂 Available Fields (from sample contact):');
      console.log('═'.repeat(50));
      
      fields.forEach(field => {
        console.log(`   ${field.api_name}`);
        console.log(`      Display Name: ${field.display_label}`);
        console.log(`      Type: ${field.data_type}`);
        
        if (field.sample_value !== null && field.sample_value !== undefined) {
          const sampleStr = typeof field.sample_value === 'object' ? 
            JSON.stringify(field.sample_value, null, 2) : 
            String(field.sample_value);
          console.log(`      Sample Value: ${sampleStr.substring(0, 100)}${sampleStr.length > 100 ? '...' : ''}`);
        }
        
        console.log('');
      });
    }
    
    // Step 4: Show summary of useful fields for API queries
    console.log('\n💡 Commonly used fields for API queries:');
    console.log('═'.repeat(50));
    
    const commonFields = [
      'id', 'Email', 'First_Name', 'Last_Name', 'Full_Name', 'Phone', 'Mobile',
      'Account_Name', 'Title', 'Department', 'Lead_Source', 'Created_Time',
      'Modified_Time', 'Owner', 'Mailing_Street', 'Mailing_City', 'Mailing_State',
      'Mailing_Zip', 'Mailing_Country'
    ];
    
    const availableCommonFields = fields.filter(field => 
      commonFields.includes(field.api_name)
    );
    
    availableCommonFields.forEach(field => {
      console.log(`   ${field.api_name} - ${field.display_label} (${field.data_type})`);
    });
    
    // Step 5: Generate sample API request with limited fields
    console.log('\n\n🔧 Sample API request with limited fields:');
    console.log('═'.repeat(50));
    
    const sampleFields = availableCommonFields.slice(0, 10).map(f => f.api_name).join(',');
    
    console.log(`GET ${tokenData.apiDomain}/crm/v8/Contacts?fields=${sampleFields}`);
    console.log(`\nHeaders:`);
    console.log(`Authorization: ${tokenData.tokenType} ${tokenData.accessToken}`);
    console.log(`Content-Type: application/json`);
    
    console.log('\n🎉 Contacts fields fetch completed successfully!');
    
  } catch (error) {
    console.error('❌ Contacts fields fetch failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    process.exit(1);
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  fetchContactsFields();
}

module.exports = fetchContactsFields;