const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Simple in-memory database for testing
const DB_FILE = path.join(__dirname, 'db.json');

// Initialize database if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  const initialDB = {
    users: [],
    companies: [],
    emails: []
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2));
}

// Database helper functions
const readDB = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [], companies: [], emails: [] };
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
  }
};

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and static files
    return req.path === '/api/health' || req.path.startsWith('/static/');
  }
});

// Apply rate limiting based on environment
if (process.env.NODE_ENV === 'development') {
  // More lenient rate limiting for development
  const devLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5000, // 5000 requests per minute for development
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks and static files
      return req.path === '/api/health' || req.path.startsWith('/static/');
    }
  });
  app.use(devLimiter);
} else {
  app.use(limiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../dist')));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const db = readDB();

    // Check if user already exists
    const existingUser = db.users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDB(db);

    // Generate token
    const token = generateToken(newUser.id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = readDB();

    // Find user
    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    writeDB(db);

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const db = readDB();
    const user = db.users.find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Company routes
app.get('/api/companies', authenticateToken, (req, res) => {
  try {
    const db = readDB();
    const companies = db.companies.filter(c => c.user === req.user.userId && c.isActive);
    res.json({ companies });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

app.post('/api/companies', authenticateToken, (req, res) => {
  try {
    const { name, emailSettings, senderInfo, description } = req.body;
    const db = readDB();

    // Check if company name already exists for this user
    const existingCompany = db.companies.find(c => 
      c.user === req.user.userId && c.name === name && c.isActive
    );

    if (existingCompany) {
      return res.status(400).json({ error: 'A company with this name already exists' });
    }

    const newCompany = {
      _id: Date.now().toString(),
      name,
      user: req.user.userId,
      emailSettings,
      senderInfo,
      isActive: true,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.companies.push(newCompany);
    writeDB(db);

    res.status(201).json({
      message: 'Company created successfully',
      company: newCompany
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Update company
app.put('/api/companies/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, emailSettings, senderInfo, description } = req.body;
    const db = readDB();

    const companyIndex = db.companies.findIndex(c => c._id === id && c.user === req.user.userId && c.isActive);
    if (companyIndex === -1) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const current = db.companies[companyIndex];
    const updatedCompany = {
      ...current,
      name: typeof name === 'string' && name.trim() ? name : current.name,
      emailSettings: {
        ...current.emailSettings,
        ...(emailSettings || {})
      },
      senderInfo: {
        ...current.senderInfo,
        ...(senderInfo || {})
      },
      description: typeof description === 'string' ? description : current.description,
      updatedAt: new Date().toISOString()
    };

    db.companies[companyIndex] = updatedCompany;
    writeDB(db);

    res.json({
      message: 'Company updated successfully',
      company: updatedCompany
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// Delete (soft-delete) company
app.delete('/api/companies/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();

    const company = db.companies.find(c => c._id === id && c.user === req.user.userId && c.isActive);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    company.isActive = false;
    company.updatedAt = new Date().toISOString();
    writeDB(db);

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// Email routes
app.get('/api/emails', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.query;
    const userId = req.user.userId;
    const db = readDB();
    
    let filteredEmails = db.emails.filter(email => email.user === userId);
    
    if (companyId && companyId !== 'all') {
      filteredEmails = filteredEmails.filter(email => email.company === companyId);
    }
    
    // Sort by sent date (newest first)
    filteredEmails.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    
    res.json({
      emails: filteredEmails,
      total: filteredEmails.length
    });
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({
      error: 'Failed to fetch emails',
      details: error.message
    });
  }
});

app.post('/api/emails/send', authenticateToken, async (req, res) => {
  try {
    const { companyId, to, cc, subject, htmlContent, textContent, campaignName } = req.body;
    const db = readDB();

    // Get company
    const company = db.companies.find(c => c._id === companyId && c.user === req.user.userId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Configure transporter based on email type
    let transporter;
    const emailSettings = company.emailSettings;

    if (emailSettings.type === 'gmail') {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailSettings.email,
          pass: emailSettings.password // This should be an app password for Gmail
        }
      });
    } else if (emailSettings.type === 'outlook') {
      transporter = nodemailer.createTransport({
        service: 'outlook',
        auth: {
          user: emailSettings.email,
          pass: emailSettings.password
        }
      });
    } else if (emailSettings.type === 'yahoo') {
      transporter = nodemailer.createTransport({
        service: 'yahoo',
        auth: {
          user: emailSettings.email,
          pass: emailSettings.password
        }
      });
    } else if (emailSettings.type === 'custom') {
      console.log(`Setting up custom SMTP: ${emailSettings.smtpHost}:${emailSettings.smtpPort}`);
      transporter = nodemailer.createTransport({
        host: emailSettings.smtpHost,
        port: parseInt(emailSettings.smtpPort),
        secure: parseInt(emailSettings.smtpPort) === 465, // true for 465, false for other ports
        auth: {
          user: emailSettings.email,
          pass: emailSettings.password
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,   // 10 seconds
        socketTimeout: 10000      // 10 seconds
      });
    } else {
      return res.status(400).json({ error: 'Unsupported email type' });
    }

    // Send email
    const mailOptions = {
      from: `"${company.senderInfo.name}" <${emailSettings.email}>`,
      to: to,
      cc: cc || undefined, // Only include CC if provided
      subject: subject,
      html: htmlContent,
      text: textContent
    };

    console.log('Attempting to send email...');
    console.log('Mail options:', { from: mailOptions.from, to: mailOptions.to, subject: mailOptions.subject });
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    console.log('SMTP Response:', info.response);

    // Create email record
    const emailRecord = {
      _id: Date.now().toString(),
      user: req.user.userId,
      company: companyId,
      to,
      cc: cc || null, // Store CC field
      subject,
      htmlContent,
      textContent,
      status: 'sent',
      sentAt: new Date().toISOString(),
      messageId: info.messageId || `msg_${Date.now()}`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        campaignName,
        smtpResponse: info.response
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.emails.push(emailRecord);
    writeDB(db);

    res.json({
      message: 'Email sent successfully',
      email: emailRecord,
      messageId: emailRecord.messageId
    });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${DB_FILE}`);
});
