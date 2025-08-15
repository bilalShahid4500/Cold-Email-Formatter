# Cold Email Formatter

A modern web application for creating and formatting professional cold emails with a live preview feature.

## Features

- **Email Platform Selection**: Choose between Gmail or your own website for sending emails
- **Form Inputs**: Complete email form with From, To, CC, and Subject fields
- **Code Editor**: Monaco Editor for writing email content with syntax highlighting
- **Live Preview**: Real-time preview of your email content
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, professional interface built with Tailwind CSS

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Code Editor**: Monaco Editor (same as VS Code)
- **Icons**: Lucide React
- **Development**: ESLint, TypeScript

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cold-email-formatter
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Usage

1. **Choose Email Platform**: Select between Gmail or your website
2. **Fill Email Details**: Enter From, To, CC, and Subject information
3. **Write Content**: Use the code editor to write your email content
4. **Preview**: See a live preview of your email on the right side
5. **Send**: Click the send button (email sending functionality to be implemented)

## Project Structure

```
src/
├── components/
│   ├── EmailForm.tsx      # Initial form with platform selection
│   ├── EmailEditor.tsx    # Code editor for email content
│   └── EmailPreview.tsx   # Live preview component
├── types/
│   └── email.ts          # TypeScript type definitions
├── App.tsx               # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## Email Sending Integration

The application is set up to handle two different email sending methods:

### Gmail Integration
- Requires 2-factor authentication
- Uses Gmail SMTP with app password
- Configure SMTP settings for Gmail

### Website Integration
- Uses your domain's email settings
- Configure SMTP credentials for your hosting provider
- Supports custom domain email addresses

## Customization

### Styling
The application uses Tailwind CSS for styling. You can customize the design by modifying:
- `tailwind.config.js` - Tailwind configuration
- `src/index.css` - Global styles and custom components

### Email Templates
Default email templates can be modified in the `EmailEditor.tsx` component.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For support or questions, please open an issue in the repository.
