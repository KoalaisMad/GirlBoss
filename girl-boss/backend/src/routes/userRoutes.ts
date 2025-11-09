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
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existing = await getUserByEmail(email);
    if (existing) return res.json(existing);
    const user = await createUser({
      name,
      email,
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
router.post('/:id/contacts', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const user = await addEmergencyContact(id, { name, phone });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Contact added (alias route)',
      contacts: user.emergencyContacts
    });
  } catch (error: any) {
    console.error('Alias contact error:', error);
    res.status(500).json({ error: 'Failed to add contact', message: error.message });
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

router.patch('/:id/contacts/:contactId', async (req: Request, res: Response) => {
  try {
    const { id, contactId } = req.params;
    const updates = req.body;

    // Fetch user
    const user = await getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Find contact index
    const contactIndex = user.emergencyContacts.findIndex(c => (c as any)._id?.toString() === contactId);
    if (contactIndex === -1) return res.status(404).json({ error: 'Contact not found' });

    // Update fields
    user.emergencyContacts[contactIndex] = { ...user.emergencyContacts[contactIndex], ...updates };
    await updateUser(id, { emergencyContacts: user.emergencyContacts });

    res.json(user.emergencyContacts[contactIndex]);
  } catch (error: any) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact', message: error.message });
  }
});

// DELETE /api/users/:id/contacts/:contactId - Delete a contact
router.delete('/:id/contacts/:contactId', async (req: Request, res: Response) => {
  try {
    const { id, contactId } = req.params;

    const user = await getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const filteredContacts = user.emergencyContacts.filter(
      c => (c as any)._id?.toString() !== contactId
    );

    if (filteredContacts.length === user.emergencyContacts.length) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await updateUser(id, { emergencyContacts: filteredContacts });

    res.json({ message: 'Contact deleted', contacts: filteredContacts });
  } catch (error: any) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact', message: error.message });
  }
});

export default router;
