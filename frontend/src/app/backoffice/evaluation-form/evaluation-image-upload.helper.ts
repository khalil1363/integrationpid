/**
 * Helper for evaluation image upload: read selected file as Data URL
 * and return it for storing in the form (imageUrl). The uploaded photo
 * is kept as a File reference in the component; this file provides the
 * conversion to a storable string (base64 data URL).
 */
export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image (e.g. JPG, PNG)'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const ACCEPTED_IMAGE_TYPES = 'image/*';
