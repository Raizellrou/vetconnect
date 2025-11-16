import { sendNotification } from '../firebase/firestoreHelpers';

/**
 * Test function to send a notification
 * Call this from browser console: window.testNotification('userId')
 */
export const testNotification = async (userId) => {
  if (!userId) {
    console.error('Please provide a user ID');
    return;
  }

  try {
    await sendNotification({
      toUserId: userId,
      title: '🧪 Test Notification',
      body: 'This is a test notification to verify the system is working!',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Test notification sent successfully to:', userId);
  } catch (error) {
    console.error('❌ Failed to send test notification:', error);
  }
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  window.testNotification = testNotification;
}
