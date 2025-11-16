import React, { useState } from 'react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import SuccessModal from '../../components/modals/SuccessModal';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';
import DownloadModal from '../../components/modals/DownloadModal';
import { useAuth } from '../../contexts/AuthContext';
import { Upload, FileText, Download, Trash2, Calendar, User, Dog } from 'lucide-react';
import styles from '../../styles/ClinicDashboard.module.css';

export default function ClinicFiles() {
  const { userData } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.clinicName || userData?.email;

  // Dummy uploaded files
  const [uploadedFiles, setUploadedFiles] = useState([
    {
      id: 'file-1',
      fileName: 'Max_Vaccination_Record.pdf',
      petName: 'Max',
      ownerName: 'John Smith',
      uploadDate: '2024-11-15',
      fileSize: '245 KB',
      appointmentDate: '2024-11-14'
    },
    {
      id: 'file-2',
      fileName: 'Bella_Lab_Results.pdf',
      petName: 'Bella',
      ownerName: 'Sarah Johnson',
      uploadDate: '2024-11-16',
      fileSize: '1.2 MB',
      appointmentDate: '2024-11-15'
    },
    {
      id: 'file-3',
      fileName: 'Charlie_Xray_Report.pdf',
      petName: 'Charlie',
      ownerName: 'Mike Davis',
      uploadDate: '2024-11-17',
      fileSize: '892 KB',
      appointmentDate: '2024-11-16'
    }
  ]);

  const [uploading, setUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [downloadFileName, setDownloadFileName] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    // Simulate upload
    setTimeout(() => {
      const newFile = {
        id: `file-${Date.now()}`,
        fileName: file.name,
        petName: 'New Pet',
        ownerName: 'Pet Owner',
        uploadDate: new Date().toISOString().split('T')[0],
        fileSize: `${(file.size / 1024).toFixed(0)} KB`,
        appointmentDate: new Date().toISOString().split('T')[0]
      };
      
      setUploadedFiles(prev => [newFile, ...prev]);
      setUploading(false);
      setUploadedFileName(file.name);
      setShowSuccessModal(true);
      e.target.value = '';
    }, 1000);
  };

  const handleDownload = (file) => {
    setDownloadFileName(file.fileName);
    setShowDownloadModal(true);
    console.log('Download initiated for:', file.fileName);
  };

  const handleDeleteClick = (file) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      setUploadedFiles(prev => prev.filter(file => file.id !== fileToDelete.id));
      setShowDeleteModal(false);
      setFileToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setFileToDelete(null);
  };

  return (
    <div className={styles.dashboard}>
      <ClinicSidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />
        
        <main className={styles.mainContent}>
          <header style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', margin: '0 0 8px 0' }}>
              Pet Medical Records
            </h1>
            <p style={{ color: '#64748b', margin: 0 }}>
              Upload and manage pet medical records and documents
            </p>
          </header>

          {/* Upload Section */}
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '32px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: '#dbeafe', 
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Upload size={20} color="#3b82f6" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                Upload New Record
              </h3>
            </div>

            <div style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              background: '#f8fafc',
              transition: 'all 0.2s'
            }}>
              <input
                type="file"
                id="file-upload"
                onChange={handleFileUpload}
                disabled={uploading}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                style={{ display: 'none' }}
              />
              <label 
                htmlFor="file-upload"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '10px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  opacity: uploading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!uploading) e.currentTarget.style.background = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  if (!uploading) e.currentTarget.style.background = '#3b82f6';
                }}
              >
                <Upload size={20} />
                {uploading ? 'Uploading...' : 'Choose File to Upload'}
              </label>
              <p style={{ marginTop: '16px', color: '#64748b', fontSize: '0.875rem' }}>
                Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
              </p>
            </div>
          </div>

          {/* Files List */}
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '32px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: '#f0fdf4', 
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={20} color="#22c55e" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                Uploaded Records ({uploadedFiles.length})
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {uploadedFiles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No files uploaded yet
                </div>
              ) : (
                uploadedFiles.map((file) => (
                  <div 
                    key={file.id} 
                    style={{
                      padding: '20px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        background: '#eff6ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FileText size={24} color="#3b82f6" />
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                          {file.fileName}
                        </h4>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Dog size={14} />
                            {file.petName}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={14} />
                            {file.ownerName}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={14} />
                            {new Date(file.uploadDate).toLocaleDateString()}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                            {file.fileSize}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleDownload(file)}
                        style={{
                          padding: '10px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(file)}
                        style={{
                          padding: '10px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="File Uploaded Successfully!"
        message={`${uploadedFileName} has been uploaded and is now available in your medical records.`}
      />

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
        title="Delete Medical Record"
        message={`Are you sure you want to delete "${fileToDelete?.fileName}"? This action cannot be undone.`}
        confirmText="Delete File"
      />
    </div>
  );
}
