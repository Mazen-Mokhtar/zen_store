# Zen Store - Gaming Platform

A modern, comprehensive gaming platform built with Next.js frontend and NestJS backend, featuring advanced functionality for managing games, packages, and user interactions.

## 🚀 Features

### Core Features
- 🎮 **Gaming Dashboard** - Dynamic content with real-time data from backend
- 📦 **Package Management** - Comprehensive package system with categories
- 🏷️ **Category Organization** - Hierarchical category management
- 🔐 **Authentication System** - Secure JWT-based authentication
- 📱 **Responsive Design** - Mobile-first responsive interface
- ⚡ **Real-time Data** - Live data synchronization with backend

### Advanced Features
- 🌍 **Internationalization (i18n)** - Multi-language support (English, Arabic, Portuguese, Spanish, French)
- 🎨 **Theme Management** - Multiple themes with dark/light modes
- 🔊 **Sound System** - Audio feedback and notifications
- 📊 **Analytics** - User behavior tracking and performance monitoring
- 🔒 **Security** - XSS protection, CSRF tokens, input sanitization
- 🧪 **Testing Framework** - Comprehensive testing utilities
- 📚 **Documentation** - Auto-generated documentation system
- 🚀 **Deployment** - Multi-platform deployment support
- 💾 **Caching** - Intelligent API response caching
- 🔔 **Notifications** - In-app and browser notifications
- 📈 **Performance Monitoring** - Core Web Vitals tracking
- 🛠️ **Settings Management** - User preferences and app configuration

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Icons**: Lucide React

### Backend
- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **File Upload**: Multer with Cloud Storage
- **Email**: Nodemailer

### Deployment & DevOps
- **Platforms**: Vercel, Netlify, Heroku, Docker, AWS
- **CI/CD**: GitHub Actions
- **Monitoring**: Performance tracking, error reporting

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (for backend)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your configuration:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
```

4. Start the backend server:
```bash
npm run start:dev
```

### Frontend Setup

1. Navigate to the project root:
```bash
cd zen_test
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

## 📁 Project Structure

```
zen_test/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard page with API integration
│   ├── packages/          # Packages page
│   ├── signin/           # Authentication pages
│   ├── signup/           # Authentication pages
│   └── ...
├── backend/               # NestJS backend
│   ├── src/
│   │   ├── modules/       # Feature modules (games, packages, auth)
│   │   ├── DB/           # Database models and repositories
│   │   ├── commen/       # Shared utilities and decorators
│   │   └── ...
│   └── ...
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── ...
├── lib/                   # Utility libraries
│   ├── api.ts            # API service with caching
│   ├── analytics.ts      # Analytics tracking
│   ├── cache.ts          # In-memory caching
│   ├── i18n.ts           # Internationalization
│   ├── security.ts       # Security utilities
│   ├── performance.ts    # Performance monitoring
│   ├── testing.ts        # Testing framework
│   ├── documentation.ts  # Documentation system
│   ├── deployment.ts     # Deployment utilities
│   └── ...
└── ...
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout

### Games
- `GET /game` - Get all games (with pagination and filtering)
- `GET /game/:id` - Get game by ID
- `POST /game` - Create new game (Admin only)
- `PUT /game/:id` - Update game (Admin only)
- `DELETE /game/:id` - Delete game (Admin only)

### Packages
- `GET /packages` - Get all packages (with pagination and filtering)
- `GET /packages/:id` - Get package by ID
- `POST /packages` - Create new package (Admin only)
- `PUT /packages/:id` - Update package (Admin only)
- `DELETE /packages/:id` - Delete package (Admin only)

### Categories
- `GET /category/AllCategory` - Get all categories
- `GET /category/:id` - Get category by ID
- `POST /category` - Create new category (Admin only)
- `PUT /category/:id` - Update category (Admin only)
- `DELETE /category/:id` - Delete category (Admin only)

### Users
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `GET /user/orders` - Get user orders

## 🎨 UI Components

### Core Components
- `LoadingSpinner` - Customizable loading spinner
- `ErrorMessage` - Error display with retry functionality
- `ErrorBoundary` - React error boundary
- `NotificationToast` - Toast notifications
- `LanguageSelector` - Multi-language selector
- `Tooltip` - Hover tooltips

### Features
- Responsive design with mobile-first approach
- Dark/light theme support
- RTL language support (Arabic)
- Accessibility features
- Keyboard navigation
- Screen reader support

## 🌍 Internationalization

The platform supports multiple languages:
- 🇺🇸 English (en)
- 🇸🇦 Arabic (ar) - RTL support
- 🇧🇷 Portuguese (pt)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)

### Usage
```typescript
import { useTranslation } from '@/lib/i18n';

function MyComponent() {
  const { t, currentLanguage, setLanguage } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <LanguageSelector />
    </div>
  );
}
```

## 🔒 Security Features

- **XSS Protection** - Input sanitization and output encoding
- **CSRF Protection** - CSRF tokens for form submissions
- **Clickjacking Protection** - Frame-busting headers
- **Rate Limiting** - API rate limiting
- **Input Validation** - Comprehensive input validation
- **Password Strength** - Password strength validation
- **Session Management** - Secure session handling

## 📊 Analytics & Monitoring

### User Analytics
- Page view tracking
- User interaction tracking
- Performance metrics
- Error tracking
- Custom event tracking

### Performance Monitoring
- Core Web Vitals (LCP, FID, CLS)
- Memory usage monitoring
- Network performance
- Resource loading times

## 🧪 Testing

### Test Types
- **Unit Tests** - Component and utility testing
- **Integration Tests** - API endpoint testing
- **E2E Tests** - End-to-end user flow testing
- **Performance Tests** - Performance benchmarking
- **Security Tests** - Security vulnerability testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 📚 Documentation

### Auto-generated Documentation
- API documentation
- Component documentation
- Installation guides
- Usage examples

### Documentation Features
- Search functionality
- Category organization
- Tag-based filtering
- Export to HTML/JSON

## 🚀 Deployment

### Supported Platforms
- **Vercel** - Recommended for Next.js
- **Netlify** - Static site hosting
- **Heroku** - Container-based deployment
- **Docker** - Containerized deployment
- **AWS** - Cloud infrastructure

### Deployment Scripts
```bash
# Generate deployment script
npm run generate:deploy

# Generate Docker files
npm run generate:docker

# Generate GitHub Actions
npm run generate:github-actions
```

## 🔧 Configuration

### Environment Variables
```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000

# Backend
PORT=3000
MONGODB_URI=mongodb://localhost:27017/zen_store
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### Settings Management
```typescript
import { settingsManager } from '@/lib/settings';

// Get setting
const theme = settingsManager.get('theme');

// Set setting
settingsManager.set('theme', 'dark');

// Update multiple settings
settingsManager.update({
  theme: 'dark',
  language: 'ar',
  notifications: true
});
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style
- Add proper error handling

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API reference

## 🔄 Changelog

### Version 1.0.0
- Initial release with core gaming platform features
- Multi-language support
- Advanced security features
- Comprehensive testing framework
- Performance monitoring
- Auto-generated documentation
- Multi-platform deployment support
