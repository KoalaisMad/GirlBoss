/**
 * TRIP SERVICE
 * 
 * Stores and retrieves trip history, routes, and safety scores.
 */

import { getDB } from '../config/db';
import { ObjectId } from 'mongodb';

export interface Trip {
  _id?: ObjectId;
  userId: ObjectId;
  startLocation: {
    lat: number;
    lon: number;
    address?: string;
  };
  endLocation: {
    lat: number;
    lon: number;
    address?: string;
  };
  transportMode: 'walking' | 'driving' | 'public';
  safetyScore: number;
  distance: number;
  duration: number;
  startTime: Date;
  endTime?: Date;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  emergencyTriggered?: boolean;
  createdAt: Date;
}

export const createTrip = async (tripData: Omit<Trip, '_id' | 'createdAt'>): Promise<Trip> => {
  const db = getDB();
  const trips = db.collection<Trip>('trips');
  
  const newTrip: Trip = {
    ...tripData,
    createdAt: new Date()
  };
  
  const result = await trips.insertOne(newTrip);
  return { ...newTrip, _id: result.insertedId };
};

export const getTripById = async (tripId: string): Promise<Trip | null> => {
  const db = getDB();
  const trips = db.collection<Trip>('trips');
  return trips.findOne({ _id: new ObjectId(tripId) });
};

export const getUserTrips = async (userId: string, limit: number = 10): Promise<Trip[]> => {
  const db = getDB();
  const trips = db.collection<Trip>('trips');
  
  return trips
    .find({ userId: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
};

export const updateTripStatus = async (
  tripId: string, 
  status: Trip['status'],
  endTime?: Date
): Promise<Trip | null> => {
  const db = getDB();
  const trips = db.collection<Trip>('trips');
  
  const update: any = { status };
  if (endTime) {
    update.endTime = endTime;
  }
  
  await trips.updateOne(
    { _id: new ObjectId(tripId) },
    { $set: update }
  );
  
  return getTripById(tripId);
};

export const triggerEmergency = async (tripId: string): Promise<Trip | null> => {
  const db = getDB();
  const trips = db.collection<Trip>('trips');
  
  await trips.updateOne(
    { _id: new ObjectId(tripId) },
    { $set: { emergencyTriggered: true, status: 'cancelled' } }
  );
  
  return getTripById(tripId);
};
