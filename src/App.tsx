import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ArrowLeft, Send, Upload, FileText, Eye } from 'lucide-react'
import EmailForm from './components/EmailForm'
import EmailEditor from './components/EmailEditor'
import EmailPreview from './components/EmailPreview'
import ErrorNotification from './components/ErrorNotification'
import MarketingPage from './pages/MarketingPage'
import { EmailData, EmailError } from './types/email'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MarketingPage />} />
        <Route path="/app" element={<EmailApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

function EmailApp() {
  const [emailData, setEmailData] = useState<EmailData>({
    emailType: '',
    from: '',
    password: '',
    domain: '',
    smtpPort: '',
    to: '',
    cc: '',
    subject: '',
    content: ''
  })

  const [showEditor, setShowEditor] = useState(false)
  const [error, setError] = useState<EmailError | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleEmailDataChange = (newData: Partial<EmailData>) => {
    setEmailData(prev => ({ ...prev, ...newData }))
  }

  const handleContinue = () => {
    if (emailData.emailType) {
      setShowEditor(true)
    }
  }



  const clearError = () => {
    setError(null)
  }

  const handleSendEmail = async () => {
    try {
      // Validate required fields
      if (!emailData.from || !emailData.password || !emailData.to || !emailData.subject || !emailData.content) {
        setError({
          type: 'error',
          message: 'Please fill in all required fields before sending the email.'
        })
        return
      }

      // Show sending status
      setError({
        type: 'warning',
        message: 'Sending email... Please wait.'
      })

      // Import and use the email sender
      const { sendEmail } = await import('./utils/emailSender')
      const result = await sendEmail(emailData)

      if (result.success) {
        setError({
          type: 'success',
          message: result.message
        })
      } else {
        setError({
          type: 'error',
          message: result.message
        })
      }

    } catch (error) {
      setError({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send email. Please try again.'
      })
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/html') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setEmailData(prev => ({ ...prev, content }))
      }
      reader.readAsText(file)
    } else {
      alert('Please upload an HTML file (.html)')
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

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
            
            <p>Looking forward to hearing from you.</p>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>
            [Your Name]<br>
            [Your Company]<br>
            [Your Contact Information]</p>
        </div>
    </div>
</body>
</html>`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Cold Email Formatter
          </h1>
          <p className="text-gray-600">
            Create and format professional cold emails with ease
          </p>
        </header>

        {/* Error Notification */}
        {error && (
          <ErrorNotification 
            error={error} 
            onClose={clearError}
          />
        )}

        {!showEditor ? (
          <div className="max-w-2xl mx-auto">
            <EmailForm 
              emailData={emailData} 
              onEmailDataChange={handleEmailDataChange}
              onContinue={handleContinue}
            />
          </div>
        ) : (
          <div>
            {/* Controls and headings outside the grid */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 mb-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowEditor(false)}
                  className="flex items-center text-gray-600 hover:text-blue-700 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:border-blue-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Form
                </button>
                
                <button
                  onClick={handleSendEmail}
                  className="btn-primary flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </button>
              </div>

              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  HTML Email Editor
                </h3>
                <p className="text-gray-600">
                  Upload a complete HTML file or edit the content below. The preview will show only the body content.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Email Content
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleUploadClick}
                      className="flex items-center text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors border border-blue-200"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Upload HTML
                    </button>
                    <button
                      onClick={() => setEmailData(prev => ({ ...prev, content: defaultEmailTemplate }))}
                      className="flex items-center text-sm bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors border border-green-200"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Load Template
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden file input for upload functionality */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Grid for editor and preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="mb-2">
                  <h4 className="text-xl font-bold text-gray-900 flex items-center">
                    <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                      <FileText className="w-3 h-3 text-white" />
                    </div>
                    HTML Email Editor
                  </h4>
                </div>
                <EmailEditor 
                  emailData={emailData}
                  onEmailDataChange={handleEmailDataChange}
                />
              </div>
              <div>
                <div className="mb-2">
                  <h4 className="text-xl font-bold text-gray-900 flex items-center">
                    <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                      <Eye className="w-3 h-3 text-white" />
                    </div>
                    Email Preview
                  </h4>
                </div>
                <EmailPreview emailData={emailData} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
