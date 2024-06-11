const fileInput = document.getElementById('file-input');
const takePhotoButton = document.getElementById('take-photo');
const message = document.getElementById('message');

takePhotoButton.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
        uploadToCloudinary(file);
    }
});

function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'wpm2bh30');

    axios.post('https://api.cloudinary.com/v1_1/dsxokywuo/image/upload', formData)
        .then(response => {
            console.log('Image uploaded successfully:', response.data);
            message.textContent = 'Thanks for sharing, we have received the image!';
        })
        .catch(error => {
            console.error('Error uploading image:', error);
            message.textContent = 'Error uploading image. Please try again.';
        });
}
