const startCameraButton = document.getElementById('start-camera');
const video = document.getElementById('camera-stream');
const canvas = document.getElementById('capture-canvas');
const takePhotoButton = document.getElementById('take-photo');

startCameraButton.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.style.display = 'block';
        takePhotoButton.style.display = 'block';
    } catch (error) {
        console.error('Error accessing the camera', error);
    }
});

takePhotoButton.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    video.srcObject.getTracks().forEach(track => track.stop()); // Stop the video stream

    const imageDataUrl = canvas.toDataURL('image/png');
    uploadToCloudinary(imageDataUrl);
});

function uploadToCloudinary(imageDataUrl) {
    const blob = dataURLToBlob(imageDataUrl);
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', 'yvs77n6j');
    formData.append("tags", "browser_upload"); // Optional - add tag for image admin in Cloudinary
    const config = {
      headers: { "X-Requested-With": "XMLHttpRequest" },
    };
    axios.post(`https://api.cloudinary.com/v1_1/dtjohf0uv/image/upload`, formData)
    .then(response => {
        console.log('Image uploaded successfully:', response.data);
    })
    .catch(error => {
        console.error('Error uploading image:', error);
    });
}

function dataURLToBlob(dataURL) {
    const parts = dataURL.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}
