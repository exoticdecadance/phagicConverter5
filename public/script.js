document.addEventListener('DOMContentLoaded', () => {
  const downloadForm = document.getElementById('downloadForm');
  const convertBtn = document.querySelector('.convert-btn');

  // Adds event listener to "submit" so we can detect when the URL from the form is sent.
  downloadForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevents the page from being reloaded.
    convertBtn.disabled = true;

    // Grabs the URL from the form.
    const videoUrl = document.getElementById('videoUrl').value;

    try {
      // fetch request for /download, which downloads the YT video.
      const downloadResponse = await fetch('/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: videoUrl })
      });

      if (!downloadResponse.ok) {
        console.error('Failed to start video download');
        showMessage('Please input in a valid YouTube video URL.', 'error');
        showMessage('Refresh the page! ;(', 'error');
        return;
      }

      console.log('Video download started successfully');
      showMessage('Audio downloaded successfully!', 'success');

      // Once the video is downloaded successfully, initiate the conversion
      const convertResponse = await fetch('/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: videoUrl })
      });

      if (convertResponse.ok) {
        console.log('Conversion to FLAC completed');
        showMessage('Conversion to FLAC completed!!', 'success');

        const result = await convertResponse.json();
        const title = result.title;

        // Show download link
        const downloadLinkContainer = document.getElementById('downloadLinkContainer');
        downloadLinkContainer.style.display = 'block';

        // Set the download link
        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = `/download/${encodeURIComponent(title)}`;
        downloadLink.setAttribute('download', `${title}.flac`);
        downloadLink.addEventListener('click', () => {
          window.location.reload();  // This will reload the page after the download link is clicked.
        });

        // Display message for download ready
        showMessage('Your file is ready for download!!!', 'info');
      } else {
        console.error('Failed to convert to FLAC(');
        showMessage('Tragically, your video has failed to convert to FLAC!! >;(', 'error');
        // Optionally, display an error message to the user
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('An error occurred', 'error');
      // Display an error message to the user
    }
  });

  // Function to display messages
  function showMessage(message, type) {
    const messageContainer = document.getElementById('messageContainer');
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.classList.add(type); // Add class for styling
    messageContainer.appendChild(messageElement);
  }
  
// Deleting all files from the audio_files folder when the page refreshes
  const deleteFiles = async () => {
    try {
      const response = await fetch('/refresh');
      if (!response.ok) {
        console.error('Failed to delete files');
      } else {
        console.log('Files deleted successfully');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Handle page refresh
  window.addEventListener('beforeunload', deleteFiles);

  // Handle page close
  window.addEventListener('unload', () => {
    deleteFiles();
  });
});