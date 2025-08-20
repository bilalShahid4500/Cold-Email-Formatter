import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Company } from '../types/company';
import EmailEditor from './EmailEditor';
import EmailPreview from './EmailPreview';
import ErrorNotification from './ErrorNotification';
import { EmailData, EmailError } from '../types/email';

interface EmailAppProps {
  onSwitchTab: (tab: 'email' | 'companies' | 'logs') => void;
}

const EmailApp: React.FC<EmailAppProps> = ({ onSwitchTab }) => {
  const { token } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const defaultEmailTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cold Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .email-container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
        .content { margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h2>Cold Email Template</h2>
        </div>
        
        <div class="content">
            <p>Dear [Recipient Name],</p>
            
            <p>I hope this email finds you well. I came across your profile and was impressed by your work in [their field/company].</p>
            
            <p>I believe there might be a great opportunity for collaboration between us. [Your value proposition or specific reason for reaching out].</p>
            
            <p>Would you be interested in a brief 15-minute call to discuss how we could potentially work together?</p>
            
            <p>Looking forward to hearing from you!</p>
            
            <p>Best regards,<br>
            [Your Name]<br>
            [Your Title]<br>
            [Your Company]</p>
        </div>
        
        <div class="footer">
            <p style="font-size: 12px; color: #666;">
                This email was sent using Cold Email Formatter
            </p>
        </div>
    </div>
</body>
</html>`;

  const [emailData, setEmailData] = useState<EmailData>({
    emailType: '',
    from: '',
    password: '',
    domain: '',
    smtpPort: '',
    to: '',
    cc: '',
    subject: '',
    content: defaultEmailTemplate
  });

  const [error, setError] = useState<EmailError | null>(null);

  const API_BASE_URL = 'http://localhost:3001/api';

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies);
        if (data.companies.length > 0) {
          setSelectedCompany(data.companies[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const handleEmailDataChange = (newData: Partial<EmailData>) => {
    setEmailData(prev => ({ ...prev, ...newData }));
  };

  const handleCompanyChange = (company: Company) => {
    setSelectedCompany(company);
    // Update email data with company settings
    setEmailData(prev => ({
      ...prev,
      from: company.emailSettings.email,
      emailType: company.emailSettings.type
    }));
  };



  const clearError = () => {
    setError(null);
  };

  const resetForm = () => {
    setEmailData(prev => ({
      ...prev,
      to: '',
      cc: '',
      subject: '',
      content: defaultEmailTemplate
    }));
    setError(null);
  };

  const handleSendEmail = async () => {
    if (!selectedCompany) {
      setError({
        type: 'error',
        message: 'Please select a company first.'
      });
      return;
    }

    try {
      // Validate required fields
      if (!emailData.to || !emailData.subject || !emailData.content) {
        setError({
          type: 'error',
          message: 'Please fill in all required fields before sending the email.'
        });
        return;
      }

      // Show sending status
      setError({
        type: 'warning',
        message: 'Sending email... Please wait.'
      });

      const response = await fetch(`${API_BASE_URL}/emails/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: selectedCompany._id,
          to: emailData.to,
          cc: emailData.cc || undefined, // Include CC field
          subject: emailData.subject,
          htmlContent: emailData.content,
          textContent: emailData.content.replace(/<[^>]*>/g, ''),
          campaignName: 'Cold Email Campaign'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setError({
          type: 'success',
          message: 'Email sent successfully! Form has been reset for your next email.'
        });
        // Reset form to default template
        setEmailData(prev => ({
          ...prev,
          to: '',
          cc: '',
          subject: '',
          content: defaultEmailTemplate
        }));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setError(null);
        }, 3000);
      } else {
        setError({
          type: 'error',
          message: result.error || 'Failed to send email.'
        });
      }

    } catch (error) {
      setError({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send email. Please try again.'
      });
    }
  };



  if (companies.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Companies Found</h2>
          <p className="text-gray-600 mb-6">
            You need to create a company configuration first before sending emails.
          </p>
          <button
            onClick={() => onSwitchTab('companies')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Company Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Send Email</h1>
        <p className="text-gray-600">Select a company and compose your email</p>
      </div>

      {error && (
        <ErrorNotification
          error={error}
          onClose={clearError}
        />
      )}

      <div className="space-y-6">
        {/* Company Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Company
            </label>
            <select
              value={selectedCompany?._id || ''}
              onChange={(e) => {
                const company = companies.find(c => c._id === e.target.value);
                if (company) handleCompanyChange(company);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {companies.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.name} ({company.emailSettings.email})
                </option>
              ))}
            </select>
          </div>

          {selectedCompany && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Selected Company</h3>
              <p className="text-sm text-gray-600">
                <strong>Name:</strong> {selectedCompany.name}<br />
                <strong>Email:</strong> {selectedCompany.emailSettings.email}<br />
                <strong>Type:</strong> {selectedCompany.emailSettings.type}<br />
                <strong>Sender:</strong> {selectedCompany.senderInfo.name}
              </p>
            </div>
          )}
        </div>

        {/* Email Fields */}
        {selectedCompany && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                  To *
                </label>
                <input
                  type="email"
                  id="to"
                  value={emailData?.to || ''}
                  onChange={(e) => handleEmailDataChange({ to: e.target.value })}
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="cc" className="block text-sm font-medium text-gray-700 mb-1">
                  CC (optional)
                </label>
                <input
                  type="email"
                  id="cc"
                  value={emailData?.cc || ''}
                  onChange={(e) => handleEmailDataChange({ cc: e.target.value })}
                  placeholder="cc@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  value={emailData?.subject || ''}
                  onChange={(e) => handleEmailDataChange({ subject: e.target.value })}
                  placeholder="Your email subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Editor and Preview Side by Side */}
        {selectedCompany && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg h-[800px]">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Email Editor</h3>
              </div>
              <div className="h-[calc(100%-73px)]">
                <EmailEditor
                  emailData={emailData}
                  onEmailDataChange={handleEmailDataChange}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg h-[800px]">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
              </div>
              <div className="h-[calc(100%-73px)]">
                <EmailPreview emailData={emailData} />
              </div>
            </div>
          </div>
        )}

        {/* Send Button */}
        {selectedCompany && (
          <div className="flex justify-between items-center">
            <button
              onClick={resetForm}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Reset Form
            </button>
            <button
              onClick={handleSendEmail}
              disabled={!emailData?.to || !emailData?.subject || !emailData?.content}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5 mr-2" />
              Send Email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailApp;
