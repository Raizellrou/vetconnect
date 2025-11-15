import React from 'react';
import { Filter, Search } from 'lucide-react';

export default function AppointmentFilters({
  statusFilter,
  dateFilter,
  searchQuery,
  customDateStart,
  customDateEnd,
  onStatusChange,
  onDateFilterChange,
  onSearchChange,
  onCustomDateStartChange,
  onCustomDateEndChange,
  onClearFilters,
  showClearButton
}) {
  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginTop: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Filter size={20} color="#818cf8" />
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Filters</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {/* Status Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Date</label>
          <select
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Search */}
        <div style={{ gridColumn: dateFilter === 'custom' ? 'auto' : 'span 2' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by clinic, pet, or reason..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* Custom Date Range */}
      {dateFilter === 'custom' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Start Date</label>
            <input
              type="date"
              value={customDateStart}
              onChange={(e) => onCustomDateStartChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>End Date</label>
            <input
              type="date"
              value={customDateEnd}
              onChange={(e) => onCustomDateEndChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>
      )}

      {/* Clear Filters Button */}
      {showClearButton && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={onClearFilters}
            style={{
              padding: '8px 20px',
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#818cf8';
              e.currentTarget.style.color = '#818cf8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
