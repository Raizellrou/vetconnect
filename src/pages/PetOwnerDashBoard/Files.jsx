import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import { Trash2, AlertTriangle, Download, CheckCircle } from 'lucide-react';
import '../../styles/Files.css';

import { useCollection } from '../../hooks/useCollection';

const Files = () => {
  const { currentUser, userData } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.email;

  const { docs: records = [], loading } = useCollection(currentUser ? `users/${currentUser.uid}/files` : null);

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, fileId: null, fileName: '' });
  const [downloadModal, setDownloadModal] = useState({ isOpen: false, fileName: '' });

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
    setDownloadModal({ isOpen: true, fileName: record.name });
    
    // For dummy files, simulate download
    if (record.id && record.id.startsWith('dummy-')) {
      // In a real scenario, you would trigger actual file download
      console.log('Download initiated for:', record.name);
      return;
    }
    // For real files, browser will open the downloadURL
    if (record?.downloadURL) window.open(record.downloadURL, '_blank');
  };

  const closeDownloadModal = () => {
    setDownloadModal({ isOpen: false, fileName: '' });
  };

  const handleArchive = async (recordId) => {
    // archive implementation depends on your model; placeholder:
    console.log('Archiving record:', recordId);
  };

  const handleDelete = async (recordId) => {
    // Find the file name
    const file = dummyFiles.find(f => f.id === recordId) || records.find(r => r.id === recordId);
    const fileName = file?.name || 'this file';
    
    // Open modal
    setDeleteModal({ isOpen: true, fileId: recordId, fileName });
  };

  const confirmDelete = () => {
    const { fileId } = deleteModal;
    
    // Check if it's a dummy file
    if (fileId.startsWith('dummy-')) {
      setDummyFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
      console.log('Deleted dummy file:', fileId);
    } else {
      // For real files
      try {
        console.log('Delete requested for record:', fileId);
        // optionally call a delete mutation if implemented
      } catch (error) {
        console.error('Error deleting record:', error);
      }
    }
    
    // Close modal
    setDeleteModal({ isOpen: false, fileId: null, fileName: '' });
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, fileId: null, fileName: '' });
  };

  return (
    <div className="files-page-root">
      <Sidebar />
      <div className="files-main-wrapper">
        <TopBar username={displayName} />
        
        <main className="files-content">
          <header className="files-header-row">
            <h2 className="files-title">Medical Records</h2>
          </header>

          <section className="files-card">
            <h3 className="files-section-label">Recent Pet Records</h3>

            <div className="records-table">
              <div className="table-header">
                <div className="column-name">Name</div>
                <div className="column-date">Date</div>
              </div>

              {loading ? (
                <div className="loading">Loading records...</div>
              ) : (
                <div className="records-list">
                  {/* Display dummy files */}
                  {dummyFiles.map((file) => (
                    <div key={file.id} className="record-row">
                      <div className="record-name">{file.name}</div>
                      <div className="record-date">
                        {file.uploadedAt.toLocaleDateString()}
                      </div>
                      <div className="record-actions">
                        <button 
                          className="action-btn download-btn"
                          onClick={() => handleDownload(file)}
                          title="Download"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(file.id)}
                          title="Delete"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Display real records from Firestore */}
                  {records.map((record) => (
                    <div key={record.id} className="record-row">
                      <div className="record-name">{record.name || 'Untitled Record'}</div>
                      <div className="record-date">
                        {record.uploadedAt ? new Date(record.uploadedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="record-actions">
                        <button 
                          className="action-btn download-btn"
                          onClick={() => handleDownload(record)}
                          title="Download"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button 
                          className="action-btn archive-btn"
                          onClick={() => handleArchive(record.id)}
                          title="Archive"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(record.id)}
                          title="Delete"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Show empty state only if no dummy files and no real records */}
                  {dummyFiles.length === 0 && records.length === 0 && (
                    <div className="empty-state">No pet records found</div>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Download Notification Modal */}
      {downloadModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '420px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'modalFadeIn 0.3s ease-out'
          }}>
            {/* Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <CheckCircle size={32} color="#059669" strokeWidth={2.5} />
            </div>

            {/* Title */}
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1f2937',
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              Download Started
            </h3>

            {/* Message */}
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: '1.6',
              marginBottom: '28px'
            }}>
              Downloading <strong style={{ color: '#374151' }}>{downloadModal.fileName}</strong>
            </p>

            {/* Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onClick={closeDownloadModal}
                style={{
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '120px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '440px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'modalFadeIn 0.3s ease-out'
          }}>
            {/* Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <AlertTriangle size={32} color="#dc2626" strokeWidth={2.5} />
            </div>

            {/* Title */}
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1f2937',
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              Delete File?
            </h3>

            {/* Message */}
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: '1.6',
              marginBottom: '28px'
            }}>
              Are you sure you want to delete <strong style={{ color: '#374151' }}>{deleteModal.fileName}</strong>? This action cannot be undone.
            </p>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '12px 28px',
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '120px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                }}
              >
                <Trash2 size={18} strokeWidth={2.5} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Files;