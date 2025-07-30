# Zoho CRM Data Connector

A production-ready webhook-driven data connector service that receives requests from the CheckD Data Connector Gateway, authenticates with Zoho CRM using OAuth 2.0, extracts merchant contact data, and stores it in Dataswyft Wallets with comprehensive error handling and user-friendly error pages.

## Features

- 🚀 **Production API Endpoint** - `/connect` endpoint for Data Connector Gateway integration
- 🔐 **JWT Token Authentication** - Validates and processes JWT tokens from the gateway
- 📧 **Email-Based Contact Search** - Searches Zoho CRM contacts by merchant email
- 💾 **Smart Namespace Storage** - Test/production separation with automatic detection
- 📄 **User-Friendly Error Pages** - Professional error pages for different failure scenarios
- 📞 **Callback Integration** - Returns status and record IDs via callback URLs
- 🧪 **Comprehensive Testing** - Full end-to-end test suite with error page validation

## Quick Start

### 1. Installation

```bash
git clone <repository-url>
cd zoho-crm-data-connector
npm install
```

### 2. Environment Configuration

Create your environment file:

```bash
cp .env.example .env
```

Configure your credentials in `.env`:

```bash
# Zoho CRM OAuth Configuration (Self-Client)
ZOHO_CRM_CLIENT_ID=your_client_id_here
ZOHO_CRM_CLIENT_SECRET=your_client_secret_here
ZOHO_CRM_REFRESH_TOKEN=your_refresh_token_here

# Dataswyft Wallet Configuration
DATASWIFT_API_URL=https://your-wallet-instance.hubat.net
DATASWIFT_USERNAME=your_username
DATASWIFT_PASSWORD=your_password

# Optional Configuration
DS_APPLICATION_ID=zoho-crm-connector
CONNECTOR_PORT=8080
NODE_ENV=test
```

### 3. Zoho CRM Authentication Setup

#### Create Self-Client Application

1. Go to [Zoho API Console](https://api-console.zoho.com/)
2. Create a new application → Select **"Self Client"**
3. Configure scopes: `ZohoCRM.modules.contacts.ALL`
4. Note your `Client ID` and `Client Secret`

#### Generate Refresh Token

1. In API Console → "Generate Code" tab
2. Select scopes: `ZohoCRM.modules.contacts.ALL`
3. Generate authorization code (**expires in 3 minutes**)
4. Add your Client ID and Client Secret to `.env` file first
5. Run the test suite to exchange authorization code for refresh token:

```bash
npm test
```

When prompted, enter your authorization code. The test will validate your setup and display the refresh token to copy to your `.env` file.

### 4. Test Data Setup

Import sample contacts to your Zoho CRM:

1. **Sample contacts included:**
   - `sarah.johnson@techcorp.com` - TechCorp Solutions (US)
   - `michael.chen@globalfinance.com` - Global Finance Ltd (UK)  
   - `emma.rodriguez@innovatestart.com` - InnovateStart Inc (Australia)

2. **Import to Zoho CRM:**
   - Upload `test_data/zoho_sample_data.csv` to your Contacts module
   - Map CSV columns to Zoho CRM fields

## Usage

### Start the Server

```bash
# Production mode
npm start

# Development mode  
npm run dev
```

Server runs on `http://localhost:8080` (or `CONNECTOR_PORT`)

### Main API Endpoint

#### `GET /connect` - Data Connector Gateway Endpoint

**Query Parameters:**
- `token` (required) - JWT token containing PDA URL and application ID
- `callback_url` (required) - URL to redirect after completion  
- `data` (required) - JSON object containing merchant email
- `request_id` (required) - Request identifier for tracking

**Example Request:**
```
GET /connect?token=eyJhbGc...&callback_url=https://checkd.io/api/callback&data={"email":"merchant@example.com"}&request_id=req_123456
```

**Response Flow:**
1. **Immediate Response** - 200 OK with processing status
2. **Async Processing** - Validates JWT, searches Zoho CRM, stores data
3. **Callback Response** - Success/failure status with record IDs or error page URL

### Error Pages

The connector provides user-friendly error pages for different scenarios:

- **🔍 Contact Not Found (404)** - `/error?type=EMAIL_NOT_FOUND`
- **🔐 Authentication Failed (401)** - `/error?type=INVALID_TOKEN`
- **🔗 Zoho CRM Error (401)** - `/error?type=OAUTH_FAILURE`
- **⚠️ Service Error (500)** - `/error?type=API_ERROR`
- **📋 Invalid Request (400)** - `/error?type=INVALID_DATA`

## Testing

### Run Test Suite

```bash
npm test
```

The test suite validates the complete `/connect` endpoint workflow including success scenarios, error handling, JWT token validation, and error page functionality.

## Data Flow

### Success Flow
1. **Gateway Request** → `/connect` endpoint with JWT token
2. **JWT Validation** → Extract PDA URL and validate expiration
3. **Contact Search** → Find merchant in Zoho CRM by email
4. **Data Transform** → Convert to Dataswyft wallet format
5. **Storage** → Save to appropriate namespace (test/production)
6. **Callback** → Send success status with record ID

### Error Flow  
1. **Error Detection** → Invalid token, missing email, API failure
2. **Error Page Generation** → Create user-friendly error page
3. **Callback** → Send failure status with error page URL for user redirection

## Data Structure

### Input (from Gateway)
```javascript
{
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // JWT with PDA URL
  callback_url: "https://checkd.io/api/callback",
  data: "{\"email\":\"merchant@example.com\"}",       // Merchant email
  request_id: "req_123456"
}
```

### Output (to Dataswyft Wallet)
```javascript
{
  "namespace": "zoho_crm", // or "test" for testing
  "endpoint": "/crm/v8/Contacts/search",
  "data": {
    "id": "6899019000000603062",
    "created_at": "2025-07-16T12:34:51-04:00",
    "source": {
      "provider": "zoho_crm",
      "version": "v8",
      "module": "Contacts"
    },
    "content": {
      "email": "merchant@example.com",
      "firstname": "John",
      "lastname": "Doe",
      "company": "Example Corp",
      "phone": "+1-555-0123",
      "jobtitle": "CEO",
      "country": "United States",
      // ... additional fields
    },
    "metadata": {
      "sync_timestamp": "2025-07-30T22:15:30.123Z",
      "connector_version": "1.0.0",
      "schema_version": "1.0"
    }
  }
}
```

## Project Structure

```
src/
├── server.js                     # Main Express server with /connect endpoint
├── auth/
│   ├── oauth-client.js           # Zoho CRM OAuth 2.0 client
│   ├── token-manager.js          # Token caching and refresh
│   └── jwt-token-generator.js    # JWT utilities
├── connectors/
│   ├── zoho-crm-connector.js     # CRM API client with field optimization
│   ├── contact-search.js         # Email-based contact search
│   └── data-mapper.js            # Data transformation
├── storage/
│   └── dataswyft-wallet-client.js # Dataswyft Wallet API client
└── test/
    ├── test-connect-endpoint.js   # Main endpoint test suite
    ├── run-connect-test.js        # Test runner with server management
    ├── test-connection.js         # OAuth authentication test
    └── import-contact-to-wallet.js # Individual contact import test
```

## Health Checks

### Server Health
```bash
curl http://localhost:8080/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0", 
  "timestamp": "2025-07-30T22:15:30.123Z"
}
```

## Production Deployment

### Environment Variables
- Set `NODE_ENV=production` for production namespace usage
- Ensure `ZOHO_CRM_REFRESH_TOKEN` is valid and secure

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 8080
CMD ["npm", "start"]
```


## Error Handling

### Error Codes
- `EMAIL_NOT_FOUND` (404) - Contact not found in Zoho CRM
- `INVALID_TOKEN` (401) - JWT token invalid or expired
- `OAUTH_FAILURE` (401) - Zoho CRM authentication failed
- `API_ERROR` (500) - General service error
- `INVALID_DATA` (400) - Invalid request parameters

### Retry Strategy
- **Non-retryable**: Email not found, invalid tokens
- **Retryable**: OAuth failures, API errors, network issues
- **Automatic**: Exponential backoff for transient failures

## Performance

### Targets
- OAuth token acquisition: < 1 second
- Contact search: < 1 second  
- Data transformation: < 100ms
- Wallet storage: < 2 seconds
- **Total processing time: < 5 seconds**

### Optimization
- Limited field extraction from Zoho CRM
- In-memory token caching
- Namespace separation for test/production
- Connection pooling for external APIs

## Security

- ✅ **JWT token validation** with expiration checking
- ✅ **OAuth refresh tokens** stored securely as environment variables
- ✅ **Access tokens** never persisted to disk
- ✅ **HTTPS-only** communication with external APIs
- ✅ **Input validation** for all request parameters
- ✅ **Error page sanitization** to prevent XSS

## Troubleshooting

### Common Issues

**"Token has expired"**
- Regenerate authorization code in Zoho API Console
- Run `npm test` to get new refresh token

**"Contact not found"**  
- Verify email exists in Zoho CRM Contacts
- Check test data import was successful
- Ensure contact has required fields populated

**"Tests failing"**
- Verify all environment variables are set
- Check Zoho CRM refresh token is valid
- Ensure Dataswyft wallet credentials are correct

### Debug Mode
Enable detailed logging:
```bash
LOG_LEVEL=debug npm start
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and add tests
4. Run test suite: `npm test`
5. Submit pull request

## License

[Your License Here]