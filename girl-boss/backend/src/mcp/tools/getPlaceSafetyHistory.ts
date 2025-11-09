
import { getLocationSafetyHistory } from '../../services/snowflakeService';

export const getPlaceSafetyHistory = async (
  lat: number,
  lon: number,
  radiusMiles: number = 0.5
) => {
  const history = await getLocationSafetyHistory(lat, lon, radiusMiles);
  
  if (history.length === 0) {
    return {
      hasData: false,
      message: 'No historical safety data available for this location',
      averageScore: 75
    };
  }

  const avgScore = history.reduce((sum, item) => sum + item.safetyScore, 0) / history.length;
  const totalIncidents = history.reduce((sum, item) => sum + item.incidents, 0);

  return {
    hasData: true,
    averageScore: Math.round(avgScore),
    totalIncidents,
    recentData: history.slice(0, 5),
    trend: avgScore > 70 ? 'improving' : avgScore > 50 ? 'stable' : 'concerning'
  };
};
