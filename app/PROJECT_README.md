# Hubble - Cyberbullying Detection & Prevention Mobile App

A React Native mobile application for detecting and preventing cyberbullying with AI-powered assistance.

## Features

### 1. Authentication
- Login with email and password
- Sign up for new users
- Forgot password functionality
- Social login options (Facebook, Google, Apple)

### 2. Dashboard
- Overview of active reports and resolved cases
- Community statistics
- Security tips and cyber awareness content
- Recent cyber updates and alerts
- Quick access to chatbot and complaint filing

### 3. Feed (Community)
- Family feed for private family updates
- Public feed for community cyber awareness
- Post cyber security tips and experiences
- Like and comment on posts
- Hashtag support for categorization

### 4. AI Chatbot (Echo)
- Soothing and supportive conversation interface
- AI-powered responses using Gemini API
- Designed to help victims of cyberbullying
- Smooth animations for calming effect
- Text-only input for focused conversations

### 5. Complaint Upload
- Report deepfakes, cyberbullying, or threats
- Upload evidence (photos/screenshots)
- Text description of incidents
- Automatic severity analysis using ML model
- Direct submission to appropriate authorities

### 6. Reports & Logs
- Track status of submitted complaints
- Filter by pending, reviewing, or resolved
- View which authorities were notified
- Detailed report history with timestamps

### 7. Settings
- Profile management
- Notification preferences
- Privacy and security settings
- Permissions management
- Help and support access

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v7
- **UI Components**: Custom components with Lucide React Native icons
- **Styling**: React Native StyleSheet
- **State Management**: React Context API (ready for Redux)
- **Colors**: Bright yellow, red, and black theme
- **Font**: Poppins (to be integrated)

## Design Principles

- Minimal and clean UI
- Soft, calming colors for sensitive content
- Professional spacing using consistent SPACING constants
- Smooth animations for better UX
- Accessibility-focused design

## Project Structure

```
app/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── ForgotPasswordScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── FeedScreen.tsx
│   │   ├── ChatBotScreen.tsx
│   │   ├── ComplaintUploadScreen.tsx
│   │   ├── ReportsLogScreen.tsx
│   │   └── SettingsScreenNew.tsx
│   ├── components/
│   │   └── (reusable UI components)
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── constants/
│   │   └── theme.ts
│   └── services/
│       └── (API service files)
├── App.tsx
└── package.json
```

## Installation & Setup

### Prerequisites
- Node.js (v22 or later recommended)
- npm or yarn
- Expo CLI

### Steps

1. Install dependencies:
```bash
cd app
npm install --legacy-peer-deps
```

2. Start the development server:
```bash
npx expo start
```

3. Run on web:
```bash
npx expo start --web
```

4. Run on iOS:
```bash
npx expo start --ios
```

5. Run on Android:
```bash
npx expo start --android
```

## Backend Integration

All screens contain TODO comments marking where backend integration is needed:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/forgot-password` - Password reset
- `GET /api/auth/verify-token` - Token verification

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/security-tips` - Get security tips

### Feed
- `GET /api/feed/family` - Get family feed posts
- `GET /api/feed/public` - Get public feed posts
- `POST /api/feed/post` - Create new post
- `POST /api/feed/validate` - Validate post for hate speech using Gemini API

### Chatbot
- `POST /api/chat/message` - Send message and get AI response (Gemini API)

### Complaints
- `POST /api/complaints/upload-image` - Upload evidence
- `POST /api/complaints/submit` - Submit complaint
- ML model integration for severity analysis
- Automatic reporting to authorities

### Reports
- `GET /api/reports/user/:userId` - Get user's reports
- `GET /api/reports/:reportId` - Get specific report details

## Environment Variables

Create a `.env` file in the app directory:

```
API_BASE_URL=http://localhost:3000/api
GEMINI_API_KEY=your_gemini_api_key
```

## Color Scheme

```typescript
COLORS = {
  background: '#FFFFFF',
  surface: '#F8F9FA',
  primary: '#FFD700', // Bright Yellow
  secondary: '#FF4444', // Red
  accent: '#000000', // Black
  text: '#000000',
  textSecondary: '#666666',
  textLight: '#999999',
  success: '#4CAF50',
  border: '#E0E0E0',
}
```

## Typography

Font: Poppins
- Regular: 400
- Medium: 500
- SemiBold: 600
- Bold: 700

## Next Steps

1. Install Poppins font using expo-font
2. Integrate with backend API endpoints
3. Add expo-secure-store for token management
4. Implement expo-image-picker for complaint uploads
5. Set up Gemini API integration for chatbot
6. Add push notifications using expo-notifications
7. Implement real-time updates using WebSockets
8. Add screenshot capture functionality
9. Integrate ML model for OCR and severity detection
10. Add parental control features

## Testing

```bash
# Run tests (to be implemented)
npm test
```

## License

Copyright 2025 Hubble - All rights reserved
