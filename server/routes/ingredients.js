const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const allIngredients = await pool.query('SELECT * FROM ingredients');
    res.json(allIngredients.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Autocomplete search
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);
    
    const sqlQuery = `
      SELECT * FROM ingredients 
      WHERE name ILIKE $1 
      ORDER BY 
        CASE WHEN name ILIKE $2 THEN 0 ELSE 1 END,
        CASE WHEN name ILIKE $3 THEN 0 ELSE 1 END,
        LENGTH(name) ASC
      LIMIT 10
    `;

    const result = await pool.query(sqlQuery, [
      `%${query}%`, 
      query,        
      `${query}%`   
    ]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;