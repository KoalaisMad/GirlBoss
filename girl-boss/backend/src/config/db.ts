/**
 * �️ MONGODB CONFIGURATION
 * 
 * This file handles the connection to MongoDB Atlas.
 * 
 * IMPLEMENTATION CHECKLIST:
 * 
 * 1. SET UP MONGODB ATLAS:
 *    Create account at https://www.mongodb.com/cloud/atlas
 *    Create free M0 cluster (512MB, perfect for development)
 *    Add database user with username/password
 *    Whitelist your IP or allow from anywhere (0.0.0.0/0)
 *    Get connection string from "Connect" → "Drivers"
 * 
 * 2. UPDATE .env FILE:
 *    Replace this: mongodb://localhost:27017/girlboss
 *    With this: mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/girlboss?retryWrites=true&w=majority
 * 
 * 3. CREATE COLLECTIONS (run these in MongoDB Atlas UI or MongoDB Compass):
 *    
 *    // Users collection
 *    db.createCollection("users");
 *    db.users.createIndex({ email: 1 }, { unique: true });
 *    
 *    // Trips collection  
 *    db.createCollection("trips");
 *    db.trips.createIndex({ userId: 1 });
 *    db.trips.createIndex({ startTime: -1 });
 * 
 * 4. SAMPLE DATA STRUCTURE:
 *    
 *    // users collection document:
 *    {
 *      _id: ObjectId("..."),
 *      name: "Jane Doe",
 *      email: "jane@example.com",
 *      phone: "+1234567890",
 *      emergencyContacts: [
 *        { name: "Mom", phone: "+1987654321", relationship: "mother" }
 *      ],
 *      preferences: {
 *        transportMode: "walking",
 *        safetyThreshold: 70
 *      },
 *      createdAt: ISODate("2024-01-01T00:00:00Z")
 *    }
 *    
 *    // trips collection document:
 *    {
 *      _id: ObjectId("..."),
 *      userId: ObjectId("..."),
 *      startLocation: { lat: 30.6187, lon: -96.3365 },
 *      endLocation: { lat: 30.6280, lon: -96.3344 },
 *      transportMode: "walking",
 *      safetyScore: 85,
 *      distance: 1200,
 *      duration: 900,
 *      status: "completed",
 *      startTime: ISODate("2024-01-01T10:00:00Z"),
 *      endTime: ISODate("2024-01-01T10:15:00Z")
 *    }
 * 
 * 5. USED BY THESE FILES:
 *    - src/services/mongoUserService.ts (user operations)
 *    - src/services/mongoTripService.ts (trip operations)
 *    - src/routes/userRoutes.ts (user endpoints)
 *    - src/routes/planningRoutes.ts (trip creation)
 * 
 * 6. TESTING:
 *    After setup, test connection:
 *    - Start backend: npm run dev
 *    - Look for: "MongoDB connected" in logs
 *    - If error, check: connection string, network access, credentials
 */

// import { MongoClient, Db } from 'mongodb';

// let db: Db | null = null;
// let client: MongoClient | null = null;

// export const connectMongoDB = async (): Promise<Db> => {
//   if (db) {
//     return db;
//   }

//   try {
//     const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/girlboss';
    
//     client = new MongoClient(uri);
//     await client.connect();
    
//     db = client.db();
//     console.log('Connected to MongoDB');
    
//     return db;
//   } catch (error) {
//     console.error('MongoDB connection error:', error);
//     throw error;
//   }
// };

// export const getDB = (): Db => {
//   if (!db) {
//     throw new Error('Database not initialized. Call connectMongoDB first.');
//   }
//   return db;
// };

// export const closeMongoDB = async (): Promise<void> => {
//   if (client) {
//     await client.close();
//     db = null;
//     client = null;
//     console.log('MongoDB connection closed');
//   }
// };

import mongoose from "mongoose";

const uri = process.env.MONGODB_URI!; 

export async function connectToMongoDB() 
{ try 
  { if (mongoose.connection.readyState === 0) 
    { 
      await mongoose.connect(uri); console.log("Connected to MongoDB Atlas"); 
    } 
  } catch (error) { 
    console.error("MongoDB connection error:", error); 
  } 
}
