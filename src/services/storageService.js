import supabase from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB (Supabase free-tier per-file cap)

/**
 * Storage Service
 * Uploads post/comment media to Supabase Storage public buckets.
 * File paths are namespaced by user id: "<userId>/<timestamp>-<uuid>.<ext>"
 * so storage RLS policies can enforce ownership.
 */
class StorageService {
  constructor() {
    this.POST_BUCKET = 'post_media';
    this.COMMENT_BUCKET = 'comment_media';
    this.IMAGE_TYPES = IMAGE_TYPES;
    this.VIDEO_TYPES = VIDEO_TYPES;
    this.MAX_IMAGE_BYTES = MAX_IMAGE_BYTES;
    this.MAX_VIDEO_BYTES = MAX_VIDEO_BYTES;
  }

  validateImage(file) {
    if (!IMAGE_TYPES.includes(file.type)) return 'imgBadType';
    if (file.size > MAX_IMAGE_BYTES) return 'imgTooBig';
    return null;
  }

  validateVideo(file) {
    if (!VIDEO_TYPES.includes(file.type)) return 'vidBadType';
    if (file.size > MAX_VIDEO_BYTES) return 'vidTooBig';
    return null;
  }

  buildPath(userId, file) {
    const safeName = (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${userId}/${Date.now()}-${uuidv4().slice(0, 8)}-${safeName}`;
  }

  /**
   * Upload a file and return its public URL
   */
  async uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return this.getPublicUrl(bucket, data.path);
  }

  getPublicUrl(bucket, path) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Upload a post image or video. Returns the public URL.
   */
  async uploadPostMedia(userId, file, kind) {
    const issue = kind === 'video' ? this.validateVideo(file) : this.validateImage(file);
    if (issue) {
      const err = new Error(issue);
      err.isKey = true; // caller may translate the message as an i18n key
      throw err;
    }
    return this.uploadFile(this.POST_BUCKET, this.buildPath(userId, file), file);
  }

  /**
   * Upload a comment image. Returns the public URL.
   */
  async uploadCommentMedia(userId, file) {
    const issue = this.validateImage(file);
    if (issue) {
      const err = new Error(issue);
      err.isKey = true;
      throw err;
    }
    return this.uploadFile(this.COMMENT_BUCKET, this.buildPath(userId, file), file);
  }

  /**
   * Parse "<bucket>/<path>" out of a public URL we generated earlier.
   * Returns null for foreign URLs (images hosted elsewhere).
   */
  parseOwnedUrl(url) {
    if (!url) return null;
    const marker = '/object/public/';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    const rest = url.slice(idx + marker.length);
    const slash = rest.indexOf('/');
    if (slash === -1) return null;
    const bucket = rest.slice(0, slash);
    if (bucket !== this.POST_BUCKET && bucket !== this.COMMENT_BUCKET) return null;
    return { bucket, path: rest.slice(slash + 1) };
  }

  /**
   * Best-effort removal of a previously uploaded file (used when media
   * is replaced or removed during post edit). Never throws.
   */
  async removeByUrl(url) {
    try {
      const parsed = this.parseOwnedUrl(url);
      if (!parsed) return;
      await supabase.storage.from(parsed.bucket).remove([parsed.path]);
    } catch (err) {
      console.warn('Failed to remove old media file:', err);
    }
  }
}

export const storageService = new StorageService();
