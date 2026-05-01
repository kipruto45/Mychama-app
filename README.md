# MyChama App

> A modern mobile application for managing community savings groups (Chamas) across Africa

[![React Native](https://img.shields.io/badge/React%20Native-0.73+-61dafb?style=flat-square&logo=react)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-Latest-000?style=flat-square&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

## Overview

MyChama App is a comprehensive mobile solution designed to revolutionize how community savings groups operate. It provides seamless tools for member management, financial tracking, loan processing, and governance—all accessible from a mobile device.

## ✨ Key Features

### Financial Management
- 💰 **Contribution Tracking** - Monitor member contributions in real-time
- 📊 **Financial Reports** - Comprehensive financial dashboards and analytics
- 💳 **Multiple Payment Methods** - M-Pesa, cash, and bank transfer support
- 📈 **Goal Tracking** - Set and monitor savings goals
- 💸 **Withdrawal Management** - Request and process withdrawals securely

### Loan Management
- 🏦 **Loan Applications** - Streamlined application and approval workflow
- 📋 **Loan Restructuring** - Manage loan recovery with flexibility
- ⚖️ **Fair Lending** - Transparent pricing and terms
- 📞 **Recovery Queue** - Track overdue loans efficiently

### Community Features
- 👥 **Member Management** - Add, remove, and manage group members
- 🎯 **Role-Based Access** - Treasurer, secretary, and member roles
- 📢 **Announcements** - Communicate group updates to all members
- 📅 **Meeting Management** - Schedule and document meetings
- ✍️ **Minutes & Resolutions** - Track governance decisions

### Compliance & Security
- ✅ **KYC Verification** - Know Your Customer compliance
- 🔐 **Two-Factor Authentication** - Enhanced account security
- 📱 **OTP Verification** - Secure transaction verification
- 🔒 **End-to-End Encryption** - Protect sensitive data
- 📊 **Audit Logs** - Complete transaction history

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode 14+ (macOS only)
- Android: Android Studio and SDK

### Installation

```bash
# Clone the repository
git clone https://github.com/kipruto45/Mychama-app.git
cd Mychama-app

# Install dependencies
npm install
# or
yarn install

# Configure environment
cp .env.example .env
# Update .env with your configuration

# Start development server
npx expo start

# For iOS (macOS)
npx expo start --ios

# For Android
npx expo start --android
```

### Configuration

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
EXPO_PUBLIC_API_URL=your_api_url
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_token
NODE_ENV=development
```

## 📁 Project Structure

```
src/
├── api/              # API endpoints and requests
├── auth/             # Authentication logic
├── components/       # Reusable UI components
├── screens/          # App screens (role-based)
│   ├── roles/        # Role-specific screens
│   └── shared/       # Shared screens
├── services/         # Business logic services
├── store/            # State management (Zustand)
├── hooks/            # Custom React hooks
├── navigation/       # Navigation configuration
├── theme/            # Design tokens and styling
├── types/            # TypeScript types
├── utils/            # Helper utilities
└── constants/        # App constants
```

## 🏗️ Architecture

The app follows a **clean architecture pattern**:

- **Presentation Layer**: React Native components and screens
- **Business Logic Layer**: Services for API calls and state management
- **Data Layer**: Supabase integration for backend communication

**State Management**: Zustand for simple, efficient state management
**Navigation**: React Navigation for screen navigation
**Type Safety**: Full TypeScript for development confidence

## 🔌 API Integration

The app communicates with the MyChama Backend API:

```typescript
// Example API call
const response = await api.post('/contributions', {
  amount: 1000,
  chamaId: 'chama-123',
  paymentMethod: 'mpesa'
});
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 📱 Building for Production

### iOS
```bash
eas build --platform ios
eas submit --platform ios
```

### Android
```bash
eas build --platform android
eas submit --platform android
```

## 🛠️ Development

### Code Style
- Uses ESLint and Prettier for code formatting
- Follow the existing code patterns

### Commits
- Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
- Example: `feat(contributions): add offline support`

### PR Guidelines
- Write descriptive PR titles
- Include screenshots for UI changes
- Test on both platforms before submitting

## 📚 Dependencies

### Core
- **react-native**: 0.73+
- **expo**: Latest
- **@react-navigation**: 6.x
- **zustand**: State management
- **axios**: HTTP client

### UI & Styling
- **react-native-paper**: Material Design components
- **react-native-vector-icons**: Icon library

### Utilities
- **date-fns**: Date manipulation
- **lodash-es**: Utility functions
- **zod**: Schema validation

## 🔐 Security Best Practices

- Never commit `.env` files
- Rotate API keys regularly
- Use secure storage for tokens (Secure Store)
- Enable certificate pinning for API calls
- Report security issues privately to maintainers

## 📖 Documentation

- [Screens Documentation](docs/SCREENS.md)
- [Services API](docs/SERVICES.md)
- [State Management](docs/STORE.md)
- [Architecture Guide](docs/ARCHITECTURE.md)

## 🐛 Debugging

### React Native Debugger
```bash
# Install React Native Debugger
# Open http://localhost:19001/debugger-ui with the app

# In app console
__DEV__ // Check if in development mode
```

### Sentry Error Tracking
Errors are automatically reported to Sentry for monitoring and debugging.

## 📊 Performance

- Average app size: ~45MB
- Startup time: <3 seconds
- Supports devices running Android 8+ and iOS 13+

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with conventional commits
5. Push to your fork and create a Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 📞 Support

- **Issues**: Report bugs via [GitHub Issues](https://github.com/kipruto45/Mychama-app/issues)
- **Email**: support@mychama.app
- **Documentation**: [MyChama Docs](https://docs.mychama.app)

## 🙏 Acknowledgments

Built with ❤️ for African communities. Special thanks to all contributors and community members.

---

**Made with React Native + Expo**  
**Powering Community Savings Groups Across Africa**
