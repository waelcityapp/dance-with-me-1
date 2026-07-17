import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file before uploading
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  };
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Compression error:', error);
    return file; // Return original if compression fails
  }
}

/**
 * Uploads a file to Cloudinary and returns the secure URL
 */
export async function uploadToCloudinary(file: File): Promise<string | null> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error('Cloudinary configuration missing in environment variables');
    throw new Error('CONFIG_MISSING');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary upload failed:', errorData);
      return null;
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
}

/**
 * Deletes a file from Cloudinary via our backend
 */
export async function deleteFromCloudinary(url: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> {
  try {
    const response = await fetch('/api/delete-media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, resourceType }),
    });
    
    if (!response.ok) {
      console.error('Failed to delete media from Cloudinary');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting media:', error);
    return false;
  }
}
