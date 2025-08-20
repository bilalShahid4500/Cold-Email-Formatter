import React, { useState } from 'react'
import { Mail, Globe, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react'
import { EmailFormProps } from '../types/email'

const EmailForm: React.FC<EmailFormProps> = ({ emailData, onEmailDataChange, onContinue }) => {
  const [showPassword, setShowPassword] = useState(false)

  const handleEmailTypeSelect = (type: 'gmail' | 'website') => {
    onEmailDataChange({ emailType: type })
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const isFormValid = emailData?.emailType && 
    emailData?.from && 
    emailData?.password && 
    emailData?.to && 
    emailData?.subject &&
    (emailData?.emailType === 'gmail' || (emailData?.emailType === 'website' && emailData?.domain && emailData?.smtpPort))

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Choose Your Email Platform
        </h2>
        <p className="text-gray-600">
          Select how you want to send your cold emails
        </p>
      </div>

      {/* Email Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Email Platform *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleEmailTypeSelect('gmail')}
            className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
              emailData?.emailType === 'gmail'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center mb-2">
              <Mail className="w-5 h-5 mr-2 text-primary-600" />
              <span className="font-medium">Gmail Account</span>
            </div>
            <p className="text-sm text-gray-600">
              Send emails using your Gmail account with SMTP
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleEmailTypeSelect('website')}
            className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
              emailData?.emailType === 'website'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center mb-2">
              <Globe className="w-5 h-5 mr-2 text-primary-600" />
              <span className="font-medium">Your Website</span>
            </div>
            <p className="text-sm text-gray-600">
              Send emails through your own domain and hosting
            </p>
          </button>
        </div>
      </div>

      {/* Email Fields */}
      <div className="space-y-4">
        <div>
          <label htmlFor="from" className="block text-sm font-medium text-gray-700 mb-1">
            From *
          </label>
          <input
            type="email"
            id="from"
            value={emailData?.from || ''}
            onChange={(e) => onEmailDataChange({ from: e.target.value })}
            placeholder="your-email@example.com"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={emailData?.password || ''}
              onChange={(e) => onEmailDataChange({ password: e.target.value })}
              placeholder="Enter your email password"
              className="input-field pr-20"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-gray-400" />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {emailData?.emailType === 'gmail' 
              ? 'Use an App Password if 2FA is enabled'
              : 'Use your email account password'
            }
          </p>
        </div>

        {/* SMTP Configuration fields - only show for website emails */}
        {emailData?.emailType === 'website' && (
          <>
            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
                SMTP Domain *
              </label>
              <input
                type="text"
                id="domain"
                value={emailData?.domain || ''}
                onChange={(e) => onEmailDataChange({ domain: e.target.value })}
                placeholder="smtp.yourdomain.com"
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your SMTP server domain (e.g., smtp.yourdomain.com)
              </p>
            </div>

            <div>
              <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700 mb-1">
                SMTP Port *
              </label>
              <input
                type="number"
                id="smtpPort"
                value={emailData?.smtpPort || ''}
                onChange={(e) => onEmailDataChange({ smtpPort: e.target.value })}
                placeholder="587"
                min="1"
                max="65535"
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Common ports: 587 (STARTTLS), 465 (SSL), 25 (Standard)
              </p>
            </div>
          </>
        )}

        <div>
          <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
            To *
          </label>
          <input
            type="email"
            id="to"
            value={emailData?.to || ''}
            onChange={(e) => onEmailDataChange({ to: e.target.value })}
            placeholder="recipient@example.com"
            className="input-field"
          />
        </div>

        {emailData?.emailType === 'gmail' && (
          <div>
            <label htmlFor="cc" className="block text-sm font-medium text-gray-700 mb-1">
              CC (optional)
            </label>
            <input
              type="email"
              id="cc"
              value={emailData?.cc || ''}
              onChange={(e) => onEmailDataChange({ cc: e.target.value })}
              placeholder="cc@example.com"
              className="input-field"
            />
          </div>
        )}

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            value={emailData?.subject || ''}
            onChange={(e) => onEmailDataChange({ subject: e.target.value })}
            placeholder="Your email subject"
            className="input-field"
          />
        </div>
      </div>

      {/* Continue Button */}
      <div className="mt-6">
        <button
          onClick={onContinue}
          disabled={!isFormValid}
          className={`w-full flex items-center justify-center ${
            isFormValid
              ? 'btn-primary'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed font-medium py-2 px-4 rounded-lg'
          }`}
        >
          Continue to Editor
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>

      {/* Platform Info */}
      {emailData?.emailType && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-1">
            {emailData?.emailType === 'gmail' ? 'Gmail Setup' : 'Website Setup'}
          </h3>
          <p className="text-sm text-blue-700">
            {emailData?.emailType === 'gmail' 
              ? 'You\'ll need to enable 2-factor authentication and generate an app password for Gmail.'
              : 'You\'ll need to configure your domain\'s email settings and SMTP credentials.'
            }
          </p>
          {emailData?.emailType === 'website' && (
            <div className="mt-2 text-xs text-blue-700">
              <strong>SMTP Settings:</strong> Common configurations:
              <ul className="mt-1 ml-4 list-disc">
                <li><strong>Domains:</strong> smtp.yourdomain.com, mail.yourdomain.com</li>
                <li><strong>Ports:</strong> 587 (STARTTLS), 465 (SSL), 25 (Standard)</li>
                <li><strong>Hostinger:</strong> smtp.hostinger.com:587</li>
                <li><strong>GoDaddy:</strong> smtp.godaddy.com:587</li>
                <li><strong>cPanel:</strong> smtp.cpanel.net:587</li>
              </ul>
            </div>
          )}
          <div className="mt-2 text-xs text-blue-600">
            <strong>Security Note:</strong> Your password is stored securely and only used for sending emails.
          </div>
        </div>
      )}
    </div>
  )
}

export default EmailForm
