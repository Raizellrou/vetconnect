import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { ArrowLeft, FileText, Download, Eye, Calendar, Paperclip } from 'lucide-react';
import styles from './MedicalRecords.module.css';

export default function MedicalRecords({ userData, petId, onBack }) {
  const [records, setRecords] = useState([]);
  const [files, setFiles] = useState([]);

  const fetchRecords = async () => {
    const recordsRef = collection(
      db,
      "users",
      userData.uid,
      "pets",
      petId,
      "medical_records"
    );
    const snapshot = await getDocs(recordsRef);
    let recordsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    
    // Add dummy records if empty for demo purposes
    if (recordsData.length === 0) {
      recordsData = [
        {
          id: 'dummy-1',
          title: 'Annual Checkup',
          description: 'Routine health examination and vaccination update',
          diagnosis: 'Healthy, no issues found',
          treatment: 'Updated vaccination records',
          date: new Date('2024-11-15'),
          createdAt: new Date('2024-11-15'),
          attachments: [
            {
              fileName: 'vaccination-certificate.pdf',
              fileUrl: '#',
              uploadedAt: new Date('2024-11-15')
            },
            {
              fileName: 'lab-results.pdf',
              fileUrl: '#',
              uploadedAt: new Date('2024-11-15')
            }
          ]
        },
        {
          id: 'dummy-2',
          title: 'Dental Cleaning',
          description: 'Professional teeth cleaning and oral examination',
          diagnosis: 'Minor tartar buildup',
          treatment: 'Dental scaling and polishing completed',
          date: new Date('2024-10-22'),
          createdAt: new Date('2024-10-22'),
          attachments: [
            {
              fileName: 'dental-xray.jpg',
              fileUrl: '#',
              uploadedAt: new Date('2024-10-22')
            }
          ]
        }
      ];
    }
    
    setRecords(recordsData);
    
    // Gather all files from records
    const allFiles = [];
    recordsData.forEach(record => {
      if (record.attachments && Array.isArray(record.attachments)) {
        record.attachments.forEach(file => {
          allFiles.push({
            ...file,
            recordTitle: record.title,
            recordDate: record.date || record.createdAt
          });
        });
      }
    });
    setFiles(allFiles);
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
      {/* Header */}
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          <ArrowLeft size={20} />
          Back to Pets
        </button>
        <h2 className={styles.title}>Medical Records & Files</h2>
        <p className={styles.subtitle}>View medical history and attachments for this pet</p>
      </div>

      {/* Medical Records Section */}
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

                {record.attachments && record.attachments.length > 0 && (
                  <div className={styles.attachmentCount}>
                    <Paperclip size={14} />
                    <span>{record.attachments.length} attachment(s)</span>
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
    </div>
  );
}
