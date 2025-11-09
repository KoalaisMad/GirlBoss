/**
 * SNOWFLAKE DATA WAREHOUSE CONFIGURATION
 * 
 * This file connects to Snowflake for historical safety data queries.
 * 
 * IMPLEMENTATION CHECKLIST:
 * 
 * 1. SET UP SNOWFLAKE ACCOUNT:
 *    Sign up at https://signup.snowflake.com/ (30-day free trial)
 *    Choose cloud provider (AWS/Azure/GCP) and region
 *    Note your account identifier (e.g., "abc12345.us-east-1.aws")
 *    Create database user with password
 * 
 * 2. CREATE DATABASE SCHEMA:
 *    Run these SQL commands in Snowflake UI:
 *    
 *    -- Create database
 *    CREATE DATABASE SAFETY_DB;
 *    USE DATABASE SAFETY_DB;
 *    
 *    -- Create warehouse for compute
 *    CREATE WAREHOUSE COMPUTE_WH 
 *    WITH WAREHOUSE_SIZE = 'X-SMALL'
 *    AUTO_SUSPEND = 60
 *    AUTO_RESUME = TRUE;
 *    
 *    -- Create schema
 *    CREATE SCHEMA PUBLIC;
 *    USE SCHEMA PUBLIC;
 * 
 * 3. CREATE TABLES FOR SAFETY DATA:
 *    
 *    -- Historical incidents table
 *    CREATE TABLE incident_history (
 *      incident_id VARCHAR(50) PRIMARY KEY,
 *      incident_date DATE NOT NULL,
 *      incident_time TIME,
 *      location_name VARCHAR(200),
 *      latitude FLOAT NOT NULL,
 *      longitude FLOAT NOT NULL,
 *      incident_type VARCHAR(50),  -- 'theft', 'assault', 'vandalism', etc.
 *      severity VARCHAR(20),        -- 'low', 'medium', 'high'
 *      description TEXT,
 *      weather_condition VARCHAR(50),
 *      time_of_day VARCHAR(20),     -- 'morning', 'afternoon', 'evening', 'night'
 *      day_of_week VARCHAR(20),
 *      reported_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
 *    );
 *    
 *    -- Aggregated safety scores by location
 *    CREATE TABLE location_safety_scores (
 *      location_id VARCHAR(50) PRIMARY KEY,
 *      latitude FLOAT NOT NULL,
 *      longitude FLOAT NOT NULL,
 *      radius_km FLOAT DEFAULT 0.5,
 *      safety_score INT,            -- 0-100
 *      incident_count INT,
 *      last_incident_date DATE,
 *      trend VARCHAR(20),            -- 'improving', 'stable', 'worsening'
 *      updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
 *    );
 *    
 *    -- Create indexes for better query performance
 *    CREATE INDEX idx_incident_location ON incident_history(latitude, longitude);
 *    CREATE INDEX idx_incident_date ON incident_history(incident_date);
 * 
 * 4. LOAD SAMPLE DATA:
 *    INSERT INTO incident_history VALUES
 *    ('INC001', '2024-01-01', '22:30:00', 'Downtown', 30.6187, -96.3365, 
 *     'theft', 'low', 'Bike theft', 'clear', 'night', 'Monday', CURRENT_TIMESTAMP());
 * 
 * 5. UPDATE .env FILE:
 *    SNOWFLAKE_ACCOUNT=abc12345.us-east-1.aws
 *    SNOWFLAKE_USER=your_username
 *    SNOWFLAKE_PASSWORD=your_password
 *    SNOWFLAKE_DB=SAFETY_DB
 *    SNOWFLAKE_SCHEMA=PUBLIC
 *    SNOWFLAKE_WAREHOUSE=COMPUTE_WH
 * 
 * 6. USED BY THESE FILES:
 *    - src/services/snowflakeService.ts (execute queries)
 *    - src/mcp/tools/getPlaceSafetyHistory.ts (historical data)
 *    - src/mcp/tools/getRouteSafety.ts (safety scoring)
 */

import snowflake from 'snowflake-sdk';

let connection: any = null;

export const getSnowflakeConnection = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (connection && connection.isUp()) {
      return resolve(connection);
    }

    connection = snowflake.createConnection({
      account: process.env.SNOWFLAKE_ACCOUNT || '',
      username: process.env.SNOWFLAKE_USER || '',
      password: process.env.SNOWFLAKE_PASSWORD || '',
      database: process.env.SNOWFLAKE_DB || '',
      schema: process.env.SNOWFLAKE_SCHEMA || '',
      warehouse: process.env.SNOWFLAKE_WAREHOUSE || '',
    });

    connection.connect((err: Error, conn: any) => {
      if (err) {
        console.error('❌ Snowflake connection error:', err);
        return reject(err);
      }
      console.log('✅ Connected to Snowflake');
      resolve(conn);
    });
  });
};

export const executeSnowflakeQuery = async (query: string): Promise<any[]> => {
  const conn = await getSnowflakeConnection();
  
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText: query,
      complete: (err: Error, stmt: any, rows: any[]) => {
        if (err) {
          console.error('Snowflake query error:', err);
          return reject(err);
        }
        resolve(rows || []);
      }
    });
  });
};
