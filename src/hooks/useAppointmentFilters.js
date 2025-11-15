import { useState } from 'react';

export const useAppointmentFilters = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const clearFilters = () => {
    setStatusFilter('all');
    setDateFilter('all');
    setSearchQuery('');
    setCustomDateStart('');
    setCustomDateEnd('');
  };

  const hasActiveFilters = 
    statusFilter !== 'all' || 
    dateFilter !== 'all' || 
    searchQuery.trim() !== '';

  return {
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    customDateStart,
    setCustomDateStart,
    customDateEnd,
    setCustomDateEnd,
    searchQuery,
    setSearchQuery,
    clearFilters,
    hasActiveFilters
  };
};
