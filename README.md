# Zoho CRM Data Connector

A webhook-driven data connector service that extracts merchant data from Zoho CRM Contacts module and stores it in Dataswyft Wallets in the zoho-crm namespace with comprehensive error handling and retry mechanisms.

## Features

- 🔐 **OAuth 2.0 Authentication** - Self-client authorization with automatic token refresh
- 📊 **Limited Field Extraction** - Only pulls required fields to optimize API performance
- 🔄 **Intelligent Retry Logic** - Exponential backoff with error-specific retry strategies
- 💾 **Zoho CRM Namespace Storage** - Stores data in zoho-crm namespace with test/production separation
- 📞 **Callback Integration** - Returns status and record IDs via callback URLs
- 🛡️ **Comprehensive Error Handling** - Structured error codes with user action guidance

## Quick Start

### 1. Installation

```bash
git clone <repository-url>
cd zoho-crm-data-connector
npm install
```

### 2. Configuration

Copy the environment template:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Zoho CRM OAuth Configuration
ZOHO_CRM_CLIENT_ID=your_client_id_here
ZOHO_CRM_CLIENT_SECRET=your_client_secret_here
ZOHO_CRM_REFRESH_TOKEN=your_refresh_token_here

# Dataswyft Wallet Configuration
DATASWIFT_API_URL=https://your-wallet-instance.hubat.net
DATASWIFT_USERNAME=your_username
DATASWIFT_PASSWORD=your_password

# Callback Configuration
CALLBACK_URL=https://example.com/callback
```

### 3. Zoho CRM Authentication Setup

#### Step 1: Create Self-Client Application

1. Go to [Zoho API Console](https://api-console.zoho.com/)
2. Create a new application
3. Select **"Self Client"** application type
4. Configure scopes: `ZohoCRM.modules.contacts.ALL`
5. Note your `Client ID` and `Client Secret`

#### Step 2: Generate Authorization Code

1. In Zoho API Console, navigate to "Generate Code" tab
2. Select scopes: `ZohoCRM.modules.contacts.ALL`
3. Set code expiry time (default: 3 minutes)
4. Click "CREATE" to generate authorization code
5. **Copy the code immediately** (expires in 3 minutes)

#### Step 3: Test Authentication

Run the authentication test:

```bash
npm test
```

Enter your authorization code when prompted. The test will:
- Exchange authorization code for access token
- Test token validation
- Test refresh token functionality
- Display token information

**Save the refresh token** from the output to your `.env` file.

## Usage

### Basic Contact Import

```bash
# Import a specific contact
node src/test/import-contact-to-wallet.js michael.chen@globalfinance.com

# Run full test suite
node src/test/import-contact-to-wallet.js
```

### Production Integration

```javascript
const { importContactToWallet } = require('./src/test/import-contact-to-wallet');

// Import contact with full error handling
const result = await importContactToWallet('user@example.com');

if (result.success) {
  console.log('Success!', result.recordId);
  console.log('Callback URL:', result.callbackUrl);
} else {
  console.log('Error:', result.code, result.message);
  console.log('User Action:', result.userAction);
  console.log('Retryable:', result.retryable);
}
```

## Data Structure

### Input Fields (from Zoho CRM)

The connector extracts these specific fields to optimize API performance:

```javascript
const fields = [
  'Email', 'First_Name', 'Last_Name', 'company', 'Phone', 'Title',
  'Mailing_Country', 'Mailing_City', 'Mailing_Street', 'address2', 'Mailing_Zip',
  'registration_number', 'tax_file_number', 'sales_service_tax_number',
  'kyb_verified', 'kyb_verified_at', 'id', 'Created_Time', 'Modified_Time'
];
```

### Output Structure (to Dataswyft Wallet)

```javascript
{
  "namespace": "zoho-crm",
  "endpoint": "/crm/v8/Contacts/search",
  "data": {
    "id": "6899019000000603062",
    "created_at": "2025-07-16T12:34:51-04:00",
    "updated_at": "2025-07-16T12:34:51-04:00",
    "source": {
      "provider": "zoho_crm",
      "version": "v8",
      "endpoint": "/crm/v8/Contacts/search",
      "module": "Contacts"
    },
    "content": {
      "email": "michael.chen@globalfinance.com",
      "firstname": "Michael",
      "lastname": "Chen",
      "company": "Global Finance Ltd",
      "phone": "+44-20-7123-4567",
      "jobtitle": "Financial Director",
      "country": "United Kingdom",
      "city": "London",
      "address": "45 Canary Wharf",
      "address2": null,
      "zip": "E14 5AB",
      "registration_number": "REG-GF-2024-002",
      "tax_file_number": "TFN-123456789",
      "sales_service_tax_number": "SST-GF-789123",
      "kyb_verified": true,
      "kyb_verified_at": "2024-02-20T14:45:00Z",
      "zoho_object_id": "6899019000000603062",
      "properties": {}
    },
    "metadata": {
      "sync_timestamp": "2025-07-16T17:37:05.190Z",
      "connector_version": "1.0.0",
      "schema_version": "1.0",
      "import_trigger": "badge_authentication"
    }
  }
}
```

## Error Handling

### Error Codes & Status Codes

| Error | Code | Message | User Action |
|-------|------|---------|-------------|
| Email Not Found | 404 | "Merchant email not found in Zoho CRM" | Contact support |
| OAuth Failure | 401 | "Unable to authenticate with Zoho CRM" | Check configuration |
| Zoho CRM API Error | 503 | "Zoho CRM service temporarily unavailable" | Retry later |
| Invalid Email | 400 | "Invalid email format provided" | Check email |
| Rate Limited | 429 | "Too many requests, please wait" | Wait 10 minutes |
| No Module Access | 403 | "Cannot access Contacts module" | Config error |
| Token Expired | 401 | "OAuth token expired" | Refresh token |

### Retry Strategy

- **Email Not Found**: No retry (legitimate business case)
- **OAuth Failures**: Retry token refresh once
- **API Errors (5xx)**: Exponential backoff, max 3 attempts
- **Rate Limits**: Wait for rate limit window reset (10 minutes)
- **Network Errors**: Immediate retry, then exponential backoff

### Callback URLs

#### Success Response
```
https://example.com/callback?recordId=c2e120d3-aac2-4044-b2b0-6b8b8f62cfce&status=success&code=200
```

#### Error Response
```
https://example.com/callback?status=failure&code=404&message=Merchant%20email%20not%20found%20in%20Zoho%20CRM&userAction=Contact%20support
```

## Project Structure

```
src/
├── auth/
│   ├── oauth-client.js          # OAuth 2.0 client with token management
│   ├── token-manager.js         # Token caching and refresh logic
│   └── jwt-token-generator.js   # JWT token utilities
├── connectors/
│   ├── zoho-crm-connector.js    # Main CRM connector with limited fields
│   ├── contact-search.js        # Email-based contact search
│   └── data-mapper.js           # Schema transformation
├── storage/
│   └── dataswyft-wallet-client.js  # Dataswyft Wallet API client
├── test/
│   ├── import-contact-to-wallet.js  # Complete import test with retry logic
│   ├── test-connection.js           # OAuth authentication test
│   ├── pull-contact-data.js         # Contact data extraction test
│   └── test-production-connector.js # Production connector test
└── config/
    └── environment.js           # Environment configuration
```

## Testing

### Run Authentication Test
```bash
npm test
```

### Test Contact Import
```bash
# Test with known contact
node src/test/import-contact-to-wallet.js michael.chen@globalfinance.com

# Test error handling
node src/test/import-contact-to-wallet.js nonexistent@example.com
```

### Test Data Extraction
```bash
# Pull raw contact data
node src/test/pull-contact-data.js michael.chen@globalfinance.com

# Test production connector
node src/test/test-production-connector.js
```

## Development

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ZOHO_CRM_CLIENT_ID` | Zoho CRM OAuth Client ID | Yes |
| `ZOHO_CRM_CLIENT_SECRET` | Zoho CRM OAuth Client Secret | Yes |
| `ZOHO_CRM_REFRESH_TOKEN` | OAuth refresh token | Yes |
| `DATASWIFT_API_URL` | Dataswyft wallet API URL | Yes |
| `DATASWIFT_USERNAME` | Dataswyft wallet username | Yes |
| `DATASWIFT_PASSWORD` | Dataswyft wallet password | Yes |
| `CALLBACK_URL` | Callback URL for status updates | Yes |

### Storage Namespaces

The connector writes data to the Dataswyft wallet using these namespace patterns:

- **Production**: `zoho-crm/contacts`
- **Testing**: `test/zoho-crm`

All data is stored in the `zoho-crm` namespace structure, with test data separated using the `test/` prefix.

### Performance Targets

- OAuth token acquisition: < 1 second
- Contact search: < 1 second
- Data transformation: < 100ms
- Wallet storage: < 2 seconds
- Total import time: < 5 seconds

## Security

- OAuth refresh tokens stored as environment variables
- Access tokens never persisted to disk
- Token cache cleared on application restart
- Client credentials kept secure
- All API communications over HTTPS

## Troubleshooting

### Common Issues

1. **"Authorization code expired"**
   - Authorization codes expire in 3 minutes
   - Generate a new code and retry immediately

2. **"Unable to authenticate with Zoho CRM"**
   - Check your client ID and secret
   - Verify refresh token is valid
   - Ensure correct scopes are configured

3. **"No contact found"**
   - Verify email exists in Zoho CRM
   - Check email format
   - Ensure contact has required fields

4. **"Rate limit exceeded"**
   - Wait 10 minutes before retrying
   - System automatically handles rate limiting

### Debug Mode

Enable detailed logging:

```bash
LOG_LEVEL=debug node src/test/import-contact-to-wallet.js
```

## License

[Your License Here]

## Contributing

[Your Contributing Guidelines Here]