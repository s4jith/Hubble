# Hubble API - Postman Collections Guide

## 📦 What's Included

This directory contains complete Postman collections and environments for testing the Hubble API:

- **`Hubble_API.postman_collection.json`** - Complete API collection with all endpoints
- **`Hubble_Development.postman_environment.json`** - Development environment (localhost)
- **`Hubble_Production.postman_environment.json`** - Production environment template

## 🚀 Quick Start

### 1. Import into Postman

1. Open Postman Desktop or Web
2. Click **Import** button
3. Drag and drop all three JSON files or select them via file browser
4. Collections and environments will be imported automatically

### 2. Select Environment

1. Click the environment dropdown (top right)
2. Select **Hubble Development** for local testing
3. Select **Hubble Production** for production API

### 3. Start Testing

1. Run **Authentication → Register Parent** to create an account
2. Tokens are automatically saved to environment variables
3. Subsequent requests will use the saved tokens automatically

## 📚 Collection Structure

### 1. Authentication (6 endpoints)

| Endpoint | Description |
|----------|-------------|
| **Register Parent** | Create new parent account, saves tokens automatically |
| **Login** | Login with email/username + password |
| **Login as Child** | Child-specific login example |
| **Create Child Account** | Parent creates child account (requires auth) |
| **Refresh Token** | Get new access token using refresh token |
| **Logout** | Invalidate refresh token |

### 2. Content Scanning (7 endpoints)

| Endpoint | Description |
|----------|-------------|
| **Scan Text** | Analyze text for cyberbullying |
| **Scan Text - Safe Content** | Example with safe content |
| **Scan Text - Self-Harm Detection** | Example detecting critical content |
| **Scan Image** | Analyze image via URL |
| **Scan Image - Base64** | Analyze base64 encoded image |
| **Get Scan History** | Paginated history with filters |
| **Get Scan by ID** | Retrieve specific scan result |

### 3. Alerts (6 endpoints)

| Endpoint | Description |
|----------|-------------|
| **Get All Alerts** | List with pagination and filters |
| **Get Alert by ID** | Retrieve specific alert |
| **Update Alert Status** | Change alert status |
| **Acknowledge Alert** | Mark alert as seen |
| **Resolve Alert** | Mark resolved with notes |
| **Get Alert Statistics** | Stats by severity and status |

### 4. Parent Dashboard (6 endpoints)

| Endpoint | Description |
|----------|-------------|
| **Get Children List** | All children under parent |
| **Get Dashboard Summary** | Overview statistics |
| **Get Incidents** | All cyberbullying incidents |
| **Get Analytics** | Trends and detailed analytics |
| **Get Parent Settings** | Notification preferences |
| **Update Parent Settings** | Update all settings |

### 5. Child (5 endpoints)

| Endpoint | Description |
|----------|-------------|
| **Get Child Profile** | Child's own profile |
| **Update Child Profile** | Update non-credential fields |
| **Update Child Profile - Blocked** | Demo of credential update block |
| **Get Mental Health Resources** | Support resources |
| **Get Child Scan History** | Personal scan history |

### 6. Health Check (1 endpoint)

| Endpoint | Description |
|----------|-------------|
| **Health Check** | Server status (no auth required) |

## 🔐 Authentication Flow

### Automatic Token Management

The collection includes **test scripts** that automatically:
1. Extract tokens from login/register responses
2. Save them to environment variables
3. Use them in subsequent requests

### Manual Token Setup (if needed)

If automatic token extraction fails:

1. Send a **Login** or **Register** request
2. Copy `accessToken` from response
3. Go to Environment variables (top right)
4. Paste into `accessToken` variable
5. Repeat for `refreshToken` if needed

### Token Variables

| Variable | Usage |
|----------|-------|
| `{{accessToken}}` | Short-lived auth token (15min) |
| `{{refreshToken}}` | Long-lived refresh token (7 days) |
| `{{parentId}}` | Parent user ID |
| `{{childId}}` | Child user ID |
| `{{scanId}}` | Recent scan ID |
| `{{alertId}}` | Recent alert ID |

## 🧪 Testing Workflows

### Workflow 1: Parent Registration & Setup

1. **Register Parent** → Creates account, saves tokens
2. **Create Child Account** → Add a child
3. **Get Children List** → Verify child created
4. **Update Parent Settings** → Configure notifications

### Workflow 2: Content Scanning & Alerts

1. **Login as Child** → Get child tokens
2. **Scan Text** → Send text for analysis (use abusive content)
3. **Login** (as parent) → Switch back to parent
4. **Get All Alerts** → See generated alert
5. **Acknowledge Alert** → Mark as seen
6. **Resolve Alert** → Close with notes

### Workflow 3: Dashboard & Analytics

1. **Login** (as parent)
2. **Get Dashboard Summary** → Overview stats
3. **Get Incidents** → Detailed incident list
4. **Get Analytics** → Trends over time period
5. **Get Alert Statistics** → Distribution by severity

### Workflow 4: Child Experience

1. **Login as Child**
2. **Get Child Profile** → View own profile
3. **Update Child Profile** → Change firstName (allowed)
4. **Update Child Profile - Blocked** → Try password change (blocked)
5. **Get Mental Health Resources** → Access support

## 📝 Query Parameters Reference

### Pagination

```
?page=1&limit=20
```

Available on: `/scan/history`, `/alerts`, `/parent/incidents`

### Filtering

#### Alerts
```
?severity=high              # low, medium, high, critical
?status=pending             # pending, acknowledged, reviewed, resolved
?childId=<child-id>         # Filter by specific child
```

#### Scans
```
?isAbusive=true             # true/false
?startDate=2025-01-01       # ISO date
?endDate=2025-12-31         # ISO date
```

#### Analytics
```
?period=7d                  # 24h, 7d, 30d, 90d
?childId=<child-id>         # Filter by child
```

## 🎨 Customizing Requests

### Modifying Request Bodies

1. Click on any request
2. Go to **Body** tab
3. Edit the JSON as needed
4. Use variables like `{{childId}}` for dynamic values

### Example: Custom Scan

```json
{
  "content": "Your custom text here",
  "source": "custom_app",
  "platform": "TestPlatform",
  "metadata": {
    "customField": "customValue"
  }
}
```

### Adding Headers

1. Go to request **Headers** tab
2. Add custom headers as needed
3. Example: `X-Request-ID: {{$guid}}`

## 🔧 Environment Variables

### Development Environment

```
baseUrl: http://localhost:3000/api
```

Make sure your backend server is running on port 3000.

### Production Environment

```
baseUrl: https://api.hubble.app/api
```

Update this URL with your actual production API URL.

## 📊 Response Examples

### Successful Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": "123abc",
    "field": "value"
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional info"
  }
}
```

## 🐛 Troubleshooting

### Issue: "Unauthorized" errors

**Solution:**
1. Run **Login** or **Register** request
2. Check that `{{accessToken}}` is populated in environment
3. Verify environment is selected (top right dropdown)

### Issue: "404 Not Found"

**Solution:**
1. Verify backend server is running
2. Check `baseUrl` in environment matches your server
3. Ensure no extra slashes in URLs

### Issue: "Validation Error"

**Solution:**
1. Check request body matches required schema
2. Verify all required fields are present
3. Check data types (strings, numbers, booleans)

### Issue: Token expired

**Solution:**
1. Use **Refresh Token** endpoint
2. Or login again to get new tokens

## 🔒 Security Best Practices

1. **Never commit** environment files with real tokens to version control
2. Use separate environments for dev/staging/prod
3. Rotate tokens regularly in production
4. Use **secret** type for sensitive variables in Postman
5. Clear tokens when done testing: Environment → Reset All

## 📱 Testing Socket.IO Events

Postman doesn't support WebSocket/Socket.IO directly. For real-time events:

1. Use [Socket.IO Client Tool](https://amritb.github.io/socketio-client-tool/)
2. Connect to: `http://localhost:3000`
3. Add auth: `{ "auth": { "token": "your-access-token" } }`
4. Listen for events: `alert:new`, `alert:critical`, `scan:complete`

## 🚀 Advanced Usage

### Using Pre-request Scripts

Collection includes auto-token extraction. To add custom logic:

1. Click collection or request
2. Go to **Pre-request Script** tab
3. Add JavaScript code (runs before request)

### Using Test Scripts

Example: Save scan ID automatically

```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set('scanId', response.data.id);
}
```

### Running Collection with Newman CLI

```bash
# Install Newman
npm install -g newman

# Run collection
newman run Hubble_API.postman_collection.json \
  -e Hubble_Development.postman_environment.json \
  --reporters cli,json

# Run specific folder
newman run Hubble_API.postman_collection.json \
  --folder "Authentication"
```

## 📖 API Documentation

For detailed API documentation with schemas, visit:

```
http://localhost:3000/api/docs
```

(Swagger UI when server is running)

## 🤝 Contributing

When adding new endpoints:

1. Add to appropriate folder in collection
2. Include description and test scripts
3. Document query parameters
4. Add example request bodies
5. Update this guide

---

**Happy Testing! 🎉**
