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
      <span style={{
        fontSize: '0.875rem',
        color: '#4338ca',
        fontWeight: 600
      }}>
        Showing {filteredCount} of {totalCount} result{totalCount !== 1 ? 's' : ''}
      </span>
      
      {showClearButton && onClearFilters && (
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
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f0f4ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
          }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
