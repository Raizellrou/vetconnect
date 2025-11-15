import { Timestamp } from 'firebase/firestore';

/**
 * Convert a date string and time string to a Firestore Timestamp
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} timeStr - Time in HH:MM format
 * @returns {Timestamp} Firestore Timestamp
 */
export function toTimestamp(dateStr, timeStr) {
  if (!dateStr || !timeStr) {
    throw new Error('Date and time are required');
  }
  
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  const date = new Date(year, month - 1, day, hours, minutes);
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date or time format');
  }
  
  return Timestamp.fromDate(date);
}

/**
 * Format a Firestore Timestamp to a readable date string
 * @param {Timestamp} timestamp - Firestore Timestamp
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Format a Firestore Timestamp to a short date string
 * @param {Timestamp} timestamp - Firestore Timestamp
 * @returns {string} Short formatted date
 */
export function formatShortDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

/**
 * Format time only from a Firestore Timestamp
 * @param {Timestamp} timestamp - Firestore Timestamp
 * @returns {string} Formatted time
 */
export function formatTime(timestamp) {
  if (!timestamp) return 'N/A';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
