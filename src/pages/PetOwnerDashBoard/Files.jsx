import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import '../../styles/Files.css';

const Files = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userData } = useAuth();

  const displayName = userData?.fullName || userData?.displayName || userData?.email;

  useEffect(() => {
    if (currentUser) {
      fetchPetRecords();
    }
  }, [currentUser]);

  const fetchPetRecords = async () => {
    try {
      setLoading(true);
      const recordsRef = collection(db, 'petRecords');
      const q = query(recordsRef, where('ownerId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      const fetchedRecords = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRecords(fetchedRecords);
    } catch (error) {
      console.error('Error fetching pet records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (record) => {
    // Implement download functionality
    console.log('Downloading record:', record);
  };

  const handleArchive = async (recordId) => {
    try {
      // Implement archive functionality
      console.log('Archiving record:', recordId);
    } catch (error) {
      console.error('Error archiving record:', error);
    }
  };

  const handleDelete = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteDoc(doc(db, 'petRecords', recordId));
        setRecords(records.filter(record => record.id !== recordId));
      } catch (error) {
        console.error('Error deleting record:', error);
      }
    }
  };

  return (
    <div className="files-page-root">
      <Sidebar />
      <div className="files-main-wrapper">
        <TopBar username={displayName} />
        
        <main className="files-content">
          <header className="files-header-row">
            <div className="files-breadcrumb">
              <span>Files</span>
              <span className="bullet-point">•</span>
              <span className="date-text">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
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
              ) : records.length === 0 ? (
                <div className="empty-state">No pet records found</div>
              ) : (
                <div className="records-list">
                  {records.map((record) => (
                    <div key={record.id} className="record-row">
                      <div className="record-name">{record.name || 'Untitled Record'}</div>
                      <div className="record-date">
                        {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
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
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Files;