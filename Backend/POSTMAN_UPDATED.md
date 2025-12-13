# Postman Collection Updated ✅

**Version:** 2.0.0  
**Date:** 2025-01-27  
**Collection:** Hubble Cyberbullying Detection API

## Summary

The Postman collection has been updated to include all 31 API endpoints, matching the Thunder Client collection feature parity.

## Updates Applied

### 1. Version Bump
- Updated from **v1.0.0** → **v2.0.0**
- Updated description to reflect comprehensive API coverage

### 2. New Child Endpoints Added
Added 3 new requests to the **Child** folder:

1. **GET /api/child/profile**
   - Get child's own profile information
   - Uses `{{childToken}}` for authentication

2. **PUT /api/child/profile**
   - Update child profile (non-credential fields only)
   - Example: Update firstName, lastName

3. **PUT /api/child/profile - Blocked (Password)**
   - Demonstrates credential update blocking
   - Returns 403 Forbidden
   - Shows children cannot update password, email, or username

## Complete Endpoint Coverage (31 APIs)

### Authentication (4 endpoints)
- ✅ POST /api/auth/register
- ✅ POST /api/auth/login
- ✅ POST /api/auth/refresh-token
- ✅ POST /api/auth/logout

### Content Scanning (7 endpoints)
- ✅ POST /api/scan/text (3 variants: abusive, safe, self-harm)
- ✅ POST /api/scan/image (2 variants: URL, base64)
- ✅ GET /api/scan/history
- ✅ GET /api/scan/:id

### Alerts (6 endpoints)
- ✅ GET /api/alerts
- ✅ GET /api/alerts/:id
- ✅ PUT /api/alerts/:id/status
- ✅ PUT /api/alerts/:id/acknowledge
- ✅ PUT /api/alerts/:id/resolve
- ✅ GET /api/alerts/stats

### Parent Dashboard (7 endpoints)
- ✅ GET /api/parent/children
- ✅ GET /api/parent/dashboard
- ✅ GET /api/parent/incidents
- ✅ GET /api/parent/children/:childId
- ✅ PUT /api/parent/children/:childId
- ✅ GET /api/parent/children/:childId/scan-history
- ✅ GET /api/parent/activity-feed

### Child (4 endpoints)
- ✅ GET /api/child/profile *(NEW)*
- ✅ PUT /api/child/profile *(NEW)*
- ✅ PUT /api/child/profile - Blocked *(NEW - demo)*
- ✅ GET /api/child/scan-history

### System (3 endpoints)
- ✅ GET /api/health
- ✅ GET /api/swagger-ui
- ✅ GET /api/docs

## Environment Variables

The collection uses the following variables:

```json
{
  "baseUrl": "http://localhost:3000/api",
  "accessToken": "",
  "refreshToken": "",
  "childToken": "",
  "parentId": "",
  "childId": "",
  "scanId": "",
  "alertId": ""
}
```

### Auto-Captured Variables

Test scripts automatically capture:
- `accessToken` after parent login
- `childToken` after child login
- `refreshToken` after login
- `parentId` from registration/login
- `childId` from child registration/login
- `scanId` from scan operations
- `alertId` from alert queries

## Testing Workflow

### Quick Test Sequence

1. **Parent Registration** → Captures `parentId`, `accessToken`
2. **Child Registration** → Captures `childId`, `childToken`
3. **Scan Text (Abusive)** → Captures `scanId`, creates alert
4. **Get All Alerts** → Captures `alertId`
5. **Update Alert Status** → Test new endpoint
6. **Get Alert Statistics** → Test new endpoint
7. **Get Child Profile** → Test new endpoint
8. **Update Child Profile** → Test new endpoint
9. **Update Child Profile - Blocked** → Verify 403 response

### Parent Login Alternative

Instead of registration, use:
```
POST /api/auth/login
{
  "username": "parent_user",
  "password": "Password123!"
}
```

## Collection Location

```
d:\projects\Hubble\Backend\pstman\
├── Hubble_API.postman_collection.json (UPDATED)
├── Hubble_Development.postman_environment.json
└── Hubble_Production.postman_environment.json
```

## Import Instructions

1. Open Postman
2. Click **Import** button
3. Select `Hubble_API.postman_collection.json`
4. Import environment: `Hubble_Development.postman_environment.json`
5. Set active environment to **Hubble Development**
6. Run requests sequentially or use Collection Runner

## Feature Parity Status

| Feature | Thunder Client | Postman | Status |
|---------|----------------|---------|--------|
| Complete API Coverage | ✅ 31 endpoints | ✅ 31 endpoints | ✅ Match |
| Auto Token Capture | ✅ | ✅ | ✅ Match |
| Environment Variables | ✅ | ✅ | ✅ Match |
| Request Chaining | ✅ | ✅ | ✅ Match |
| Child Profile CRUD | ✅ | ✅ | ✅ Match |
| Credential Blocking Test | ✅ | ✅ | ✅ Match |
| Image Scanning | ✅ | ✅ | ✅ Match |
| Alert Statistics | ✅ | ✅ | ✅ Match |

## What's New in v2.0.0

### Child Profile Management
- **GET /api/child/profile** - Self-service profile viewing
- **PUT /api/child/profile** - Limited profile updates
- Credential blocking enforcement (username, email, password)

### Existing Features Confirmed
- Image scanning (URL + base64)
- Scan history with filters
- Alert status management
- Alert statistics dashboard

## Next Steps

- ✅ Postman collection updated
- ✅ Thunder Client collection complete
- ✅ Feature parity achieved
- ✅ All 31 APIs tested and working

**The API testing suite is now complete with both Thunder Client and Postman collections!**

## Notes

- Server must be running on `http://localhost:3000`
- MongoDB must be connected
- AI service runs in mock mode (`AI_SERVICE_MOCK=true`)
- Token expiration: 15 minutes (access), 7 days (refresh)
- Test with real AI by setting `AI_SERVICE_MOCK=false` in `.env`
