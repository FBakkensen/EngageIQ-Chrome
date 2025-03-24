# EngageIQ Chrome Extension

A Chrome extension that helps users generate engaging comments for LinkedIn posts using the Gemini AI API.

## Features

- Detects LinkedIn posts and comment fields
- Generates AI-powered comments based on post content
- Customizable comment tones (Professional, Casual, Enthusiastic)
- Adjustable comment length (Short, Medium, Long)
- Movable floating popup UI
- Dark/light mode compatibility
- Secure API key storage

## Development

### Prerequisites

- Node.js (v14+)
- npm (v6+)
- Chrome browser

### Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/engageiq-chrome.git
cd engageiq-chrome
```

2. Install dependencies
```bash
npm install
```

3. Build the extension
```bash
npm run build
```

4. Load the extension in Chrome
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` directory

### Development Commands

- `npm run build`: Build for production
- `npm run watch`: Build and watch for changes
- `npm test`: Run all tests
- `npx jest path/to/test.ts`: Run a single test file
- `npm run storybook`: Run Storybook UI development environment

## Usage

1. Install the extension from the Chrome Web Store (or load unpacked during development)
2. Click on the extension icon and navigate to Options
3. Enter your Gemini API key
4. Browse LinkedIn and click on any comment field
5. Click the EngageIQ button that appears
6. Select the desired tone and length for your comment
7. Choose from the generated comments or regenerate
8. Click on a comment to insert it into the comment field

## Project Structure

- `src/`: Source code
  - `background/`: Background service worker
  - `content/`: Content scripts for LinkedIn integration
  - `options/`: Options page for API key management
  - `popup/`: Extension popup UI
  - `shared/`: Shared utilities and types
- `dist/`: Build output
- `docs/`: Documentation
- `plans/`: Development plans
- `tests/`: Test files

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 