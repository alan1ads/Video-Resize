const fs = require('fs');
const path = require('path');
const https = require('https');
const ffmpeg = require('fluent-ffmpeg');

const tempDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

// Ensure directories exist
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

/**
 * Download a file from Slack
 * @param {string} url - The private URL of the file to download
 * @param {string} token - The Slack bot token for authentication
 * @param {string} fileName - The name to save the file as
 * @returns {Promise<string>} - Path to the downloaded file
 */
const downloadFile = (url, token, fileName) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(tempDir, fileName);
    const fileStream = fs.createWriteStream(filePath);
    
    const options = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    https.get(url, options, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file: ${response.statusCode}`));
        return;
      }
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(filePath);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file if download failed
      reject(err);
    });
  });
};

/**
 * Get the dimensions of a video file
 * @param {string} filePath - Path to the video file
 * @returns {Promise<{width: number, height: number}>} - Video dimensions
 */
const getVideoDimensions = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }
      
      resolve({
        width: videoStream.width,
        height: videoStream.height
      });
    });
  });
};

/**
 * Resize a video to specified dimensions
 * @param {string} inputPath - Path to the input video
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @returns {Promise<string>} - Path to the resized video
 */
const resizeVideo = (inputPath, width, height) => {
  const outputFileName = `resized_${width}x${height}_${path.basename(inputPath)}`;
  const outputPath = path.join(outputDir, outputFileName);
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .size(`${width}x${height}`)
      .on('end', () => {
        console.log(`Video resized to ${width}x${height}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error during video resizing:', err);
        reject(err);
      })
      .run();
  });
};

/**
 * Convert a horizontal video to vertical format
 * @param {string} inputPath - Path to the input video
 * @returns {Promise<string>} - Path to the converted video
 */
const convertToVertical = (inputPath) => {
  const outputFileName = `vertical_${path.basename(inputPath)}`;
  const outputPath = path.join(outputDir, outputFileName);
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .size('720x1280')
      // Add padding to maintain aspect ratio
      .videoFilters([
        {
          filter: 'scale',
          options: 'w=720:h=1280:force_original_aspect_ratio=decrease'
        },
        {
          filter: 'pad',
          options: '720:1280:(ow-iw)/2:(oh-ih)/2:black'
        }
      ])
      .on('end', () => {
        console.log('Video converted to vertical format');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error during video conversion:', err);
        reject(err);
      })
      .run();
  });
};

/**
 * Clean up temporary files
 * @param {string} filePath - Path to the file to delete
 */
const cleanupFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Failed to delete file ${filePath}:`, err);
    } else {
      console.log(`Deleted temporary file: ${filePath}`);
    }
  });
};

module.exports = {
  downloadFile,
  getVideoDimensions,
  resizeVideo,
  convertToVertical,
  cleanupFile
}; 