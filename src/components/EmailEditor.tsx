import React, { useRef } from 'react'
import { Download, Upload } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { EmailEditorProps } from '../types/email'

const EmailEditor: React.FC<EmailEditorProps> = ({ emailData, onEmailDataChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditorChange = (value: string | undefined) => {
    onEmailDataChange({ content: value || '' })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/html') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onEmailDataChange({ content });
      };
      reader.readAsText(file);
    } else {
      alert('Please upload an HTML file (.html)');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadHTML = () => {
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailData?.subject || 'Email'}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .email-container { max-width: 600px; margin: 0 auto; padding: 20px; }
    </style>
</head>
<body>
    ${emailData?.content || ''}
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
</html>`

  return (
    <div className="h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">HTML Editor</h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleUploadClick}
            className="flex items-center text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors border border-blue-200"
          >
            <Upload className="w-4 h-4 mr-1" />
            Upload Template
          </button>
          <button
            onClick={handleDownloadHTML}
            className="flex items-center text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-md transition-colors border border-purple-200"
          >
            <Download className="w-4 h-4 mr-1" />
            Download HTML
          </button>
        </div>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".html"
        className="hidden"
      />
      
      <div className="h-[calc(100%-80px)]">
        <Editor
          height="100%"
          defaultLanguage="html"
          value={emailData?.content || defaultEmailTemplate}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            theme: 'vs-light',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible'
            },
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: 'off'
          }}
        />
      </div>
    </div>
  )
}

export default EmailEditor
