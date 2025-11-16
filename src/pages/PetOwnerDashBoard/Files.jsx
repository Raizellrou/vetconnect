import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import DownloadModal from '../../components/modals/DownloadModal';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';
import '../../styles/Files.css';

import { useCollection } from '../../hooks/useCollection';

const Files = () => {
  const { currentUser, userData } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.email;

  const { docs: records = [], loading } = useCollection(currentUser ? `users/${currentUser.uid}/files` : null);

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
      return;
    }
    // For real files, browser will open the downloadURL
    if (record?.downloadURL) window.open(record.downloadURL, '_blank');
  };

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
    </div>
  );
};

export default Files;