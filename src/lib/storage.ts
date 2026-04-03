import { supabase } from './supabase';

/**
 * Local Storage Helper for Persistence
 */
export const storage = {
  get: <T>(key: string): T | null => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  },
  set: (key: string, value: any): void => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
  clear: (): void => {
    localStorage.clear();
  },
};

/**
 * Uploads a file to Supabase Storage
 * @param bucket - The name of the bucket (e.g., 'pos-g-assets')
 * @param path - The path within the bucket (e.g., 'products/apple.jpg')
 * @param file - The File object to upload
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(bucket: string, path: string, file: File): Promise<string | null> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (err) {
    console.error(`Error uploading file to ${bucket}:`, err);
    return null;
  }
}

/**
 * Deletes a file from Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`Error deleting file from ${bucket}:`, err);
    return false;
  }
}
