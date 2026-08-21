const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

export function cloudinaryConfigured() {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

export function getCloudinaryConfig() {
  return { cloudName: CLOUD_NAME, uploadPreset: UPLOAD_PRESET };
}

function validateFile(file, kind) {
  if (!file) throw new Error('Please select a file.');

  const allowed = kind === 'aadhaar'
    ? ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    : ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowed.includes(file.type)) {
    throw new Error(kind === 'aadhaar'
      ? 'Aadhaar must be JPG, PNG, WEBP or PDF.'
      : 'Only JPG, PNG or WEBP images are allowed.');
  }

  const maxMb = kind === 'aadhaar' ? 10 : 5;
  if (file.size > maxMb * 1024 * 1024) {
    throw new Error(`${kind === 'photo' ? 'Photo' : 'File'} must be smaller than ${maxMb} MB.`);
  }
}

export async function uploadToCloudinary(file, folder, kind = 'image') {
  if (!cloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env and redeploy.');
  }

  validateFile(file, kind);

  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', UPLOAD_PRESET);
  body.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: 'POST', body }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.secure_url) {
    throw new Error(data?.error?.message || 'Cloudinary upload failed.');
  }

  return data.secure_url;
}
