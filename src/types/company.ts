export interface EmailSettings {
  email: string;
  password: string;
  type: 'gmail' | 'outlook' | 'yahoo' | 'custom';
  smtpHost?: string;
  smtpPort?: number;
  useSSL?: boolean;
  useTLS?: boolean;
}

export interface SenderInfo {
  name: string;
  signature?: string;
}

export interface Company {
  _id: string;
  name: string;
  user: string;
  emailSettings: EmailSettings;
  senderInfo: SenderInfo;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyData {
  name: string;
  emailSettings: EmailSettings;
  senderInfo: SenderInfo;
  description?: string;
}

export interface UpdateCompanyData {
  name?: string;
  emailSettings?: EmailSettings;
  senderInfo?: SenderInfo;
  description?: string;
  isActive?: boolean;
}
