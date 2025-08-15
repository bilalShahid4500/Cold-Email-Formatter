import React from 'react'
import { X, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { EmailError } from '../types/email'

interface ErrorNotificationProps {
  error: EmailError
  onClose: () => void
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({ error, onClose }) => {
  const getIcon = () => {
    switch (error.type) {
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      case 'success':
        return <CheckCircle className="w-5 h-5" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const getBgColor = () => {
    switch (error.type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default:
        return 'bg-red-50 border-red-200 text-red-800'
    }
  }

  const getIconColor = () => {
    switch (error.type) {
      case 'error':
        return 'text-red-600'
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      default:
        return 'text-red-600'
    }
  }

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4`}>
      <div className={`border rounded-lg p-4 shadow-lg ${getBgColor()}`}>
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${getIconColor()}`}>
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">
              {error.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 hover:bg-opacity-20 ${getIconColor()} hover:bg-current focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorNotification
