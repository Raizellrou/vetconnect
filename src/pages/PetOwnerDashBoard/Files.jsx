import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, File, FileText, Image, Video, Music, Archive, Trash2, Download, Eye, X, Loader, AlertCircle } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
<<<<<<< HEAD
import DownloadModal from '../../components/modals/DownloadModal';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';
import '../../styles/Files.css';

=======
import { useAuth } from '../../contexts/AuthContext';
>>>>>>> b46e9c861f0b7efe19f65b1b5e940c994d99d697
import { useCollection } from '../../hooks/useCollection';
import { uploadPetFile } from '../../lib/firebaseMutations';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import styles from '../../styles/Files.module.css';

export default function Files() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const displayName = userData?.fullName || userData?.displayName || userData?.email;

  // Real-time files listener
  const {
    docs: files = [],
    loading: filesLoading,
    error: filesError
  } = useCollection(
    currentUser?.uid ? `users/${currentUser.uid}/files` : null
  );

<<<<<<< HEAD
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Dummy files for display
  const [dummyFiles, setDummyFiles] = useState([
    {
      id: 'dummy-1',
      name: 'Max_Vaccination_Record.pdf',
      uploadedAt: new Date('2024-10-15'),
      size: '245 KB',
      type: 'PDF Document'
    },
    {
      id: 'dummy-2',
      name: 'Bella_Checkup_Report.pdf',
      uploadedAt: new Date('2024-11-02'),
      size: '1.2 MB',
      type: 'PDF Document'
    },
    {
      id: 'dummy-3',
      name: 'Lab_Results_2024.pdf',
      uploadedAt: new Date('2024-11-10'),
      size: '892 KB',
      type: 'PDF Document'
    }
  ]);

  const handleDownload = (record) => {
    // Show download modal
    setDownloadFileName(record.name);
    setShowDownloadModal(true);
    
    // For dummy files, simulate download
    if (record.id && record.id.startsWith('dummy-')) {
      // In a real scenario, you would trigger actual file download
      console.log('Download initiated for:', record.name);
=======
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
>>>>>>> b46e9c861f0b7efe19f65b1b5e940c994d99d697
      return;
    }

<<<<<<< HEAD
  const handleArchive = async (recordId) => {
    // archive implementation depends on your model; placeholder:
    console.log('Archiving record:', recordId);
  };

  const handleDelete = async (recordId) => {
    // Find the file
    const file = dummyFiles.find(f => f.id === recordId) || records.find(r => r.id === recordId);
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    
    setIsDeleting(true);
    
    try {
      // Check if it's a dummy file
      if (fileToDelete.id.startsWith('dummy-')) {
        setDummyFiles(prevFiles => prevFiles.filter(file => file.id !== fileToDelete.id));
        console.log('Deleted dummy file:', fileToDelete.id);
      } else {
        // For real files
        console.log('Delete requested for record:', fileToDelete.id);
        // optionally call a delete mutation if implemented
      }
    } catch (error) {
      console.error('Error deleting record:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setFileToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setFileToDelete(null);
=======
    setUploading(true);
    setUploadError('');

    try {
      await uploadPetFile(currentUser.uid, file);
      console.log('File uploaded successfully');
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
      await deleteDoc(doc(db, 'users', currentUser.uid, 'files', fileId));
      console.log('File deleted successfully');
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <File size={24} />;
    
    if (fileType.startsWith('image/')) return <Image size={24} color="#10b981" />;
    if (fileType.startsWith('video/')) return <Video size={24} color="#3b82f6" />;
    if (fileType.startsWith('audio/')) return <Music size={24} color="#8b5cf6" />;
    if (fileType.includes('pdf')) return <FileText size={24} color="#ef4444" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive size={24} color="#f59e0b" />;
    
    return <File size={24} color="#6b7280" />;
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
>>>>>>> b46e9c861f0b7efe19f65b1b5e940c994d99d697
  };

  return (
    <div className={styles.pageRoot}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />
        
        <main className={styles.content}>
          {/* Header */}
          <header className={styles.header}>
            <div>
              <div className={styles.breadcrumb}>
                <span>Files</span>
                <span className={styles.bullet}>•</span>
                <span className={styles.dateText}>
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <h2 className={styles.title}>My Files</h2>
              <p className={styles.subtitle}>Upload and manage your pet's documents and medical records</p>
            </div>

            <label className={styles.uploadBtn}>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              {uploading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Upload File
                </>
              )}
            </label>
          </header>

          {/* Upload Error */}
          {uploadError && (
            <div style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              border: '2px solid #f87171',
              borderRadius: '10px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={20} color="#dc2626" />
              <span style={{ color: '#991b1b', fontWeight: 600, fontSize: '0.875rem' }}>
                {uploadError}
              </span>
            </div>
          )}

          {/* Loading State */}
          {filesLoading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              gap: '16px'
            }}>
              <Loader size={48} color="#818cf8" className="animate-spin" />
              <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading your files...</p>
            </div>
          )}

          {/* Error State */}
          {filesError && (
            <div style={{
              padding: '48px 24px',
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              border: '2px solid #f87171',
              borderRadius: '16px',
              textAlign: 'center'
            }}>
              <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#991b1b', marginBottom: '8px' }}>
                Error Loading Files
              </h3>
              <p style={{ color: '#7f1d1d', marginBottom: '16px' }}>
                {filesError.message || 'Unable to load your files. Please try again.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 24px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!filesLoading && !filesError && files.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Upload size={64} />
              </div>
              <h3 className={styles.emptyTitle}>No files yet</h3>
              <p className={styles.emptyText}>
                Upload your pet's medical records, vaccination certificates, or other important documents.
              </p>
            </div>
          )}

          {/* Files Grid */}
          {!filesLoading && !filesError && files.length > 0 && (
            <>
              <div style={{
                padding: '12px 16px',
                background: '#eef2ff',
                borderRadius: '10px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.875rem', color: '#4338ca', fontWeight: 600 }}>
                  {files.length} file{files.length !== 1 ? 's' : ''} uploaded
                </span>
              </div>

              <div className={styles.filesGrid}>
                {files.map((file) => (
                  <div key={file.id} className={styles.fileCard}>
                    <div className={styles.fileIcon}>
                      {getFileIcon(file.type)}
                    </div>
                    
                    <div className={styles.fileInfo}>
                      <h4 className={styles.fileName}>{file.name}</h4>
                      <div className={styles.fileMeta}>
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.uploadedAt)}</span>
                      </div>
                    </div>

                    <div className={styles.fileActions}>
                      {file.downloadURL && (
                        <>
                          <button
                            className={styles.actionBtn}
                            onClick={() => setSelectedFile(file)}
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                          <a
                            href={file.downloadURL}
                            download={file.name}
                            className={styles.actionBtn}
                            title="Download"
                          >
                            <Download size={18} />
                          </a>
                        </>
                      )}
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => setDeleteConfirm(file)}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

<<<<<<< HEAD
      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        fileName={downloadFileName}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Pet Medical Record"
        message={`Are you sure you want to delete "${fileToDelete?.name}"? This action cannot be undone and the file will be permanently removed from your pet's records.`}
        confirmText="Delete Record"
        isLoading={isDeleting}
      />
=======
      {/* File Preview Modal */}
      {selectedFile && (
        <div className={styles.modal} onClick={() => setSelectedFile(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{selectedFile.name}</h3>
              <button onClick={() => setSelectedFile(null)}>
                <X size={24} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {selectedFile.type?.startsWith('image/') ? (
                <img src={selectedFile.downloadURL} alt={selectedFile.name} style={{ maxWidth: '100%', maxHeight: '70vh' }} />
              ) : selectedFile.type?.includes('pdf') ? (
                <iframe src={selectedFile.downloadURL} style={{ width: '100%', height: '70vh', border: 'none' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <File size={64} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
                  <p style={{ color: '#6b7280', marginBottom: '16px' }}>Preview not available for this file type</p>
                  <a
                    href={selectedFile.downloadURL}
                    download={selectedFile.name}
                    className={styles.downloadLink}
                  >
                    <Download size={18} />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className={styles.modal} onClick={() => !isDeleting && setDeleteConfirm(null)}>
          <div className={styles.deleteDialog} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Trash2 size={32} color="#ef4444" />
            </div>
            
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Delete File?</h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                style={{
                  padding: '10px 24px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteFile(deleteConfirm.id)}
                disabled={isDeleting}
                style={{
                  padding: '10px 24px',
                  background: isDeleting ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete File'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
>>>>>>> b46e9c861f0b7efe19f65b1b5e940c994d99d697
    </div>
  );
}