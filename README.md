# Cold Email Formatter

A full-stack web application for creating, formatting, and sending professional cold emails with company management and authentication.

## Features

### 🔐 Authentication & User Management
- JWT-based authentication system
- User registration and login
- Secure password hashing with bcrypt
- Protected routes and session management

### 🏢 Company Management
- Multiple companies per user account
- Email configuration for each company
- Support for Gmail, Outlook, Yahoo, and custom SMTP
- Company-specific sender information and signatures
- Test email functionality

### 📧 Email Features
- HTML email editor with Monaco Editor
- Real-time email preview
- File upload support for HTML templates
- Email history and tracking
- Bulk email sending with personalization
- Email statistics and analytics

### 🛡️ Security Features
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS protection
- Helmet security headers
- XSS protection

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons
- **Monaco Editor** for code editing

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Nodemailer** for email sending
- **bcryptjs** for password hashing
- **Helmet** for security headers
- **Express Rate Limit** for API protection

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Cold-Email-Formatter
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
# Copy the environment template
cp env.example .env

# Edit the .env file with your configuration
nano .env
```

**Required Environment Variables:**
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/cold-email-formatter

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 4. Start MongoDB
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or start manually
mongod
```

### 5. Start the Backend Server
```bash
# Using the provided script
./start-backend.sh

# Or manually
npm run dev:server
```

### 6. Start the Frontend Development Server
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Usage

### 1. Registration & Authentication
1. Visit http://localhost:5173
2. Click "Get Started Free" to go to the authentication page
3. Create a new account or sign in with existing credentials

### 2. Company Setup
1. After logging in, navigate to "Company Settings"
2. Click "Add Company" to create your first company
3. Configure email settings:
   - **Gmail**: Use your Gmail address and app password
   - **Outlook**: Use your Outlook credentials
   - **Yahoo**: Use your Yahoo credentials
   - **Custom SMTP**: Configure your own SMTP server

### 3. Sending Emails
1. Go to "Send Email" tab
2. Select a company from the dropdown
3. Fill in recipient details and subject
4. Use the HTML editor to compose your email
5. Preview the email before sending
6. Click "Send Email" to deliver

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Companies
- `GET /api/companies` - Get user's companies
- `POST /api/companies` - Create new company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company
- `POST /api/companies/:id/test-email` - Test email configuration

### Emails
- `GET /api/emails` - Get email history
- `POST /api/emails/send` - Send single email
- `POST /api/emails/send-bulk` - Send bulk emails
- `GET /api/emails/stats/overview` - Get email statistics

## Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use your Gmail address and the generated app password

### Outlook Setup
1. Use your Outlook email and password
2. If you have 2FA enabled, you may need to generate an app password

### Custom SMTP Setup
1. Get your SMTP server details from your email provider
2. Configure:
   - SMTP Host (e.g., smtp.gmail.com)
   - SMTP Port (e.g., 587 for TLS, 465 for SSL)
   - Enable SSL/TLS as required

## Development

### Project Structure
```
Cold-Email-Formatter/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── pages/             # Page components
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── server/                # Backend source code
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   └── server.js          # Main server file
├── public/                # Static assets
└── dist/                  # Built frontend files
```

### Available Scripts
```bash
# Development
npm run dev              # Start frontend dev server
npm run dev:server       # Start backend dev server

# Building
npm run build            # Build frontend for production

# Production
npm start                # Build and start production server
```

### Database Schema

#### User Model
```javascript
{
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  isActive: Boolean,
  lastLogin: Date,
  timestamps: true
}
```

#### Company Model
```javascript
{
  name: String,
  user: ObjectId (ref: User),
  emailSettings: {
    email: String,
    password: String,
    type: String (gmail|outlook|yahoo|custom),
    smtpHost: String (for custom),
    smtpPort: Number (for custom),
    useSSL: Boolean,
    useTLS: Boolean
  },
  senderInfo: {
    name: String,
    signature: String
  },
  isActive: Boolean,
  description: String,
  timestamps: true
}
```

#### Email Model
```javascript
{
  user: ObjectId (ref: User),
  company: ObjectId (ref: Company),
  to: String,
  subject: String,
  htmlContent: String,
  textContent: String,
  status: String (pending|sent|failed|delivered|bounced),
  sentAt: Date,
  errorMessage: String,
  messageId: String,
  metadata: {
    ipAddress: String,
    userAgent: String,
    campaignName: String
  },
  timestamps: true
}
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to version control
2. **JWT Secret**: Use a strong, unique secret for JWT signing
3. **Password Security**: Passwords are hashed using bcrypt with salt rounds
4. **Rate Limiting**: API endpoints are protected against abuse
5. **Input Validation**: All user inputs are validated and sanitized
6. **CORS**: Configured to allow only trusted origins

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure production `MONGODB_URI`
4. Set proper `FRONTEND_URL` for CORS
5. Use environment variables for all sensitive data

### Database
1. Use a production MongoDB instance (Atlas, etc.)
2. Set up proper backup strategies
3. Configure database indexes for performance

### Server
1. Use a process manager like PM2
2. Set up SSL/TLS certificates
3. Configure reverse proxy (Nginx)
4. Set up monitoring and logging

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **Email Sending Failures**
   - Verify email credentials
   - Check for 2FA/app passwords
   - Test email configuration

3. **CORS Errors**
   - Ensure `FRONTEND_URL` is correctly set
   - Check browser console for specific errors

4. **JWT Token Issues**
   - Verify `JWT_SECRET` is set and consistent
   - Check token expiration

### Logs
- Backend logs are output to console
- Check browser developer tools for frontend errors
- MongoDB logs for database issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section
