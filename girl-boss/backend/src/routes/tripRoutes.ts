import express, { Request, Response } from 'express';
import { createTrip, getTripsByUserEmail, getUserTrips, getTripById } from '../services/mongoTripService';
import { getUserByEmail } from '../services/mongoUserService';
import { ObjectId } from 'mongodb';

const router = express.Router();

// POST /api/trips - Create a new trip
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, destination, startLocation, transportMode } = req.body;

    if (!email || !destination) {
      return res.status(400).json({ error: 'Email and destination are required' });
    }

    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('📍 Creating trip for user:', email);
    console.log('   Destination:', destination.name);

    // Extract street address (first two parts: number + street name)
    const fullAddress = destination.address || destination.name;
    const addressParts = fullAddress.split(',').map((part: string) => part.trim());
    const streetAddress = addressParts.length > 1 
      ? `${addressParts[0]} ${addressParts[1]}`.trim()  // "125" + "Spence Street"
      : addressParts[0];  // Fallback to first part only

    // Create trip
    const trip = await createTrip({
      userId: new ObjectId(user._id),
      startLocation: {
        lat: startLocation?.lat || 0,
        lon: startLocation?.lon || 0,
        address: startLocation?.address || 'Current Location',
        name: 'Current Location',
      },
      endLocation: {
        lat: destination.lat || 0,
        lon: destination.lon || 0,
        name: destination.name,
        address: streetAddress,
      },
      transportMode: transportMode || 'walking',
      safetyScore: 85, // Default safety score
      distance: destination.distance || 0,
      duration: 0,
      startTime: new Date(),
      status: 'active',
    });

    console.log('✅ Trip created:', trip._id);

    res.json({
      success: true,
      trip: {
        _id: trip._id,
        location: destination.name,
        address: streetAddress,
        date: trip.startTime.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      },
    });
  } catch (error: any) {
    console.error('❌ Create trip error:', error);
    res.status(500).json({ error: 'Failed to create trip', message: error.message });
  }
});

// GET /api/trips/user/:email - Get user's recent trips
router.get('/user/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const limit = parseInt(req.query.limit as string) || 3;

    console.log('📋 Fetching trips for:', email, 'limit:', limit);

    const trips = await getTripsByUserEmail(email, limit);

    // Format trips for frontend
    const formattedTrips = trips.map(trip => ({
      _id: trip._id,
      location: trip.endLocation.name || trip.endLocation.address || 'Unknown Location',
      address: trip.endLocation.address || 'Unknown Address',
      date: trip.startTime.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      transportMode: trip.transportMode,
      safetyScore: trip.safetyScore,
    }));

    console.log('✅ Found', formattedTrips.length, 'trips');

    res.json({
      success: true,
      trips: formattedTrips,
    });
  } catch (error: any) {
    console.error('❌ Get trips error:', error);
    res.status(500).json({ error: 'Failed to get trips', message: error.message });
  }
});

// GET /api/trips/:id - Get trip by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const trip = await getTripById(id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(trip);
  } catch (error: any) {
    console.error('Get trip error:', error);
    res.status(500).json({ error: 'Failed to get trip', message: error.message });
  }
});

export default router;

