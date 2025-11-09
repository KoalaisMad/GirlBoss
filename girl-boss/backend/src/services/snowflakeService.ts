/**
 * SNOWFLAKE SERVICE
 * 
 * Queries historical safety data, crime statistics, and analytics.
 */

import { executeSnowflakeQuery } from '../config/snowflake';

export interface SafetyData {
  location: string;
  crimeRate: number;
  timeOfDay: string;
  safetyScore: number;
  incidents: number;
}

export const getLocationSafetyHistory = async (
  lat: number,
  lon: number,
  radius: number = 1
): Promise<SafetyData[]> => {
  try {
    // Example query - adjust based on your Snowflake schema
    const query = `
      SELECT 
        location_name as location,
        crime_rate as crimeRate,
        time_of_day as timeOfDay,
        safety_score as safetyScore,
        incident_count as incidents
      FROM safety_data
      WHERE 
        ST_DISTANCE(
          ST_POINT(longitude, latitude),
          ST_POINT(${lon}, ${lat})
        ) < ${radius * 1609.34}
      ORDER BY timestamp DESC
      LIMIT 100
    `;
    
    const results = await executeSnowflakeQuery(query);
    return results;
  } catch (error) {
    console.error('Error fetching safety history:', error);
    return [];
  }
};

export const getRouteSafetyScore = async (
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<number> => {
  try {
    const query = `
      SELECT AVG(safety_score) as avgScore
      FROM route_safety
      WHERE 
        (start_lat BETWEEN ${startLat - 0.01} AND ${startLat + 0.01})
        AND (start_lon BETWEEN ${startLon - 0.01} AND ${startLon + 0.01})
        AND (end_lat BETWEEN ${endLat - 0.01} AND ${endLat + 0.01})
        AND (end_lon BETWEEN ${endLon - 0.01} AND ${endLon + 0.01})
    `;
    
    const results = await executeSnowflakeQuery(query);
    return results[0]?.avgScore || 75; // Default score
  } catch (error) {
    console.error('Error calculating route safety:', error);
    return 75;
  }
};
