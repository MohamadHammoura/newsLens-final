# NewsLens

NewsLens is a powerful news analysis platform that combines a Chrome extension with a web application to provide enhanced news reading and analysis capabilities.

## Overview

NewsLens consists of two main components:
1. **Chrome Extension**: Captures and processes news articles as you browse
2. **Web Application**: Provides a comprehensive interface for viewing and analyzing your saved articles

## Features

- Real-time news article capture through the Chrome extension
- Seamless integration between extension and web app
- Modern, responsive web interface
- Article analysis and organization
- Cross-platform compatibility

## Tech Stack

### Web Application
- Vue.js 3
- TypeScript
- Vite
- Vue Router
- PWA support

### Chrome Extension
- Chrome Extension Manifest V3
- JavaScript/TypeScript

## Getting Started

### Prerequisites
- Node.js (Latest LTS version recommended)
- Chrome browser
- npm or yarn package manager

### Web Application Setup
1. Navigate to the web app directory:
   ```bash
   cd newsLens
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

### Chrome Extension Setup
1. Navigate to the extension directory:
   ```bash
   cd newsLens-extension
   ```

2. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `newsLens-extension` directory

## Development

The project uses a modern development stack with TypeScript for type safety and Vue.js for the frontend. The web application is built with Vite for fast development and optimal production builds.

### Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
