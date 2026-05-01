const express = require('express');
const db = require('../config/database');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get all cities
router.get('/cities', async (req, res) => {
  try {
    const [cities] = await db.execute('SELECT * FROM cities');
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cities', error: error.message });
  }
});

// Get places by city
router.get('/places/city/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    const { type } = req.query;
    
    let query = 'SELECT * FROM places WHERE city_id = ?';
    let params = [cityId];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    const [places] = await db.execute(query, params);
    res.json(places);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch places', error: error.message });
  }
});

module.exports = router;