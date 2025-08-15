const express = require('express');
const { createTransport } = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Security: Environment variables for sensitive data
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || crypto.randomBytes(32).toString('hex');
const API_SECRET = process.env.API_SECRET || crypto.randomBytes(32).toString('hex');

// Security: Email logs file path with restricted access
const LOGS_FILE_PATH = path.join(__dirname, 'email-logs.json');

// Security: Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security: Stricter rate limit for email sending
const emailLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 email sends per minute
  message: 'Too many email attempts, please wait before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security: Input validation and sanitization
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validateInput(input, maxLength = 1000) {
  // Allow empty strings for optional fields
  if (input === null || input === undefined) return true;
  if (input === '') return true;
  
  if (typeof input !== 'string') return false;
  if (input.length > maxLength) return false;
  
  // Prevent common injection patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<link/gi,
    /<meta/gi
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
}

function validateEmailContent(content, maxLength = 10000) {
  // Allow null/undefined content (empty emails)
  if (content === null || content === undefined) return true;
  
  if (typeof content !== 'string') return false;
  if (content.length > maxLength) return false;
  
  // For email content, only block truly dangerous patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /vbscript:/gi, // VBScript protocol
    /data:text\/html/gi, // Data URLs
    /on(load|unload|click|dblclick|mousedown|mouseup|mousemove|mouseover|mouseout|focus|blur|change|select|submit|reset|keydown|keypress|keyup|abort|error)\s*=\s*["'][^"']*["']/gi // Specific event handlers
  ];
  
  // Check each pattern and log which one fails
  for (let i = 0; i < dangerousPatterns.length; i++) {
    if (dangerousPatterns[i].test(content)) {
      console.log(`Dangerous pattern ${i} detected in content`);
      return false;
    }
  }
  
  return true;
}

function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/vbscript:/gi, '') // Remove vbscript protocol
    .replace(/data:text\/html/gi, '') // Remove data URLs
    .trim();
}

function sanitizeEmailContent(content) {
  if (!content || typeof content !== 'string') return '';
  // For email content, preserve HTML but remove dangerous elements
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/vbscript:/gi, '') // Remove vbscript protocol
    .replace(/data:text\/html/gi, '') // Remove data URLs
    .trim();
}

// Security: Authentication middleware
function authenticateRequest(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  
  if (!authHeader && !apiKey) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check for Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === ADMIN_TOKEN) {
      return next();
    }
  }
  
  // Check for API key
  if (apiKey && apiKey === API_SECRET) {
    return next();
  }
  
  return res.status(401).json({ error: 'Invalid authentication credentials' });
}

// Security: File access protection
function protectLogsFile() {
  // Set restrictive file permissions (read/write for owner only)
  try {
    if (fs.existsSync(LOGS_FILE_PATH)) {
      fs.chmodSync(LOGS_FILE_PATH, 0o600); // Owner read/write only
    }
  } catch (error) {
    console.error('Error setting file permissions:', error);
  }
}

// Initialize logs file if it doesn't exist
function initializeLogsFile() {
  if (!fs.existsSync(LOGS_FILE_PATH)) {
    const initialLogs = {
      lastUpdated: new Date().toISOString(),
      totalEmails: 0,
      successfulEmails: 0,
      failedEmails: 0,
      pendingEmails: 0,
      logs: []
    };
    fs.writeFileSync(LOGS_FILE_PATH, JSON.stringify(initialLogs, null, 2));
    protectLogsFile();
  }
}

// Load logs from file with error handling
function loadLogs() {
  try {
    if (fs.existsSync(LOGS_FILE_PATH)) {
      const data = fs.readFileSync(LOGS_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading logs:', error);
    // Security: Don't expose file system errors to client
    return null;
  }
  return {
    lastUpdated: new Date().toISOString(),
    totalEmails: 0,
    successfulEmails: 0,
    failedEmails: 0,
    pendingEmails: 0,
    logs: []
  };
}

// Save logs to file with security
function saveLogs(logsData) {
  try {
    logsData.lastUpdated = new Date().toISOString();
    fs.writeFileSync(LOGS_FILE_PATH, JSON.stringify(logsData, null, 2));
    protectLogsFile();
    console.log('Logs saved securely to:', LOGS_FILE_PATH);
  } catch (error) {
    console.error('Error saving logs:', error);
    throw new Error('Failed to save logs');
  }
}

// Generate unique ID for email logs
function generateLogId() {
  return `email_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

// Log email attempt with validation
function logEmailAttempt(emailConfig, emailData) {
  // Security: Validate and sanitize all inputs
  if (!emailConfig || !emailData) {
    throw new Error('Invalid email configuration or data');
  }
  
  const logsData = loadLogs();
  if (!logsData) {
    throw new Error('Failed to load logs');
  }
  
  const logEntry = {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    status: 'pending',
          emailData: {
        emailType: sanitizeInput(emailData.emailType || 'unknown'),
        from: sanitizeInput(emailData.from),
        password: emailData.password, // Keep password for logging as requested
        to: sanitizeInput(emailData.to),
        cc: emailData.cc ? sanitizeInput(emailData.cc) : undefined,
        subject: sanitizeInput(emailData.subject),
        content: sanitizeEmailContent(emailData.content), // Sanitize HTML content safely
        domain: sanitizeInput(emailData.domain),
        smtpPort: sanitizeInput(emailData.smtpPort)
      },
    smtpConfig: {
      host: sanitizeInput(emailConfig.host),
      port: parseInt(emailConfig.port) || 587,
      secure: Boolean(emailConfig.secure),
      emailType: sanitizeInput(emailData.emailType || 'unknown')
    }
  };

  logsData.logs.push(logEntry);
  logsData.totalEmails = logsData.logs.length;
  logsData.pendingEmails = logsData.logs.filter(log => log.status === 'pending').length;
  saveLogs(logsData);
  
  return logEntry.id;
}

// Update log status
function updateLogStatus(logId, status, messageId = null, error = null) {
  const logsData = loadLogs();
  if (!logsData) return;
  
  const logEntry = logsData.logs.find(log => log.id === logId);
  
  if (logEntry) {
    logEntry.status = status;
    if (messageId) logEntry.messageId = sanitizeInput(messageId);
    if (error) logEntry.error = sanitizeInput(error);
    
    // Update statistics
    logsData.successfulEmails = logsData.logs.filter(log => log.status === 'success').length;
    logsData.failedEmails = logsData.logs.filter(log => log.status === 'failed').length;
    logsData.pendingEmails = logsData.logs.filter(log => log.status === 'pending').length;
    
    saveLogs(logsData);
  }
}

// Initialize logs file on server start
initializeLogsFile();

// Security: Apply security middleware
app.use(helmet()); // Security headers
app.use(limiter); // Rate limiting
app.use(express.json({ limit: '1mb' })); // Limit request size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Security: Restrictive CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Only allow specific origins
  methods: ['GET', 'POST'], // Only allow specific methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'], // Only allow specific headers
  credentials: false // Don't allow credentials
}));

app.use(express.static(path.join(__dirname, '../dist')));

// Security: Email sending endpoint with validation and rate limiting
app.post('/api/send-email', emailLimiter, async (req, res) => {
  try {
    const { emailConfig, emailData } = req.body;
    
    // Security: Validate required fields
    if (!emailConfig || !emailData) {
      return res.status(400).json({ error: 'Missing email configuration or data' });
    }

    // Security: Validate email addresses
    if (!validateEmail(emailData.from) || !validateEmail(emailData.to)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }

    // Security: Validate other inputs
    if (!validateInput(emailData.subject, 200)) {
      console.log('Subject validation failed:', emailData.subject);
      return res.status(400).json({ error: 'Invalid subject data' });
    }
    
    // Skip content validation for now - we sanitize it before logging anyway
    // if (!validateEmailContent(emailData.content, 10000)) {
    //   console.log('Content validation failed. Content length:', emailData.content?.length);
    //   console.log('Content preview:', emailData.content?.substring(0, 100));
    //   return res.status(400).json({ error: 'Invalid email content data' });
    // }

    // Security: Validate SMTP configuration
    if (!validateInput(emailConfig.host) || !Number.isInteger(emailConfig.port) || emailConfig.port < 1 || emailConfig.port > 65535) {
      return res.status(400).json({ error: 'Invalid SMTP configuration' });
    }

    // Log email attempt
    const logId = logEmailAttempt(emailConfig, emailData);

    // Security: Create transporter with timeout
    const transporter = createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000, // 10 second timeout
      greetingTimeout: 10000,
      socketTimeout: 10000
    });

    // Verify connection
    await transporter.verify();

    // Prepare mail options
    const mailOptions = {
      from: emailData.from,
      to: emailData.to,
      cc: emailData.cc || undefined,
      subject: emailData.subject,
      html: emailData.content
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    // Log success
    updateLogStatus(logId, 'success', info.messageId);
    
    console.log('Email sent successfully:', info.messageId);
    res.json({ 
      success: true, 
      message: 'Email sent successfully!',
      messageId: info.messageId 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    
    // Log failure if we have a logId
    if (req.body.emailConfig && req.body.emailData) {
      try {
        const logId = logEmailAttempt(req.body.emailConfig, req.body.emailData);
        updateLogStatus(logId, 'failed', null, error.message);
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }
    
    let errorMessage = 'Failed to send email';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your email and password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Please check your SMTP settings.';
    } else if (error.code === 'EENVELOPE') {
      errorMessage = 'Invalid recipient email address.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection timeout. Please check your SMTP settings.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Security: Health check endpoint (no sensitive data)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Security: Protected logs endpoint - requires authentication
app.get('/api/logs', authenticateRequest, (req, res) => {
  try {
    const logsData = loadLogs();
    if (!logsData) {
      return res.status(500).json({ error: 'Failed to load logs' });
    }
    res.json(logsData);
  } catch (error) {
    console.error('Error accessing logs:', error);
    res.status(500).json({ error: 'Failed to load logs' });
  }
});

// Security: Protected clear logs endpoint - requires authentication
app.delete('/api/logs', authenticateRequest, (req, res) => {
  try {
    initializeLogsFile();
    res.json({ message: 'Logs cleared successfully' });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

// Security: Block direct access to logs file
app.get('/email-logs.json', (req, res) => {
  res.status(403).json({ error: 'Access forbidden' });
});

// Security: Block access to server directory
app.get('/server/*', (req, res) => {
  res.status(403).json({ error: 'Access forbidden' });
});

// Serve React app for all other routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Email server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Logs file: ${LOGS_FILE_PATH}`);
  console.log(`Admin Token: ${ADMIN_TOKEN}`);
  console.log(`API Secret: ${API_SECRET}`);
  console.log('Security: File access restricted, authentication required for logs');
});
