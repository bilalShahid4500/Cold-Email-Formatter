# Email Sending Setup Guide

This guide will help you set up the email sending functionality for your cold email formatter.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Environment
You need to run both the frontend and backend servers:

**Terminal 1 - Frontend (React):**
```bash
npm run dev
```

**Terminal 2 - Backend (Email Server):**
```bash
npm run dev:server
```

### 3. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## 📧 Email Configuration

### Gmail Setup
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. **Use the App Password** in the application (not your regular Gmail password)

### Website/Domain Email Setup
1. **Get SMTP Settings** from your hosting provider:
   - SMTP Host (e.g., `smtp.yourdomain.com`)
   - SMTP Port (usually 587 or 465)
   - Username (your email address)
   - Password (your email password)

2. **Update Configuration** in `src/utils/emailSender.ts`:
   ```typescript
   // Replace with your actual SMTP settings
   host: 'smtp.yourdomain.com',
   port: 587,
   ```

## 🔧 Production Deployment

### Option 1: Single Server Deployment
```bash
npm run start
```
This builds the React app and serves it from the Express server.

### Option 2: Separate Frontend/Backend
1. **Build Frontend:**
   ```bash
   npm run build
   ```

2. **Deploy Backend:**
   - Upload `server/emailServer.js` to your server
   - Install dependencies: `npm install express nodemailer cors`
   - Run: `node emailServer.js`

3. **Update API URL** in `src/utils/emailSender.ts`:
   ```typescript
   const response = await fetch('https://your-backend.com/api/send-email', {
   ```

## 🛡️ Security Considerations

### Environment Variables
For production, use environment variables for sensitive data:

```javascript
// server/emailServer.js
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
```

### Rate Limiting
Add rate limiting to prevent abuse:

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 requests per windowMs
});

app.use('/api/send-email', emailLimiter);
```

## 🔍 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check if 2FA is enabled for Gmail
   - Use App Password instead of regular password
   - Verify SMTP settings for domain emails

2. **Connection Failed**
   - Check internet connection
   - Verify SMTP host and port
   - Check firewall settings

3. **Invalid Email Address**
   - Verify recipient email format
   - Check if email domain exists

### Debug Mode
Enable debug logging in the server:

```javascript
const transporter = nodemailer.createTransporter({
  // ... other options
  debug: true,
  logger: true
});
```

## 📋 API Endpoints

### POST /api/send-email
Sends an email using the provided configuration.

**Request Body:**
```json
{
  "emailConfig": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "your-email@gmail.com",
      "pass": "your-app-password"
    }
  },
  "emailData": {
    "from": "your-email@gmail.com",
    "to": "recipient@example.com",
    "cc": "cc@example.com",
    "subject": "Test Email",
    "content": "<h1>Hello World</h1>"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully!",
  "messageId": "<random-message-id>"
}
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "message": "Email server is running"
}
```

## 🎯 Testing

### Test Email Sending
1. Fill in the form with your email credentials
2. Upload or create an HTML email
3. Click "Send Email"
4. Check the notification for success/error messages

### Test with Sample HTML
Use the provided `sample-email.html` file to test the upload functionality.

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Check the server console for backend errors
3. Verify your email configuration
4. Test with a simple email first
