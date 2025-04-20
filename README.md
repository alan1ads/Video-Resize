# Slack Video Resizer Bot

A Slack bot that helps users resize and convert videos directly in Slack. Upload a video, and the bot will give you options to resize it to common resolutions or convert horizontal videos to vertical format.

## Features

- Resize videos to common resolutions (720p, 1080p, 480p)
- Convert horizontal videos to vertical format
- Seamless integration with Slack's interface
- Simple, user-friendly interaction

## Requirements

- Node.js 14.x or higher
- FFmpeg installed on your server
- A Slack workspace with permission to add apps

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/slack-video-resizer.git
   cd slack-video-resizer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Install FFmpeg (if not already installed):
   - On Ubuntu/Debian: `sudo apt-get install ffmpeg`
   - On macOS: `brew install ffmpeg`
   - On Windows: Download from [FFmpeg.org](https://ffmpeg.org/download.html)

4. Create a Slack app:
   - Go to [api.slack.com/apps](https://api.slack.com/apps)
   - Click "Create New App" and choose "From scratch"
   - Name your app and select your workspace
   - Under "Basic Information", note your "Signing Secret"

5. Set up app permissions:
   - Go to "Socket Mode" and enable it (this will generate your App Token)
   - Go to "OAuth & Permissions" and add the following Bot Token Scopes:
     - `chat:write`
     - `files:read`
     - `files:write`
   - Install the app to your workspace
   - Copy the Bot User OAuth Token

6. Set up event subscriptions:
   - Go to "Event Subscriptions" and enable events
   - Subscribe to bot events: `message.im`, `message.groups`, `message.channels`

7. Create a `.env` file in the project root with the following:
   ```
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_SIGNING_SECRET=your-signing-secret
   SLACK_APP_TOKEN=xapp-your-app-token
   PORT=3000
   ```

8. Start the app:
   ```
   npm start
   ```

## How to Use

1. Add the bot to a channel in your Slack workspace
2. Upload a video to the channel
3. The bot will respond with options to resize the video or convert it to vertical
4. Select your desired option
5. Wait for processing to complete
6. The bot will upload the processed video back to the channel

## Technical Details

The bot uses:
- [Slack Bolt JS](https://slack.dev/bolt-js/concepts) for Slack integration
- [FFmpeg](https://ffmpeg.org/) for video processing
- [Express](https://expressjs.com/) for the web server

## Limitations

- Video file size is limited by Slack's file upload limits
- Processing time depends on the video size and server capacity
- The bot needs to be able to write temporary files to disk

## License

MIT 