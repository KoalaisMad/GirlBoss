/**
 * 👤 GET USER PROFILE TOOL
 */

import { getUserById, getUserByEmail } from '../../services/mongoUserService';

export const getUserProfile = async (identifier: string) => {
  // Try as email first, then as ID
  let user = await getUserByEmail(identifier);
  if (!user) {
    user = await getUserById(identifier);
  }
  
  return user;
};
