/**
 * TWILIO SERVICE
 * 
 * Sends SMS notifications to emergency contacts when needed.
 */

import axios from 'axios';

export const sendEmergencySMS = async (
  toNumber: string,
  message: string
): Promise<boolean> => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.warn('Twilio credentials not configured');
      return false;
    }

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        To: toNumber,
        From: fromNumber,
        Body: message
      }),
      {
        auth: {
          username: accountSid,
          password: authToken
        }
      }
    );

    return response.status === 201;
  } catch (error) {
    console.error('Twilio SMS error:', error);
    return false;
  }
};

export const notifyEmergencyContacts = async (
  contacts: Array<{ name: string; phone: string }>,
  userName: string,
  location: { lat: number; lon: number }
): Promise<void> => {
  const message = `EMERGENCY: ${userName} has triggered an emergency alert. 
Last known location: https://maps.google.com/?q=${location.lat},${location.lon}
Time: ${new Date().toLocaleString()}`;

  const promises = contacts.map(contact => 
    sendEmergencySMS(contact.phone, message)
  );

  await Promise.all(promises);
  console.log(`Emergency notifications sent to ${contacts.length} contacts`);
};
