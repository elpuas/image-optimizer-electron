const {
  app, BrowserWindow, ipcMain, dialog,
} = require('electron');
const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 500,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('renderer/index.html');
}

app.whenReady().then(() => {
  createWindow();
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

function getScriptPath() {
  if (app.isPackaged) {
    // Try multiple possible locations for the script in packaged app
    const possiblePaths = [
      path.join(process.resourcesPath, 'app.asar.unpacked', 'scripts', 'optimize.js'),
      path.join(process.resourcesPath, 'app', 'scripts', 'optimize.js'),
      path.join(__dirname, '..', 'app.asar.unpacked', 'scripts', 'optimize.js'),
    ];

    for (const scriptPath of possiblePaths) {
      if (fs.existsSync(scriptPath)) {
        return scriptPath;
      }
    }

    // Fallback to first path if none exist (will help with debugging)
    return possiblePaths[0];
  }
  // In development, use relative path from __dirname
  return path.join(__dirname, 'scripts', 'optimize.js');
}



ipcMain.handle('optimize-images', (event, inputPath, format) => new Promise((resolve, reject) => {
  // Get the correct script path
  const scriptPath = getScriptPath();

  console.log('🧭 App packaged:', app.isPackaged);
  console.log('🧭 Electron executable:', process.execPath);
  console.log('📜 Script path:', scriptPath);
  console.log('📂 Script exists:', fs.existsSync(scriptPath));
  console.log('📂 Input folder:', inputPath);
  console.log('🎯 Format:', format);

  // Use fork instead of spawn - this works better for Node.js scripts in Electron
  const child = fork(
    scriptPath,
    ['--input', inputPath, '--format', format],
    {
      silent: true, // Capture stdout/stderr
      env: { ...process.env, NODE_ENV: 'production' },
    },
  );

  child.on('spawn', () => {
    console.log('🚀 Forked optimization process');
  });

  let outputBuffer = '';
  let errorBuffer = '';

  // Handle stdout data - emit real-time updates
  if (child.stdout) {
    child.stdout.on('data', (data) => {
      const text = data.toString();
      outputBuffer += text;
      console.log('📤 Script stdout:', text.trim());

      // Split by lines and emit each complete line
      const lines = text.split('\n');
      lines.forEach((line, index) => {
        if (line.trim() || index < lines.length - 1) {
          // Send real-time log update to renderer
          event.sender.send('optimize-log', line);
        }
      });
    });
  }

  // Handle stderr data - emit real-time error updates
  if (child.stderr) {
    child.stderr.on('data', (data) => {
      const text = data.toString();
      errorBuffer += text;
      console.log('📤 Script stderr:', text.trim());

      // Split by lines and emit each complete line
      const lines = text.split('\n');
      lines.forEach((line, index) => {
        if (line.trim() || index < lines.length - 1) {
          // Send real-time log update to renderer
          event.sender.send('optimize-log', `ERROR: ${line}`);
        }
      });
    });
  }

  // Handle process completion
  child.on('close', (code, signal) => {
    console.log(`🏁 Process closed with code ${code}, signal ${signal}`);

    // Send final completion status
    event.sender.send('optimize-complete', {
      success: code === 0,
      exitCode: code,
    });

    resolve({
      success: code === 0,
      exitCode: code,
    });
  });

  // Handle process errors
  child.on('error', (error) => {
    console.log('💥 Fork error:', error);
    const msg = `Failed to start optimization process: ${error.message}`;
    event.sender.send('optimize-log', `ERROR: ${msg}`);
    event.sender.send('optimize-complete', {
      success: false,
      exitCode: -1,
    });
    reject(new Error(msg));
  });
}));
