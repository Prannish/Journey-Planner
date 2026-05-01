const express = require('express');
const db = require('../config/database');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Save trip to database
router.post('/', auth, async (req, res) => {
  try {
    const { tripName, cityId, days, budget, startDate, endDate, places, totalCost } = req.body;
    const userId = req.user.id;

    if (!tripName || !cityId || !days || !budget || !startDate || !endDate) {
      const missing = ['tripName','cityId','days','budget','startDate','endDate'].filter(f => !req.body[f]);
      return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
    }

    const values = [
      userId,
      parseInt(cityId),
      String(tripName),
      parseFloat(budget),
      parseFloat(totalCost) || 0,
      parseInt(days),
      String(startDate).split('T')[0],
      String(endDate).split('T')[0]
    ];

    const [tripResult] = await db.execute(
      'INSERT INTO trips (user_id, city_id, trip_name, budget, total_cost, days, start_date, end_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      values
    );

    const tripId = tripResult.insertId;

    if (places && places.length > 0) {
      const uniquePlaceIds = [...new Set(places.map(p => p.id).filter(id => id !== undefined && id !== null))];
      for (const placeId of uniquePlaceIds) {
        await db.execute(
          'INSERT INTO trip_places (trip_id, place_id) VALUES (?, ?)',
          [tripId, parseInt(placeId)]
        );
      }
    }

    res.status(201).json({ success: true, tripId, message: 'Trip saved successfully' });
  } catch (error) {
    console.error('Error saving trip:', error);
    res.status(500).json({ success: false, message: 'Failed to create trip', error: error.message });
  }
});

// Get user trips
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [tripsData] = await db.execute(`
      SELECT t.id, t.trip_name, t.budget, t.total_cost, t.days, t.start_date, t.end_date, t.created_at,
             c.name as city_name, c.id as city_id,
             COUNT(tp.id) as places_count
      FROM trips t
      JOIN cities c ON t.city_id = c.id
      LEFT JOIN trip_places tp ON t.id = tp.trip_id
      WHERE t.user_id = ?
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `, [userId]);

    // Fetch places for each trip
    const tripsWithPlaces = await Promise.all(tripsData.map(async (trip) => {
      const [places] = await db.execute(`
        SELECT p.* FROM places p
        JOIN trip_places tp ON p.id = tp.place_id
        WHERE tp.trip_id = ?
      `, [trip.id]);
      return { ...trip, places };
    }));

    res.json({ success: true, data: tripsWithPlaces });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trips' });
  }
});

// Delete trip
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify trip belongs to user
    const [trip] = await db.execute('SELECT id FROM trips WHERE id = ? AND user_id = ?', [id, userId]);
    if (trip.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Delete trip (trip_places will be deleted automatically due to CASCADE)
    await db.execute('DELETE FROM trips WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ success: false, message: 'Failed to delete trip' });
  }
});

module.exports = router;