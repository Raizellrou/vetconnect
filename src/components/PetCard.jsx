import React, { useState } from 'react';
import { Upload, File, FileText, Image, Download, Trash2, Eye, X, Loader, AlertCircle } from 'lucide-react';
import { useCollection } from '../hooks/useCollection';
import { uploadPetFile, deletePetFile } from '../lib/petMutations';
import Toast from './Toast';
import styles from './PetCard.module.css';

export default function PetCard({ pet, userId, onEdit, isClinicView = false, canUpload = false }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Real-time files listener for this specific pet
  const {
    docs: files = [],
    loading: filesLoading,
    error: filesError
  } = useCollection(
    userId && pet?.id ? `users/${userId}/pets/${pet.id}/files` : null
  );

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      await uploadPetFile(userId, pet.id, file);
      setToast({ message: 'File uploaded successfully!', type: 'success' });
      e.target.value = ''; // Reset input
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!fileId) return;

    setIsDeleting(true);
    try {
      await deletePetFile(userId, pet.id, fileId);
      setDeleteConfirm(null);
      setToast({ message: 'File deleted successfully!', type: 'success' });
    } catch (error) {
      console.error('Error deleting file:', error);
      setToast({ message: 'Failed to delete file. Please try again.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <File size={20} />;
    
    if (fileType.startsWith('image/')) return <Image size={20} color="#10b981" />;
    if (fileType.includes('pdf')) return <FileText size={20} color="#ef4444" />;
    
    return <File size={20} color="#6b7280" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className={styles.petCard}>
      {/* Sticky Header */}
      <div className={styles.petCardHeader}>
        <div className={styles.petInfo}>
          <h3 className={styles.petName}>{pet.name || pet.pet_name}</h3>
          <p className={styles.petDetails}>
            {pet.species} • {pet.breed || 'Mixed'} • {pet.gender}
          </p>
        </div>
        <button
          onClick={() => onEdit(pet)}
          className={styles.editBtn}
        >
          Edit
        </button>
      </div>

      {/* Pet Details Section */}
      <div className={styles.petCardBody}>
        <div className={styles.detailsSection}>
          {pet.dob && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Date of Birth:</span>
              <span className={styles.detailValue}>{formatDate(pet.dob)}</span>
            </div>
          )}
          {pet.weightKg && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Weight:</span>
              <span className={styles.detailValue}>{pet.weightKg} kg</span>
            </div>
          )}
          {pet.notes && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Notes:</span>
              <span className={styles.detailValue}>{pet.notes}</span>
            </div>
          )}
        </div>

        {/* Files Section */}
        <div className={styles.filesSection}>
          <div className={styles.filesSectionHeader}>
            <h4 className={styles.filesSectionTitle}>Medical Records & Files</h4>
            {canUpload && (
              <label className={styles.uploadBtn}>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  style={{ display: 'none' }}
                />
                {uploading ? (
                  <>
                    <Loader size={16} className={styles.spinner} />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Upload File</span>
                  </>
                )}
              </label>
            )}
          </div>

          {uploadError && (
            <div className={styles.errorMessage}>
              <AlertCircle size={16} />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Files List */}
          {filesLoading && (
            <div className={styles.loadingState}>
              <Loader size={24} className={styles.spinner} />
              <p>Loading files...</p>
            </div>
          )}

          {filesError && (
            <div className={styles.errorState}>
              <AlertCircle size={24} />
              <p>Error loading files</p>
            </div>
          )}

          {!filesLoading && !filesError && files.length === 0 && (
            <div className={styles.emptyState}>
              <FileText size={48} color="#d1d5db" />
              <p>No files uploaded yet</p>
              <p className={styles.emptySubtext}>
                Upload medical records, prescriptions, or vaccination certificates
              </p>
            </div>
          )}

          {!filesLoading && !filesError && files.length > 0 && (
            <div className={styles.filesList}>
              {files.map((file) => (
                <div key={file.id} className={styles.fileItem}>
                  <div className={styles.fileIcon}>
                    {getFileIcon(file.type)}
                  </div>
                  <div className={styles.fileDetails}>
                    <p className={styles.fileName}>{file.name}</p>
                    <p className={styles.fileMetadata}>
                      {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                  <div className={styles.fileActions}>
                    <button
                      onClick={() => window.open(file.downloadURL, '_blank')}
                      className={styles.fileActionBtn}
                      title="View file"
                    >
                      <Eye size={18} />
                    </button>
                    <a
                      href={file.downloadURL}
                      download={file.name}
                      className={styles.fileActionBtn}
                      title="Download file"
                    >
                      <Download size={18} />
                    </a>
                    {canUpload && (
                      <button
                        onClick={() => setDeleteConfirm(file.id)}
                        className={styles.fileActionBtn}
                        title="Delete file"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Delete File</h3>
              <button onClick={() => setDeleteConfirm(null)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Are you sure you want to delete this file? This action cannot be undone.</p>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => setDeleteConfirm(null)}
                className={styles.cancelBtn}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteFile(deleteConfirm)}
                className={styles.deleteBtn}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader size={16} className={styles.spinner} />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
