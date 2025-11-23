import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { ArrowLeft, FileText, Download, Eye, Calendar, Paperclip, AlertCircle } from 'lucide-react';
import styles from './MedicalRecords.module.css';
import Toast from '../../components/Toast';

export default function MedicalRecords({ userData, petId, onBack }) {
  const [records, setRecords] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Query global medicalRecords collection by petId
      const recordsQuery = query(
        collection(db, "medicalRecords"),
        where("petId", "==", petId)
      );
      
      const snapshot = await getDocs(recordsQuery);
      const recordsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        title: doc.data().diagnosis || 'Medical Record' // Use diagnosis as title if no title field
      }));
      
      setRecords(recordsData);
      
      // Gather all files from records (from 'files' array in new format)
      const allFiles = [];
      recordsData.forEach(record => {
        // Check for files array (new format from clinic uploads)
        if (record.files && Array.isArray(record.files)) {
          record.files.forEach(fileUrl => {
            // Extract filename from URL
            const urlParts = fileUrl.split('/');
            const fileName = urlParts[urlParts.length - 1].split('?')[0];
            
            allFiles.push({
              url: fileUrl,
              name: decodeURIComponent(fileName),
              recordTitle: record.diagnosis || 'Medical Record',
              recordDate: record.createdAt
            });
          });
        }
        
        // Also check for attachments array (legacy format)
        if (record.attachments && Array.isArray(record.attachments)) {
          record.attachments.forEach(file => {
            allFiles.push({
              ...file,
              recordTitle: record.diagnosis || record.title,
              recordDate: record.date || record.createdAt
            });
          });
        }
      });
      
      setFiles(allFiles);
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setError('Failed to load medical records. Please try again.');
      setToast({ type: 'error', message: 'Failed to load medical records. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [petId]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleViewFile = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  const handleDownloadFile = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'medical-record';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          <ArrowLeft size={20} />
          Back to Pets
        </button>
        <h2 className={styles.title}>Medical Records & Files</h2>
        <p className={styles.subtitle}>View medical history and attachments for this pet</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={styles.section}>
          <div className={styles.emptyState}>
            <div style={{ animation: 'spin 1s linear infinite' }}>
              <FileText size={48} color="#818cf8" />
            </div>
            <p className={styles.emptyText}>Loading medical records...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className={styles.section}>
          <div className={styles.emptyState}>
            <AlertCircle size={48} color="#ef4444" />
            <p className={styles.emptyText} style={{ color: '#ef4444' }}>Error Loading Records</p>
            <p className={styles.emptySubtext}>{error}</p>
            <button
              onClick={fetchRecords}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Medical Records Section */}
      {!loading && !error && (
        <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <FileText size={20} color="var(--vc-primary)" />
          <h3 className={styles.sectionTitle}>Medical Records ({records.length})</h3>
        </div>

        {records.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={48} color="#cbd5e1" />
            <p className={styles.emptyText}>No medical records found</p>
            <p className={styles.emptySubtext}>Records will appear here after clinic visits</p>
          </div>
        ) : (
          <div className={styles.recordsGrid}>
            {records.map((record) => (
              <div key={record.id} className={styles.recordCard}>
                <div className={styles.recordHeader}>
                  <div className={styles.recordIcon}>
                    <FileText size={20} />
                  </div>
                  <div className={styles.recordInfo}>
                    <h4 className={styles.recordTitle}>{record.title}</h4>
                    <div className={styles.recordMeta}>
                      <Calendar size={14} />
                      <span>{formatDate(record.date || record.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                {record.description && (
                  <p className={styles.recordDescription}>{record.description}</p>
                )}

                {record.diagnosis && (
                  <div className={styles.recordDetail}>
                    <strong>Diagnosis:</strong> {record.diagnosis}
                  </div>
                )}

                {record.treatment && (
                  <div className={styles.recordDetail}>
                    <strong>Treatment:</strong> {record.treatment}
                  </div>
                )}

                {((record.files && record.files.length > 0) || (record.attachments && record.attachments.length > 0)) && (
                  <div className={styles.attachmentCount}>
                    <Paperclip size={14} />
                    <span>{(record.files?.length || 0) + (record.attachments?.length || 0)} attachment(s)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Files & Attachments Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Paperclip size={20} color="var(--vc-primary)" />
          <h3 className={styles.sectionTitle}>Files & Attachments ({files.length})</h3>
        </div>

        {files.length === 0 ? (
          <div className={styles.emptyState}>
            <Paperclip size={48} color="#cbd5e1" />
            <p className={styles.emptyText}>No files attached</p>
            <p className={styles.emptySubtext}>Medical documents and images will appear here</p>
          </div>
        ) : (
          <div className={styles.filesGrid}>
            {files.map((file, index) => (
              <div key={index} className={styles.fileCard}>
                <div className={styles.fileIcon}>
                  <FileText size={20} />
                </div>
                <div className={styles.fileInfo}>
                  <h4 className={styles.fileName}>{file.name || `Document ${index + 1}`}</h4>
                  <p className={styles.fileMeta}>
                    {file.recordTitle && (
                      <>
                        <span>{file.recordTitle}</span>
                        <span className={styles.bullet}>•</span>
                      </>
                    )}
                    <span>{formatDate(file.recordDate)}</span>
                  </p>
                  {file.size && (
                    <p className={styles.fileSize}>
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  )}
                </div>
                <div className={styles.fileActions}>
                  <button 
                    onClick={() => handleViewFile(file.url)}
                    className={styles.actionButton}
                    title="View file"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => handleDownloadFile(file.url, file.name)}
                    className={styles.actionButton}
                    title="Download file"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
