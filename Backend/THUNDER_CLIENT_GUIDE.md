# Thunder Client API Testing Guide

## 🎯 Quick Setup

### 1. Import Collection
The Thunder Client collection is already in the workspace at:
- `thunder-tests/thunderclient.json` - Main collection (29 requests)
- `thunder-tests/thunderEnvironment.json` - Environment variables

Thunder Client should auto-detect these files.

### 2. Select Environment
1. Click the Thunder Client icon in VS Code sidebar
2. Go to "Env" tab
3. Select "Hubble Development"

### 3. Run Tests in Order
Execute requests 1-29 sequentially for full workflow testing.

## 📋 Test Flow

### Phase 1: Authentication (Requests 1-4)
```
1. Register Parent → Creates account + saves tokens
2. Login Parent → Tests login flow
3. Create Child Account → Parent creates child
4. Login as Child → Get child token
```

### Phase 2: Content Scanning (Requests 5-10)
```
5. Scan Text - Safe Content → Non-abusive detection
6. Scan Text - Abusive Content → Cyberbullying detection
7. Scan Text - Self-Harm → Critical severity detection
8. Scan Image → Image analysis
9. Get Scan History → Pagination test
10. Get Scan by ID → Retrieve specific scan
```

### Phase 3: Alerts Management (Requests 11-16)
```
11. Get All Alerts (Parent) → List with filters
12. Get Alert by ID → Specific alert details
13. Acknowledge Alert → Mark as seen
14. Update Alert Status → Change to 'reviewed'
15. Resolve Alert → Close with notes
16. Get Alert Statistics → Stats dashboard
```

### Phase 4: Parent Dashboard (Requests 17-22)
```
17. Get Children List → All children under parent
18. Get Dashboard Summary → Overview stats
19. Get Incidents → Cyberbullying incidents
20. Get Analytics → Trends data
21. Get Parent Settings → Current preferences
22. Update Parent Settings → Modify notifications
```

### Phase 5: Child Features (Requests 23-27)
```
23. Get Child Profile → Child's own data
24. Update Child Profile → Allowed fields
25. Update Child Profile - Blocked → Test credential protection
26. Get Mental Health Resources → Support links
27. Get Child Scan History → Personal scans
```

### Phase 6: Token Management (Requests 28-29)
```
28. Refresh Token → Get new access token
29. Logout → Invalidate refresh token
```

## ✅ Expected Results

### All Requests Should:
- Return proper HTTP status codes (200, 201, 403, etc.)
- Have `success: true` in response body (except blocked operations)
- Auto-save tokens and IDs to environment variables

### Key Validations:
| Request | Expected Status | Key Validation |
|---------|----------------|----------------|
| Register Parent | 201 | Returns accessToken + refreshToken |
| Login | 200 | Returns both tokens |
| Create Child | 201 | Child ID saved |
| Scan Safe Text | 200 | isAbusive = false |
| Scan Abusive Text | 200 | isAbusive = true |
| Scan Self-Harm | 200 | severityScore > 0.7 |
| Get Alerts | 200 | Array of alerts |
| Child Update Password | 403 | BLOCKED - credential protection |
| Get Analytics | 200 | Trends data with period |

## 🔧 Environment Variables

Auto-populated by test scripts:
- `{{baseUrl}}` - API base URL (http://localhost:3000/api)
- `{{accessToken}}` - Parent auth token
- `{{refreshToken}}` - Refresh token
- `{{childToken}}` - Child auth token
- `{{parentId}}` - Parent user ID
- `{{childId}}` - Child user ID
- `{{scanId}}` - Recent scan ID
- `{{alertId}}` - Recent alert ID

## 🐛 Troubleshooting

### Issue: 401 Unauthorized
**Solution:** Run requests 1-2 first to get fresh tokens

### Issue: 404 Not Found on Alert/Scan by ID
**Solution:** 
1. Run request 6 to create abusive scan
2. Run request 11 to generate alert
3. Environment variables should auto-populate

### Issue: Empty alerts list
**Solution:** Run requests 6-7 first (abusive scans) to generate alerts

### Issue: Variables not saving
**Solution:** Check "Env" tab → "Hubble Development" is selected

## 📊 Testing Scenarios

### Scenario 1: Complete Parent Workflow
```
1. Register Parent (1)
2. Create Child (3)
3. Check Dashboard (18)
4. View Children (17)
5. Update Settings (22)
```

### Scenario 2: Cyberbullying Detection
```
1. Login as Child (4)
2. Scan Abusive Content (6)
3. Login as Parent (2)
4. View Alerts (11)
5. Acknowledge Alert (13)
6. Resolve Alert (15)
```

### Scenario 3: Child Safety Check
```
1. Login as Child (4)
2. Try Update Password (25) → SHOULD FAIL 403
3. Update Profile Name (24) → SHOULD SUCCEED
4. Get Resources (26)
5. View Own History (27)
```

## 🚀 Advanced Testing

### Custom Tests
Add test scripts in Thunder Client:
```javascript
// Example: Validate response structure
const response = tc.response.json;
tc.test("Has success field", () => {
  tc.expect(response.success).to.be.true;
});
```

### Query Parameters
Modify URLs for filtering:
```
/alerts?severity=high&status=pending
/scan/history?isAbusive=true&page=1&limit=10
/parent/analytics?period=30d&childId={{childId}}
```

### Bulk Testing
Run entire collection:
1. Right-click collection
2. Select "Run All"
3. View results in "Activity" tab

## 📝 API Coverage

Total Endpoints: 29
- ✅ Authentication: 5 endpoints
- ✅ Content Scanning: 5 endpoints  
- ✅ Alerts: 6 endpoints
- ✅ Parent Dashboard: 6 endpoints
- ✅ Child Features: 5 endpoints
- ✅ Health Check: 1 endpoint
- ✅ Token Management: 1 endpoint

## 🔒 Security Testing

### Test Cases Covered:
1. ✅ JWT Token Authentication
2. ✅ Role-Based Access Control (Parent vs Child)
3. ✅ Child Credential Protection (blocked updates)
4. ✅ Token Refresh Flow
5. ✅ Logout & Token Invalidation

### Not Covered (Manual Testing Required):
- Rate limiting (requires 100+ requests)
- Socket.IO real-time events
- File upload for image scanning
- Concurrent user sessions

## 📈 Success Metrics

After running all 29 tests:
- ✅ 27 requests should return 2xx status
- ⚠️ 2 requests should return 403 (child credential block)
- 🎯 All environment variables populated
- 📊 Alerts generated and visible in dashboard
- 🔐 Token refresh working correctly

---

**Server Status:** http://localhost:3000/api/health  
**API Docs:** http://localhost:3000/api/docs
