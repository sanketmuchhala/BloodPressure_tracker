import imageCompression from 'browser-image-compression';

/**
 * Compress image before OCR and upload
 * - Max dimension: 1280px on longest side
 * - Output: JPEG format
 * - Quality: 0.7 (balance between file size and OCR readability)
 * - Uses web worker for better performance
 *
 * @param {File} file - The image file to compress
 * @returns {Promise<Blob>} - Compressed image blob
 */
export async function compressImage(file) {
  if (!file) {
    throw new Error('No file provided for compression');
  }

  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }

  const options = {
    maxSizeMB: 1,                    // Max file size in MB
    maxWidthOrHeight: 1280,           // Max dimension (width or height)
    useWebWorker: true,               // Use web worker for better performance
    fileType: 'image/jpeg',           // Output as JPEG
    initialQuality: 0.7,              // Quality setting (0.7 = good balance)
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log('Image compressed:', {
      originalSize: (file.size / 1024).toFixed(2) + ' KB',
      compressedSize: (compressedFile.size / 1024).toFixed(2) + ' KB',
      reduction: (((file.size - compressedFile.size) / file.size) * 100).toFixed(1) + '%'
    });

    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
}

/**
 * Convert File or Blob to data URL for preview
 *
 * @param {File|Blob} file - The file to convert
 * @returns {Promise<string>} - Data URL string
 */
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
