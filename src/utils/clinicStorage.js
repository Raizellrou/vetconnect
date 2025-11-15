// Clinic storage utilities using localStorage
const CLINICS_KEY = 'clinics';
const ACTIVE_CLINIC_KEY = 'activeClinic';

/**
 * Get all clinics from localStorage
 * @returns {Array} Array of clinic objects
 */
export const getAllClinics = () => {
  try {
    const clinics = localStorage.getItem(CLINICS_KEY);
    return clinics ? JSON.parse(clinics) : [];
  } catch (error) {
    console.error('Error reading clinics:', error);
    return [];
  }
};

/**
 * Get a single clinic by ID
 * @param {string} clinicId - The clinic ID
 * @returns {Object|null} Clinic object or null if not found
 */
export const getClinicById = (clinicId) => {
  try {
    const clinics = getAllClinics();
    return clinics.find(c => c.id === clinicId) || null;
  } catch (error) {
    console.error('Error getting clinic by ID:', error);
    return null;
  }
};

/**
 * Save a new clinic
 * @param {Object} clinicData - The clinic data to save
 * @returns {Object} The saved clinic with generated ID
 */
export const saveClinic = (clinicData) => {
  try {
    const clinics = getAllClinics();
    const newClinic = {
      ...clinicData,
      id: clinicData.id || `clinic_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    clinics.push(newClinic);
    localStorage.setItem(CLINICS_KEY, JSON.stringify(clinics));
    
    // Set as active clinic if it's the first one
    if (clinics.length === 1) {
      setActiveClinic(newClinic.id);
    }
    
    console.log('Clinic saved to localStorage:', newClinic);
    return newClinic;
  } catch (error) {
    console.error('Error saving clinic:', error);
    throw error;
  }
};

/**
 * Update an existing clinic
 * @param {string} clinicId - The clinic ID to update
 * @param {Object} updates - The updated data
 * @returns {Object|null} Updated clinic or null if not found
 */
export const updateClinic = (clinicId, updates) => {
  try {
    const clinics = getAllClinics();
    const index = clinics.findIndex(c => c.id === clinicId);
    
    if (index !== -1) {
      clinics[index] = {
        ...clinics[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(CLINICS_KEY, JSON.stringify(clinics));
      console.log('Clinic updated in localStorage:', clinics[index]);
      return clinics[index];
    }
    
    throw new Error('Clinic not found');
  } catch (error) {
    console.error('Error updating clinic:', error);
    throw error;
  }
};

/**
 * Delete a clinic
 * @param {string} clinicId - The clinic ID to delete
 * @returns {boolean} True if deleted successfully
 */
export const deleteClinic = (clinicId) => {
  try {
    const clinics = getAllClinics();
    const filtered = clinics.filter(c => c.id !== clinicId);
    localStorage.setItem(CLINICS_KEY, JSON.stringify(filtered));
    
    // Clear active clinic if it was deleted
    if (getActiveClinic()?.id === clinicId) {
      localStorage.removeItem(ACTIVE_CLINIC_KEY);
    }
    
    console.log('Clinic deleted from localStorage:', clinicId);
  } catch (error) {
    console.error('Error deleting clinic:', error);
    throw error;
  }
};

/**
 * Get the active clinic object
 * @returns {Object|null} Active clinic object or null
 */
export const getActiveClinic = () => {
  try {
    const activeId = localStorage.getItem(ACTIVE_CLINIC_KEY);
    if (!activeId) return null;
    
    const clinics = getAllClinics();
    return clinics.find(c => c.id === activeId) || null;
  } catch (error) {
    console.error('Error getting active clinic:', error);
    return null;
  }
};

/**
 * Set the active clinic
 * @param {string} clinicId - The clinic ID to set as active
 * @returns {boolean} True if set successfully
 */
export const setActiveClinic = (clinicId) => {
  try {
    localStorage.setItem(ACTIVE_CLINIC_KEY, clinicId);
    console.log('Active clinic set:', clinicId);
  } catch (error) {
    console.error('Error setting active clinic:', error);
  }
};
