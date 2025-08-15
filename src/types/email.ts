export interface EmailData {
  emailType: 'gmail' | 'website' | ''
  from: string
  password: string
  domain: string // SMTP domain for website emails
  smtpPort: string // SMTP port for website emails
  to: string
  cc: string
  subject: string
  content: string // This will contain the complete HTML content
}

export interface EmailError {
  message: string
  type: 'error' | 'success' | 'warning'
}

export interface EmailFormProps {
  emailData: EmailData
  onEmailDataChange: (data: Partial<EmailData>) => void
  onContinue: () => void
  onError: (error: EmailError) => void
}

export interface EmailEditorProps {
  emailData: EmailData
  onEmailDataChange: (data: Partial<EmailData>) => void
  onBack: () => void
  onError: (error: EmailError) => void
}

export interface EmailPreviewProps {
  emailData: EmailData
}
