import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader, AlertCircle, Check } from 'lucide-react';
import { uploadImageToCloudinary } from '/src/utils/uploadImage';

/**
 * Reusable Image Uploader Component
 * 
 * Features:
 * - Image preview
 * - Upload progress indicator
 * - File validation (type & size)
 * - Error handling
 * - Success feedback
 * 
 * @param {Function} onUpload - Callback function that receives the Cloudinary URL
 * @param {string} currentImage - Current image URL to display (optional)
 * @param {string} label - Label for the upload button
 * @param {string} aspectRatio - CSS aspect ratio (default: '1/1')
 */
export default function ImageUploader({ 
  onUpload, 
  currentImage = null,
  label = "Upload Image",
  aspectRatio = '1/1',
  className = ''
}) {
  const [preview, setPreview] = useState(currentImage);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setError(null);
    setSuccess(false);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPG, PNG, or WebP image.');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size exceeds 5MB. Please choose a smaller image.');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setUploading(true);
    try {
      const cloudinaryUrl = await uploadImageToCloudinary(file);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Call parent callback with the URL
      if (onUpload) {
        onUpload(cloudinaryUrl);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
      setPreview(currentImage); // Revert to current image on error
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onUpload) {
      onUpload(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Image Preview Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: aspectRatio,
        borderRadius: '12px',
        overflow: 'hidden',
        background: preview ? 'transparent' : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        border: '2px dashed #d1d5db',
        cursor: uploading ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s'
      }}
      onClick={!uploading ? handleClick : undefined}>
        
        {preview ? (
          <>
            {/* Image */}
            <img
              src={preview}
              alt="Preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            
            {/* Remove Button */}
            {!uploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  padding: '8px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(8px)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                }}
              >
                <X size={20} color="white" />
              </button>
            )}

            {/* Upload Overlay */}
            {uploading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <Loader size={40} color="white" className="animate-spin" />
                <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>
                  Uploading...
                </p>
              </div>
            )}

            {/* Success Overlay */}
            {success && !uploading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(16, 185, 129, 0.9)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                <Check size={48} color="white" strokeWidth={3} />
                <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: 700 }}>
                  Uploaded Successfully!
                </p>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '20px'
          }}>
            {uploading ? (
              <>
                <Loader size={40} color="#818cf8" className="animate-spin" />
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', textAlign: 'center' }}>
                  Uploading...
                </p>
              </>
            ) : (
              <>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ImageIcon size={32} color="#818cf8" />
                </div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', textAlign: 'center' }}>
                  {label}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
                  JPG, PNG, WebP (Max 5MB)
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          marginTop: '12px',
          padding: '12px 16px',
          background: '#fee2e2',
          border: '1px solid #f87171',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={18} color="#ef4444" />
          <p style={{ fontSize: '0.875rem', color: '#991b1b', margin: 0 }}>
            {error}
          </p>
        </div>
      )}

      {/* Helper Text */}
      {!error && !uploading && (
        <p style={{
          marginTop: '8px',
          fontSize: '0.75rem',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          Click to {preview ? 'change' : 'upload'} image
        </p>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
