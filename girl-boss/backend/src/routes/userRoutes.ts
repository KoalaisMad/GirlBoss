/**
 * USER ROUTES
 * 
 * Endpoints for user management and authentication.
 */

import express, { Request, Response } from 'express';
import {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  addEmergencyContact
} from '../services/mongoUserService';
import { getUserProfile } from '../mcp/tools/getUserProfile';

const router = express.Router();

// POST /api/users - Create new user
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, preferences } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const user = await createUser({
      name,
      email,
      phone,
      preferences
    });

    res.status(201).json({
      userId: user._id,
      name: user.name,
      email: user.email
    });
  } catch (error: any) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Failed to create user', message: error.message });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user', message: error.message });
  }
});

// GET /api/users/email/:email - Get user by email
router.get('/email/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user', message: error.message });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await updateUser(id, updates);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Failed to update user', message: error.message });
  }
});

// POST /api/users/:id/emergency-contacts - Add emergency contact
router.post('/:id/emergency-contacts', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, relationship } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const user = await addEmergencyContact(id, { name, phone, relationship });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Emergency contact added',
      contacts: user.emergencyContacts
    });
  } catch (error: any) {
    console.error('Emergency contact error:', error);
    res.status(500).json({ error: 'Failed to add emergency contact', message: error.message });
  }
});

// GET /api/users/:id/profile - Get full profile with MCP context
router.get('/:id/profile', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const profile = await getUserProfile(id);

    res.json(profile);
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile', message: error.message });
  }
});

export default router;
