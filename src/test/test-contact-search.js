const ContactSearch = require('../connectors/contact-search');
const readline = require('readline');

async function testContactSearch() {
  console.log('🔍 Testing Zoho CRM Contact Search by Email...\n');
  
  const contactSearch = new ContactSearch();
  
  try {
    // Hard-coded email for testing
    const email = 'david.chen@globaltech.com';
    console.log(`📧 Testing with email: ${email}`);
    
    console.log(`\n🔄 Searching for contact with email: ${email}`);
    
    // Search for contact
    const contact = await contactSearch.searchContactByEmail(email);
    
    if (contact) {
      console.log('\n✅ Contact found!');
      
      // Format and display contact info
      const formattedContact = contactSearch.formatContactInfo(contact);
      
      console.log('\n📋 Contact Information:');
      console.log(`   - ID: ${formattedContact.id}`);
      console.log(`   - Email: ${formattedContact.email}`);
      console.log(`   - First Name: ${formattedContact.firstName || 'N/A'}`);
      console.log(`   - Last Name: ${formattedContact.lastName || 'N/A'}`);
      console.log(`   - Full Name: ${formattedContact.fullName || 'N/A'}`);
      console.log(`   - Company: ${formattedContact.company || 'N/A'}`);
      console.log(`   - Phone: ${formattedContact.phone || 'N/A'}`);
      console.log(`   - Mobile: ${formattedContact.mobile || 'N/A'}`);
      console.log(`   - Owner: ${formattedContact.owner || 'N/A'}`);
      console.log(`   - Created: ${formattedContact.createdTime || 'N/A'}`);
      console.log(`   - Modified: ${formattedContact.modifiedTime || 'N/A'}`);
      
      console.log('\n🎉 Contact search completed successfully!');
      
      // Show raw data automatically
      console.log('\n📊 Raw Contact Data:');
      console.log(JSON.stringify(formattedContact.rawData, null, 2));
      
    } else {
      console.log('\n❌ No contact found with that email address.');
      console.log('\n💡 Possible reasons:');
      console.log('   - Email address does not exist in your Zoho CRM');
      console.log('   - Email address might be spelled differently');
      console.log('   - Contact might be in a different module');
    }
    
  } catch (error) {
    console.error('\n❌ Contact search failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('Authentication')) {
      console.error('\n💡 Authentication issues:');
      console.error('   - Check your refresh token in .env file');
      console.error('   - Ensure your Zoho CRM credentials are correct');
    }
    
    if (error.message.includes('Rate limit')) {
      console.error('\n💡 Rate limit issues:');
      console.error('   - Wait a few minutes before trying again');
      console.error('   - Consider implementing request throttling');
    }
    
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testContactSearch();
}

module.exports = testContactSearch;