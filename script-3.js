const startCameraButton = document.getElementById('start-camera');
const takePhotoButton = document.getElementById('take-photo');
const fileInput = document.getElementById('file-input');
const message = document.getElementById('message');
const video = document.getElementById('camera-stream');
const canvas = document.getElementById('capture-canvas');
const uploadedImage = document.getElementById('uploaded-image');
const uploadAnotherButton = document.getElementById('upload-another');

startCameraButton.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
        message.textContent = 'Uploading...';
        uploadToCloudinary(file);
    }
});

takePhotoButton.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    video.srcObject.getTracks().forEach(track => track.stop()); // Stop the video stream

    const imageDataUrl = canvas.toDataURL('image/png');
    const blob = dataURLToBlob(imageDataUrl);
    message.textContent = 'Uploading...';
    uploadToCloudinary(blob);
});

uploadAnotherButton.addEventListener('click', () => {
    message.textContent = '';
    uploadedImage.src = '';
    uploadedImage.style.display = 'none';
    fileInput.value = '';
    startCameraButton.style.display = 'inline';
    takePhotoButton.style.display = 'inline';
    video.style.display = 'inline';
});

function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'wpm2bh30');

    axios.post('https://api.cloudinary.com/v1_1/dsxokywuo/image/upload', formData)
        .then(response => {
            console.log('Image uploaded successfully:', response.data);
            message.textContent = 'Thanks for helping us with this memory!';
            uploadedImage.src = response.data.secure_url;
            uploadedImage.style.display = 'block';
            startCameraButton.style.display = 'none';
            takePhotoButton.style.display = 'none';
            video.style.display = 'none';
        })
        .catch(error => {
            console.error('Error uploading image:', error);
            message.textContent = 'Error uploading image. Please try again.';
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
