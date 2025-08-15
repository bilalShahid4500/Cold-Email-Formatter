# 🔒 Email Server Security Configuration

## Security Features Implemented

### 1. **Authentication & Authorization**
- **Admin Token**: Required for accessing logs via `/api/logs`
- **API Secret**: Alternative authentication method
- **Bearer Token**: Standard HTTP authentication
- **Protected Endpoints**: Logs access requires authentication

### 2. **Input Validation & Sanitization**
- **Email Validation**: Strict email format validation
- **Input Sanitization**: Removes dangerous HTML/JavaScript patterns
- **Length Limits**: Prevents oversized requests
- **SMTP Validation**: Validates port numbers and hostnames

### 3. **Rate Limiting**
- **General Rate Limit**: 100 requests per 15 minutes per IP
- **Email Rate Limit**: 5 email sends per minute per IP
- **Prevents**: Brute force attacks and spam

### 4. **File System Security**
- **Restricted Permissions**: Logs file set to 600 (owner read/write only)
- **Path Protection**: Blocks direct access to server files
- **Error Handling**: Prevents information disclosure

### 5. **Network Security**
- **CORS Restrictions**: Only allows specific origins
- **Request Size Limits**: 1MB maximum request size
- **Security Headers**: Helmet.js for HTTP security headers
- **Connection Timeouts**: 10-second SMTP timeouts

### 6. **Access Control**
- **Blocked Paths**: `/email-logs.json`, `/server/*`
- **Protected Routes**: All sensitive endpoints require auth
- **Catch-all**: 404 for unknown endpoints

## Environment Variables

Set these in production for enhanced security:

```bash
# Generate secure tokens
export ADMIN_TOKEN="your-secure-admin-token-here"
export API_SECRET="your-secure-api-secret-here"
export PORT=3001
```

## Accessing Logs Securely

### Method 1: Bearer Token
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     http://localhost:3001/api/logs
```

### Method 2: API Key
```bash
curl -H "X-API-Key: YOUR_API_SECRET" \
     http://localhost:3001/api/logs
```

## Security Best Practices

1. **Change Default Tokens**: Update ADMIN_TOKEN and API_SECRET in production
2. **Use HTTPS**: Always use HTTPS in production
3. **Firewall Rules**: Restrict access to server ports
4. **Regular Updates**: Keep dependencies updated
5. **Monitor Logs**: Check for suspicious activity
6. **Backup Security**: Secure backup of logs file
7. **Access Logging**: Monitor who accesses the logs

## File Permissions

The logs file is automatically set to restrictive permissions:
- **Owner**: Read/Write (600)
- **Group**: No access
- **Others**: No access

## Security Headers

Helmet.js automatically adds:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security (in production)
- Content-Security-Policy

## Monitoring

Check server logs for:
- Failed authentication attempts
- Rate limit violations
- Invalid input patterns
- Connection timeouts
- File access attempts

## Emergency Procedures

1. **Stop Server**: `pkill -f "node server/emailServer.js"`
2. **Secure File**: `chmod 600 server/email-logs.json`
3. **Check Logs**: Review for unauthorized access
4. **Rotate Tokens**: Generate new ADMIN_TOKEN and API_SECRET
5. **Restart**: Restart with new security tokens
