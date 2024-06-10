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
    const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dtjohf0uv/image/upload';
    const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

    axios.post(CLOUDINARY_URL, {
        file: imageDataUrl,
        upload_preset: CLOUDINARY_UPLOAD_PRESET
    })
    .then(response => {
        console.log('Image uploaded successfully:', response.data);
    })
    .catch(error => {
        console.error('Error uploading image:', error);
    });
}
