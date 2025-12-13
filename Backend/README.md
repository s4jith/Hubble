# Hubble Backend - Cyberbullying Detection & Prevention API

A secure, scalable, role-based, AI-powered backend for detecting and preventing cyberbullying in real-time. Built for the Hubble mobile application.

## 🚀 Features

- **Real-time Cyberbullying Detection** - AI-powered text and image analysis
- **Role-Based Access Control** - Parent, Child, and Admin roles with different permissions
- **Real-time Alerts** - Socket.IO powered instant notifications
- **Parent Dashboard** - Comprehensive analytics and monitoring
- **Mental Health Resources** - Curated resources for children
- **Audit Logging** - COPPA/GDPR compliant activity logging
- **Secure Authentication** - JWT with token rotation

## 🏗️ Architecture

```
src/
├── config/          # Environment, database, constants
├── docs/            # Swagger/OpenAPI documentation
├── middlewares/     # Auth, error, rate-limiting, audit
├── modules/
│   ├── ai/          # AI analysis service (mock/real)
│   ├── alerts/      # Alert management
│   ├── auth/        # Authentication & authorization
│   ├── child/       # Child-specific features
│   ├── parent/      # Parent dashboard & settings
│   ├── scan/        # Content scanning
│   └── users/       # User management
├── routes/          # API route aggregation
├── sockets/         # Socket.IO real-time service
├── tests/           # Jest test suites
├── types/           # TypeScript declarations
├── utils/           # Helpers, logger, response handlers
└── validations/     # Zod schemas
```

### Clean Layered Architecture

```
Controllers → Services → Repositories → Models
     ↓           ↓            ↓           ↓
  HTTP I/O   Business    Data Access   Database
             Logic
```

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js LTS |
| Framework | Express.js |
| Language | TypeScript (strict mode) |
| Database | MongoDB + Mongoose ODM |
| Authentication | JWT (Access + Refresh tokens) |
| Password Hashing | bcrypt (12 rounds) |
| Validation | Zod |
| Real-time | Socket.IO |
| Documentation | Swagger/OpenAPI 3.0 |
| Logging | Winston |
| Security | Helmet, Rate Limiting, CORS |
| Containerization | Docker + Docker Compose |
| Testing | Jest + Supertest |

## 📋 Prerequisites

- Node.js >= 18.x LTS
- MongoDB >= 6.0
- npm or yarn
- Docker (optional)

## 🚀 Getting Started

### 1. Clone and Install

```bash
cd Backend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/hubble

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# AI Service
AI_SERVICE_URL=http://localhost:5000
AI_SERVICE_MOCK=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Run with Docker

```bash
docker-compose up -d
```

## 📚 API Documentation

Once running, access Swagger UI at:

```
http://localhost:3000/api/docs
```

## 🔐 Authentication

### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `parent` | Primary account holder | Register, manage children, view all data |
| `child` | Child account (created by parent) | Login only, cannot modify credentials |
| `admin` | System administrator | Full access for oversight |

### Token Flow

1. **Register/Login** → Receive `accessToken` (15m) + `refreshToken` (7d)
2. **API Requests** → Include `Authorization: Bearer <accessToken>`
3. **Token Refresh** → POST `/api/auth/refresh-token` with `refreshToken`
4. **Logout** → Invalidates refresh token

## 🔄 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register parent account |
| POST | `/api/auth/child` | Create child account (parent only) |
| POST | `/api/auth/login` | Login (email/username + password) |
| POST | `/api/auth/refresh-token` | Refresh access token |
| POST | `/api/auth/logout` | Logout and invalidate tokens |

### Content Scanning
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scan/text` | Scan text for cyberbullying |
| POST | `/api/scan/image` | Scan image for harmful content |
| GET | `/api/scan/history` | Get scan history |
| GET | `/api/scan/:id` | Get specific scan result |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | Get all alerts (paginated) |
| GET | `/api/alerts/:id` | Get specific alert |
| PUT | `/api/alerts/:id/status` | Update alert status |
| PUT | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| PUT | `/api/alerts/:id/resolve` | Resolve alert |
| GET | `/api/alerts/stats` | Get alert statistics |

### Parent Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parent/children` | Get all children |
| GET | `/api/parent/dashboard` | Get dashboard summary |
| GET | `/api/parent/incidents` | Get all incidents |
| GET | `/api/parent/analytics` | Get analytics data |
| GET | `/api/parent/settings` | Get notification settings |
| PUT | `/api/parent/settings` | Update settings |

### Child
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/child/profile` | Get profile |
| PUT | `/api/child/profile` | Update profile (non-credentials) |
| GET | `/api/child/resources` | Get mental health resources |
| GET | `/api/child/scan-history` | Get personal scan history |

## 🔔 Real-time Events (Socket.IO)

### Client Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-access-token'
  }
});
```

### Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `alert:new` | Server → Client | New alert notification |
| `alert:critical` | Server → Client | Critical severity alert |
| `scan:complete` | Server → Client | Scan analysis complete |
| `connection` | Bidirectional | Connection established |
| `disconnect` | Bidirectional | Connection terminated |

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

## 🐳 Docker Commands

```bash
# Build and start
docker-compose up -d --build

# Stop
docker-compose down

# View logs
docker-compose logs -f backend

# Access MongoDB
docker-compose exec mongodb mongosh
```

## 📁 Project Structure Details

### Models

- **User** - Parent/Child accounts with role-based fields
- **ScanResult** - Content analysis results with AI output
- **Alert** - Notifications for detected incidents
- **Settings** - Parent notification/monitoring preferences
- **AuditLog** - Immutable compliance logs
- **MentalHealthResource** - Support resources for children

### Security Features

- **Password Hashing** - bcrypt with 12 salt rounds
- **JWT Tokens** - Short-lived access + rotating refresh tokens
- **Rate Limiting** - General, auth-specific, and scan-specific limits
- **Input Validation** - Zod schemas on all endpoints
- **Helmet** - Security headers
- **CORS** - Configurable origin whitelist
- **Audit Logging** - All sensitive actions logged

### AI Service Integration

The AI service is decoupled and supports mock mode for development:

```env
AI_SERVICE_MOCK=true  # Uses keyword-based detection
AI_SERVICE_MOCK=false # Calls real AI service
```

Detection categories:
- Harassment
- Threats
- Hate Speech
- Bullying
- Profanity
- Self-harm

## 🔧 Development

### Scripts

```bash
npm run dev       # Development with hot reload
npm run build     # TypeScript compilation
npm start         # Production server
npm test          # Run tests
npm run lint      # ESLint check
npm run format    # Prettier format
```

### Path Aliases

```typescript
import { env } from '@config/env';
import { UserRole } from '@config/constants';
import { logger } from '@utils/logger';
import { authenticate } from '@middlewares/auth.middleware';
```

## 📜 License

MIT License - see [LICENSE](../LICENSE)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**Built with ❤️ for the Hubble Hackathon**
