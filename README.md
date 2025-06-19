# Image Optimizer - Electron Desktop App

A lightweight desktop application built with Electron and Node.js for optimizing images using the powerful [Sharp](https://sharp.pixelplumbing.com/) library. Select a folder, choose your desired output format, and watch as all images are optimized with real-time progress feedback.

![Image Optimizer Demo](https://img.shields.io/badge/Electron-Desktop%20App-blue?logo=electron)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)
![Sharp](https://img.shields.io/badge/Sharp-Image%20Processing-orange)

## 🚀 Features

- **🖥️ Native Desktop App**: Built with Electron for cross-platform compatibility
- **⚡ Fast Image Processing**: Powered by Sharp for high-performance image optimization
- **📁 Folder-Based Processing**: Select any folder and optimize all images at once
- **🔄 Real-Time Progress**: Live streaming of optimization progress to the UI
- **🎯 Multiple Formats**: Support for WebP, JPEG, PNG, and original format optimization
- **🔒 Secure Architecture**: Uses Electron's contextBridge for secure IPC communication
- **📊 Detailed Feedback**: Shows file sizes, compression ratios, and processing status
- **🎨 Clean UI**: Simple, responsive interface with no frameworks - just vanilla JS

## 📋 Supported Image Formats

**Input**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`, `.tiff`  
**Output**: `webp`, `jpeg`, `png`, `original` (optimized versions of input format)

## 🛠️ Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd image-optimizer-electron
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### 🎯 Running the App

**Development Mode**
```bash
npm run dev
```

**Production Mode**
```bash
npm start
```

## 📁 Project Structure

```
image-optimizer-electron/
├── main.js                 # Main Electron process - window management & IPC
├── preload.js              # Secure IPC bridge via contextBridge
├── package.json            # Dependencies and scripts
├── scripts/
│   └── optimize.js         # Node.js script using Sharp for image processing
├── renderer/
│   ├── index.html          # UI structure
│   └── app.js              # DOM logic & IPC communication
└── .cursor/
    └── rules/              # Development rules and architecture guidelines
```

## ⚙️ How It Works

### Architecture Overview

1. **Main Process** (`main.js`) - Manages the application lifecycle and creates browser windows
2. **Renderer Process** (`renderer/`) - Handles the user interface and user interactions  
3. **Preload Script** (`preload.js`) - Provides secure communication bridge between main and renderer
4. **Optimization Script** (`scripts/optimize.js`) - Performs actual image processing using Sharp

### Processing Flow

1. **Folder Selection**: User selects a folder containing images via native dialog
2. **Format Selection**: Choose output format (WebP, JPEG, PNG, or optimized original)
3. **Child Process**: Main process spawns `optimize.js` as a child process with CLI arguments
4. **Real-Time Streaming**: Processing logs stream back to UI via IPC events
5. **Output**: Optimized images are saved to `selectedFolder/optimized/`

### IPC Communication

```javascript
// Real-time log streaming
main → renderer: 'optimize-log' (individual log messages)
main → renderer: 'optimize-complete' (final status)

// User actions  
renderer → main: 'select-folder' (folder selection)
renderer → main: 'optimize-images' (start processing)
```

## 🔧 Available Scripts

```bash
npm run dev          # Run in development mode
npm start            # Run in production mode  
npm run lint         # Check code quality with ESLint
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## 📦 Dependencies

### Production
- **[electron](https://electronjs.org/)** - Desktop app framework
- **[sharp](https://sharp.pixelplumbing.com/)** - High-performance image processing

### Development
- **[eslint](https://eslint.org/)** - Code linting with Airbnb base config
- **[prettier](https://prettier.io/)** - Code formatting
- **[eslint-config-airbnb-base](https://www.npmjs.com/package/eslint-config-airbnb-base)** - Airbnb ESLint rules

## 🎨 UI Features

- **Clean Interface**: Styled with [Water.css](https://watercss.kognise.dev/) for a modern, lightweight design
- **Real-Time Feedback**: Progress updates appear instantly as each image is processed
- **Auto-Scrolling Output**: Automatically scrolls to show the latest processing updates
- **Visual Status Indicators**: Clear ✅/❌ indicators for success and failure states
- **Responsive Design**: Works well across different window sizes

## 🔒 Security

This app follows Electron security best practices:

- **Context Isolation**: Renderer processes run in isolated contexts
- **No Node.js Integration**: Renderer cannot directly access Node.js APIs
- **Secure IPC**: All communication goes through the secure contextBridge API
- **Minimal API Surface**: Only necessary APIs are exposed to the renderer

## 🏗️ Development Guidelines

The project follows strict architectural principles:

- **Separation of Concerns**: Clear boundaries between UI, logic, and system integration
- **Security First**: All IPC communication uses contextBridge pattern
- **No Overengineering**: Simple, maintainable code without unnecessary abstractions
- **Image Processing**: All image transformations use Sharp library exclusively

## 📝 Example Usage

1. Launch the application
2. Click "Select Folder" and choose a directory with images
3. Select your preferred output format (WebP recommended for best compression)
4. Click "Optimize" and watch real-time progress
5. Find optimized images in the `optimized` subfolder

## 🐛 Troubleshooting

**App won't start**: Ensure Node.js 18+ is installed and dependencies are installed with `npm install`

**No images found**: Make sure your folder contains supported image formats (jpg, png, webp, etc.)

**Sharp installation issues**: Sharp may need to rebuild for your platform. Try:
```bash
npm rebuild sharp
```

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

**Built with ❤️ using Electron and Sharp** 
