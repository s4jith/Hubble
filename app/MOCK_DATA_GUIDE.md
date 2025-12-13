# Mock Data Quick Reference

## Test Credentials

### User 1
- **Email:** `john@example.com`
- **Password:** `passwo@rd123`
- **Name:** John Doe
- **ID:** 1

### User 2
- **Email:** `jane@example.com`
- **Password:** `password123`
- **Name:** Jane Smith
- **ID:** 2

## Dashboard Stats
```json
{
  "totalReports": 24,
  "activeAlerts": 3,
  "resolved": 18,
  "pending": 6
}
```

## Feed Posts (6 total)

### Family Posts (3)
1. Sarah Johnson - Phishing scam warning (2 hours ago)
2. Michael Chen - Cyberbullying experience (5 hours ago)
3. Priya Sharma - Thank you message (2 days ago)

### Public Posts (3)
1. Cyber Safety India - Deepfake detection (1 day ago) + image
2. Tech News Daily - Cybercrime stats (1 day ago) + image
3. National Cyber Cell - Safety guidelines (3 days ago) + image

## Complaints (5 total)

| Type | Status | Severity | Authority |
|------|--------|----------|-----------|
| Cyberbullying | under_review | high | Cyber Crime Cell |
| Deepfake | resolved | critical | National Cyber Cell |
| Threat | in_progress | critical | Local Police |
| Cyberbullying | pending | medium | School Authority |
| Deepfake | resolved | high | Cyber Crime Cell |

## Security Tips (5)
1. Never share personal information with strangers online
2. Use strong and unique passwords for each account
3. Enable two-factor authentication wherever possible
4. Verify identity before accepting friend requests
5. Report suspicious activity immediately

## Chatbot Response Templates

### Greeting
- "Hello! I'm here to listen and support you. How are you feeling?"
- "Hi there! I'm Echo, your safe space companion. What's on your mind?"
- "Welcome! Take a deep breath. I'm here to help. How can I support you today?"

### Support
- "I understand this must be difficult for you. You're not alone in this."
- "Thank you for sharing that with me. Your feelings are valid."
- "It takes courage to speak up. I'm proud of you for reaching out."

### Resources
- "Would you like me to connect you with professional help?"
- "I can help you file a report if you're ready. Would that be helpful?"
- "There are trained counselors available 24/7. Would you like their contact information?"

### Emergency
- "If you're in immediate danger, please call emergency services: 112"
- "Your safety is the priority. Consider reaching out to a trusted adult or authority."
- "National Cyber Crime Helpline: 1930. They're available to help you right now."

## How to Use in Code

### Login
```typescript
const user = mockData.users.find(
  u => u.email === email && u.password === password
);
```

### Dashboard
```typescript
dispatch(setStats(mockData.dashboardStats));
dispatch(setSecurityTips(mockData.securityTips));
```

### Feed
```typescript
dispatch(setPosts(mockData.feedPosts));
const filteredPosts = posts.filter(p => p.type === activeTab);
```

### Chat
```typescript
dispatch(setMessages(mockData.chatMessages));

// Random bot response
const responses = mockData.botResponses.support;
const botText = responses[Math.floor(Math.random() * responses.length)];
```

### Complaints
```typescript
dispatch(setComplaints(mockData.complaints));

// Filter by status
const filtered = complaints.filter(c => c.status === 'pending');
```

## Data Structure Location

**File:** `/app/src/data/mockData.json`

Import in any file:
```typescript
import mockData from '../data/mockData.json';
```

## Redux State Access

### Reading State
```typescript
import { useAppSelector } from '../store/hooks';

const { user } = useAppSelector((state) => state.auth);
const { posts } = useAppSelector((state) => state.feed);
const { messages } = useAppSelector((state) => state.chat);
const { complaints } = useAppSelector((state) => state.complaint);
const { stats } = useAppSelector((state) => state.dashboard);
```

### Updating State
```typescript
import { useAppDispatch } from '../store/hooks';
import { loginSuccess, setPosts, addMessage } from '../store/slices/...';

const dispatch = useAppDispatch();

dispatch(loginSuccess({ user, token }));
dispatch(setPosts(mockData.feedPosts));
dispatch(addMessage(newMessage));
```

## Testing Scenarios

### Scenario 1: New User Signup
1. Click "Sign Up"
2. Enter: Name="Test User", Email="test@test.com", Password="test123"
3. Confirm password: "test123"
4. Should auto-login and show dashboard

### Scenario 2: Existing User Login
1. Enter Email: "john@example.com"
2. Enter Password: "password123"
3. Should login and show dashboard with 24 reports

### Scenario 3: View Feed Posts
1. Login
2. Go to Feed tab
3. Click "Family" - should see 3 posts
4. Click "Public" - should see 3 posts

### Scenario 4: Chat with Bot
1. Login
2. Go to ChatBot screen
3. Type message
4. Should get random supportive response

### Scenario 5: Submit Complaint
1. Login
2. Go to Dashboard
3. Click "Upload Complaint"
4. Select type, add description
5. Submit - should add to complaints list

### Scenario 6: View Reports
1. Login
2. Go to Reports tab
3. Should see 5 complaints
4. Filter by status (All, Pending, Under Review, etc.)

## Mock Data Benefits

✅ **No Backend Required** - App works fully offline
✅ **Fast Development** - Test UI without waiting for APIs
✅ **Consistent Data** - Same data every time for testing
✅ **Easy Debugging** - Known data makes issues easier to find
✅ **Demo Ready** - Can demo app without internet
✅ **Type Safe** - JSON structure matches TypeScript interfaces

## When to Remove Mock Data

Replace mock data with API calls when:
1. Backend endpoints are ready
2. Authentication service is live
3. Database is populated
4. API keys (Gemini) are configured
5. ML models are deployed

Simply search for "BACKEND TODO" comments and replace mock data calls with actual API calls.
