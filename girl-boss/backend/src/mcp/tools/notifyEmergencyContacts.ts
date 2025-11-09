/**
 * 🚨 NOTIFY EMERGENCY CONTACTS TOOL
 */

import { getUserById } from '../../services/mongoUserService';
import { notifyEmergencyContacts as sendNotifications } from '../../services/twilioService';

export const notifyEmergencyContacts = async (
  userId: string,
  location: { lat: number; lon: number }
) => {
  const user = await getUserById(userId);
  
  if (!user || user.emergencyContacts.length === 0) {
    return {
      success: false,
      message: 'No emergency contacts found'
    };
  }

  await sendNotifications(
    user.emergencyContacts.map(c => ({ name: c.name, phone: c.phone })),
    user.name,
    location
  );

  return {
    success: true,
    contactsNotified: user.emergencyContacts.length,
    message: `Emergency alert sent to ${user.emergencyContacts.length} contacts`
  };
};
