const express = require('express');
const Company = require('../models/Company');

const router = express.Router();

// Get all companies for the authenticated user
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find({ 
      user: req.user.userId,
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json({ companies });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get a specific company by ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.params.id,
      user: req.user.userId,
      isActive: true
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ company });
  } catch (error) {
    console.error('Get company error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid company ID' });
    }
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// Create a new company
router.post('/', async (req, res) => {
  try {
    const {
      name,
      emailSettings,
      senderInfo,
      description
    } = req.body;

    // Validate required fields
    if (!name || !emailSettings || !senderInfo) {
      return res.status(400).json({ 
        error: 'Name, email settings, and sender info are required' 
      });
    }

    // Check if company name already exists for this user
    const existingCompany = await Company.findOne({
      user: req.user.userId,
      name: name.trim(),
      isActive: true
    });

    if (existingCompany) {
      return res.status(400).json({ 
        error: 'A company with this name already exists' 
      });
    }

    const company = new Company({
      user: req.user.userId,
      name: name.trim(),
      emailSettings,
      senderInfo,
      description: description?.trim()
    });

    await company.save();

    res.status(201).json({
      message: 'Company created successfully',
      company
    });
  } catch (error) {
    console.error('Create company error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Update a company
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      emailSettings,
      senderInfo,
      description,
      isActive
    } = req.body;

    const company = await Company.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if name is being changed and if it conflicts with existing company
    if (name && name.trim() !== company.name) {
      const existingCompany = await Company.findOne({
        user: req.user.userId,
        name: name.trim(),
        isActive: true,
        _id: { $ne: req.params.id }
      });

      if (existingCompany) {
        return res.status(400).json({ 
          error: 'A company with this name already exists' 
        });
      }
    }

    // Update fields
    if (name) company.name = name.trim();
    if (emailSettings) company.emailSettings = emailSettings;
    if (senderInfo) company.senderInfo = senderInfo;
    if (description !== undefined) company.description = description?.trim();
    if (isActive !== undefined) company.isActive = isActive;

    await company.save();

    res.json({
      message: 'Company updated successfully',
      company
    });
  } catch (error) {
    console.error('Update company error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid company ID' });
    }
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// Delete a company (soft delete by setting isActive to false)
router.delete('/:id', async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    company.isActive = false;
    await company.save();

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid company ID' });
    }
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// Test email configuration
router.post('/:id/test-email', async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.params.id,
      user: req.user.userId,
      isActive: true
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const { testEmail } = req.body;
    if (!testEmail) {
      return res.status(400).json({ error: 'Test email address is required' });
    }

    // Import nodemailer dynamically to avoid circular dependencies
    const nodemailer = require('nodemailer');

    // Create transporter based on email type
    let transporter;
    const { emailSettings } = company;

    switch (emailSettings.type) {
      case 'gmail':
        transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: emailSettings.email,
            pass: emailSettings.password
          }
        });
        break;
      case 'outlook':
        transporter = nodemailer.createTransporter({
          service: 'outlook',
          auth: {
            user: emailSettings.email,
            pass: emailSettings.password
          }
        });
        break;
      case 'yahoo':
        transporter = nodemailer.createTransporter({
          service: 'yahoo',
          auth: {
            user: emailSettings.email,
            pass: emailSettings.password
          }
        });
        break;
      case 'custom':
        transporter = nodemailer.createTransporter({
          host: emailSettings.smtpHost,
          port: emailSettings.smtpPort,
          secure: emailSettings.useSSL,
          auth: {
            user: emailSettings.email,
            pass: emailSettings.password
          },
          tls: {
            rejectUnauthorized: emailSettings.useTLS
          }
        });
        break;
      default:
        return res.status(400).json({ error: 'Invalid email type' });
    }

    // Send test email
    const mailOptions = {
      from: `${company.senderInfo.name} <${emailSettings.email}>`,
      to: testEmail,
      subject: 'Test Email - Cold Email Formatter',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from your Cold Email Formatter configuration.</p>
        <p><strong>Company:</strong> ${company.name}</p>
        <p><strong>Sender:</strong> ${company.senderInfo.name}</p>
        <p><strong>Email:</strong> ${emailSettings.email}</p>
        <p><strong>Type:</strong> ${emailSettings.type}</p>
        <hr>
        <p><em>If you received this email, your email configuration is working correctly!</em></p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error.message 
    });
  }
});

module.exports = router;
