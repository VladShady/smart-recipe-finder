const express = require('express');
const pool = require('../config/db');

const router = express.Router();

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
let categoriesCache = { data: null, timestamp: 0 };

// Retrieve unique recipe categories
router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    
    if (categoriesCache.data && (now - categoriesCache.timestamp < CACHE_DURATION)) {
      return res.json(categoriesCache.data);
    }

    const categories = await pool.query(
      'SELECT DISTINCT description FROM recipes WHERE description IS NOT NULL ORDER BY description'
    );
    const data = categories.rows.map(row => row.description);
    
    categoriesCache = { data, timestamp: now };
    
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Retrieve categories applicable to the user's current pantry selection
router.post('/available', async (req, res) => {
  try {
    const { ingredientIds } = req.body;
    
    if (!ingredientIds || ingredientIds.length === 0) {
      return res.json([]);
    }

    const query = `
      SELECT DISTINCT r.description as category
      FROM recipes r
      JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      WHERE ri.ingredient_id = ANY($1)
      AND r.description IS NOT NULL
      ORDER BY r.description
    `;

    const result = await pool.query(query, [ingredientIds]);
    res.json(result.rows.map(row => row.category));
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;