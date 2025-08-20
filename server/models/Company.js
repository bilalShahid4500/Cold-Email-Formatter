const mongoose = require('mongoose');
const validator = require('validator');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  emailSettings: {
    email: {
      type: String,
      required: [true, 'Email is required'],
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Email password is required']
    },
    type: {
      type: String,
      enum: ['gmail', 'outlook', 'yahoo', 'custom'],
      required: [true, 'Email type is required']
    },
    smtpHost: {
      type: String,
      required: function() { return this.emailSettings.type === 'custom'; }
    },
    smtpPort: {
      type: Number,
      required: function() { return this.emailSettings.type === 'custom'; },
      min: [1, 'Port must be greater than 0'],
      max: [65535, 'Port must be less than 65536']
    },
    useSSL: {
      type: Boolean,
      default: true
    },
    useTLS: {
      type: Boolean,
      default: true
    }
  },
  senderInfo: {
    name: {
      type: String,
      required: [true, 'Sender name is required'],
      trim: true,
      maxlength: [100, 'Sender name cannot exceed 100 characters']
    },
    signature: {
      type: String,
      trim: true,
      maxlength: [500, 'Signature cannot exceed 500 characters']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for efficient queries
companySchema.index({ user: 1, name: 1 });

// Virtual for full sender name
companySchema.virtual('fullSenderName').get(function() {
  return `${this.senderInfo.name} <${this.emailSettings.email}>`;
});

// Ensure virtual fields are serialized
companySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Company', companySchema);
