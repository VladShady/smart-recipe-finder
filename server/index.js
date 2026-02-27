const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const app = express();
const port = process.env.SERVER_PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple In-Memory Cache Setup
const cache = {
  categories: { data: null, timestamp: 0 },
  popular: { data: null, timestamp: 0 }
};
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds

// System health check
app.get('/', (req, res) => {
  res.send('Server is running. API is ready.');
});

// Retrieve unique recipe categories (with caching)
app.get('/api/categories', async (req, res) => {
  try {
    const now = Date.now();
    
    // Serve from cache if valid
    if (cache.categories.data && (now - cache.categories.timestamp < CACHE_DURATION)) {
      return res.json(cache.categories.data);
    }

    const categories = await pool.query(
      'SELECT DISTINCT description FROM recipes WHERE description IS NOT NULL ORDER BY description'
    );
    const data = categories.rows.map(row => row.description);
    
    // Update cache
    cache.categories = { data, timestamp: now };
    
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Retrieve all available ingredients
app.get('/api/ingredients', async (req, res) => {
  try {
    const allIngredients = await pool.query('SELECT * FROM ingredients');
    res.json(allIngredients.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Ingredients universally assumed to be available
const STAPLES = ['%water%', '%salt%', '%oil%', '%sugar%', '%pepper%', '%flour%'];

// Core search algorithm: evaluates pantry matches vs. recipe requirements
app.post('/api/recipes/search', async (req, res) => {
  try {
    const { ingredientIds, category, maxTime } = req.body;
    
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
      AND (rs.essential_total - rs.essential_match) <= 3
      AND ($3::text IS NULL OR r.description = $3)
      AND ($4::int IS NULL OR r.time_minutes <= $4)
      GROUP BY 
        r.id, r.title, r.time_minutes, r.description, r.image_url, r.instructions,
        rs.essential_total, rs.essential_match
      ORDER BY missing_count ASC, essential_match DESC
      LIMIT 50;
    `;

    const result = await pool.query(query, [
      ingredientIds, 
      STAPLES, 
      category || null,
      maxTime || null
    ]);
    
    res.json(result.rows);
  } catch (err) {
    console.error("SQL Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Retrieve categories applicable to the user's current pantry selection
app.post('/api/categories/available', async (req, res) => {
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

// Autocomplete search prioritizing exact matches and starts-with strings
app.get('/api/ingredients/search', async (req, res) => {
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

// Retrieve popular recipes (cached for 1 hour to reduce DB load)
app.get('/api/recipes/popular', async (req, res) => {
  try {
    const now = Date.now();

    // Serve from cache if valid
    if (cache.popular.data && (now - cache.popular.timestamp < CACHE_DURATION)) {
      return res.json(cache.popular.data);
    }

    const query = `
      SELECT id, title, time_minutes, description, image_url 
      FROM recipes 
      WHERE image_url IS NOT NULL
      ORDER BY RANDOM() 
      LIMIT 6;
    `;
    const result = await pool.query(query);
    
    // Update cache
    cache.popular = { data: result.rows, timestamp: now };
    
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Immediate initial fetch for recipe details
app.get('/api/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT r.id, r.title, r.time_minutes, r.description, r.image_url, r.instructions, r.youtube_url, r.ai_instructions,
             array_agg(ri.quantity || ' ' || i.name) as ingredients_list,
             array_agg(i.name) as ingredient_names
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

// Background worker route to format instructions via LLM
app.get('/api/recipes/:id/ai-instructions', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query("SELECT instructions, ai_instructions FROM recipes WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Recipe not found" });
    
    const recipe = result.rows[0];

    // Return cached instructions if already processed
    if (recipe.ai_instructions) {
      return res.json({ ai_instructions: recipe.ai_instructions });
    }

    if (process.env.GEMINI_API_KEY) {
        console.log(`[AI] Formatting instructions in background for recipe ${id}...`);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `
          Analyze the following cooking instructions and format them into a logical, comprehensive, and sequential array of steps.
          Rules:
          1. Combine alternative methods or substitute ingredients into a single logical step (e.g., if it says "Bake for 10 mins. Alternatively, microwave for 2 mins", keep that as one single step).
          2. Make each step a complete, actionable instruction. Keep the flow chronological.
          3. Remove any existing step numbers (like "1.", "Step 2:").
          Return ONLY a valid JSON array of strings, without any markdown formatting.
          Instructions to process: ${recipe.instructions}
        `;

        const aiResponse = await model.generateContent(prompt);
        let aiText = aiResponse.response.text().trim();
      
      if (aiText.startsWith('```json')) aiText = aiText.replace(/```json/g, '');
      if (aiText.startsWith('```')) aiText = aiText.replace(/```/g, '');
      
      const structuredSteps = JSON.parse(aiText.trim());

      await pool.query("UPDATE recipes SET ai_instructions = $1 WHERE id = $2", [JSON.stringify(structuredSteps), id]);

      return res.json({ ai_instructions: structuredSteps });
    } else {
      res.status(400).json({ message: "API key is missing" });
    }
  } catch (err) {
    console.error("[AI Error]:", err.message);
    res.status(500).send("AI Generation Failed");
  }
});

// Administrative utility: Deduplicate plurals and enforce Title Case standard
app.get('/api/admin/format-ingredients', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); 

    // Re-link recipe associations to the root singular ingredient ID
    await client.query(`
      UPDATE recipe_ingredients
      SET ingredient_id = subquery.min_id
      FROM (
        SELECT MIN(id) as min_id, REGEXP_REPLACE(LOWER(TRIM(name)), 's$', '') as base_name
        FROM ingredients
        GROUP BY REGEXP_REPLACE(LOWER(TRIM(name)), 's$', '')
      ) AS subquery
      JOIN ingredients i ON REGEXP_REPLACE(LOWER(TRIM(i.name)), 's$', '') = subquery.base_name
      WHERE recipe_ingredients.ingredient_id = i.id
        AND i.id != subquery.min_id;
    `);

    // Purge orphaned plural records
    const deleteResult = await client.query(`
      DELETE FROM ingredients
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM ingredients
        GROUP BY REGEXP_REPLACE(LOWER(TRIM(name)), 's$', '')
      );
    `);

    // Enforce consistent capitalization
    await client.query(`
      UPDATE ingredients
      SET name = INITCAP(TRIM(name));
    `);

    await client.query('COMMIT'); 
    res.send(`Done! Removed ${deleteResult.rowCount} duplicates. All ingredients updated to Title Case.`);
  } catch (err) {
    await client.query('ROLLBACK'); 
    console.error(err.message);
    res.status(500).send("Formatting Error: " + err.message);
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});