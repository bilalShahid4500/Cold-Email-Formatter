import React, { useState } from 'react'
import { Download, Edit3, Save, X } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { EmailEditorProps } from '../types/email'

const EmailEditor: React.FC<EmailEditorProps> = ({ emailData, onEmailDataChange }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    from: emailData.from,
    to: emailData.to,
    cc: emailData.cc,
    subject: emailData.subject
  })

  const handleEditorChange = (value: string | undefined) => {
    onEmailDataChange({ content: value || '' })
  }

  const handleSave = () => {
    onEmailDataChange(editData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData({
      from: emailData.from,
      to: emailData.to,
      cc: emailData.cc,
      subject: emailData.subject
    })
    setIsEditing(false)
  }

  const handleDownloadHTML = () => {
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailData.subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .email-container { max-width: 600px; margin: 0 auto; padding: 20px; }
    </style>
</head>
<body>
    ${emailData.content}
</body>
</html>`
    
    const blob = new Blob([fullHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `email-${Date.now()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Update editData when emailData changes
  React.useEffect(() => {
    setEditData({
      from: emailData.from,
      to: emailData.to,
      cc: emailData.cc,
      subject: emailData.subject
    })
  }, [emailData.from, emailData.to, emailData.cc, emailData.subject])

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
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Email Details</h4>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors border border-blue-200"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center text-sm bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors border border-green-200"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors border border-gray-200"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={handleDownloadHTML}
              className="flex items-center text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-md transition-colors border border-purple-200"
            >
              <Download className="w-4 h-4 mr-1" />
              Download HTML
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From:</label>
            {isEditing ? (
              <input
                type="email"
                value={editData.from}
                onChange={(e) => setEditData(prev => ({ ...prev, from: e.target.value }))}
                className="input-field text-sm"
                placeholder="your-email@example.com"
              />
            ) : (
              <div className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border">
                {emailData.from || 'Not set'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
            {isEditing ? (
              <input
                type="email"
                value={editData.to}
                onChange={(e) => setEditData(prev => ({ ...prev, to: e.target.value }))}
                className="input-field text-sm"
                placeholder="recipient@example.com"
              />
            ) : (
              <div className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border">
                {emailData.to || 'Not set'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.subject}
                onChange={(e) => setEditData(prev => ({ ...prev, subject: e.target.value }))}
                className="input-field text-sm"
                placeholder="Email subject"
              />
            ) : (
              <div className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border">
                {emailData.subject || 'Not set'}
              </div>
            )}
          </div>

          {emailData.emailType === 'gmail' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CC:</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.cc}
                  onChange={(e) => setEditData(prev => ({ ...prev, cc: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="cc@example.com"
                />
              ) : (
                <div className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border">
                  {emailData.cc || 'None'}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform:</label>
            <div className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border">
              {emailData.emailType === 'gmail' ? 'Gmail' : 'Website'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailEditor
