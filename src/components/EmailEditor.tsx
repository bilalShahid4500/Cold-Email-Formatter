import React, { useRef } from 'react'
import { ArrowLeft, Send, Upload, FileText } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { EmailEditorProps } from '../types/email'
import { sendEmail } from '../utils/emailSender'

const EmailEditor: React.FC<EmailEditorProps> = ({ emailData, onEmailDataChange, onBack, onError }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleEditorChange = (value: string | undefined) => {
    onEmailDataChange({ content: value || '' })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/html') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        onEmailDataChange({ content })
      }
      reader.readAsText(file)
    } else {
      alert('Please upload an HTML file (.html)')
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleSendEmail = async () => {
    try {
      // Validate required fields
      if (!emailData.from || !emailData.password || !emailData.to || !emailData.subject || !emailData.content) {
        onError({
          type: 'error',
          message: 'Please fill in all required fields before sending the email.'
        })
        return
      }

      // Show sending status
      onError({
        type: 'warning',
        message: 'Sending email... Please wait.'
      })

      // Send email using the real email sender
      const result = await sendEmail(emailData)

      if (result.success) {
        onError({
          type: 'success',
          message: result.message
        })
      } else {
        onError({
          type: 'error',
          message: result.message
        })
      }

    } catch (error) {
      onError({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send email. Please try again.'
      })
    }
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
    <div>
      {/* Hidden file input for upload functionality */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Main editor card */}
      <div className="card h-[800px] overflow-hidden">
        <div className="h-full overflow-y-auto">
          <Editor
            height="100%"
            defaultLanguage="html"
            value={emailData.content || defaultEmailTemplate}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              theme: 'vs-light',
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible'
              }
            }}
          />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mt-4">
        <h4 className="font-medium text-gray-900 mb-2">Email Preview Info</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>From:</strong> {emailData.from}</p>
          <p><strong>To:</strong> {emailData.to}</p>
          {emailData.cc && <p><strong>CC:</strong> {emailData.cc}</p>}
          <p><strong>Subject:</strong> {emailData.subject}</p>
          <p><strong>Platform:</strong> {emailData.emailType === 'gmail' ? 'Gmail' : 'Website'}</p>
        </div>
      </div>
    </div>
  )
}

export default EmailEditor
