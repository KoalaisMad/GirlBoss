/**
 * Test Safety Score Differences by Transport Mode
 * 
 * This script demonstrates how safety scores vary based on transportation mode.
 * Run with: npx ts-node test-transport-modes.ts
 */

import safetyScoreService from './src/services/safetyScoreService';

// Sample scenario: Late night trip in moderately risky area with low battery
const testScenario = {
  crime: {
    incidents_per_1000: 18, // Slightly above baseline
    baseline: 10,
    scale: 15
  },
  location: {
    latitude: 30.2672,
    longitude: -97.7431,
    population_density: 800,
    recent_incidents: 3,
    safe_spaces_count: 2,
    public_transport_stops: 1,
    is_isolated: false
  },
  time: {
    hour: 23 // 11 PM - risky time
  },
  weather: {
    severe_alert: false,
    precipitation_probability: 30,
    wind_speed: 12,
    visibility_loss: 0.2
  },
  battery: {
    battery_percent: 15, // Low battery
    is_charging: false
  }
};

console.log('🧪 Testing Safety Scores Across Transport Modes\n');
console.log('Scenario: Late night (11 PM), low battery (15%), moderate crime area\n');
console.log('='.repeat(80));

const modes: Array<'walking' | 'driving' | 'transit' | 'bicycling'> = ['walking', 'bicycling', 'transit', 'driving'];

(async () => {
  for (const mode of modes) {
    const result = await safetyScoreService.calculateSafetyScore({
      ...testScenario,
      transport_mode: mode
    });

    console.log(`\n🚶 ${mode.toUpperCase()}`);
    console.log('-'.repeat(80));
    console.log(`Safety Score: ${result.total_score}/100 (${safetyScoreService.getSafetyLevel(result.total_score)})`);
    console.log(`Total Risk: ${(result.risk * 100).toFixed(1)}%`);
    console.log('\nRisk Breakdown:');
    console.log(`  Crime:    ${(result.breakdown.crime_risk * 100).toFixed(1)}% (weight: ${(result.weights.crime * 100).toFixed(0)}%)`);
    console.log(`  Location: ${(result.breakdown.location_risk * 100).toFixed(1)}% (weight: ${(result.weights.location * 100).toFixed(0)}%)`);
    console.log(`  Time:     ${(result.breakdown.time_risk * 100).toFixed(1)}% (weight: ${(result.weights.time * 100).toFixed(0)}%)`);
    console.log(`  Weather:  ${(result.breakdown.weather_risk * 100).toFixed(1)}% (weight: ${(result.weights.weather * 100).toFixed(0)}%)`);
    console.log(`  Battery:  ${(result.breakdown.battery_risk * 100).toFixed(1)}% (weight: ${(result.weights.battery * 100).toFixed(0)}%)`);

    const recommendations = safetyScoreService.getRecommendations(result);
    console.log('\n💡 Recommendations:');
    recommendations.forEach(rec => console.log(`  • ${rec}`));
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Key Insights:');
  console.log('  • WALKING: Highest vulnerability to crime and time-of-day factors');
  console.log('  • BICYCLING: Higher weather risk, moderate crime vulnerability');
  console.log('  • TRANSIT: Lower crime/location risk, higher battery dependency');
  console.log('  • DRIVING: Safest overall, but weather and battery are critical\n');

  // Comparison test
  console.log('='.repeat(80));
  console.log('\n🔄 Same Scenario, Different Times of Day:\n');

  const times = [
    { hour: 3, label: 'Late Night (3 AM)' },
    { hour: 8, label: 'Morning (8 AM)' },
    { hour: 14, label: 'Afternoon (2 PM)' },
    { hour: 22, label: 'Evening (10 PM)' }
  ];

  for (const { hour, label } of times) {
    console.log(`\n${label}:`);
    for (const mode of modes) {
      const result = await safetyScoreService.calculateSafetyScore({
        ...testScenario,
        time: { hour },
        transport_mode: mode
      });
      console.log(`  ${mode.padEnd(10)}: ${result.total_score}/100`);
    }
  }

  console.log('\n');
})();
