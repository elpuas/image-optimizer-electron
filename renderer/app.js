const selectBtn = document.getElementById('select-folder');
const folderPathEl = document.getElementById('folder-path');
const optimizeBtn = document.getElementById('optimize');
const formatSelect = document.getElementById('format');
const outputEl = document.getElementById('output');

let selectedFolder = null;

selectBtn.addEventListener('click', async () => {
  const folder = await window.api.selectFolder();
  if (folder) {
    selectedFolder = folder;
    folderPathEl.textContent = folder;
    optimizeBtn.disabled = false;
  } else {
    folderPathEl.textContent = 'No folder selected';
    optimizeBtn.disabled = true;
  }
});

// Set up real-time log listeners
window.api.onOptimizeLog((message) => {
  if (message.trim()) {
    outputEl.textContent += `${message}\n`;
    // Auto-scroll to bottom
    outputEl.scrollTop = outputEl.scrollHeight;
  }
});

window.api.onOptimizeComplete((result) => {
  // Show final completion message
  if (result.success) {
    outputEl.textContent += '\n✅ Optimization completed successfully!\n';
  } else {
    outputEl.textContent += '\n❌ Optimization failed!\n';
  }

  // Re-enable button
  optimizeBtn.disabled = false;
  optimizeBtn.textContent = 'Optimize';

  // Auto-scroll to bottom
  outputEl.scrollTop = outputEl.scrollHeight;
});

optimizeBtn.addEventListener('click', async () => {
  if (!selectedFolder) return;

  const format = formatSelect.value;

  // Disable button and show loading state
  optimizeBtn.disabled = true;
  optimizeBtn.textContent = 'Optimizing...';
  outputEl.textContent = 'Starting optimization...\n';

  try {
    // Start the optimization process (real-time updates will be handled by listeners)
    await window.api.optimizeImages(selectedFolder, format);
  } catch (error) {
    outputEl.textContent += `\n❌ Error: ${error.message}\n`;
    // Re-enable button if there's an error
    optimizeBtn.disabled = false;
    optimizeBtn.textContent = 'Optimize';
  }
});

// Clean up listeners when the page is unloaded
window.addEventListener('beforeunload', () => {
  window.api.removeOptimizeListeners();
});
