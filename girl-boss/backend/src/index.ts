// Main server file - starts the Express app
// this runs on port 4000 and handles all the backend stuff

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToMongoDB } from './config/db';
import planningRoutes from './routes/planningRoutes';
import yappingRoutes from './routes/yappingRoutes';
import chatbotRoutes from './routes/chatbotRoutes';
import userRoutes from './routes/userRoutes';
import emergencyRoutes from './routes/emergencyRoutes';
import tripRoutes from './routes/tripRoutes';

// load env vars from .env file
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4000;

// setup middleware - basically just CORS and JSON parsing
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// simple health check so we know server is alive
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'GirlBoss Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// all the API routes
app.use('/api/plan', planningRoutes);
app.use('/api/yap', yappingRoutes);
app.use('/api/chat', chatbotRoutes);
app.use('/api/users', userRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/trips', tripRoutes);

// handle 404s
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// catch errors so server doesn't crash
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// start the server!
const startServer = async () => {
  try {
    // try to connect to MongoDB but keep going if it fails
    // (helpful for testing without DB)
    try {
      await connectToMongoDB();
      console.log('MongoDB connected');
    } catch (dbError) {
      console.warn('MongoDB not connected - some features will use mock data');
      console.warn('   To enable full features, configure MongoDB in .env');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 GirlBoss Backend running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
