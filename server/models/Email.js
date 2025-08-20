const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company reference is required']
  },
  to: {
    type: String,
    required: [true, 'Recipient email is required'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Email subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  htmlContent: {
    type: String,
    required: [true, 'Email content is required']
  },
  textContent: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'delivered', 'bounced'],
    default: 'pending'
  },
  sentAt: {
    type: Date
  },
  errorMessage: {
    type: String,
    trim: true
  },
  messageId: {
    type: String,
    trim: true
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    campaignName: {
      type: String,
      trim: true,
      maxlength: [100, 'Campaign name cannot exceed 100 characters']
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
emailSchema.index({ user: 1, company: 1, createdAt: -1 });
emailSchema.index({ status: 1, createdAt: -1 });

// Virtual for email status display
emailSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    pending: 'Pending',
    sent: 'Sent',
    failed: 'Failed',
    delivered: 'Delivered',
    bounced: 'Bounced'
  };
  return statusMap[this.status] || this.status;
});

// Ensure virtual fields are serialized
emailSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Email', emailSchema);
