import { api } from '../api/axios';

type UploadPurpose = 'post' | 'stream-recording';
type UploadResourceType = 'auto' | 'image' | 'video' | 'raw';

type UploadMediaPayload = {
  file: File | Blob;
  fileName?: string;
  purpose?: UploadPurpose;
  resourceType?: UploadResourceType;
};

type UploadedMedia = {
  secureUrl: string;
  publicId: string;
  bytes: number;
  duration?: number;
  resourceType: string;
  format?: string;
};

async function toBase64(file: File | Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Unable to read media file'));
    reader.readAsDataURL(file);
  });
}

export function useMediaUpload() {
  const uploadMedia = async (payload: UploadMediaPayload) => {
    const base64Data = await toBase64(payload.file);
    const mimeType =
      ('type' in payload.file && payload.file.type) || 'application/octet-stream';
    const fileName =
      payload.fileName ||
      ('name' in payload.file ? payload.file.name : `upload-${Date.now()}`);

    const { data } = await api.post<UploadedMedia>('/media/upload', {
      fileName,
      mimeType,
      base64Data,
      purpose: payload.purpose ?? 'post',
      resourceType: payload.resourceType ?? 'auto',
    });

    return data;
  };

  return {
    uploadMedia,
  };
}
