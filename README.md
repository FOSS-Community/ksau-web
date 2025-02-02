# Ksau Web - Developer File Sharing Platform

A modern, developer-focused file sharing platform built with Next.js and shadcn/ui. This platform provides a clean, terminal-inspired interface for uploading and sharing files, with both web and CLI interfaces.

## Features

- 🚀 Modern terminal-inspired UI
- 📁 Drag-and-drop file uploads
- 🔄 Real-time upload progress
- 🔗 Instant share links
- 🛠️ Configurable chunk sizes
- 💻 CLI command generation
- 🌐 Multiple storage backends (OneDrive)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- [ksau-go CLI](https://github.com/global-index-source/ksau-go) (optional, for CLI usage)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ksau-web.git
   cd ksau-web
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and update `NEXT_PUBLIC_API_ENDPOINT` to point to your API server.

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Vercel

1. Push your code to a GitHub repository

2. Connect your repository to Vercel:
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Configure environment variables:
     - Add `NEXT_PUBLIC_API_ENDPOINT` with your production API URL

3. Deploy:
   - Vercel will automatically deploy your project
   - It will also deploy automatically on every push to main

### Environment Variables

- `NEXT_PUBLIC_API_ENDPOINT`: Your API endpoint URL
  - Development: `http://localhost:8080`
  - Production: Your actual API URL

## Project Structure

```
ksau-web/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main upload interface
├── components/            # UI components
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── .env.example          # Example environment variables
├── .gitignore           # Git ignore rules
└── package.json         # Project dependencies
```

## Guidelines for Development

1. **Environment Variables**
   - Always use environment variables for configurable values
   - Keep `.env.example` updated with new variables

2. **Code Style**
   - Follow TypeScript best practices
   - Use `use client` directive for client components
   - Keep components modular and reusable

3. **Backend Integration**
   - All API calls should use the `NEXT_PUBLIC_API_ENDPOINT`
   - Implement proper error handling
   - Show loading states during operations

## Storage Guidelines

- Files are stored on a best-effort basis
- Storage cleanup occurs at 90% capacity
- Contact maintainers for file deletion requests
- Intended for development and testing files only

## CLI Integration

This web interface works alongside the [ksau-go CLI tool](https://github.com/global-index-source/ksau-go). The interface shows equivalent CLI commands for each operation, making it easy to switch between web and CLI usage.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Project Maintainers

- ksauraj
- hakimi
- pratham

## License

This project is open-source and available under the MIT License.

# Donation Acknowledgment

**Proudly donated to [FOSS-Community](https://github.com/FOSS-Community) by [Pratham](https://github.com/prathamdby), [Hakimi](https://github.com/hakimifr) and [Sauraj](https://github.com/ksauraj)**
