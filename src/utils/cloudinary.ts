import imageCompression from 'browser-image-compression';
import { auth } from '../lib/firebase';

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
export async function deleteFromCloudinary(
  url: string,
  resourceType: 'image' | 'video' = 'image',
  submissionId?: string,
  onError?: (reason: string) => void
): Promise<boolean> {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return true;
  }

  // Never delete default branding assets
  const protectedAssets = ['fbyjfjq8equle5pl7kwz', 'r5uj8nyeht88n4wqdihq'];
  if (protectedAssets.some(asset => url.includes(asset))) {
    return true;
  }

  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      const reason = 'لا يوجد تسجيل دخول صالح للأدمن أو مالك الإعلان';
      console.warn('Cloudinary deletion blocked:', reason);
      onError?.(reason);
      return false;
    }

    const response = await fetch('/api/delete-media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ url, resourceType, submissionId }),
    });
    
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success !== true) {
      const reason = data.error || data.warning || ('استجابة السيرفر رقم ' + response.status);
      console.warn('Cloudinary deletion was not confirmed:', reason, data.result || '');
      onError?.(reason);
      return false;
    }
    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'تعذر الاتصال بخدمة حذف الوسائط';
    console.warn('Cloudinary media deletion failed:', reason);
    onError?.(reason);
    return false;
  }
}
