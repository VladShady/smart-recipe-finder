const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.SERVER_PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running. API is ready.');
});

app.get('/api/ingredients', async (req, res) => {
  try {
    const allIngredients = await pool.query('SELECT * FROM ingredients');
    res.json(allIngredients.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

const STAPLES = ['%water%', '%salt%', '%oil%', '%sugar%', '%pepper%', '%flour%'];

app.post('/api/recipes/search', async (req, res) => {
  try {
    const { ingredientIds } = req.body;
    if (!ingredientIds || ingredientIds.length === 0) return res.json([]);

    const query = `
      WITH recipe_stats AS (
        SELECT 
          r.id,
          COUNT(ri.ingredient_id) FILTER (
            WHERE i.name NOT ILIKE ANY($2)
          ) as essential_total,
          COUNT(ri.ingredient_id) FILTER (
            WHERE ri.ingredient_id = ANY($1) 
            AND i.name NOT ILIKE ANY($2)
          ) as essential_match
        FROM recipes r
        JOIN recipe_ingredients ri ON r.id = ri.recipe_id
        JOIN ingredients i ON ri.ingredient_id = i.id
        GROUP BY r.id
      )
      SELECT 
        r.id, 
        r.title, 
        r.time_minutes, 
        r.description, 
        r.image_url, 
        r.instructions,
        rs.essential_total,
        rs.essential_match,
        (rs.essential_total - rs.essential_match) as missing_count,
        array_agg(ri.quantity || ' ' || i.name) as ingredients_list
      FROM recipes r
      JOIN recipe_stats rs ON r.id = rs.id
      JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE rs.essential_match > 0 
      GROUP BY 
        r.id, r.title, r.time_minutes, r.description, r.image_url, r.instructions,
        rs.essential_total, rs.essential_match
      ORDER BY missing_count ASC, essential_match DESC
      LIMIT 50;
    `;

    const result = await pool.query(query, [ingredientIds, STAPLES]);
    res.json(result.rows);
  } catch (err) {
    console.error("SQL Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ingredients/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) return res.json([]);

    const result = await pool.query(
      "SELECT * FROM ingredients WHERE name ILIKE $1 LIMIT 10", 
      [`%${query}%`] 
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get('/api/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT r.id, r.title, r.time_minutes, r.description, r.image_url, r.instructions,
             array_agg(ri.quantity || ' ' || i.name) as ingredients_list
      FROM recipes r
      JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE r.id = $1
      GROUP BY r.id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});