function forceDownload(blobUrl: string, filename: string) {
  try {
    const a = document.createElement("a");
    a.download = filename;
    a.href = blobUrl;
    a.style.display = 'none'; // Hide the element
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl); // Free up memory
    }, 100);
  } catch (error) {
    console.error('Error during download:', error);
    alert('Failed to download the image. Please try again.');
  }
}

export default function downloadPhoto(url: string, filename: string) {
  try {
    // Extract filename from URL if not provided
    if (!filename) {
      filename = url.split("\\").pop().split("/").pop() || 'image.jpg';
    }

    // Sanitize filename to remove invalid characters
    filename = filename.replace(/[/\\?%*:|"<>]/g, '-');

    fetch(url, {
      headers: new Headers({
        Origin: location.origin,
      }),
      mode: "cors",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        forceDownload(blobUrl, filename);
      })
      .catch((error) => {
        console.error('Error downloading image:', error);
        alert('Failed to download the image. Please try again.');
      });
  } catch (error) {
    console.error('Error initiating download:', error);
    alert('Failed to initiate download. Please try again.');
  }
}