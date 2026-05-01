const express = require('express');
const db = require('../config/database');
const upload = require('../config/upload');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Get all places
router.get('/places', auth, adminAuth, async (req, res) => {
  try {
    const [places] = await db.execute(`
      SELECT p.*, c.name as city_name 
      FROM places p 
      JOIN cities c ON p.city_id = c.id
    `);
    res.json(places);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch places', error: error.message });
  }
});

// Add new place with image
router.post('/places', auth, adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { city_id, name, type, description, price, latitude, longitude } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const cleanData = {
      city_id: city_id || null,
      name: name || null,
      type: type || null,
      description: description || null,
      price: price || null,
      latitude: latitude || null,
      longitude: longitude || null,
      image_url
    };
    const [result] = await db.execute(
      'INSERT INTO places (city_id, name, type, description, price, rating, latitude, longitude, image_url) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)',
      [cleanData.city_id, cleanData.name, cleanData.type, cleanData.description, cleanData.price, cleanData.latitude, cleanData.longitude, cleanData.image_url]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Place added successfully' });
  } catch (error) {
    console.error('Backend error:', error);
    res.status(400).json({ message: 'Failed to add place', error: error.message });
  }
});

// Update place
router.put('/places/:id', auth, adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { city_id, name, type, description, price, latitude, longitude } = req.body;
    const cleanData = {
      city_id: city_id || null,
      name: name || null,
      type: type || null,
      description: description || null,
      price: price || null,
      latitude: latitude || null,
      longitude: longitude || null
    };
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    let query, params;
    
    if (image_url) {
      // Update with new image
      query = 'UPDATE places SET city_id = ?, name = ?, type = ?, description = ?, price = ?, latitude = ?, longitude = ?, image_url = ? WHERE id = ?';
      params = [cleanData.city_id, cleanData.name, cleanData.type, cleanData.description, cleanData.price, cleanData.latitude, cleanData.longitude, image_url, id];
    } else {
      // Update without changing image
      query = 'UPDATE places SET city_id = ?, name = ?, type = ?, description = ?, price = ?, latitude = ?, longitude = ? WHERE id = ?';
      params = [cleanData.city_id, cleanData.name, cleanData.type, cleanData.description, cleanData.price, cleanData.latitude, cleanData.longitude, id];
    }
    
    await db.execute(query, params);
    res.json({ message: 'Place updated successfully' });
  } catch (error) {
    console.error('Update error:', error);
    res.status(400).json({ message: 'Failed to update place', error: error.message });
  }
});

// Delete place
router.delete('/places/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM places WHERE id = ?', [id]);
    res.json({ message: 'Place deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to delete place', error: error.message });
  }
});

// Get all users (admin only)
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT u.id, u.name, u.email, u.role, u.created_at,
             COUNT(t.id) as itinerary_count
      FROM users u
      LEFT JOIN trips t ON u.id = t.user_id
      WHERE u.role = "USER"
      GROUP BY u.id, u.name, u.email, u.role, u.created_at
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM users WHERE id = ? AND role = "USER"', [id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

module.exports = router;