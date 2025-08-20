import React, { useEffect } from 'react'
import { Mail } from 'lucide-react'
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
    <div className="h-full p-4">
      {/* Main preview card */}
      <div className="h-[calc(100%-80px)] overflow-y-auto border border-gray-200 rounded-lg bg-white">
        {emailData?.content ? (
          <div 
            className="email-preview-content p-6"
            dangerouslySetInnerHTML={{ 
              __html: formatEmailContent(emailData?.content || '') 
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Start writing content in the editor</p>
              <p className="text-sm">Your preview will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Email Stats - Compact */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Words: {emailData?.content ? emailData?.content.split(/\s+/).filter(word => word.length > 0).length : 0}</span>
          <span>Chars: {emailData?.content ? emailData?.content.length : 0}</span>
        </div>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            emailData?.emailType === 'gmail' ? 'bg-red-500' : 'bg-blue-500'
          }`} />
          <span>{emailData?.emailType === 'gmail' ? 'Gmail' : 'Website'}</span>
        </div>
      </div>
    </div>
  )
}

export default EmailPreview
