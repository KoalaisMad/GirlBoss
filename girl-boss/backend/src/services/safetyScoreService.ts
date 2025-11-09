/**
 * Safety Score Calculation Service
 * 
 * Calculates comprehensive safety scores based on:
 * - Crime rate (35%)
 * - Location/route specifics (25%)
 * - Day/night & time (15%)
 * - Weather (15%)
 * - Battery (10%)
 * 
 * Enhanced with Databricks ML predictions for improved accuracy
 */

import { predictRouteSafety } from './databricksService';

interface WeatherData {
  severe_alert: boolean;
  precipitation_probability?: number; // 0-100
  wind_speed?: number; // mph
  visibility_loss?: number; // 0-1 (0 = clear, 1 = no visibility)
}

interface LocationData {
  latitude: number;
  longitude: number;
  population_density?: number; // per sq km
  recent_incidents?: number; // count in area
  safe_spaces_count?: number; // open businesses, etc.
  public_transport_stops?: number;
  is_isolated?: boolean;
}

interface TimeData {
  hour: number; // 0-23
  sunrise_hour?: number; // e.g., 6
  sunset_hour?: number; // e.g., 18
}

interface BatteryData {
  battery_percent: number; // 0-100
  is_charging: boolean;
}

interface CrimeData {
  incidents_per_1000: number;
  baseline?: number; // default 10
  scale?: number; // default 15
}

interface SafetyScoreInput {
  crime: CrimeData;
  location: LocationData;
  time: TimeData;
  weather: WeatherData;
  battery: BatteryData;
  route_waypoints?: LocationData[]; // for route-specific analysis
  transport_mode?: 'walking' | 'driving' | 'transit' | 'bicycling'; // transportation mode
}

interface SafetyScoreResult {
  total_score: number; // 0-100
  risk: number; // 0-1
  breakdown: {
    crime_risk: number;
    location_risk: number;
    time_risk: number;
    weather_risk: number;
    battery_risk: number;
  };
  weights: {
    crime: number;
    location: number;
    time: number;
    weather: number;
    battery: number;
  };
}

class SafetyScoreService {
  // Base weights for risk components - USER REQUESTED: Crime 60%, Location 10%, Time 15%, Weather 3%, Battery 12%
  private readonly BASE_WEIGHTS = {
    crime: 0.55,     // 55% - Crime is the dominant factor (reduced slightly for battery)
    location: 0.10,  // 10% - Location risk
    time: 0.15,      // 15% - Time of day
    weather: 0.03,   // 3% - Weather conditions
    battery: 0.17,   // 17% - Battery level (INCREASED from 12%)
  };

  /**
   * Get transport mode-specific weight adjustments and risk modifiers
   */
  private getTransportModeAdjustments(mode: 'walking' | 'driving' | 'transit' | 'bicycling' = 'walking') {
    switch (mode) {
      case 'walking':
        // Walking: highest vulnerability to crime - CRIME DOMINANT
        return {
          weights: {
            crime: 0.60,      // 60% - VERY vulnerable to crime when walking
            location: 0.12,   // 12% - location matters more
            time: 0.18,       // 18% - time of day is critical
            weather: 0.02,    // 2% - weather less important than safety
            battery: 0.08,    // 8% - battery matters (INCREASED from 3%)
          },
          crime_multiplier: 1.5,      // 50% MORE crime risk when walking (INCREASED from 1.3)
          location_multiplier: 1.3,   // 30% more location risk (INCREASED)
          time_multiplier: 1.6,       // 60% more time risk - very vulnerable at night (INCREASED)
          weather_multiplier: 0.7,
          battery_multiplier: 1.0,
        };

      case 'bicycling':
        // Bicycling: high crime vulnerability, slightly less exposed
        return {
          weights: {
            crime: 0.53,      // 53% - still very vulnerable
            location: 0.11,   // 11% - can navigate quickly
            time: 0.16,       // 16% - still exposed at night
            weather: 0.05,    // 5% - weather matters a bit more for biking
            battery: 0.15,    // 15% - phone important for navigation
          },
          crime_multiplier: 1.25,     // 25% more crime risk (INCREASED from 1.15)
          location_multiplier: 1.15,  // 15% more location risk (INCREASED)
          time_multiplier: 1.35,      // 35% more time risk (INCREASED)
          weather_multiplier: 1.2,
          battery_multiplier: 1.2,
        };

      case 'transit':
        // Transit: safer from crime due to monitoring
        return {
          weights: {
            crime: 0.40,      // 40% - public transit is monitored (less crime risk)
            location: 0.08,   // 8% - fixed routes
            time: 0.20,       // 20% - late night transit can be risky
            weather: 0.02,    // 2% - protected from weather
            battery: 0.30,    // 30% - need phone for schedules/tickets
          },
          crime_multiplier: 0.5,      // 50% LESS crime risk in transit (DECREASED from 0.6)
          location_multiplier: 0.4,   // 60% less location risk (DECREASED)
          time_multiplier: 1.3,       // 30% more time risk (late night transit) (INCREASED)
          weather_multiplier: 0.4,
          battery_multiplier: 2.0,
        };

      case 'driving':
        // Driving: safest from crime, protected in vehicle
        return {
          weights: {
            crime: 0.30,      // 30% - protected in vehicle (lowest crime weight)
            location: 0.08,   // 8% - can avoid areas easily
            time: 0.12,       // 12% - less affected by time
            weather: 0.05,    // 5% - weather affects driving
            battery: 0.45,    // 45% - need phone for navigation
          },
          crime_multiplier: 0.3,      // 70% LESS crime risk in car (DECREASED from 0.4)
          location_multiplier: 0.5,   // 50% less location risk (DECREASED)
          time_multiplier: 0.6,       // 40% less time risk (DECREASED)
          weather_multiplier: 1.3,
          battery_multiplier: 3.0,
        };

      default:
        return {
          weights: this.BASE_WEIGHTS,
          crime_multiplier: 1.0,
          location_multiplier: 1.0,
          time_multiplier: 1.0,
          weather_multiplier: 1.0,
          battery_multiplier: 1.0,
        };
    }
  }

  /**
   * Clamp a value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Logistic function for smooth scaling
   */
  private logistic(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * Calculate weather risk (Rw)
   * If severe_alert -> Rw = 1
   * Else Rw = clamp(0.2*p + 0.1*(wind/25) + 0.05*vis_loss, 0, 1)
   */
  calculateWeatherRisk(weather: WeatherData): number {
    if (weather.severe_alert) {
      return 1.0;
    }

    const p = (weather.precipitation_probability || 0) / 100; // normalize to 0-1
    const wind = weather.wind_speed || 0;
    const vis_loss = weather.visibility_loss || 0;

    const risk = 0.2 * p + 0.1 * (wind / 25) + 0.05 * vis_loss;
    return this.clamp(risk, 0, 1);
  }

  /**
   * Calculate crime risk (Rc)
   * Rc = logistic((incidents_per_1000 - baseline) / scale)
   */
  calculateCrimeRisk(crime: CrimeData): number {
    const baseline = crime.baseline || 10;
    const scale = crime.scale || 15;
    
    const normalized = (crime.incidents_per_1000 - baseline) / scale;
    return this.logistic(normalized);
  }

  /**
   * Calculate time risk (Rt)
   * If between sunrise and sunset -> Rt = 0
   * Else Rt = clamp(0.2 + 0.8 * hour_penalty, 0, 1)
   * hour_penalty = 1 if hour in [0,4], 0.5 if hour in [22,24] or [4,6], else 0.2
   */
  calculateTimeRisk(time: TimeData): number {
    const { hour, sunrise_hour = 6, sunset_hour = 18 } = time;

    // Daytime = safe
    if (hour >= sunrise_hour && hour < sunset_hour) {
      return 0;
    }

    // Nighttime - calculate hour penalty
    let hour_penalty = 0.2; // default
    
    if (hour >= 0 && hour < 4) {
      hour_penalty = 1.0; // late night/early morning - highest risk
    } else if ((hour >= 22 && hour <= 23) || (hour >= 4 && hour < 6)) {
      hour_penalty = 0.5; // late evening or early dawn
    }

    const risk = 0.2 + 0.8 * hour_penalty;
    return this.clamp(risk, 0, 1);
  }

  /**
   * Calculate battery risk (Rb)
   * If charging -> Rb = 0
   * Else Rb = clamp((20 - battery_percent) / 20, 0, 1)
   */
  calculateBatteryRisk(battery: BatteryData): number {
    if (battery.is_charging) {
      return 0;
    }

    const risk = (20 - battery.battery_percent) / 20;
    return this.clamp(risk, 0, 1);
  }

  /**
   * Calculate location/route risk (Rl)
   * Combines: population density, recent incidents, safe spaces, 
   * public transport, isolated areas
   * Enhanced with Databricks ML predictions for route segments
   */
  async calculateLocationRisk(
    location: LocationData, 
    route_waypoints?: LocationData[],
    transport_mode?: 'walking' | 'driving' | 'transit' | 'bicycling',
    time?: TimeData
  ): Promise<number> {
    let risk = 0;

    // Base location risk
    const loc_risk = this.calculateSingleLocationRisk(location);
    
    // If we have route waypoints, calculate risk for all segments using Databricks
    if (route_waypoints && route_waypoints.length > 0) {
      console.log(`🚀 Using Databricks ML for ${route_waypoints.length} route segments`);
      try {
        // Get Databricks predictions for each route segment
        const segmentPredictions = await Promise.all(
          route_waypoints.map(async (waypoint, index) => {
            const startLat = index === 0 ? location.latitude : route_waypoints[index - 1].latitude;
            const startLon = index === 0 ? location.longitude : route_waypoints[index - 1].longitude;
            const endLat = waypoint.latitude;
            const endLon = waypoint.longitude;
            
            const timeOfDay = time ? `${time.hour}:00` : new Date().toTimeString().split(' ')[0];
            const mode = transport_mode || 'walking';
            
            console.log(`  📍 Segment ${index + 1}: (${startLat.toFixed(4)}, ${startLon.toFixed(4)}) → (${endLat.toFixed(4)}, ${endLon.toFixed(4)}) via ${mode}`);
            
            // Call Databricks for ML prediction
            const prediction = await predictRouteSafety(
              startLat,
              startLon,
              endLat,
              endLon,
              timeOfDay,
              mode
            );
            
            console.log(`  ✅ Segment ${index + 1} ML score: ${prediction.safetyScore}, confidence: ${prediction.confidence}`);
            
            // Convert safety score (0-100) to risk (0-1)
            const mlRisk = 1 - (prediction.safetyScore / 100);
            
            // Combine ML prediction with rule-based location risk
            const ruleBasedRisk = this.calculateSingleLocationRisk(waypoint);
            
            // Weight: 90% ML prediction (we trust Databricks!), 10% rule-based as safety net
            return 0.9 * mlRisk + 0.1 * ruleBasedRisk;
          })
        );
        
        // Average risk across all route segments
        const avg_route_risk = segmentPredictions.reduce((a, b) => a + b, 0) / segmentPredictions.length;
        
        // Weight: 80% Databricks ML (we trust it more now), 20% current location
        risk = 0.2 * loc_risk + 0.8 * avg_route_risk;
        
        console.log(`✅ Route ML analysis complete: ${route_waypoints.length} segments, avg risk: ${avg_route_risk.toFixed(3)}, final: ${risk.toFixed(3)}`);
      } catch (error: any) {
        // PROPAGATE ERROR - Don't fall back, we want to see Databricks issues
        console.error('❌ Databricks ML prediction FAILED:', error.message);
        throw new Error(`Databricks ML prediction failed: ${error.message}`);
      }
    } else {
      risk = loc_risk;
    }

    return this.clamp(risk, 0, 1);
  }

  /**
   * Calculate risk for a single location
   */
  private calculateSingleLocationRisk(location: LocationData): number {
    let risk = 0.3; // baseline

    // Recent incidents increase risk
    if (location.recent_incidents !== undefined) {
      risk += Math.min(0.3, location.recent_incidents * 0.05);
    }

    // Population density (very low = isolated = risky, moderate-high = safer)
    if (location.population_density !== undefined) {
      const density = location.population_density;
      if (density < 100) {
        risk += 0.2; // very isolated
      } else if (density > 1000) {
        risk -= 0.1; // well-populated
      }
    }

    // Safe spaces reduce risk
    if (location.safe_spaces_count !== undefined) {
      risk -= Math.min(0.2, location.safe_spaces_count * 0.03);
    }

    // Public transport stops reduce risk (indicates activity)
    if (location.public_transport_stops !== undefined) {
      risk -= Math.min(0.15, location.public_transport_stops * 0.05);
    }

    // Isolated areas increase risk
    if (location.is_isolated) {
      risk += 0.25;
    }

    return this.clamp(risk, 0, 1);
  }

  /**
   * Calculate comprehensive safety score
   * Returns score from 0-100 (100 = safest)
   * Enhanced with Databricks ML predictions for route analysis
   */
  async calculateSafetyScore(input: SafetyScoreInput): Promise<SafetyScoreResult> {
    // Get transport mode adjustments
    const mode = input.transport_mode || 'walking';
    const adjustments = this.getTransportModeAdjustments(mode);

    // Calculate individual risk components with transport mode multipliers
    const Rc = this.calculateCrimeRisk(input.crime) * adjustments.crime_multiplier;
    const Rl = await this.calculateLocationRisk(
      input.location, 
      input.route_waypoints,
      input.transport_mode,
      input.time
    ) * adjustments.location_multiplier;
    const Rt = this.calculateTimeRisk(input.time) * adjustments.time_multiplier;
    const Rw = this.calculateWeatherRisk(input.weather) * adjustments.weather_multiplier;
    const Rb = this.calculateBatteryRisk(input.battery) * adjustments.battery_multiplier;

    // Clamp adjusted risks to [0, 1]
    const Rc_clamped = this.clamp(Rc, 0, 1);
    const Rl_clamped = this.clamp(Rl, 0, 1);
    const Rt_clamped = this.clamp(Rt, 0, 1);
    const Rw_clamped = this.clamp(Rw, 0, 1);
    const Rb_clamped = this.clamp(Rb, 0, 1);

    // Calculate total risk using transport mode-specific weights
    const total_risk = 
      adjustments.weights.crime * Rc_clamped +
      adjustments.weights.location * Rl_clamped +
      adjustments.weights.time * Rt_clamped +
      adjustments.weights.weather * Rw_clamped +
      adjustments.weights.battery * Rb_clamped;

    // Convert risk to safety score (0-100)
    const safety_score = Math.round(100 * (1 - total_risk));

    return {
      total_score: safety_score,
      risk: total_risk,
      breakdown: {
        crime_risk: Rc_clamped,
        location_risk: Rl_clamped,
        time_risk: Rt_clamped,
        weather_risk: Rw_clamped,
        battery_risk: Rb_clamped,
      },
      weights: adjustments.weights,
    };
  }

  /**
   * Get a detailed text description of safety level
   * Based on comprehensive risk assessment:
   * - 90-100: Excellent safety (daytime, good weather, populated, charged)
   * - 70-89: Good safety (minor risk factors)
   * - 50-69: Moderate safety (some significant risks)
   * - 30-49: Poor safety (multiple risk factors)
   * - 0-29: Dangerous (severe weather, night, isolated, low battery, high crime)
   */
  getSafetyLevel(score: number): string {
    if (score >= 90) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Moderate";
    if (score >= 30) return "Poor";
    return "Dangerous";
  }

  /**
   * Get detailed safety description for UI display
   */
  getSafetyDescription(score: number): string {
    if (score >= 90) return "Excellent safety conditions - daytime, good weather, populated area, charged device";
    if (score >= 70) return "Good safety with minor risk factors - generally safe to proceed";
    if (score >= 50) return "Moderate safety with some significant risks - exercise caution";
    if (score >= 30) return "Poor safety with multiple risk factors - consider alternative route or time";
    return "Dangerous conditions - severe weather, night, isolated area, or high crime. Avoid if possible";
  }

  /**
   * Get safety recommendations based on score breakdown
   * Provides actionable advice based on risk factors
   */
  getRecommendations(result: SafetyScoreResult): string[] {
    const recommendations: string[] = [];
    const score = result.total_score;

    // Critical recommendations for dangerous conditions
    if (score < 30) {
      recommendations.push("⚠️ DANGEROUS CONDITIONS - Strongly consider delaying or canceling this trip");
    }

    // Specific risk-based recommendations
    if (result.breakdown.crime_risk > 0.7) {
      recommendations.push("🚨 Very high crime area - avoid this route or travel during daylight with others");
    } else if (result.breakdown.crime_risk > 0.5) {
      recommendations.push("⚠️ High crime area - consider alternative route or travel in groups");
    } else if (result.breakdown.crime_risk > 0.3) {
      recommendations.push("Stay alert - moderate crime risk in this area");
    }

    if (result.breakdown.location_risk > 0.7) {
      recommendations.push("🚨 Very isolated or risky area - choose well-populated, well-lit routes");
    } else if (result.breakdown.location_risk > 0.5) {
      recommendations.push("⚠️ Isolated area detected - stay in well-lit, populated spaces when possible");
    }

    if (result.breakdown.time_risk > 0.7) {
      recommendations.push("🌙 Very late hours - travel during daylight if possible");
    } else if (result.breakdown.time_risk > 0.4) {
      recommendations.push("🌆 Late hours - be extra cautious and stay in well-lit areas");
    } else if (result.breakdown.time_risk > 0) {
      recommendations.push("Evening/night travel - use well-lit routes");
    }

    if (result.breakdown.weather_risk > 0.8) {
      recommendations.push("⛈️ SEVERE WEATHER ALERT - delay trip until conditions improve");
    } else if (result.breakdown.weather_risk > 0.5) {
      recommendations.push("🌧️ Poor weather conditions - take extra precautions");
    } else if (result.breakdown.weather_risk > 0.3) {
      recommendations.push("Weather may affect visibility - drive carefully");
    }

    if (result.breakdown.battery_risk > 0.7) {
      recommendations.push("🔋 CRITICAL: Very low battery - charge device immediately before traveling");
    } else if (result.breakdown.battery_risk > 0.4) {
      recommendations.push("🔋 Low battery - charge device before departure");
    } else if (result.breakdown.battery_risk > 0.2) {
      recommendations.push("Consider charging device for longer trips");
    }

    // Positive feedback for good conditions
    if (score >= 90) {
      recommendations.push("✅ Excellent conditions - safe to proceed");
    } else if (score >= 70 && recommendations.length === 0) {
      recommendations.push("✅ Good conditions - generally safe with standard precautions");
    }

    // Default if no specific recommendations but score is moderate
    if (recommendations.length === 0 && score >= 50) {
      recommendations.push("Exercise normal safety precautions");
    }

    return recommendations;
  }
}

export default new SafetyScoreService();
export type { SafetyScoreInput, SafetyScoreResult, WeatherData, LocationData, TimeData, BatteryData, CrimeData };
