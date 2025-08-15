import React from 'react'
import { Eye, Mail } from 'lucide-react'
import { EmailPreviewProps } from '../types/email'

const EmailPreview: React.FC<EmailPreviewProps> = ({ emailData }) => {
  const extractBodyContent = (htmlContent: string) => {
    // Extract content from <body> tag if it exists
    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    if (bodyMatch) {
      return bodyMatch[1]
    }
    
    // If no body tag, check if it's just HTML content
    const htmlMatch = htmlContent.match(/<html[^>]*>([\s\S]*?)<\/html>/i)
    if (htmlMatch) {
      return htmlMatch[1]
    }
    
    // If no HTML structure, return as is
    return htmlContent
  }

  const formatEmailContent = (content: string) => {
    const bodyContent = extractBodyContent(content)
    // Return the HTML content as-is for proper rendering
    return bodyContent
  }

  return (
    <div>
      {/* Main preview card */}
      <div className="card h-[800px]">
        <div className="h-full overflow-y-auto">
          {emailData.content ? (
            <div 
              className="email-preview-content"
              dangerouslySetInnerHTML={{ 
                __html: formatEmailContent(emailData.content) 
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Upload an HTML file or start writing content</p>
                <p className="text-sm">Your preview will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Word Count</div>
          <div className="text-lg font-semibold text-blue-900">
            {emailData.content ? emailData.content.split(/\s+/).filter(word => word.length > 0).length : 0}
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-sm text-green-600 font-medium">Character Count</div>
          <div className="text-lg font-semibold text-green-900">
            {emailData.content ? emailData.content.length : 0}
          </div>
        </div>
      </div>

      {/* Platform Info */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Sending Platform</h4>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            emailData.emailType === 'gmail' ? 'bg-red-500' : 'bg-blue-500'
          }`} />
          <span className="text-sm text-gray-700">
            {emailData.emailType === 'gmail' ? 'Gmail SMTP' : 'Website SMTP'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default EmailPreview
