/**
 * MCP CONTEXT BUILDER
 * 
 * Builds rich context for AI by combining data from multiple sources:
 * MongoDB, Snowflake, Databricks, and real-time info.
 */

import { getUserById } from '../services/mongoUserService';
import { getUserTrips } from '../services/mongoTripService';
import { getLocationSafetyHistory } from '../services/snowflakeService';
import { predictRouteSafety } from '../services/databricksService';

export interface MCPContext {
  user?: any;
  recentTrips?: any[];
  safetyHistory?: any[];
  riskPrediction?: any;
  timestamp: string;
}

export const buildUserContext = async (userId: string): Promise<MCPContext> => {
  try {
    const [user, recentTrips] = await Promise.all([
      getUserById(userId),
      getUserTrips(userId, 5)
    ]);

    return {
      user: user ? {
        name: user.name,
        email: user.email,
        emergencyContacts: user.emergencyContacts,
        preferences: user.preferences
      } : undefined,
      recentTrips: recentTrips.map(trip => ({
        destination: trip.endLocation.address,
        mode: trip.transportMode,
        safetyScore: trip.safetyScore,
        date: trip.createdAt
      })),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error building user context:', error);
    return { timestamp: new Date().toISOString() };
  }
};

export const buildRouteContext = async (
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  transportMode: string
): Promise<MCPContext> => {
  try {
    const timeOfDay = new Date().getHours() < 12 ? 'morning' : 
                      new Date().getHours() < 18 ? 'afternoon' : 'evening';

    const [safetyHistory, riskPrediction] = await Promise.all([
      getLocationSafetyHistory(endLat, endLon, 1),
      predictRouteSafety(startLat, startLon, endLat, endLon, timeOfDay, transportMode)
    ]);

    return {
      safetyHistory,
      riskPrediction,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error building route context:', error);
    return { timestamp: new Date().toISOString() };
  }
};
