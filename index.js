const express = require('express');
const app = express();
const fs = require('fs');
const ytdl = require('ytdl-core');
const bodyParser = require('body-parser');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const port = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));

// Parse JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define the folder path for storing audio files
const audioFolderPath = path.join(__dirname, 'audio_files');

// Ensure the audio_files folder exists
if (!fs.existsSync(audioFolderPath)) {
  fs.mkdirSync(audioFolderPath);
}

// Route to handle video download
app.post('/download', async (req, res) => {
  const { url } = req.body;

  try {
    const video = ytdl(url, { filter: 'audioonly' }); // Extract audio only
    const audioFilePath = path.join(audioFolderPath, 'audio.mp4');
    video.pipe(fs.createWriteStream(audioFilePath));

    video.on('end', () => {
      console.log('Audio download completed!');
      res.status(200).json({ success: true, message: 'Video downloaded successfully' });
    });

    video.on('error', (error) => {
      console.error('Error downloading audio:', error);
      res.status(500).json({ success: false, error: 'Failed to download audio!' });
    });
  } catch (error) {
    console.error('Error downloading audio:', error);
    res.status(500).json({ success: false, error: 'Failed to download audio!' });
  }
});

// Route to handle conversion to FLAC
app.post('/convert', async (req, res) => {
  try {
    const { url } = req.body;
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\x00-\x7F]/g, ""); // Remove non-ASCII characters from the title
    const audioFilePath = path.join(audioFolderPath, 'audio.mp4');
    const convertedFilePath = path.join(audioFolderPath, `${title}.flac`);

    ffmpeg(audioFilePath)
      .audioCodec('flac')
      .outputOptions('-vn')
      .save(convertedFilePath)
      .on('end', () => {
        console.log('Conversion to FLAC completed!');
        fs.unlink(audioFilePath, (err) => {
          if (err) {
            console.error('Error deleting MP4 file:', err);
          } else {
            console.log('MP4 file deleted successfully');
          }
        });
        res.status(200).json({ success: true, message: 'Conversion to FLAC completed successfully', title: title });
      })
      .on('error', (err) => {
        console.error('Error converting to FLAC:', err);
        res.status(500).json({ success: false, error: 'Failed to convert to FLAC!' });
      });
  } catch (error) {
    console.error('Error converting to FLAC:', error);
    res.status(500).json({ success: false, error: 'Failed to convert to FLAC!' });
  }
});

// Route to handle FLAC file download
app.get('/download/:title', (req, res) => {
  const title = req.params.title;
  const filePath = path.join(__dirname, 'audio_files', `${title}.flac`);
  res.download(filePath, `${title}.flac`, (err) => {
    if (err) {
      console.log('Process finished.');
    } else {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting FLAC file:', err);
        } else {
          console.log('FLAC file deleting...');
        }
      });
    }
  });
});

// Route to handle page refresh and delete all files from the audio_files folder
app.get('/refresh', (req, res) => {
  const folderPath = path.join(__dirname, 'audio_files');
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        } else {
          console.log('File deleted successfully:', filePath);
        }
      });
    });
  });
  res.send('All files deleted');
});

// Starts the server
app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});
