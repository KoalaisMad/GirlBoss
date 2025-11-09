/**
 * Test script for Safety Score Service
 * Run with: npx ts-node test-safety-score.ts
 */

import safetyScoreService from './src/services/safetyScoreService';

console.log('🔒 Safety Score Service Test\n');
console.log('='.repeat(60));

  // Test 1: Safe daytime route
  console.log('\n=== TEST 1: Safe Daytime Route ===');
  const safeRoute = await safetyScoreService.calculateSafetyScore({
  crime: {
    incidents_per_1000: 8, // Below baseline
    baseline: 10,
    scale: 15
  },
  location: {
    latitude: 30.6280,
    longitude: -96.3344,
    population_density: 800, // Well populated
    recent_incidents: 0,
    safe_spaces_count: 10,
    public_transport_stops: 5,
    is_isolated: false
  },
  time: {
    hour: 14, // 2 PM
    sunrise_hour: 6,
    sunset_hour: 19
  },
  weather: {
    severe_alert: false,
    precipitation_probability: 10,
    wind_speed: 5,
    visibility_loss: 0
  },
  battery: {
    battery_percent: 85,
    is_charging: false
  }
});

console.log(`Safety Score: ${safeRoute.total_score}/100`);
console.log(`Risk Level: ${safeRoute.risk.toFixed(3)}`);
console.log(`Safety Level: ${safetyScoreService.getSafetyLevel(safeRoute.total_score)}`);
console.log('\nRisk Breakdown:');
console.log(`  Crime:    ${(safeRoute.breakdown.crime_risk * 100).toFixed(1)}%`);
console.log(`  Location: ${(safeRoute.breakdown.location_risk * 100).toFixed(1)}%`);
console.log(`  Time:     ${(safeRoute.breakdown.time_risk * 100).toFixed(1)}%`);
console.log(`  Weather:  ${(safeRoute.breakdown.weather_risk * 100).toFixed(1)}%`);
console.log(`  Battery:  ${(safeRoute.breakdown.battery_risk * 100).toFixed(1)}%`);
console.log('\nRecommendations:');
safetyScoreService.getRecommendations(safeRoute).forEach(r => console.log(`  • ${r}`));

// Test Case 2: Risky late night route
console.log('\n\n📍 Test Case 2: Risky Late Night Route');
console.log('-'.repeat(60));
const riskyRoute = await safetyScoreService.calculateSafetyScore({
  crime: {
    incidents_per_1000: 35, // High crime
    baseline: 10,
    scale: 15
  },
  location: {
    latitude: 30.6280,
    longitude: -96.3344,
    population_density: 50, // Isolated
    recent_incidents: 5,
    safe_spaces_count: 1,
    public_transport_stops: 0,
    is_isolated: true
  },
  time: {
    hour: 2, // 2 AM
    sunrise_hour: 6,
    sunset_hour: 19
  },
  weather: {
    severe_alert: false,
    precipitation_probability: 60,
    wind_speed: 20,
    visibility_loss: 0.4
  },
  battery: {
    battery_percent: 15,
    is_charging: false
  }
});

console.log(`Safety Score: ${riskyRoute.total_score}/100`);
console.log(`Risk Level: ${riskyRoute.risk.toFixed(3)}`);
console.log(`Safety Level: ${safetyScoreService.getSafetyLevel(riskyRoute.total_score)}`);
console.log('\nRisk Breakdown:');
console.log(`  Crime:    ${(riskyRoute.breakdown.crime_risk * 100).toFixed(1)}%`);
console.log(`  Location: ${(riskyRoute.breakdown.location_risk * 100).toFixed(1)}%`);
console.log(`  Time:     ${(riskyRoute.breakdown.time_risk * 100).toFixed(1)}%`);
console.log(`  Weather:  ${(riskyRoute.breakdown.weather_risk * 100).toFixed(1)}%`);
console.log(`  Battery:  ${(riskyRoute.breakdown.battery_risk * 100).toFixed(1)}%`);
console.log('\nRecommendations:');
safetyScoreService.getRecommendations(riskyRoute).forEach(r => console.log(`  • ${r}`));

// Test Case 3: Severe weather alert
console.log('\n\n📍 Test Case 3: Severe Weather Alert');
console.log('-'.repeat(60));
const severeWeather = await safetyScoreService.calculateSafetyScore({
  crime: {
    incidents_per_1000: 12,
    baseline: 10,
    scale: 15
  },
  location: {
    latitude: 30.6280,
    longitude: -96.3344,
    population_density: 500,
    recent_incidents: 1,
    safe_spaces_count: 5,
    public_transport_stops: 3,
    is_isolated: false
  },
  time: {
    hour: 16, // 4 PM
    sunrise_hour: 6,
    sunset_hour: 19
  },
  weather: {
    severe_alert: true, // SEVERE WEATHER!
    precipitation_probability: 100,
    wind_speed: 45,
    visibility_loss: 0.8
  },
  battery: {
    battery_percent: 70,
    is_charging: false
  }
});

console.log(`Safety Score: ${severeWeather.total_score}/100`);
console.log(`Risk Level: ${severeWeather.risk.toFixed(3)}`);
console.log(`Safety Level: ${safetyScoreService.getSafetyLevel(severeWeather.total_score)}`);
console.log('\nRisk Breakdown:');
console.log(`  Crime:    ${(severeWeather.breakdown.crime_risk * 100).toFixed(1)}%`);
console.log(`  Location: ${(severeWeather.breakdown.location_risk * 100).toFixed(1)}%`);
console.log(`  Time:     ${(severeWeather.breakdown.time_risk * 100).toFixed(1)}%`);
console.log(`  Weather:  ${(severeWeather.breakdown.weather_risk * 100).toFixed(1)}% ⚠️ SEVERE ALERT`);
console.log(`  Battery:  ${(severeWeather.breakdown.battery_risk * 100).toFixed(1)}%`);
console.log('\nRecommendations:');
safetyScoreService.getRecommendations(severeWeather).forEach(r => console.log(`  • ${r}`));

// Test Case 4: Low battery while charging
console.log('\n\n📍 Test Case 4: Low Battery (Charging)');
console.log('-'.repeat(60));
const charging = await safetyScoreService.calculateSafetyScore({
  crime: {
    incidents_per_1000: 10,
    baseline: 10,
    scale: 15
  },
  location: {
    latitude: 30.6280,
    longitude: -96.3344,
    population_density: 600,
    recent_incidents: 1,
    safe_spaces_count: 7,
    public_transport_stops: 4,
    is_isolated: false
  },
  time: {
    hour: 12,
    sunrise_hour: 6,
    sunset_hour: 19
  },
  weather: {
    severe_alert: false,
    precipitation_probability: 20,
    wind_speed: 8,
    visibility_loss: 0.05
  },
  battery: {
    battery_percent: 5, // Very low!
    is_charging: true // But charging!
  }
});

console.log(`Safety Score: ${charging.total_score}/100`);
console.log(`Risk Level: ${charging.risk.toFixed(3)}`);
console.log(`Safety Level: ${safetyScoreService.getSafetyLevel(charging.total_score)}`);
console.log('\nRisk Breakdown:');
console.log(`  Crime:    ${(charging.breakdown.crime_risk * 100).toFixed(1)}%`);
console.log(`  Location: ${(charging.breakdown.location_risk * 100).toFixed(1)}%`);
console.log(`  Time:     ${(charging.breakdown.time_risk * 100).toFixed(1)}%`);
console.log(`  Weather:  ${(charging.breakdown.weather_risk * 100).toFixed(1)}%`);
console.log(`  Battery:  ${(charging.breakdown.battery_risk * 100).toFixed(1)}% (charging = 0 risk)`);
console.log('\nRecommendations:');
safetyScoreService.getRecommendations(charging).forEach(r => console.log(`  • ${r}`));

console.log('\n' + '='.repeat(60));
console.log('✅ All tests completed!\n');
