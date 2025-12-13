# Backend Integration Guide

This document outlines all the backend API endpoints and integration points needed for the Hubble mobile app.

## API Base URL
```
Development: http://localhost:3000/api
Production: https://api.hubble.com/api
```

## Authentication Endpoints

### 1. Login
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user" | "parent" | "child"
  }
}
```

### 2. Signup
```
POST /api/auth/signup
Content-Type: application/json

Request:
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}

Response: Same as login
```

### 3. Forgot Password
```
POST /api/auth/forgot-password
Content-Type: application/json

Request:
{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Password reset link sent to email"
}
```

### 4. Verify Token
```
GET /api/auth/verify-token
Authorization: Bearer {token}

Response:
{
  "success": true,
  "user": { user_object }
}
```

### 5. Logout
```
POST /api/auth/logout
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Dashboard Endpoints

### 1. Get Dashboard Statistics
```
GET /api/dashboard/stats
Authorization: Bearer {token}

Response:
{
  "activeReports": 12,
  "resolvedCases": 48,
  "communityMembers": 1200,
  "messages": 234
}
```

### 2. Get Security Tips
```
GET /api/dashboard/security-tips
Authorization: Bearer {token}

Response:
{
  "tips": [
    {
      "id": "1",
      "title": "Enable Two-Factor Authentication",
      "description": "Add extra security...",
      "icon": "lock"
    }
  ]
}
```

### 3. Get Cyber Updates
```
GET /api/dashboard/cyber-updates
Authorization: Bearer {token}

Response:
{
  "updates": [
    {
      "id": "1",
      "title": "New Phishing Campaign",
      "description": "Be aware of...",
      "type": "alert" | "info",
      "timestamp": "2025-12-13T10:30:00Z"
    }
  ]
}
```

## Feed Endpoints

### 1. Get Family Feed
```
GET /api/feed/family?page=1&limit=10
Authorization: Bearer {token}

Response:
{
  "posts": [
    {
      "id": "1",
      "author": "Emma Wilson",
      "authorAvatar": "url",
      "username": "@emmaw",
      "timestamp": "2025-12-13T10:00:00Z",
      "content": "Post content...",
      "image": "url",
      "likes": 21000,
      "comments": 389,
      "tags": ["aesthetic", "windyday"]
    }
  ],
  "hasMore": true
}
```

### 2. Get Public Feed
```
GET /api/feed/public?page=1&limit=10
Authorization: Bearer {token}

Response: Same as family feed
```

### 3. Create Post
```
POST /api/feed/post
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "content": "Post content",
  "image": "base64_or_url",
  "tags": ["cybersecurity", "awareness"],
  "feedType": "family" | "public"
}

Response:
{
  "success": true,
  "post": { post_object }
}
```

### 4. Validate Post Content
```
POST /api/feed/validate
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "content": "Post content to validate"
}

Response:
{
  "isValid": true,
  "containsHateSpeech": false,
  "flags": []
}

Note: Uses Gemini API for hate speech detection
```

## Chatbot Endpoints

### 1. Send Message
```
POST /api/chat/message
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "message": "User message",
  "sessionId": "user_id",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}

Response:
{
  "success": true,
  "response": "AI generated response",
  "formattedResponse": "Formatted for display"
}

Note: Backend should:
- Call Gemini API with the message
- Format response to be natural and supportive
- Keep conversation context
- Use psychological support prompts
```

## Complaint Endpoints

### 1. Upload Evidence Image
```
POST /api/complaints/upload-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request:
FormData with 'image' field

Response:
{
  "success": true,
  "imageUrl": "https://storage.url/image.jpg"
}
```

### 2. Submit Complaint
```
POST /api/complaints/submit
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "type": "deepfake" | "cyberbully" | "threat",
  "description": "Detailed description",
  "imageUrl": "url_from_upload",
  "userId": "user_id"
}

Response:
{
  "success": true,
  "complaintId": "complaint_id",
  "severity": "low" | "medium" | "high" | "critical",
  "reportedTo": ["School Authority", "Cyber Crime Branch"],
  "estimatedResponseTime": "24 hours"
}

Backend should:
- Analyze image using OCR if provided
- Use ML model to determine severity
- Auto-report to appropriate authorities based on severity
- Create report entry in database
- Send notifications to user
```

### 3. Get Complaint Status
```
GET /api/complaints/:complaintId
Authorization: Bearer {token}

Response:
{
  "id": "complaint_id",
  "type": "cyberbully",
  "status": "pending" | "reviewing" | "resolved" | "rejected",
  "description": "...",
  "submittedAt": "timestamp",
  "updatedAt": "timestamp",
  "reportedTo": ["authorities"],
  "resolution": "Resolution details"
}
```

## Reports Endpoints

### 1. Get User Reports
```
GET /api/reports/user/:userId?status=all&page=1&limit=10
Authorization: Bearer {token}

Query params:
- status: all | pending | reviewing | resolved | rejected
- page: pagination
- limit: items per page

Response:
{
  "reports": [
    {
      "id": "1",
      "type": "cyberbully",
      "status": "resolved",
      "description": "...",
      "date": "2025-12-10",
      "reportedTo": ["School Authority"]
    }
  ],
  "totalCount": 48,
  "hasMore": true
}
```

### 2. Get Report Details
```
GET /api/reports/:reportId
Authorization: Bearer {token}

Response:
{
  "report": {
    "id": "report_id",
    "type": "deepfake",
    "status": "reviewing",
    "description": "...",
    "evidence": ["image_urls"],
    "timeline": [
      {
        "timestamp": "2025-12-13T10:00:00Z",
        "action": "Complaint submitted",
        "actor": "user"
      },
      {
        "timestamp": "2025-12-13T10:30:00Z",
        "action": "Under review",
        "actor": "moderator"
      }
    ],
    "reportedTo": ["Cyber Crime Branch"],
    "assignedTo": "Officer Name",
    "resolution": null
  }
}
```

## ML Model Integration

### Image Analysis (OCR + Severity Detection)
```
POST /api/ml/analyze-image
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "imageUrl": "url_to_analyze"
}

Response:
{
  "success": true,
  "extractedText": "Text from OCR",
  "severity": "high",
  "threatLevel": 8.5,
  "categories": ["harassment", "threats"],
  "recommendations": ["Report to cyber police", "Block user"]
}

Backend should:
- Use OCR to extract text from screenshot
- Send to ML model (from Ai/text_toxicity folder)
- Return severity score and recommendations
```

## Gemini API Integration

The backend should integrate with Google's Gemini API for:

1. **Chatbot responses** - Natural, empathetic conversation
2. **Hate speech detection** - Validate user posts before publishing
3. **Content moderation** - Analyze complaints for severity

Example Gemini API usage in backend:
```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getChatbotResponse(userMessage, conversationHistory) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const prompt = `You are Echo, a supportive AI assistant for cyberbullying victims. 
  Be empathetic, calming, and provide helpful guidance. 
  User message: ${userMessage}`;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

## Error Responses

All endpoints should return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

Common error codes:
- `AUTH_REQUIRED` - Missing or invalid token
- `INVALID_INPUT` - Validation error
- `NOT_FOUND` - Resource not found
- `PERMISSION_DENIED` - Insufficient permissions
- `RATE_LIMIT` - Too many requests
- `SERVER_ERROR` - Internal server error

## Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer {jwt_token}
```

Token should be stored securely using expo-secure-store on mobile app.

## File Upload

For image uploads, use multipart/form-data:
- Max file size: 10MB
- Supported formats: JPEG, PNG, WebP
- Auto-resize large images on backend

## Rate Limiting

Implement rate limiting:
- Auth endpoints: 5 requests per minute
- Feed endpoints: 30 requests per minute
- Chat endpoints: 20 requests per minute
- Complaint endpoints: 10 requests per minute

## Notifications

Implement push notifications for:
- New complaint status updates
- Chat responses
- Feed interactions
- Security alerts

Use Firebase Cloud Messaging (FCM) or Expo Push Notifications.

## Database Schema

Refer to Backend/src/modules for existing schema definitions:
- users (auth module)
- posts (feed)
- complaints
- reports
- chat_messages

## Security Considerations

1. All passwords must be hashed using bcrypt
2. JWT tokens should expire after 7 days
3. Implement CSRF protection
4. Validate and sanitize all inputs
5. Use HTTPS only in production
6. Implement proper CORS policies
7. Store sensitive data encrypted
8. Regular security audits

## Testing

Create API tests for all endpoints using:
- Jest for unit tests
- Supertest for integration tests
- Postman collections provided in Backend/pstman/
