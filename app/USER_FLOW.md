# Hubble App - User Flow & Navigation

## Authentication Flow

```
┌─────────────────────┐
│   App Launch        │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────┐
    │ Check Auth   │
    │ Token        │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐  ┌──────────┐
│ Not     │  │ Auth     │
│ Auth    │  │ Valid    │
└────┬────┘  └────┬─────┘
     │            │
     ▼            ▼
┌─────────┐  ┌──────────┐
│ Login   │  │ Main App │
│ Screen  │  │ (Tabs)   │
└────┬────┘  └──────────┘
     │
     ├──► Signup Screen
     │
     └──► Forgot Password
```

## Main App Navigation

```
┌────────────────────────────────────────────────┐
│              Main Tab Navigator                │
├────────┬──────────┬──────────┬─────────────────┤
│        │          │          │                 │
▼        ▼          ▼          ▼                 │
┌──────────────────────────────────────┐         │
│          Dashboard Screen            │         │
│  ┌─────────────────────────────┐    │         │
│  │ Welcome Header              │    │         │
│  └─────────────────────────────┘    │         │
│  ┌──────────┐  ┌──────────┐        │         │
│  │ Talk     │  │ File     │        │         │
│  │ with Echo│  │ Complaint│ ◄──────┼─────────┤
│  └────┬─────┘  └────┬─────┘        │         │
│       │             │               │         │
│  ┌─────────────────────────────┐   │         │
│  │ Statistics Cards            │   │         │
│  ├─────────────────────────────┤   │         │
│  │ Security Tips               │   │         │
│  ├─────────────────────────────┤   │         │
│  │ Recent Cyber Updates        │   │         │
│  └─────────────────────────────┘   │         │
└────────────────┬─────────────────┬─┘         │
                 │                 │            │
          ┌──────┴──────┐   ┌──────┴──────┐   │
          ▼             ▼   ▼             ▼    │
    ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐
    │  Feed    │  │  Reports     │  │ Settings │  │ ChatBot  │
    │  Screen  │  │  Screen      │  │ Screen   │  │ (Modal)  │
    └──────────┘  └──────────────┘  └──────────┘  └──────────┘
         │                │                │             │
         │                │                └──► Logout  │
         │                │                              │
    ┌────┴─────┐    ┌────┴─────┐                       │
    │          │    │          │                        │
    ▼          ▼    ▼          ▼                        │
Family  Public  All  Pending                            │
Feed    Feed    Reports Resolved                        │
                                                         │
    ┌────────────────────────────────────────────┐     │
    │     Complaint Upload Screen (Modal)        │◄────┘
    │  ┌─────────────────────────────────┐      │
    │  │ Type Selection                  │      │
    │  │ [Deepfake][Cyberbully][Threat] │      │
    │  ├─────────────────────────────────┤      │
    │  │ Upload Evidence                 │      │
    │  │ [Gallery] [Camera]              │      │
    │  ├─────────────────────────────────┤      │
    │  │ Description Text Area           │      │
    │  ├─────────────────────────────────┤      │
    │  │ [Submit Complaint]              │      │
    │  └─────────────────────────────────┘      │
    └────────────────────────────────────────────┘
```

## Screen Component Breakdown

### 1. Login Screen
```
┌────────────────────────────────┐
│ [←]                            │
│                                │
│ Log in                         │
│ Enter your email and password  │
│                                │
│ ┌────────────────────────────┐ │
│ │ 📧 Email address           │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ 🔒 Password           👁   │ │
│ └────────────────────────────┘ │
│                                │
│ [✓] Remember me  Forgot Pass?  │
│                                │
│ ┌────────────────────────────┐ │
│ │       Login (Green)        │ │
│ └────────────────────────────┘ │
│                                │
│ Don't have account? Sign Up    │
│                                │
│ Or Continue With Account       │
│                                │
│    [f]    [G]    [🍎]         │
└────────────────────────────────┘
```

### 2. Dashboard Screen
```
┌────────────────────────────────┐
│ Hello, James          [Avatar] │
│ Stay safe and informed         │
│                                │
│ ┌──────────┐  ┌──────────┐    │
│ │ 💬 Talk  │  │ 📄 File  │    │
│ │ with Echo│  │ Complaint│    │
│ └──────────┘  └──────────┘    │
│                                │
│ Overview                       │
│ ┌──────────┐  ┌──────────┐    │
│ │📄 12     │  │🛡️ 48     │    │
│ │Active    │  │Resolved  │    │
│ │Reports   │  │Cases     │    │
│ └──────────┘  └──────────┘    │
│ ┌──────────┐  ┌──────────┐    │
│ │👥 1.2k   │  │💬 234    │    │
│ │Community │  │Messages  │    │
│ └──────────┘  └──────────┘    │
│                                │
│ Security Tips        View All  │
│ ┌────────────────────────────┐ │
│ │ 🔒 Enable 2FA              │ │
│ │ Add extra security...      │ │
│ └────────────────────────────┘ │
│                                │
│ Recent Cyber Updates           │
│ ┌────────────────────────────┐ │
│ │ ⚠️ Alert         2h ago    │ │
│ │ New Phishing Campaign      │ │
│ │ Be aware of emails...      │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

### 3. Feed Screen
```
┌────────────────────────────────┐
│ VibeFeed                [+]    │
│                                │
│ [👥 Family]  [🌐 Public]      │
│────────────────────────────────│
│ ┌────────────────────────────┐ │
│ │ [👤] Emma Wilson   1h ago  │ │
│ │      @emmaw                │ │
│ │                            │ │
│ │ [      Image Here      ]   │ │
│ │                            │ │
│ │ Soft wind, warm light...   │ │
│ │                            │ │
│ │ #aesthetic #windyday       │ │
│ │                            │ │
│ │ ❤️ 21k  💬 389            │ │
│ └────────────────────────────┘ │
│                                │
│ [More posts...]                │
└────────────────────────────────┘
```

### 4. Chatbot Screen
```
┌────────────────────────────────┐
│ ┌──────────┐                   │
│ │   🤖    │ Echo               │
│ └──────────┘ Your AI Assistant │
│────────────────────────────────│
│                                │
│    ┌────────────────────────┐  │
│ [🤖]│ Hello! How can I     │  │
│    │ assist you right now? │  │
│    └────────────────────────┘  │
│                                │
│       ┌────────────────────┐ [👤]
│       │ I'm being bullied  │   │
│       │ online...          │   │
│       └────────────────────┘   │
│                                │
│    ┌────────────────────────┐  │
│ [🤖]│ I understand. Can you│  │
│    │ tell me more?         │  │
│    └────────────────────────┘  │
│────────────────────────────────│
│ [Type your message...]    [➤]  │
└────────────────────────────────┘
```

### 5. Complaint Upload Screen
```
┌────────────────────────────────┐
│ File a Complaint               │
│ Report incidents of...         │
│                                │
│ Complaint Type                 │
│ ┌──────┐ ┌──────┐ ┌──────┐   │
│ │ 📷   │ │ ⚠️   │ │ 📄   │   │
│ │Deep- │ │Cyber-│ │Threat│   │
│ │fake  │ │bully │ │      │   │
│ └──────┘ └──────┘ └──────┘   │
│                                │
│ Evidence                       │
│ ┌──────────┐ ┌──────────┐    │
│ │📤 Choose │ │📷 Take   │    │
│ │  Gallery │ │  Photo   │    │
│ └──────────┘ └──────────┘    │
│                                │
│ Description                    │
│ ┌────────────────────────────┐ │
│ │                            │ │
│ │ Describe what happened...  │ │
│ │                            │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ ➤ Submit Complaint (Red)  │ │
│ └────────────────────────────┘ │
│                                │
│ ⚠️ Your complaint will be...  │
└────────────────────────────────┘
```

### 6. Reports Screen
```
┌────────────────────────────────┐
│ My Reports                     │
│ Track the status...            │
│                                │
│ [All] [Pending] [Resolved]     │
│────────────────────────────────│
│ ┌────────────────────────────┐ │
│ │ 📄 Cyberbullying [✓]       │ │
│ │                   Resolved  │ │
│ │ Abusive messages received  │ │
│ │                            │ │
│ │ 2025-12-10                 │ │
│ │ [School] [Platform]        │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ 📄 Deepfake    [⏰]         │ │
│ │                   Reviewing │ │
│ │ Fake images circulating... │ │
│ │                            │ │
│ │ 2025-12-12                 │ │
│ │ [Cyber Crime]              │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

### 7. Settings Screen
```
┌────────────────────────────────┐
│ Settings                       │
│ Manage your account...         │
│                                │
│ ACCOUNT                        │
│ ┌────────────────────────────┐ │
│ │ [👤] Profile Settings  →   │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │ [🔔] Notifications      →  │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │ [🛡️] Privacy & Security →  │ │
│ └────────────────────────────┘ │
│                                │
│ APP                            │
│ ┌────────────────────────────┐ │
│ │ [🔒] Permissions        →  │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │ [❓] Help & Support     →  │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │  🚪 Log Out                │ │
│ └────────────────────────────┘ │
│                                │
│       Version 1.0.0            │
│    Hubble - Cyberbullying      │
└────────────────────────────────┘
```

## Data Flow

### Authentication Flow
```
User Input → LoginScreen → AuthContext → Backend API → Store Token → Navigate to MainApp
```

### Feed Flow
```
FeedScreen → Backend API → Display Posts → User Interaction → Gemini API (validation) → Post
```

### Chatbot Flow
```
User Message → ChatBotScreen → Backend API → Gemini API → Format Response → Display
```

### Complaint Flow
```
Select Type → Upload Evidence → Write Description → Submit → ML Analysis → Severity Detection → Authorities Notification → Reports Database
```

### Report Tracking Flow
```
ReportsScreen → Backend API → Filter/Sort → Display Status → Track Updates → Show Timeline
```

## Backend Integration Points

### API Calls per Screen

**LoginScreen**: 1 API call
- POST /api/auth/login

**SignupScreen**: 1 API call
- POST /api/auth/signup

**DashboardScreen**: 2 API calls
- GET /api/dashboard/stats
- GET /api/dashboard/security-tips

**FeedScreen**: 3 API calls
- GET /api/feed/family
- GET /api/feed/public
- POST /api/feed/validate (Gemini)

**ChatBotScreen**: 1 API call
- POST /api/chat/message (Gemini)

**ComplaintUploadScreen**: 2 API calls
- POST /api/complaints/upload-image
- POST /api/complaints/submit (ML Model)

**ReportsLogScreen**: 1 API call
- GET /api/reports/user/:userId

## State Management

```
AuthContext
    ├── user
    ├── isAuthenticated
    ├── isLoading
    ├── login()
    ├── signup()
    └── logout()

Future: AppContext
    ├── reports
    ├── feed
    ├── chatHistory
    └── settings
```

## Security Flow

```
App Launch
    ↓
Check Secure Storage
    ↓
Token Found? ──No──→ Show Login
    │
   Yes
    ↓
Verify Token with Backend
    ↓
Valid? ──No──→ Show Login
    │
   Yes
    ↓
Load User Data
    ↓
Show Main App
```

## Error Handling Flow

```
API Call
    ↓
Error? ──No──→ Success Flow
    │
   Yes
    ↓
Check Error Type
    ├── Network Error → Show Offline Message
    ├── Auth Error → Logout & Show Login
    ├── Validation Error → Show Field Errors
    └── Server Error → Show Retry Option
```

---

This comprehensive flow diagram shows how users navigate through the app and how data flows between screens and backend systems.
