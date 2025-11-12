// Clinic storage utilities using localStorage
const CLINICS_KEY = 'vetconnect-clinics';
const ACTIVE_CLINIC_KEY = 'vetconnect-active-clinic';

/**
 * Get all clinics from localStorage
 * @returns {Array} Array of clinic objects
 */
export const getAllClinics = () => {
  try {
    const clinics = localStorage.getItem(CLINICS_KEY);
    return clinics ? JSON.parse(clinics) : [];
  } catch (error) {
    console.error('Error reading clinics from storage:', error);
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
    return clinics.find(clinic => clinic.id === clinicId) || null;
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
      id: `clinic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...clinicData,
      createdAt: new Date().toISOString(),
      active: true
    };
    clinics.push(newClinic);
    localStorage.setItem(CLINICS_KEY, JSON.stringify(clinics));
    
    // Set as active clinic if it's the first one
    if (clinics.length === 1) {
      setActiveClinic(newClinic.id);
    }
    
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
    const index = clinics.findIndex(clinic => clinic.id === clinicId);
    
    if (index === -1) {
      console.error('Clinic not found:', clinicId);
      return null;
    }
    
    clinics[index] = {
      ...clinics[index],
      ...updates,
      id: clinicId, // Preserve original ID
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(CLINICS_KEY, JSON.stringify(clinics));
    return clinics[index];
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
    const filtered = clinics.filter(clinic => clinic.id !== clinicId);
    
    if (filtered.length === clinics.length) {
      console.error('Clinic not found for deletion:', clinicId);
      return false;
    }
    
    localStorage.setItem(CLINICS_KEY, JSON.stringify(filtered));
    
    // If deleted clinic was active, set first remaining clinic as active
    const activeId = getActiveClinicId();
    if (activeId === clinicId) {
      if (filtered.length > 0) {
        setActiveClinic(filtered[0].id);
      } else {
        localStorage.removeItem(ACTIVE_CLINIC_KEY);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting clinic:', error);
    throw error;
  }
};

/**
 * Get the active clinic ID
 * @returns {string|null} Active clinic ID or null
 */
export const getActiveClinicId = () => {
  try {
    return localStorage.getItem(ACTIVE_CLINIC_KEY);
  } catch (error) {
    console.error('Error getting active clinic ID:', error);
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
    const clinic = getClinicById(clinicId);
    if (!clinic) {
      console.error('Cannot set non-existent clinic as active:', clinicId);
      return false;
    }
    localStorage.setItem(ACTIVE_CLINIC_KEY, clinicId);
    return true;
  } catch (error) {
    console.error('Error setting active clinic:', error);
    return false;
  }
};

/**
 * Get the active clinic object
 * @returns {Object|null} Active clinic object or null
 */
export const getActiveClinic = () => {
  try {
    const activeId = getActiveClinicId();
    if (!activeId) return null;
    return getClinicById(activeId);
  } catch (error) {
    console.error('Error getting active clinic:', error);
    return null;
  }
};
