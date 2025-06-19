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

function getNodeModulesPath() {
  if (app.isPackaged) {
    // In packaged app, node_modules is in app.asar.unpacked
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules');
  }
  // In development, use relative path from __dirname
  return path.join(__dirname, 'node_modules');
}

function getWorkingDirectory() {
  if (app.isPackaged) {
    // Set working directory to the app.asar.unpacked directory for proper module resolution
    return path.join(process.resourcesPath, 'app.asar.unpacked');
  }
  // In development, use current directory
  return __dirname;
}

ipcMain.handle('optimize-images', (event, inputPath, format) => new Promise((resolve, reject) => {
  // Get the correct script path
  const scriptPath = getScriptPath();
  const nodeModulesPath = getNodeModulesPath();
  const workingDir = getWorkingDirectory();

  // Use fork instead of spawn - this works better for Node.js scripts in Electron
  const child = fork(
    scriptPath,
    ['--input', inputPath, '--format', format],
    {
      silent: true, // Capture stdout/stderr
      cwd: workingDir, // Set working directory for proper module resolution
      env: {
        ...process.env,
        NODE_ENV: 'production',
        NODE_PATH: nodeModulesPath, // Add node_modules to module search path
      },
    },
  );

  let outputBuffer = '';
  let errorBuffer = '';

  // Handle stdout data - emit real-time updates
  if (child.stdout) {
    child.stdout.on('data', (data) => {
      const text = data.toString();
      outputBuffer += text;

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
    const msg = `Failed to start optimization process: ${error.message}`;
    event.sender.send('optimize-log', `ERROR: ${msg}`);
    event.sender.send('optimize-complete', {
      success: false,
      exitCode: -1,
    });
    reject(new Error(msg));
  });
}));
