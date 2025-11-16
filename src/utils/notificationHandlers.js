/**
 * Handle notification click and navigate to appropriate page
 * @param {Object} notification - Notification object with data
 * @param {Function} navigate - React Router navigate function
 * @param {Object} userData - Current user data
 */
export const handleNotificationClick = (notification, navigate, userData) => {
  if (!notification || !navigate) return;

  const { data, appointmentId } = notification;
  const type = data?.type;
  const userRole = userData?.role;

  console.log('Handling notification click:', { type, userRole, data });

  // Handle different notification types
  switch (type) {
    case 'new_appointment':
      // Clinic owner receives new appointment request
      if (userRole === 'clinicOwner' && data?.clinicId) {
        // Navigate to clinic appointments page
        navigate('/clinic/appointments', {
          state: {
            selectedClinicId: data.clinicId,
            highlightAppointmentId: appointmentId
          }
        });
      }
      break;

    case 'appointment_status':
      // Pet owner receives appointment status update (confirmed/rejected)
      if (userRole === 'petOwner' && appointmentId) {
        // Navigate to owner dashboard with appointment details
        navigate('/owner-dashboard', {
          state: {
            viewAppointmentId: appointmentId,
            openDetails: true
          }
        });
      }
      break;

    case 'appointment_reminder':
      // Either user type receives reminder about upcoming appointment
      if (userRole === 'petOwner' && appointmentId) {
        navigate('/owner-dashboard', {
          state: {
            viewAppointmentId: appointmentId,
            openDetails: true
          }
        });
      } else if (userRole === 'clinicOwner' && data?.clinicId) {
        navigate('/clinic/appointments', {
          state: {
            selectedClinicId: data.clinicId,
            highlightAppointmentId: appointmentId
          }
        });
      }
      break;

    case 'daily_schedule':
      // Clinic owner receives daily schedule summary
      if (userRole === 'clinicOwner' && data?.clinicId) {
        navigate('/clinic/appointments', {
          state: {
            selectedClinicId: data.clinicId,
            filterToday: true
          }
        });
      }
      break;

    default:
      // Generic fallback - navigate to main dashboard
      if (userRole === 'clinicOwner') {
        navigate('/clinic-dashboard');
      } else {
        navigate('/owner-dashboard');
      }
      break;
  }
};
