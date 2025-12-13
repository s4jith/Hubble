# 🚀 Quick Start - Test All APIs Now!

## Prerequisites ✅
- ✅ Server is running on http://localhost:3000
- ✅ Thunder Client extension installed in VS Code
- ✅ Thunder Client collection auto-loaded from `thunder-tests/` folder

## Step-by-Step Testing Guide

### 1. Open Thunder Client
1. Click the **Thunder Client** icon in VS Code sidebar (lightning bolt ⚡)
2. You should see "Collections" tab

### 2. Select Environment
1. Click "Env" tab in Thunder Client
2. Select **"Hubble Development"** from dropdown
3. Verify `baseUrl` is set to `http://localhost:3000/api`

### 3. Run Tests Sequentially

#### Group 1: Setup (Run First) 
```
▶️ 1. Register Parent
   → Creates parent account
   → Auto-saves: accessToken, refreshToken, parentId

▶️ 3. Create Child Account  
   → Creates child under parent
   → Auto-saves: childId

▶️ 4. Login as Child
   → Gets child authentication
   → Auto-saves: childToken
```

#### Group 2: Test Scanning
```
▶️ 5. Scan Text - Safe Content
   → Should return isAbusive: false

▶️ 6. Scan Text - Abusive Content
   → Should return isAbusive: true
   → Creates alert automatically
   → Auto-saves: scanId

▶️ 7. Scan Text - Self-Harm Detection
   → Should return severityScore > 0.7
   → Critical severity

▶️ 8. Scan Image
   → Test image scanning
```

#### Group 3: Test Alerts (Switch to Parent)
```
▶️ 2. Login Parent (to get fresh parent token)

▶️ 11. Get All Alerts (Parent)
   → See alerts created from scans
   → Auto-saves: alertId

▶️ 13. Acknowledge Alert
   → Mark alert as seen

▶️ 14. Update Alert Status
   → Change status to 'reviewed'

▶️ 15. Resolve Alert
   → Mark as resolved with notes

▶️ 16. Get Alert Statistics
   → See stats by severity/status
```

#### Group 4: Test Dashboard
```
▶️ 17. Get Children List
   → See all children under parent

▶️ 18. Get Dashboard Summary
   → Overview statistics

▶️ 19. Get Incidents
   → All cyberbullying incidents

▶️ 20. Get Analytics
   → Trends over 7 days

▶️ 21. Get Parent Settings
   → Current notification settings

▶️ 22. Update Parent Settings
   → Modify notification preferences
```

#### Group 5: Test Child Features
```
▶️ 4. Login as Child (if childToken expired)

▶️ 23. Get Child Profile
   → View child's profile

▶️ 24. Update Child Profile
   → Change firstName (allowed)

▶️ 25. Update Child Profile - Blocked (Password)
   → Should return 403 Forbidden ✅
   → Credential protection working

▶️ 26. Get Mental Health Resources
   → Access support resources

▶️ 27. Get Child Scan History
   → View personal scans
```

#### Group 6: Test Misc
```
▶️ Health Check
   → Server status check

▶️ 9. Get Scan History
   → Paginated scan list

▶️ 10. Get Scan by ID
   → Specific scan details

▶️ 28. Refresh Token
   → Get new access token

▶️ 29. Logout
   → Invalidate tokens
```

## 🎯 Expected Results

### Success Indicators
- ✅ Status codes: 200 (OK), 201 (Created)
- ✅ Response has `"success": true`
- ✅ Tokens auto-saved to environment
- ✅ IDs captured automatically

### Expected Failures (These are CORRECT)
- ⚠️ Request 25 (Update Password): **403 Forbidden** - Child credential protection
- ⚠️ Any unauthorized request: **401 Unauthorized** - Auth working

## 📊 Quick Test - Run These 10 Requests

For a fast verification, just run these:

1. **1. Register Parent** - Auth works
2. **3. Create Child Account** - Parent can create child
3. **4. Login as Child** - Child auth works
4. **6. Scan Text - Abusive Content** - Detection works, alert created
5. **2. Login Parent** - Switch back to parent
6. **11. Get All Alerts** - Alert visible to parent
7. **13. Acknowledge Alert** - Alert management works
8. **23. Get Child Profile** - Child data access works
9. **25. Update Child Profile - Blocked** - Returns 403 (correct!)
10. **Health Check** - Server healthy

### If All 10 Pass → All APIs Working! ✅

## 🔧 Tips

### Token Management
- Tokens are **automatically saved** after login/register
- No manual copying needed!
- Check "Env" tab to see saved values

### Troubleshooting
- **401 Error:** Run login request again
- **404 on Alert/Scan ID:** Run scan request (6 or 7) first
- **Empty alerts:** Need to run scan requests with abusive content

### Running All at Once
1. Right-click collection name
2. Select "Run All"
3. View results in Activity tab

## 📝 Notes

- Run requests **in order** for best results
- Requests 1-4 must run first (authentication setup)
- Some requests depend on previous ones (e.g., need alertId from request 11)
- All environment variables auto-populate

## 🎉 Done!

After running all 29 requests, you'll have tested:
- ✅ Complete authentication flow
- ✅ Content scanning (safe, abusive, self-harm)
- ✅ Alert creation and management
- ✅ Parent dashboard features
- ✅ Child safety and restrictions
- ✅ Token refresh and logout

**Total Time:** ~5-10 minutes for full test suite

---

**Ready to test?** Open Thunder Client now! ⚡
