/**
 * 🛣️ GET ROUTE SAFETY TOOL
 */

import { getRouteSafetyScore } from '../../services/snowflakeService';
import { predictRouteSafety } from '../../services/databricksService';

export const getRouteSafety = async (
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  transportMode: string = 'driving'
) => {
  const timeOfDay = new Date().getHours() < 12 ? 'morning' : 
                    new Date().getHours() < 18 ? 'afternoon' : 'evening';

  const [snowflakeScore, mlPrediction] = await Promise.all([
    getRouteSafetyScore(startLat, startLon, endLat, endLon),
    predictRouteSafety(startLat, startLon, endLat, endLon, timeOfDay, transportMode)
  ]);

  return {
    historicalScore: snowflakeScore,
    predictedScore: mlPrediction.safetyScore,
    finalScore: Math.round((snowflakeScore + mlPrediction.safetyScore) / 2),
    riskLevel: mlPrediction.riskLevel,
    factors: mlPrediction.factors
  };
};
