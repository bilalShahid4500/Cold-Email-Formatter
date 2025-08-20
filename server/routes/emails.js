const express = require('express');
const nodemailer = require('nodemailer');
const Email = require('../models/Email');
const Company = require('../models/Company');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for email sending
const emailLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 email sends per minute
  message: 'Too many email attempts, please wait before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Get email history for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, companyId, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: req.user.userId };
    if (companyId) filter.company = companyId;
    if (status) filter.status = status;

    const emails = await Email.find(filter)
      .populate('company', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Email.countDocuments(filter);

    res.json({
      emails,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + emails.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Get a specific email by ID
router.get('/:id', async (req, res) => {
  try {
    const email = await Email.findOne({
      _id: req.params.id,
      user: req.user.userId
    }).populate('company', 'name');

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json({ email });
  } catch (error) {
    console.error('Get email error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid email ID' });
    }
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

// Send a single email
router.post('/send', emailLimiter, async (req, res) => {
  try {
    const {
      companyId,
      to,
      subject,
      htmlContent,
      textContent,
      campaignName
    } = req.body;

    // Validate required fields
    if (!companyId || !to || !subject || !htmlContent) {
      return res.status(400).json({
        error: 'Company ID, recipient email, subject, and HTML content are required'
      });
    }

    // Get company configuration
    const company = await Company.findOne({
      _id: companyId,
      user: req.user.userId,
      isActive: true
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Create email record
    const emailRecord = new Email({
      user: req.user.userId,
      company: companyId,
      to,
      subject,
      htmlContent,
      textContent,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        campaignName
      }
    });

    // Create transporter based on company email settings
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

    // Send email
    const mailOptions = {
      from: `${company.senderInfo.name} <${emailSettings.email}>`,
      to,
      subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);

    // Update email record with success
    emailRecord.status = 'sent';
    emailRecord.sentAt = new Date();
    emailRecord.messageId = info.messageId;
    await emailRecord.save();

    res.json({
      message: 'Email sent successfully',
      email: emailRecord,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Send email error:', error);

    // If email record was created, update it with error
    if (emailRecord) {
      emailRecord.status = 'failed';
      emailRecord.errorMessage = error.message;
      await emailRecord.save();
    }

    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
});

// Send bulk emails
router.post('/send-bulk', emailLimiter, async (req, res) => {
  try {
    const {
      companyId,
      recipients,
      subject,
      htmlContent,
      textContent,
      campaignName,
      delay = 1000 // Delay between emails in milliseconds
    } = req.body;

    // Validate required fields
    if (!companyId || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        error: 'Company ID and recipients array are required'
      });
    }

    if (!subject || !htmlContent) {
      return res.status(400).json({
        error: 'Subject and HTML content are required'
      });
    }

    // Get company configuration
    const company = await Company.findOne({
      _id: companyId,
      user: req.user.userId,
      isActive: true
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Create transporter
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

    const results = {
      sent: 0,
      failed: 0,
      emails: []
    };

    // Send emails with delay
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      try {
        // Create email record
        const emailRecord = new Email({
          user: req.user.userId,
          company: companyId,
          to: recipient.email,
          subject: subject.replace('{name}', recipient.name || ''),
          htmlContent: htmlContent.replace(/{name}/g, recipient.name || ''),
          textContent: textContent ? textContent.replace(/{name}/g, recipient.name || '') : null,
          metadata: {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            campaignName
          }
        });

        // Send email
        const mailOptions = {
          from: `${company.senderInfo.name} <${emailSettings.email}>`,
          to: recipient.email,
          subject: subject.replace('{name}', recipient.name || ''),
          html: htmlContent.replace(/{name}/g, recipient.name || ''),
          text: textContent ? textContent.replace(/{name}/g, recipient.name || '') : htmlContent.replace(/<[^>]*>/g, '')
        };

        const info = await transporter.sendMail(mailOptions);

        // Update email record with success
        emailRecord.status = 'sent';
        emailRecord.sentAt = new Date();
        emailRecord.messageId = info.messageId;
        await emailRecord.save();

        results.sent++;
        results.emails.push({
          to: recipient.email,
          status: 'sent',
          messageId: info.messageId
        });

      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        
        // Create failed email record
        const emailRecord = new Email({
          user: req.user.userId,
          company: companyId,
          to: recipient.email,
          subject: subject.replace('{name}', recipient.name || ''),
          htmlContent: htmlContent.replace(/{name}/g, recipient.name || ''),
          textContent: textContent ? textContent.replace(/{name}/g, recipient.name || '') : null,
          status: 'failed',
          errorMessage: error.message,
          metadata: {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            campaignName
          }
        });
        await emailRecord.save();

        results.failed++;
        results.emails.push({
          to: recipient.email,
          status: 'failed',
          error: error.message
        });
      }

      // Add delay between emails (except for the last one)
      if (i < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    res.json({
      message: 'Bulk email operation completed',
      results
    });

  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({
      error: 'Failed to send bulk emails',
      details: error.message
    });
  }
});

// Get email statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { companyId, days = 30 } = req.query;
    
    const filter = { user: req.user.userId };
    if (companyId) filter.company = companyId;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    filter.createdAt = { $gte: startDate };

    const stats = await Email.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalEmails = await Email.countDocuments(filter);
    const totalCompanies = await Company.countDocuments({ 
      user: req.user.userId, 
      isActive: true 
    });

    const statsMap = {
      sent: 0,
      failed: 0,
      pending: 0,
      delivered: 0,
      bounced: 0
    };

    stats.forEach(stat => {
      statsMap[stat._id] = stat.count;
    });

    res.json({
      totalEmails,
      totalCompanies,
      statusBreakdown: statsMap,
      period: `${days} days`
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
