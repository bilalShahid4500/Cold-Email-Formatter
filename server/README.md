# Cold Email Formatter Backend

A Node.js backend with authentication, company management, and email sending capabilities.

## Features

- **User Authentication**: JWT-based sign-up/sign-in system
- **Company Management**: Multiple companies per user with email configurations
- **Email Sending**: Support for Gmail, Outlook, Yahoo, and custom SMTP
- **Email History**: Track all sent emails with status and metadata
- **Bulk Email**: Send personalized emails to multiple recipients
- **Security**: Rate limiting, input validation, and secure password handling

## Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment template:
```bash
cp env.example .env
```

3. Configure environment variables in `.env`:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/cold-email-formatter
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5173
```

4. Start the server:
```bash
npm run dev:server
```

## API Endpoints

### Authentication

#### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### POST `/api/auth/login`
Login user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/profile`
Get current user profile (requires authentication).

#### PUT `/api/auth/profile`
Update user profile (requires authentication).

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith"
}
```

#### PUT `/api/auth/change-password`
Change user password (requires authentication).

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

### Companies

#### GET `/api/companies`
Get all companies for the authenticated user.

#### GET `/api/companies/:id`
Get a specific company by ID.

#### POST `/api/companies`
Create a new company.

**Request Body:**
```json
{
  "name": "My Company",
  "emailSettings": {
    "email": "sender@company.com",
    "password": "email-password",
    "type": "gmail"
  },
  "senderInfo": {
    "name": "John Doe",
    "signature": "Best regards,\nJohn Doe"
  },
  "description": "Company description"
}
```

#### PUT `/api/companies/:id`
Update a company.

#### DELETE `/api/companies/:id`
Delete a company (soft delete).

#### POST `/api/companies/:id/test-email`
Test email configuration.

**Request Body:**
```json
{
  "testEmail": "test@example.com"
}
```

### Emails

#### GET `/api/emails`
Get email history with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `companyId`: Filter by company
- `status`: Filter by status

#### GET `/api/emails/:id`
Get a specific email by ID.

#### POST `/api/emails/send`
Send a single email.

**Request Body:**
```json
{
  "companyId": "company-id",
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "htmlContent": "<h1>Hello</h1><p>Email content</p>",
  "textContent": "Hello\nEmail content",
  "campaignName": "Campaign Name"
}
```

#### POST `/api/emails/send-bulk`
Send bulk emails.

**Request Body:**
```json
{
  "companyId": "company-id",
  "recipients": [
    {
      "email": "recipient1@example.com",
      "name": "John Doe"
    },
    {
      "email": "recipient2@example.com",
      "name": "Jane Smith"
    }
  ],
  "subject": "Hello {name}",
  "htmlContent": "<h1>Hello {name}</h1><p>Personalized content</p>",
  "campaignName": "Bulk Campaign",
  "delay": 1000
}
```

#### GET `/api/emails/stats/overview`
Get email statistics.

**Query Parameters:**
- `companyId`: Filter by company
- `days`: Number of days to look back (default: 30)

## Email Configuration Types

### Gmail
```json
{
  "type": "gmail",
  "email": "your-email@gmail.com",
  "password": "your-app-password"
}
```

### Outlook
```json
{
  "type": "outlook",
  "email": "your-email@outlook.com",
  "password": "your-password"
}
```

### Yahoo
```json
{
  "type": "yahoo",
  "email": "your-email@yahoo.com",
  "password": "your-app-password"
}
```

### Custom SMTP
```json
{
  "type": "custom",
  "email": "your-email@domain.com",
  "password": "your-password",
  "smtpHost": "smtp.domain.com",
  "smtpPort": 587,
  "useSSL": true,
  "useTLS": true
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt rounds
- **Rate Limiting**: Prevents abuse of endpoints
- **Input Validation**: Comprehensive validation for all inputs
- **CORS Protection**: Configurable cross-origin requests
- **Helmet**: Security headers
- **Input Sanitization**: Prevents XSS and injection attacks

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional details (in development)"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Development

### Running in Development Mode
```bash
npm run dev:server
```

### Running with Nodemon (Auto-restart)
```bash
npx nodemon server/server.js
```

### Database Connection
The server automatically connects to MongoDB on startup. Make sure MongoDB is running locally or update the `MONGODB_URI` in your `.env` file.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper `MONGODB_URI`
4. Set up proper CORS origins
5. Use environment variables for all sensitive data
6. Set up proper logging and monitoring
7. Configure SSL/TLS for HTTPS
8. Set up proper backup strategies for MongoDB

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**: Ensure MongoDB is running and the connection string is correct
2. **JWT Token Issues**: Check that `JWT_SECRET` is set and consistent
3. **Email Sending Failures**: Verify email credentials and check for 2FA/app passwords
4. **CORS Errors**: Ensure `FRONTEND_URL` is correctly configured

### Logs
Check the console output for detailed error messages and debugging information.
