const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  optimizeImages: (inputPath, format) => ipcRenderer.invoke('optimize-images', inputPath, format),

  // Real-time log listeners
  onOptimizeLog: (callback) => {
    ipcRenderer.on('optimize-log', (event, message) => callback(message));
  },
  onOptimizeComplete: (callback) => {
    ipcRenderer.on('optimize-complete', (event, result) => callback(result));
  },

  // Clean up listeners
  removeOptimizeListeners: () => {
    ipcRenderer.removeAllListeners('optimize-log');
    ipcRenderer.removeAllListeners('optimize-complete');
  },
});
