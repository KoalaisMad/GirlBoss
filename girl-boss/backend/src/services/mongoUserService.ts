/**
 * USER SERVICE
 * 
 * Manages user profiles, preferences, and emergency contacts in MongoDB.
 */

import { getDB } from '../config/db';
import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  phone?: string;
  emergencyContacts: EmergencyContact[];
  preferences: {
    transportMode?: string;
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

export const createUser = async (userData: Partial<User>): Promise<User> => {
  const db = getDB();
  const users = db.collection<User>('users');
  
  const newUser: User = {
    name: userData.name || '',
    email: (userData.email || '').toLowerCase().trim(), // Normalize email
    phone: userData.phone,
    emergencyContacts: userData.emergencyContacts || [],
    preferences: {
      transportMode: userData.preferences?.transportMode,
      notifications: userData.preferences?.notifications ?? true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = await users.insertOne(newUser);
  return { ...newUser, _id: result.insertedId };
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const db = getDB();
  const users = db.collection<User>('users');
  return users.findOne({ _id: new ObjectId(userId) });
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const db = getDB();
  const users = db.collection<User>('users');
  // Normalize email for consistent lookup
  const normalizedEmail = email.toLowerCase().trim();
  return users.findOne({ email: normalizedEmail });
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  const db = getDB();
  const users = db.collection<User>('users');
  
  await users.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        ...updates, 
        updatedAt: new Date() 
      } 
    }
  );
  
  return getUserById(userId);
};

export const addEmergencyContact = async (
  userId: string, 
  contact: EmergencyContact
): Promise<User | null> => {
  const db = getDB();
  const users = db.collection<User>('users');
  
  await users.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $push: { emergencyContacts: contact },
      $set: { updatedAt: new Date() }
    }
  );
  
  return getUserById(userId);
};
