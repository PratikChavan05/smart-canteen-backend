import React, { useState, useRef, useEffect } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { resolveMenuImageUrl, MENU_IMAGE_PLACEHOLDER } from '../../utils/images';

function extractUploadUrl(responseData) {
  if (!responseData) return '';
  if (typeof responseData === 'string') return responseData;
  if (typeof responseData.url === 'string') return responseData.url;
  return '';
}

export default function ImageUpload({ value = '', onChange, folder = 'menu-items' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(() =>
    typeof value === 'string' ? resolveMenuImageUrl(value) || value || '' : ''
  );
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (typeof value === 'string') {
      setPreview(resolveMenuImageUrl(value) || value || '');
    }
  }, [value]);

  const handleFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPEG, PNG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB', 'error');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await api.upload('/storage/upload', formData);
      const uploadedPath = extractUploadUrl(res.data);
      if (!uploadedPath) {
        throw new Error('Upload succeeded but no image path was returned');
      }
      setPreview(resolveMenuImageUrl(uploadedPath) || uploadedPath);
      onChange(uploadedPath);
      showToast('Image uploaded successfully', 'success');
    } catch (err) {
      console.warn('Storage upload error:', err);
      setPreview(typeof value === 'string' ? resolveMenuImageUrl(value) || value || '' : '');
      showToast(err.message || 'Image upload failed. You can still save the item without an image.', 'warning');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearImage = (e) => {
    e.stopPropagation();
    onChange('');
    setPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
        Item Image (optional)
      </label>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-teal-600 bg-teal-50'
            : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />

        {preview ? (
          <div className="flex items-center gap-4">
            <img
              src={preview}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-sm"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = MENU_IMAGE_PLACEHOLDER;
              }}
            />
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {uploading ? 'Uploading...' : 'Image selected'}
              </p>
              <p className="text-[11px] text-slate-500">Click or drop to replace</p>
            </div>
            {uploading ? (
              <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <button
                type="button"
                onClick={clearImage}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="py-2">
            <ImagePlus className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-slate-600">
              {uploading ? 'Uploading...' : 'Drag & drop image or click to browse'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, WebP up to 5MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
