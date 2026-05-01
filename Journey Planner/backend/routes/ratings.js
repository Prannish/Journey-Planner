const express = require('express');
const db = require('../config/database');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Submit or update rating
router.post('/', auth, async (req, res) => {
  try {
    const { place_id, rating } = req.body;
    const user_id = req.user.id;

    if (!place_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Valid place_id and rating (1-5) are required' });
    }

    await db.execute(`
      INSERT INTO place_ratings (user_id, place_id, rating) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE rating = VALUES(rating), updated_at = CURRENT_TIMESTAMP
    `, [user_id, place_id, rating]);

    const [avgResult] = await db.execute(`
      SELECT AVG(rating) as avg_rating FROM place_ratings WHERE place_id = ?
    `, [place_id]);

    const avgRating = parseFloat(avgResult[0].avg_rating).toFixed(1);

    await db.execute(`UPDATE places SET rating = ? WHERE id = ?`, [avgRating, place_id]);

    res.json({ message: 'Rating submitted successfully', avgRating });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ message: 'Failed to submit rating', error: error.message });
  }
});

// Get user's rating for a place
router.get('/user/:placeId', auth, async (req, res) => {
  try {
    const { placeId } = req.params;
    const user_id = req.user.id;

    const [result] = await db.execute(
      'SELECT rating FROM place_ratings WHERE user_id = ? AND place_id = ?',
      [user_id, placeId]
    );

    res.json({ userRating: result[0]?.rating || null });
  } catch (error) {
    console.error('Failed to get user rating:', error);
    res.status(500).json({ message: 'Failed to get user rating', error: error.message });
  }
});

module.exports = router;