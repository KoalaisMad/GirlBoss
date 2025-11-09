/**
 * Direct test of Databricks integration
 * Run with: npx ts-node test-databricks-direct.ts
 */

import { predictRouteSafety } from './src/services/databricksService';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from parent directory (girl-boss/.env)
const envPath = path.resolve(__dirname, '..', '.env');
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

async function testDatabricks() {
  console.log('🧪 Testing Databricks ML Integration...\n');
  
  console.log('Environment check:');
  console.log(`  DATABRICKS_MODEL_URL: ${process.env.DATABRICKS_MODEL_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`  DATABRICKS_TOKEN: ${process.env.DATABRICKS_TOKEN ? '✅ Set' : '❌ Missing'}\n`);
  
  if (!process.env.DATABRICKS_MODEL_URL || !process.env.DATABRICKS_TOKEN) {
    console.error('❌ Databricks credentials not configured!');
    process.exit(1);
  }
  
  try {
    console.log('📍 Testing route: College Station → HEB');
    console.log('  Start: (30.6212, -96.3424)');
    console.log('  End: (30.6119, -96.3185)');
    console.log('  Mode: walking');
    console.log('  Time: 10:00 AM\n');
    
    const prediction = await predictRouteSafety(
      30.6212,
      -96.3424,
      30.6119,
      -96.3185,
      '10:00',
      'walking'
    );
    
    console.log('\n✅ Databricks Response:');
    console.log(`  Safety Score: ${prediction.safetyScore}/100`);
    console.log(`  Risk Level: ${prediction.riskLevel}`);
    console.log(`  Confidence: ${prediction.confidence}`);
    console.log(`  Factors:`);
    prediction.factors.forEach(f => console.log(`    - ${f}`));
    
    console.log('\n✅ Databricks integration is working!');
    
  } catch (error: any) {
    console.error('\n❌ Databricks test failed:');
    console.error(`  Error: ${error.message}`);
    console.error(`  Stack: ${error.stack}`);
    process.exit(1);
  }
}

testDatabricks();
