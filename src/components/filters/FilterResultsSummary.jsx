import React from 'react';

export default function FilterResultsSummary({ 
  filteredCount, 
  totalCount, 
  showClearButton, 
  onClearFilters 
}) {
  return (
    <div style={{ 
      marginBottom: '16px', 
      padding: '12px 16px', 
      background: '#eef2ff', 
      borderRadius: '10px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between' 
    }}>
      <span style={{ fontSize: '0.875rem', color: '#4338ca', fontWeight: 600 }}>
        Showing {filteredCount} of {totalCount} appointments
      </span>
      {showClearButton && (
        <button
          onClick={onClearFilters}
          style={{
            padding: '6px 16px',
            background: 'white',
            border: '1px solid #c7d2fe',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#4338ca',
            cursor: 'pointer'
          }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
