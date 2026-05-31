const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Check if a specific recipe is favorited by the current user
router.get('/check/:recipeId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user;
    const { recipeId } = req.params;

    const result = await pool.query(
      'SELECT 1 FROM favorites WHERE user_id = $1 AND recipe_id = $2',
      [userId, recipeId]
    );

    res.json({ isFavorited: result.rows.length > 0 });
  } catch (err) {
    console.error("Error checking favorite status:", err.message);
    res.status(500).send("Server Error");
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user;

    const result = await pool.query(
      `SELECT r.* FROM recipes r
       JOIN favorites f ON r.id = f.recipe_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching favorites:", err.message);
    res.status(500).send("Server Error");
  }
});

router.post('/:recipeId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user;
    const { recipeId } = req.params;

    await pool.query(
      'INSERT INTO favorites (user_id, recipe_id) VALUES ($1, $2) ON CONFLICT (user_id, recipe_id) DO NOTHING',
      [userId, recipeId]
    );

    res.json({ success: true, message: "Added to favorites" });
  } catch (err) {
    console.error("Error adding favorite:", err.message);
    res.status(500).send("Server Error");
  }
});

router.delete('/:recipeId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user;
    const { recipeId } = req.params;

    await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND recipe_id = $2',
      [userId, recipeId]
    );

    res.json({ success: true, message: "Removed from favorites" });
  } catch (err) {
    console.error("Error removing favorite:", err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;