require('dotenv').config();
const { App } = require('@slack/bolt');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const videoHelper = require('./videoHelper');

// Create upload directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Configure file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Check if the file is a video
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  }
});

// Initialize the Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

// Express server for file uploads
const server = express();
const PORT = process.env.PORT || 3000;

server.use(express.json());
server.use(express.static('public'));
server.use('/output', express.static('output'));

// Listen for video uploads in Slack
app.message(/.*/, async ({ message, say }) => {
  try {
    // Check if message contains a file that is a video
    if (message.files && message.files.some(file => file.mimetype && file.mimetype.startsWith('video/'))) {
      const videoFile = message.files.find(file => file.mimetype && file.mimetype.startsWith('video/'));
      
      await say({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "I noticed you uploaded a video! What would you like to do with it?"
            }
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Resize"
                },
                value: `resize_${videoFile.id}`,
                action_id: "resize_video"
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Convert to Vertical"
                },
                value: `vertical_${videoFile.id}`,
                action_id: "convert_vertical"
              }
            ]
          }
        ]
      });
    }
  } catch (error) {
    console.error(error);
  }
});

// Handle resize action
app.action('resize_video', async ({ body, ack, say }) => {
  await ack();
  const videoId = body.actions[0].value.replace('resize_', '');
  
  await say({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Select a size to resize the video:"
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "720p"
            },
            value: `720p_${videoId}`,
            action_id: "resize_720p"
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "1080p"
            },
            value: `1080p_${videoId}`,
            action_id: "resize_1080p"
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "480p"
            },
            value: `480p_${videoId}`,
            action_id: "resize_480p"
          }
        ]
      }
    ]
  });
});

// Handle resize to specific size
const handleResize = async ({ body, ack, say, client, size }) => {
  await ack();
  const parts = body.actions[0].value.split('_');
  const videoId = parts[1];
  
  let width, height;
  switch(size) {
    case '720p':
      width = 1280;
      height = 720;
      break;
    case '1080p':
      width = 1920;
      height = 1080;
      break;
    case '480p':
      width = 854;
      height = 480;
      break;
    default:
      width = 1280;
      height = 720;
  }
  
  await say(`I'll start resizing your video to ${size}. This may take a moment...`);
  
  try {
    // Get the file information
    const fileInfo = await client.files.info({
      file: videoId
    });
    
    if (fileInfo.file && fileInfo.file.url_private) {
      // Download the file
      const fileName = `original_${Date.now()}_${fileInfo.file.name}`;
      const downloadedFilePath = await videoHelper.downloadFile(
        fileInfo.file.url_private, 
        process.env.SLACK_BOT_TOKEN, 
        fileName
      );
      
      // Resize the video
      const resizedFilePath = await videoHelper.resizeVideo(downloadedFilePath, width, height);
      
      // Upload the resized video back to Slack
      await client.files.upload({
        channels: body.channel.id,
        initial_comment: `Here's your video resized to ${size}:`,
        file: fs.createReadStream(resizedFilePath)
      });
      
      // Clean up files
      videoHelper.cleanupFile(downloadedFilePath);
      // Keep output files for a while, clean them up in a scheduled job
    }
  } catch (error) {
    console.error('Error processing video:', error);
    await say(`Sorry, I couldn't resize the video: ${error.message}`);
  }
};

app.action('resize_720p', async (args) => handleResize({ ...args, size: '720p' }));
app.action('resize_1080p', async (args) => handleResize({ ...args, size: '1080p' }));
app.action('resize_480p', async (args) => handleResize({ ...args, size: '480p' }));

// Handle vertical conversion action
app.action('convert_vertical', async ({ body, ack, say, client }) => {
  await ack();
  const videoId = body.actions[0].value.replace('vertical_', '');
  
  await say("I'll start converting your video to vertical format. This may take a moment...");
  
  try {
    // Get the file information
    const fileInfo = await client.files.info({
      file: videoId
    });
    
    if (fileInfo.file && fileInfo.file.url_private) {
      // Download the file
      const fileName = `original_${Date.now()}_${fileInfo.file.name}`;
      const downloadedFilePath = await videoHelper.downloadFile(
        fileInfo.file.url_private, 
        process.env.SLACK_BOT_TOKEN, 
        fileName
      );
      
      // Convert to vertical
      const verticalFilePath = await videoHelper.convertToVertical(downloadedFilePath);
      
      // Upload back to Slack
      await client.files.upload({
        channels: body.channel.id,
        initial_comment: "Here's your video converted to vertical format:",
        file: fs.createReadStream(verticalFilePath)
      });
      
      // Clean up files
      videoHelper.cleanupFile(downloadedFilePath);
      // Keep output files for a while, clean them up in a scheduled job
    }
  } catch (error) {
    console.error('Error converting video:', error);
    await say(`Sorry, I couldn't convert the video: ${error.message}`);
  }
});

// Start the app
(async () => {
  await app.start();
  console.log('⚡️ Bolt app is running!');
  
  server.listen(PORT, () => {
    console.log(`Express server is running on port ${PORT}`);
  });
})(); 