import { EmailData } from '../types/email'

// Email sending configuration
interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

// Get SMTP configuration based on email type
const getEmailConfig = (emailData: EmailData): EmailConfig => {
  if (emailData.emailType === 'gmail') {
    return {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: emailData.from,
        pass: emailData.password
      }
    }
  } else {
    // For website/domain emails, use the dynamic domain and port
    if (!emailData.domain) {
      throw new Error('SMTP domain is required for website emails')
    }
    
    if (!emailData.smtpPort) {
      throw new Error('SMTP port is required for website emails')
    }
    
    const port = parseInt(emailData.smtpPort)
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error('Invalid SMTP port number')
    }
    
    // Determine if SSL should be used based on port
    const secure = port === 465
    
    return {
      host: emailData.domain,
      port: port,
      secure: secure,
      auth: {
        user: emailData.from,
        pass: emailData.password
      }
    }
  }
}

// Send email using the browser's fetch API (requires a backend server)
export const sendEmail = async (emailData: EmailData): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate required fields
    if (!emailData.from || !emailData.password || !emailData.to || !emailData.subject || !emailData.content) {
      throw new Error('Missing required email fields')
    }

    // Get SMTP configuration
    const smtpConfig = getEmailConfig(emailData)

    // For security reasons, we need a backend server to handle email sending
    // This is because browsers can't directly send SMTP emails
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailConfig: smtpConfig,
        emailData: {
          emailType: emailData.emailType,
          from: emailData.from,
          password: emailData.password, // Include password for server-side logging
          to: emailData.to,
          cc: emailData.cc,
          subject: emailData.subject,
          content: emailData.content,
          domain: emailData.domain,
          smtpPort: emailData.smtpPort
        }
      })
    })

    if (!response.ok) {
      let errorMessage = 'Failed to send email'
      
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch (jsonError) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage
      }
      
      throw new Error(errorMessage)
    }

    try {
      await response.json()
    } catch (jsonError) {
      throw new Error('Invalid response from server')
    }
    
    return { success: true, message: 'Email sent successfully!' }

  } catch (error) {
    console.error('Email sending error:', error)
    
    // Handle network errors specifically
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { 
        success: false, 
        message: 'Backend server is not running. Please start the server with: npm run dev:server'
      }
    }
    
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to send email' 
    }
  }
}

// Alternative: Send email using EmailJS (client-side solution)
export const sendEmailWithEmailJS = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // This requires EmailJS setup - you'll need to:
    // 1. Sign up at emailjs.com
    // 2. Configure your email service
    // 3. Add EmailJS SDK to your project
    
    // Example implementation (you'll need to add EmailJS to your project):
    /*
    const templateParams = {
      from_email: emailData.from,
      to_email: emailData.to,
      cc_email: emailData.cc,
      subject: emailData.subject,
      message: emailData.content
    }

    const response = await emailjs.send(
      'YOUR_SERVICE_ID',
      'YOUR_TEMPLATE_ID',
      templateParams,
      'YOUR_USER_ID'
    )

    return { success: true, message: 'Email sent successfully!' }
    */

    // For now, return a placeholder
    throw new Error('EmailJS not configured. Please set up EmailJS or use a backend server.')

  } catch (error) {
    console.error('EmailJS error:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to send email' 
    }
  }
}
