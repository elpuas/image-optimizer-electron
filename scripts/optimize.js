#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Try to resolve sharp module in different ways for packaged apps
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  // Try alternative resolution paths for packaged apps
  const possibleSharpPaths = [
    path.join(process.cwd(), 'node_modules', 'sharp'),
    path.join(__dirname, '..', 'node_modules', 'sharp'),
    path.join(__dirname, '..', '..', 'node_modules', 'sharp'),
    path.join(__dirname, '..', '..', 'app.asar.unpacked', 'node_modules', 'sharp'),
  ];

  if (process.env.NODE_PATH) {
    possibleSharpPaths.unshift(path.join(process.env.NODE_PATH, 'sharp'));
  }

  for (const sharpPath of possibleSharpPaths) {
    if (fs.existsSync(sharpPath)) {
      try {
        sharp = require(sharpPath);
        break;
      } catch (loadError) {
        // Continue trying other paths
      }
    }
  }

  if (!sharp) {
    console.error('❌ Could not load sharp module from any location');
    process.exit(1);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / (k ** i)).toFixed(2))} ${sizes[i]}`;
}

// Parse command line arguments
const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const formatIndex = args.indexOf('--format');

if (inputIndex === -1 || inputIndex + 1 >= args.length) {
  console.error('❌ Error: --input argument is required');
  process.exit(1);
}

if (formatIndex === -1 || formatIndex + 1 >= args.length) {
  console.error('❌ Error: --format argument is required');
  process.exit(1);
}

const inputPath = args[inputIndex + 1];
const format = args[formatIndex + 1];

const supportedFormats = ['webp', 'jpeg', 'png', 'original'];
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'];

if (!supportedFormats.includes(format)) {
  const msg = `❌ Error: Unsupported format "${format}". `
    + `Supported: ${supportedFormats.join(', ')}`;
  console.error(msg);
  process.exit(1);
}

// Validate input path
if (!fs.existsSync(inputPath)) {
  console.error(`❌ Error: Input path "${inputPath}" does not exist`);
  process.exit(1);
}

const stat = fs.statSync(inputPath);
if (!stat.isDirectory()) {
  console.error(`❌ Error: Input path "${inputPath}" is not a directory`);
  process.exit(1);
}

async function processImageFile(file, sourceDir, outputDir, targetFormat) {
  const inputFile = path.join(sourceDir, file);
  const ext = path.extname(file);
  const baseName = path.basename(file, ext);

  let outputFile;
  let sharpInstance = sharp(inputFile);

  // Apply format conversion
  switch (targetFormat) {
  case 'webp':
    outputFile = path.join(outputDir, `${baseName}.webp`);
    sharpInstance = sharpInstance.webp({ quality: 80 });
    break;
  case 'jpeg':
    outputFile = path.join(outputDir, `${baseName}.jpg`);
    sharpInstance = sharpInstance.jpeg({ quality: 85 });
    break;
  case 'png':
    outputFile = path.join(outputDir, `${baseName}.png`);
    sharpInstance = sharpInstance.png({ compressionLevel: 9 });
    break;
  case 'original':
  default:
    outputFile = path.join(outputDir, `${baseName}_optimized${ext}`);
    // Apply format-specific optimization based on original format
    if (ext.toLowerCase() === '.jpg' || ext.toLowerCase() === '.jpeg') {
      sharpInstance = sharpInstance.jpeg({ quality: 85 });
    } else if (ext.toLowerCase() === '.png') {
      sharpInstance = sharpInstance.png({ compressionLevel: 9 });
    } else if (ext.toLowerCase() === '.webp') {
      sharpInstance = sharpInstance.webp({ quality: 80 });
    }
    break;
  }

  // Get original file size
  const originalStats = fs.statSync(inputFile);
  const originalSize = originalStats.size;

  // Process and save the image
  await sharpInstance.toFile(outputFile);

  // Get optimized file size
  const optimizedStats = fs.statSync(outputFile);
  const optimizedSize = optimizedStats.size;
  const savings = (((originalSize - optimizedSize) / originalSize) * 100).toFixed(1);

  const message = `✅ ${file} → ${path.basename(outputFile)} `
    + `(${formatBytes(originalSize)} → ${formatBytes(optimizedSize)}, ${savings}% reduction)`;
  console.log(message);

  return { success: true };
}

async function optimizeImages() {
  try {
    // Create output directory
    const outputPath = path.join(inputPath, 'optimized');
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }

    // Find all image files
    const files = fs.readdirSync(inputPath);
    const imageFiles = files.filter((file) => imageExtensions.includes(path.extname(file).toLowerCase()));

    if (imageFiles.length === 0) {
      console.log('⚠️  No image files found in the selected folder');
      return;
    }

    let processed = 0;
    let errors = 0;

    // Process files sequentially to avoid overwhelming the system
    /* eslint-disable no-await-in-loop */
    for (const file of imageFiles) {
      try {
        await processImageFile(file, inputPath, outputPath, format);
        processed += 1;
      } catch (error) {
        console.error(`❌ Error processing ${file}: ${error.message}`);
        errors += 1;
      }
    }
    /* eslint-enable no-await-in-loop */

    console.log('\n🎉 Optimization complete!');
    console.log(`✅ Successfully processed: ${processed} files`);
    if (errors > 0) {
      console.log(`❌ Errors: ${errors} files`);
    }
    console.log(`📁 Output folder: ${outputPath}`);

    exitWithMessage(0, '\n🎉 Optimization complete!\n✅ Successfully processed: ' + processed + ' files' + (errors > 0 ? '\n❌ Errors: ' + errors + ' files' : '') + '\n📁 Output folder: ' + outputPath);
  } catch (error) {
    exitWithMessage(1, `❌ Fatal error: ${error.message}`);
  }
}

// Start the optimization process
optimizeImages();
