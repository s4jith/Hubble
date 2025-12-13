# Quick Start Guide - Hubble Mobile App

## 🚀 Getting Started in 5 Minutes

### Prerequisites
✅ Node.js v22+ installed
✅ npm or yarn installed
✅ Expo CLI (will be used via npx)

### Installation

```bash
# Navigate to app directory
cd app

# Install dependencies (use legacy peer deps flag)
npm install --legacy-peer-deps

# Start the development server
npx expo start
```

### Running the App

#### On Web Browser 🌐
```bash
npx expo start --web
```
Opens at: http://localhost:8081

#### On iOS Simulator 📱
```bash
npx expo start --ios
```
Requires: Xcode installed on macOS

#### On Android Emulator 🤖
```bash
npx expo start --android
```
Requires: Android Studio with emulator configured

#### On Physical Device 📲
1. Install Expo Go app from App Store or Play Store
2. Run: `npx expo start`
3. Scan QR code with Expo Go app

## 📁 Project Structure

```
app/
├── src/
│   ├── screens/          # All screen components
│   ├── components/       # Reusable UI components
│   ├── context/          # State management
│   ├── constants/        # Theme, colors, spacing
│   └── services/         # API services (to be added)
├── App.tsx               # Main app entry point
├── package.json          # Dependencies
└── [Documentation files]
```

## 🎨 Current Features

### ✅ Fully Functional
1. **Authentication Flow**
   - Login screen
   - Signup screen
   - Forgot password screen

2. **Dashboard**
   - Statistics overview
   - Quick actions
   - Security tips
   - Cyber updates

3. **Community Feed**
   - Family feed
   - Public feed
   - Post display

4. **AI Chatbot (Echo)**
   - Message interface
   - Animations
   - Chat history

5. **Complaint System**
   - Type selection
   - Evidence upload UI
   - Description input

6. **Reports & Logs**
   - Status tracking
   - Filter options
   - Report cards

7. **Settings**
   - Profile options
   - Preferences
   - Logout

## 🔧 Current Status

### Working ✅
- All UI screens are complete and styled
- Navigation between screens
- Animations and transitions
- Tab bar navigation
- Modal presentations
- Theme and styling

### Needs Backend Integration ⚠️
- API calls (all marked with TODO comments)
- Authentication token management
- Data fetching and submission
- Real chat responses
- Image uploads
- Report submission

## 📝 Making Changes

### To Edit a Screen
1. Navigate to `src/screens/`
2. Find the screen file (e.g., `DashboardScreen.tsx`)
3. Make your changes
4. Hot reload will update automatically

### To Change Colors
Edit `src/constants/theme.ts`:
```typescript
export const COLORS = {
  primary: '#FFD700',  // Yellow
  secondary: '#FF4444', // Red
  // ... other colors
}
```

### To Add Backend Integration
Look for comments like:
```typescript
// BACKEND TODO: Description of what to implement
```

These mark all integration points!

## 🎯 Next Steps

### Immediate (Do First)
1. **Install Poppins Font**
   ```bash
   npx expo install expo-font
   ```
   - Download Poppins font files
   - Add to assets/fonts/
   - Configure in App.tsx

2. **Set Up API Service**
   ```bash
   npm install axios
   ```
   - Create `src/services/api.service.ts`
   - Configure base URL
   - Add interceptors

3. **Add Secure Storage**
   ```bash
   npx expo install expo-secure-store
   ```
   - Store auth tokens securely
   - Implement token management

### Short Term (This Week)
4. **Connect Backend APIs**
   - Follow BACKEND_INTEGRATION.md
   - Test each endpoint
   - Handle errors

5. **Add Image Handling**
   ```bash
   npx expo install expo-image-picker
   ```
   - Camera access
   - Gallery access
   - Image upload

## 🐛 Troubleshooting

### Issue: Dependencies won't install
**Solution**: Use `npm install --legacy-peer-deps`

### Issue: Expo won't start
**Solution**: 
```bash
# Clear cache
npx expo start -c

# Or delete node_modules and reinstall
rm -rf node_modules
npm install --legacy-peer-deps
```

### Issue: Wrong Node version
**Solution**:
```bash
# Check version
node -v

# Use nvm to switch
nvm use 22
```

### Issue: Port already in use
**Solution**:
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or use different port
npx expo start --port 8082
```

## 📱 Testing on Devices

### iOS (Physical Device)
1. Install Expo Go from App Store
2. Ensure device and computer on same WiFi
3. Scan QR code from terminal
4. App loads on device

### Android (Physical Device)
1. Install Expo Go from Play Store
2. Ensure device and computer on same WiFi
3. Scan QR code from terminal
4. App loads on device

### Web Browser
- Just open http://localhost:8081
- No additional setup needed
- Hot reload works instantly

## 🎨 Design System

### Colors
```typescript
Primary: #FFD700   (Yellow)
Secondary: #FF4444 (Red)
Accent: #000000    (Black)
Background: #FFFFFF
```

### Spacing
```typescript
xs: 4px
s: 8px
m: 16px
l: 24px
xl: 32px
xxl: 48px
```

### Font
Poppins (to be installed)
- Regular: 400
- Medium: 500
- SemiBold: 600
- Bold: 700

## 📚 Documentation Files

- **PROJECT_README.md** - Complete project overview
- **BACKEND_INTEGRATION.md** - API integration guide
- **IMPLEMENTATION_SUMMARY.md** - What's been built
- **USER_FLOW.md** - Navigation and flow diagrams
- **CHECKLIST.md** - Development checklist
- **This file** - Quick start guide

## 🔗 Important Links

### Backend Reference
- Backend code: `/Backend` folder
- API documentation: `BACKEND_INTEGRATION.md`
- Postman collections: `/Backend/pstman/`

### AI Models
- ML models location: `/Ai` folder
- Image captioning: `/Ai/image_captioning/`
- Text toxicity: `/Ai/text_toxicity/`

### UI Reference
- React Native Reusables: https://reactnativereusables.com/
- Lucide Icons: https://lucide.dev/

## 💡 Tips

1. **Hot Reload**: Save files to see changes instantly
2. **Debugging**: Use `console.log()` or React DevTools
3. **Comments**: All backend TODOs are clearly marked
4. **Types**: TypeScript will catch errors early
5. **Git**: Commit often with clear messages

## ⚡ Keyboard Shortcuts

When Expo is running:
- `w` - Open in web browser
- `a` - Open in Android emulator
- `i` - Open in iOS simulator
- `r` - Reload app
- `m` - Toggle menu
- `j` - Open debugger
- `c` - Clear cache and reload

## 🎉 You're Ready!

The app is now running and ready for development. Follow the checklist in `CHECKLIST.md` for next steps, and refer to `BACKEND_INTEGRATION.md` when connecting to your backend.

**Happy Coding! 🚀**

---

**Need Help?**
- Check documentation files
- Look for TODO comments in code
- Review error messages carefully
- Test on web browser first (fastest iteration)
