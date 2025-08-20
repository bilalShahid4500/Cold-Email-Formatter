import React, { useState, useEffect, useRef } from 'react';
import { Eye, Filter, Download, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EmailRecord {
  _id: string;
  user: string;
  company: string;
  to: string;
  cc?: string | null; // Add CC field
  subject: string;
  htmlContent: string;
  textContent: string;
  status: string;
  sentAt: string;
  messageId: string;
  metadata: {
    ipAddress: string;
    userAgent: string;
    campaignName: string;
    smtpResponse?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Company {
  _id: string;
  name: string;
  user: string;
  emailSettings: {
    email: string;
    type: string;
  };
  senderInfo: {
    name: string;
  };
  isActive: boolean;
}

const EmailLogs: React.FC = () => {
  const { token } = useAuth();
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const isInitialMount = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<string>('');

  useEffect(() => {
    const initializeData = async () => {
      await fetchCompanies();
      await fetchEmails();
    };
    initializeData();
    
    // Cleanup function to abort requests on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [token]); // Add token as dependency

  useEffect(() => {
    // Only fetch emails when selectedCompany changes (not on initial mount)
    if (!isInitialMount.current) {
      fetchEmails();
    } else {
      isInitialMount.current = false;
    }
    
    // Cleanup function to abort requests on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedCompany, token]); // Add token as dependency

  const fetchCompanies = async () => {
    try {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('http://localhost:3001/api/companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current.signal
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      } else {
        console.error('Failed to fetch companies:', response.status);
        setCompanies([]);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Companies request was aborted');
        return;
      }
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };

  const fetchEmails = async () => {
    try {
      setLoading(true);
      
      // Generate unique request ID to prevent duplicate requests
      const requestId = `${selectedCompany}-${Date.now()}`;
      requestIdRef.current = requestId;
      
      const url = selectedCompany === 'all' 
        ? 'http://localhost:3001/api/emails'
        : `http://localhost:3001/api/emails?companyId=${selectedCompany}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current?.signal
      });
      
      // Check if this is still the current request
      if (requestIdRef.current !== requestId) {
        console.log('Email request superseded, ignoring response');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
      } else {
        console.error('Failed to fetch emails:', response.status);
        setEmails([]);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Emails request was aborted');
        return;
      }
      console.error('Error fetching emails:', error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c._id === companyId);
    return company ? company.name : 'Unknown Company';
  };

  const getEmailType = (companyId: string) => {
    const company = companies.find(c => c._id === companyId);
    return company ? company.emailSettings.type : 'Unknown';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleShowEmail = (email: EmailRecord) => {
    setSelectedEmail(email);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEmail(null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Email History</h2>
        <div className="flex items-center space-x-4">
          {companies.length > 0 && (
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Companies</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <History className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-gray-500 text-lg font-medium mb-2">No companies found</p>
          <p className="text-gray-400 text-sm">Create a company first to start sending emails.</p>
          <div className="mt-4">
            <button
              onClick={() => window.location.href = '/app?tab=companies'}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Company
            </button>
          </div>
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <History className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-gray-500 text-lg font-medium mb-2">No emails found</p>
          <p className="text-gray-400 text-sm">
            {selectedCompany === 'all' 
              ? 'Start sending emails to see them here.' 
              : 'No emails found for the selected company.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {emails.map((email) => (
                <tr key={email._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {email.to}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {email.cc || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                    {email.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getCompanyName(email.company)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {getEmailType(email.company)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(email.status)}`}>
                      {email.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(email.sentAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleShowEmail(email)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Email Preview Modal */}
      {showModal && selectedEmail && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">To:</span> {selectedEmail.to}
                </div>
                {selectedEmail.cc && (
                  <div>
                    <span className="font-semibold">CC:</span> {selectedEmail.cc}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Subject:</span> {selectedEmail.subject}
                </div>
                <div>
                  <span className="font-semibold">Company:</span> {getCompanyName(selectedEmail.company)}
                </div>
                <div>
                  <span className="font-semibold">Sent:</span> {formatDate(selectedEmail.sentAt)}
                </div>
                <div>
                  <span className="font-semibold">Status:</span> 
                  <span className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedEmail.status)}`}>
                    {selectedEmail.status}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Message ID:</span> {selectedEmail.messageId}
                </div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b">
                <h4 className="font-medium text-gray-700">Email Content</h4>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                <div 
                  dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                  className="email-preview"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  const blob = new Blob([selectedEmail.htmlContent], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `email-${selectedEmail._id}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Download HTML
              </button>
              <button
                onClick={closeModal}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailLogs;
