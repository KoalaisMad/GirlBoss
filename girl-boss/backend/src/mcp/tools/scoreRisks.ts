/**
 * ⚠️ SCORE RISKS TOOL
 */

import { predictRouteSafety } from '../../services/databricksService';

export const scoreRisks = async (
  lat: number,
  lon: number,
  timeOfDay: string,
  transportMode: string
) => {
  // Use current location as both start and end for point-based risk assessment
  return predictRouteSafety(lat, lon, lat, lon, timeOfDay, transportMode);
};
