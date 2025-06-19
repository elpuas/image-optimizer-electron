const {
  app, BrowserWindow, ipcMain, dialog,
} = require('electron');
const { spawn } = require('child_process');
const path = require('path');

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
    // In packaged app, scripts are in the resources directory
    return path.join(process.resourcesPath, 'app', 'scripts', 'optimize.js');
  }
  // In development, use relative path from __dirname
  return path.join(__dirname, 'scripts', 'optimize.js');
}

function getNodeExecutable() {
  if (app.isPackaged) {
    // In packaged app, use the embedded Node.js
    return process.execPath;
  }
  // In development, use the current Node.js process
  return process.execPath;
}

ipcMain.handle('optimize-images', (event, inputPath, format) => new Promise((resolve, reject) => {
  // Get the correct paths for packaged vs development
  const scriptPath = getScriptPath();
  const nodeExecutable = getNodeExecutable();

  // Spawn the child process
  const child = spawn(
    nodeExecutable,
    [scriptPath, '--input', inputPath, '--format', format],
    {
      stdio: ['ignore', 'pipe', 'pipe'], // stdin ignored, capture stdout and stderr
    },
  );

  let outputBuffer = '';
  let errorBuffer = '';

  // Handle stdout data - emit real-time updates
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

  // Handle stderr data - emit real-time error updates
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

  // Handle process completion
  child.on('close', (code) => {
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
